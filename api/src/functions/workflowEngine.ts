import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { createProtectedFunction, RBAC_CONFIGS } from '../shared/middleware/rbacMiddleware';
import { auditMiddleware } from '../shared/audit/auditMiddleware';
import { AuditActions } from '../../../src/shared/types/audit';
import { z } from 'zod';

// Workflow schemas
const WorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['approval', 'review', 'signature', 'notification']),
  assigneeId: z.string(),
  assigneeName: z.string(),
  assigneeEmail: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed', 'rejected', 'skipped']).default('pending'),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
  comments: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  requirements: z.object({
    documentsNeeded: z.array(z.string()).optional(),
    approvalLevel: z.enum(['basic', 'advanced', 'executive']).optional(),
    delegationAllowed: z.boolean().default(false),
    timeoutAction: z.enum(['escalate', 'auto-approve', 'auto-reject']).default('escalate')
  }).optional()
});

const CreateWorkflowSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  workflowType: z.enum(['approval', 'review', 'signature-collection', 'compliance-check']),
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  steps: z.array(WorkflowStepSchema).min(1, 'At least one step is required'),
  businessRules: z.object({
    requireAllApprovals: z.boolean().default(true),
    allowParallelProcessing: z.boolean().default(false),
    escalationTimeoutHours: z.number().min(1).default(24),
    autoCompleteOnTimeout: z.boolean().default(false),
    notifyCreatorOnUpdate: z.boolean().default(true)
  }).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const AdvanceWorkflowSchema = z.object({
  action: z.enum(['approve', 'reject', 'request-changes', 'delegate', 'skip']),
  comments: z.string().optional(),
  delegateToId: z.string().optional(),
  attachments: z.array(z.string()).optional()
});

interface WorkflowInstance {
  id: string;
  partitionKey: string;
  documentId: string;
  documentName: string;
  type: string;
  name: string;
  description?: string;
  steps: any[];
  currentStep: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'escalated';
  priority: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  businessRules?: any;
  metadata?: any;
}

// Protected POST /api/workflows - Create new workflow
app.http('createWorkflow', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'workflows',
  handler: createProtectedFunction(
    { requiredPermissions: ['DOCUMENTS_UPDATE', 'APPROVAL_MANAGE'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = CreateWorkflowSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid workflow data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const workflowData = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Verify document exists and user has access
        const documentsContainer = getContainer('documents');
        const { resource: document } = await documentsContainer.item(workflowData.documentId).read();
        
        if (!document) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Document not found' })
          };
        }
        
        // Check document permissions
        const hasAccess = document.permissions?.owners?.includes(user.email) ||
                         document.permissions?.editors?.includes(user.email) ||
                         document.createdBy === user.email;
                         
        if (!hasAccess) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Insufficient permissions to create workflow for this document' })
          };
        }
        
        // Create workflow instance
        const workflow: WorkflowInstance = {
          id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partitionKey: user.tenantId,
          documentId: workflowData.documentId,
          documentName: document.name,
          type: workflowData.workflowType,
          name: workflowData.name,
          description: workflowData.description,
          steps: workflowData.steps.map((step, index) => ({
            ...step,
            stepNumber: index + 1,
            createdAt: now
          })),
          currentStep: 0,
          status: 'pending',
          priority: workflowData.priority,
          createdBy: user.email,
          createdAt: now,
          dueDate: workflowData.dueDate,
          businessRules: workflowData.businessRules,
          metadata: {
            ...workflowData.metadata,
            createdBy: {
              id: user.objectId,
              name: user.displayName,
              email: user.email
            }
          }
        };
        
        // Save workflow to database
        const workflowsContainer = getContainer('workflows');
        await workflowsContainer.items.create(workflow);
        
        // Update document status
        await documentsContainer.item(workflowData.documentId).patch([
          { op: 'replace', path: '/status', value: 'workflow-pending' },
          { op: 'add', path: '/activeWorkflowId', value: workflow.id },
          { op: 'replace', path: '/metadata/modifiedAt', value: now },
          { op: 'replace', path: '/metadata/modifiedBy', value: user.email }
        ]);
        
        // Send initial notifications to first step assignees
        await sendWorkflowNotifications(workflow, workflow.steps[0], 'workflow-started', ctx);
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-${workflow.id}-created`,
          partitionKey: user.tenantId,
          type: 'workflow-created',
          workflowId: workflow.id,
          workflowName: workflow.name,
          documentId: workflow.documentId,
          documentName: workflow.documentName,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            workflowType: workflow.type,
            stepsCount: workflow.steps.length,
            priority: workflow.priority
          }
        });
        
        ctx.log(`Workflow created: ${workflow.id} for document ${workflow.documentId} by ${user.displayName}`);
        
        return {
          status: 201,
          body: JSON.stringify({
            success: true,
            data: workflow,
            message: 'Workflow created successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Create workflow error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to create workflow'
          })
        };
      }
    }
  )
});

// Protected POST /api/workflows/{workflowId}/advance - Advance workflow to next step
app.http('advanceWorkflow', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'workflows/{workflowId}/advance',
  handler: createProtectedFunction(
    { requiredPermissions: ['DOCUMENTS_UPDATE'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const workflowId = req.params.get('workflowId');
        if (!workflowId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Workflow ID is required' })
          };
        }
        
        const body = await req.json();
        const parsed = AdvanceWorkflowSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid workflow action data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const { action, comments, delegateToId } = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Get workflow
        const workflowsContainer = getContainer('workflows');
        const { resource: workflow } = await workflowsContainer.item(workflowId).read();
        
        if (!workflow) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Workflow not found' })
          };
        }
        
        // Check tenant access
        if (workflow.partitionKey !== user.tenantId) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Access denied to this workflow' })
          };
        }
        
        // Check if workflow is still active
        if (workflow.status === 'completed' || workflow.status === 'cancelled') {
          return {
            status: 409,
            body: JSON.stringify({ 
              error: 'Workflow is not active',
              message: `Workflow has already been ${workflow.status}`
            })
          };
        }
        
        const currentStep = workflow.steps[workflow.currentStep];
        if (!currentStep) {
          return {
            status: 409,
            body: JSON.stringify({ error: 'No active step in workflow' })
          };
        }
        
        // Validate user can perform this action
        if (currentStep.assigneeId !== user.objectId && currentStep.assigneeEmail !== user.email) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Not authorized for this step',
              message: 'Only the assigned user can perform this action'
            })
          };
        }
        
        // Handle delegation
        if (action === 'delegate') {
          if (!delegateToId) {
            return {
              status: 400,
              body: JSON.stringify({ error: 'Delegate to ID is required for delegation' })
            };
          }
          
          if (!currentStep.requirements?.delegationAllowed) {
            return {
              status: 403,
              body: JSON.stringify({ error: 'Delegation is not allowed for this step' })
            };
          }
          
          // Update step assignee
          workflow.steps[workflow.currentStep] = {
            ...currentStep,
            assigneeId: delegateToId,
            delegatedBy: user.email,
            delegatedAt: now,
            delegationComments: comments
          };
          
          await workflowsContainer.item(workflowId).patch([
            { op: 'replace', path: '/steps', value: workflow.steps }
          ]);
          
          // Send notification to new assignee
          await sendWorkflowNotifications(workflow, workflow.steps[workflow.currentStep], 'workflow-delegated', ctx);
          
          return {
            status: 200,
            body: JSON.stringify({
              success: true,
              message: 'Workflow step delegated successfully',
              currentStep: workflow.steps[workflow.currentStep]
            })
          };
        }
        
        // Process workflow action
        const stepResult = {
          ...currentStep,
          status: getStepStatusFromAction(action),
          completedAt: now,
          completedBy: user.email,
          comments: comments || '',
          action: action
        };
        
        workflow.steps[workflow.currentStep] = stepResult;
        
        let nextStep = null;
        let workflowStatus = workflow.status;
        let workflowCompletedAt = undefined;
        
        if (action === 'approve' || action === 'skip') {
          // Move to next step or complete workflow
          if (workflow.currentStep + 1 < workflow.steps.length) {
            workflow.currentStep++;
            nextStep = workflow.steps[workflow.currentStep];
            workflowStatus = 'in-progress';
            
            // Send notification to next assignee
            await sendWorkflowNotifications(workflow, nextStep, 'workflow-step-assigned', ctx);
          } else {
            // Workflow completed
            workflowStatus = 'completed';
            workflowCompletedAt = now;
            
            // Update document status
            const documentsContainer = getContainer('documents');
            await documentsContainer.item(workflow.documentId).patch([
              { op: 'replace', path: '/status', value: 'approved' },
              { op: 'remove', path: '/activeWorkflowId' },
              { op: 'add', path: '/approvedAt', value: now },
              { op: 'add', path: '/approvedBy', value: user.email },
              { op: 'replace', path: '/metadata/modifiedAt', value: now }
            ]);
            
            // Send completion notification
            await sendWorkflowNotifications(workflow, null, 'workflow-completed', ctx);
          }
        } else if (action === 'reject' || action === 'request-changes') {
          // Workflow rejected/needs changes
          workflowStatus = 'cancelled';
          workflowCompletedAt = now;
          
          // Update document status
          const documentsContainer = getContainer('documents');
          await documentsContainer.item(workflow.documentId).patch([
            { op: 'replace', path: '/status', value: action === 'reject' ? 'rejected' : 'needs-changes' },
            { op: 'remove', path: '/activeWorkflowId' },
            { op: 'add', path: '/rejectedAt', value: now },
            { op: 'add', path: '/rejectedBy', value: user.email },
            { op: 'replace', path: '/metadata/modifiedAt', value: now }
          ]);
          
          // Send rejection notification
          await sendWorkflowNotifications(workflow, null, action === 'reject' ? 'workflow-rejected' : 'workflow-changes-requested', ctx);
        }
        
        // Update workflow
        const updateOps = [
          { op: 'replace', path: '/steps', value: workflow.steps },
          { op: 'replace', path: '/currentStep', value: workflow.currentStep },
          { op: 'replace', path: '/status', value: workflowStatus },
          { op: 'replace', path: '/metadata/lastModifiedAt', value: now },
          { op: 'replace', path: '/metadata/lastModifiedBy', value: user.email }
        ];
        
        if (workflowCompletedAt) {
          updateOps.push({ op: 'add', path: '/completedAt', value: workflowCompletedAt });
        }
        
        await workflowsContainer.item(workflowId).patch(updateOps);
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-${workflowId}-step-${workflow.currentStep}-${action}`,
          partitionKey: user.tenantId,
          type: 'workflow-step-completed',
          workflowId,
          workflowName: workflow.name,
          documentId: workflow.documentId,
          documentName: workflow.documentName,
          stepNumber: workflow.currentStep + 1,
          stepName: stepResult.name,
          action,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            comments,
            workflowStatus,
            isCompleted: workflowStatus === 'completed' || workflowStatus === 'cancelled'
          }
        });
        
        ctx.log(`Workflow ${workflowId} step ${workflow.currentStep} ${action} by ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            workflow: {
              id: workflow.id,
              status: workflowStatus,
              currentStep: workflow.currentStep,
              completedAt: workflowCompletedAt
            },
            currentStepResult: stepResult,
            nextStep: nextStep,
            message: `Workflow step ${action} successful`
          })
        };
        
      } catch (error: any) {
        ctx.error('Advance workflow error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to advance workflow'
          })
        };
      }
    }
  )
});

// Protected GET /api/workflows - Get workflows with filtering
app.http('getWorkflows', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'workflows',
  handler: createProtectedFunction(
    { requiredPermissions: ['DOCUMENTS_READ'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const user = authResult.user!;
        const userRoles = authResult.roles!;
        
        const status = req.query.get('status');
        const documentId = req.query.get('documentId');
        const assignedToMe = req.query.get('assignedToMe') === 'true';
        const createdByMe = req.query.get('createdByMe') === 'true';
        
        const workflowsContainer = getContainer('workflows');
        let query;
        const parameters: any[] = [{ name: '@tenantId', value: user.tenantId }];
        const conditions = ['c.partitionKey = @tenantId'];
        
        // Add filters
        if (status) {
          conditions.push('c.status = @status');
          parameters.push({ name: '@status', value: status });
        }
        
        if (documentId) {
          conditions.push('c.documentId = @documentId');
          parameters.push({ name: '@documentId', value: documentId });
        }
        
        if (createdByMe) {
          conditions.push('c.createdBy = @userEmail');
          parameters.push({ name: '@userEmail', value: user.email });
        }
        
        // Role-based access control
        if (!userRoles.includes('Administrator') && !userRoles.includes('Manager') && !createdByMe) {
          // Non-admin users can only see workflows they're involved in
          conditions.push(`(
            c.createdBy = @userEmail OR
            EXISTS(SELECT VALUE s FROM s IN c.steps WHERE s.assigneeEmail = @userEmail OR s.assigneeId = @userId)
          )`);
          parameters.push({ name: '@userId', value: user.objectId });
        }
        
        query = {
          query: `SELECT * FROM c WHERE ${conditions.join(' AND ')} ORDER BY c.createdAt DESC`,
          parameters
        };
        
        const { resources: workflows } = await workflowsContainer.items.query(query).fetchAll();
        
        // Filter for assigned to me
        let filteredWorkflows = workflows;
        if (assignedToMe) {
          filteredWorkflows = workflows.filter(workflow => {
            const currentStep = workflow.steps[workflow.currentStep];
            return currentStep && (
              currentStep.assigneeEmail === user.email || 
              currentStep.assigneeId === user.objectId
            );
          });
        }
        
        // Add computed fields
        const enrichedWorkflows = filteredWorkflows.map(workflow => ({
          ...workflow,
          currentStepInfo: workflow.steps[workflow.currentStep] || null,
          progressPercentage: Math.round((workflow.currentStep / workflow.steps.length) * 100),
          isOverdue: workflow.dueDate ? new Date(workflow.dueDate) < new Date() : false,
          canUserAct: (() => {
            const currentStep = workflow.steps[workflow.currentStep];
            return currentStep && (
              currentStep.assigneeEmail === user.email || 
              currentStep.assigneeId === user.objectId
            );
          })()
        }));
        
        ctx.log(`Workflows query: Returning ${enrichedWorkflows.length} workflows for ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: enrichedWorkflows,
            count: enrichedWorkflows.length,
            filters: {
              status,
              documentId,
              assignedToMe,
              createdByMe
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Get workflows error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve workflows'
          })
        };
      }
    }
  )
});

// Protected GET /api/workflows/{workflowId} - Get specific workflow
app.http('getWorkflowById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'workflows/{workflowId}',
  handler: createProtectedFunction(
    { requiredPermissions: ['DOCUMENTS_READ'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const workflowId = req.params.get('workflowId');
        if (!workflowId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Workflow ID is required' })
          };
        }
        
        const user = authResult.user!;
        const userRoles = authResult.roles!;
        
        const workflowsContainer = getContainer('workflows');
        const { resource: workflow } = await workflowsContainer.item(workflowId).read();
        
        if (!workflow) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Workflow not found' })
          };
        }
        
        // Check tenant access
        if (workflow.partitionKey !== user.tenantId) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Access denied to this workflow' })
          };
        }
        
        // Check if user has access to this workflow
        const isCreator = workflow.createdBy === user.email;
        const isAssignee = workflow.steps.some(step => 
          step.assigneeEmail === user.email || step.assigneeId === user.objectId
        );
        const isAdmin = userRoles.includes('Administrator') || userRoles.includes('Manager');
        
        if (!isCreator && !isAssignee && !isAdmin) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Access denied',
              message: 'You are not authorized to view this workflow'
            })
          };
        }
        
        // Add computed fields
        const enrichedWorkflow = {
          ...workflow,
          currentStepInfo: workflow.steps[workflow.currentStep] || null,
          progressPercentage: Math.round((workflow.currentStep / workflow.steps.length) * 100),
          isOverdue: workflow.dueDate ? new Date(workflow.dueDate) < new Date() : false,
          canUserAct: (() => {
            const currentStep = workflow.steps[workflow.currentStep];
            return currentStep && (
              currentStep.assigneeEmail === user.email || 
              currentStep.assigneeId === user.objectId
            );
          })(),
          userRole: isCreator ? 'creator' : isAssignee ? 'assignee' : 'viewer'
        };
        
        ctx.log(`Workflow details retrieved: ${workflowId} for ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: enrichedWorkflow
          })
        };
        
      } catch (error: any) {
        ctx.error('Get workflow by ID error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve workflow'
          })
        };
      }
    }
  )
});

// Helper functions
function getStepStatusFromAction(action: string): string {
  switch (action) {
    case 'approve': return 'completed';
    case 'reject': return 'rejected';
    case 'request-changes': return 'rejected';
    case 'skip': return 'skipped';
    default: return 'completed';
  }
}

// Protected DELETE /api/workflows/{workflowId} - Cancel workflow
app.http('cancelWorkflow', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'workflows/{workflowId}',
  handler: createProtectedFunction(
    { requiredPermissions: ['APPROVAL_MANAGE'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const workflowId = req.params.get('workflowId');
        if (!workflowId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Workflow ID is required' })
          };
        }
        
        const user = authResult.user!;
        const userRoles = authResult.roles!;
        const now = new Date().toISOString();
        
        const workflowsContainer = getContainer('workflows');
        const { resource: workflow } = await workflowsContainer.item(workflowId).read();
        
        if (!workflow) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Workflow not found' })
          };
        }
        
        // Check permissions - only creator or admin can cancel
        if (workflow.createdBy !== user.email && !userRoles.includes('Administrator')) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Access denied',
              message: 'Only workflow creator or administrator can cancel workflow'
            })
          };
        }
        
        // Update workflow status
        await workflowsContainer.item(workflowId).patch([
          { op: 'replace', path: '/status', value: 'cancelled' },
          { op: 'replace', path: '/completedAt', value: now },
          { op: 'add', path: '/cancelledBy', value: user.email },
          { op: 'add', path: '/cancelledAt', value: now }
        ]);
        
        // Update document status
        const documentsContainer = getContainer('documents');
        await documentsContainer.item(workflow.documentId).patch([
          { op: 'replace', path: '/status', value: 'draft' },
          { op: 'remove', path: '/activeWorkflowId' },
          { op: 'replace', path: '/metadata/modifiedAt', value: now }
        ]);
        
        // Send cancellation notifications
        await sendWorkflowNotifications(workflow, null, 'workflow-cancelled', ctx);
        
        ctx.log(`Workflow cancelled: ${workflowId} by ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Workflow cancelled successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Cancel workflow error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to cancel workflow'
          })
        };
      }
    }
  )
});

// Protected GET /api/workflows/statistics - Get workflow statistics
app.http('getWorkflowStatistics', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'workflows/statistics',
  handler: createProtectedFunction(
    { requiredPermissions: ['DOCUMENTS_READ'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const user = authResult.user!;
        
        const workflowsContainer = getContainer('workflows');
        const query = {
          query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId',
          parameters: [{ name: '@tenantId', value: user.tenantId }]
        };
        
        const { resources: workflows } = await workflowsContainer.items.query(query).fetchAll();
        
        // Calculate statistics
        const stats = {
          total: workflows.length,
          pending: workflows.filter(w => w.status === 'pending').length,
          inProgress: workflows.filter(w => w.status === 'in-progress').length,
          completed: workflows.filter(w => w.status === 'completed').length,
          cancelled: workflows.filter(w => w.status === 'cancelled').length,
          overdue: workflows.filter(w => 
            w.dueDate && new Date(w.dueDate) < new Date() && 
            !['completed', 'cancelled'].includes(w.status)
          ).length,
          assignedToMe: workflows.filter(w => {
            const currentStep = w.steps[w.currentStep];
            return currentStep && (
              currentStep.assigneeEmail === user.email || 
              currentStep.assigneeId === user.objectId
            );
          }).length,
          createdByMe: workflows.filter(w => w.createdBy === user.email).length,
          averageCompletionTime: calculateAverageCompletionTime(workflows),
          workflowsByType: getWorkflowsByType(workflows),
          recentActivity: workflows
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        };
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: stats
          })
        };
        
      } catch (error: any) {
        ctx.error('Get workflow statistics error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve workflow statistics'
          })
        };
      }
    }
  )
});

// Helper functions
function calculateAverageCompletionTime(workflows: WorkflowInstance[]): number {
  const completedWorkflows = workflows.filter(w => w.status === 'completed' && w.completedAt);
  
  if (completedWorkflows.length === 0) return 0;
  
  const totalTime = completedWorkflows.reduce((sum, w) => {
    const start = new Date(w.createdAt).getTime();
    const end = new Date(w.completedAt!).getTime();
    return sum + (end - start);
  }, 0);
  
  return Math.round(totalTime / completedWorkflows.length / (1000 * 60 * 60)); // in hours
}

function getWorkflowsByType(workflows: WorkflowInstance[]): Record<string, number> {
  const types: Record<string, number> = {};
  
  workflows.forEach(w => {
    types[w.type] = (types[w.type] || 0) + 1;
  });
  
  return types;
}

async function sendWorkflowNotifications(
  workflow: WorkflowInstance, 
  step: any, 
  notificationType: string, 
  ctx: InvocationContext
) {
  try {
    // This would integrate with Teams notifications, email, etc.
    // For now, we'll log the notification
    
    ctx.log(`Workflow Notification: ${notificationType} for workflow ${workflow.id}`);
    
    if (step) {
      ctx.log(`Notifying ${step.assigneeName} (${step.assigneeEmail}) for step: ${step.name}`);
    }
    
    // In a full implementation, this would:
    // 1. Send Teams notification using TeamsApiClient
    // 2. Send email notification
    // 3. Create in-app notification
    // 4. Log notification in activities
    
    const activitiesContainer = getContainer('activities');
    await activitiesContainer.items.create({
      id: `notification-${workflow.id}-${notificationType}-${Date.now()}`,
      partitionKey: workflow.partitionKey,
      type: 'workflow-notification',
      workflowId: workflow.id,
      notificationType,
      recipientEmail: step?.assigneeEmail || workflow.createdBy,
      recipientName: step?.assigneeName || 'Workflow Creator',
      timestamp: new Date().toISOString(),
      metadata: {
        workflowName: workflow.name,
        documentName: workflow.documentName,
        stepName: step?.name
      }
    });
    
  } catch (error: any) {
    ctx.error('Failed to send workflow notification:', error);
    // Don't fail the main operation if notification fails
  }
}
