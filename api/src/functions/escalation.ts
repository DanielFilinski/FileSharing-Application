/**
 * Escalation API
 * Azure Functions for escalation and incident management
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const CreateEscalationRequestSchema = z.object({
  type: z.enum([
    'storage_overflow',
    'storage_quota_warning',
    'document_validation_failed',
    'document_approval_overdue',
    'document_signing_failed',
    'sharepoint_sync_failed',
    'system_error',
    'security_breach',
    'user_access_issue',
    'workflow_blocked',
    'deadline_missed',
    'api_integration_failed',
    'custom'
  ]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.enum(['technical', 'business', 'security', 'compliance', 'performance']).optional(),
  details: z.record(z.any()).optional(),
  affectedUserId: z.string().optional(),
  affectedDocumentId: z.string().optional(),
  affectedResourceId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const UpdateEscalationRequestSchema = z.object({
  status: z.enum(['open', 'acknowledged', 'in_progress', 'resolved', 'closed', 'escalated']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().optional(),
  resolutionNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const AddCommentRequestSchema = z.object({
  content: z.string().min(1).max(1000),
  isInternal: z.boolean().optional(),
});

// ==========================================
// TYPES
// ==========================================

interface EscalationDocument {
  id: string;
  type: string;
  category: string;
  priority: string;
  status: string;
  
  title: string;
  description: string;
  details?: Record<string, any>;
  
  affectedUserId?: string;
  affectedUserName?: string;
  affectedDocumentId?: string;
  affectedDocumentName?: string;
  affectedResourceId?: string;
  affectedResourceType?: string;
  
  errorMessage?: string;
  errorStack?: string;
  errorCode?: string;
  
  assignedTo?: string;
  assignedToName?: string;
  assignedToTeam?: string;
  
  resolvedBy?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  resolutionTime?: string;
  
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  acknowledgedAt?: string;
  escalatedAt?: string;
  closedAt?: string;
  
  tags?: string[];
  relatedEscalations?: string[];
  
  dueDate?: string;
  slaViolated?: boolean;
  responseTime?: number;
  resolutionTimeTarget?: number;
  
  organizationId: string;
  tenantId: string;
  partitionKey: string;
}

interface EscalationCommentDocument {
  id: string;
  escalationId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isInternal: boolean;
  partitionKey: string;
}

interface EscalationHistoryDocument {
  id: string;
  escalationId: string;
  action: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  oldValue?: any;
  newValue?: any;
  notes?: string;
  partitionKey: string;
}

// ==========================================
// CREATE ESCALATION
// ==========================================

app.http('createEscalation', {
  methods: ['POST'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'escalations',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      ctx.log('Creating escalation...');

      const body = await req.json();
      const validationResult = CreateEscalationRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const request = validationResult.data;
      const container = getContainer('escalations');
      const tenantId = req.query.get('tenantId') || 'default';
      const organizationId = req.query.get('organizationId') || 'default';
      const createdBy = req.query.get('userId') || 'system';
      const createdByName = req.query.get('userName') || 'System';
      
      const now = new Date().toISOString();
      const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Calculate SLA based on priority
      const priority = request.priority || getDefaultPriority(request.type);
      const resolutionTimeMinutes = getResolutionTimeMinutes(priority);
      const dueDate = new Date(Date.now() + resolutionTimeMinutes * 60000);

      const escalation: EscalationDocument = {
        id: escalationId,
        type: request.type,
        category: request.category || getCategoryForType(request.type),
        priority,
        status: 'open',
        
        title: request.title,
        description: request.description,
        details: request.details,
        
        affectedUserId: request.affectedUserId,
        affectedDocumentId: request.affectedDocumentId,
        affectedResourceId: request.affectedResourceId,
        
        createdAt: now,
        createdBy,
        createdByName,
        updatedAt: now,
        
        tags: request.tags || [],
        
        dueDate: dueDate.toISOString(),
        resolutionTimeTarget: resolutionTimeMinutes,
        
        organizationId,
        tenantId,
        partitionKey: tenantId,
      };

      await container.items.create(escalation);

      // Add history entry
      await addHistoryEntry(escalationId, 'created', createdBy, createdByName, tenantId);

      // TODO: Send notifications
      ctx.log(`Escalation created: ${escalationId}`);

      return {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          escalation: {
            id: escalation.id,
            type: escalation.type,
            priority: escalation.priority,
            status: escalation.status,
            title: escalation.title,
            createdAt: escalation.createdAt,
            dueDate: escalation.dueDate,
          },
        }),
      };
    } catch (error: any) {
      ctx.error('Error creating escalation:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to create escalation',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET ESCALATIONS
// ==========================================

app.http('getEscalations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'escalations',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const tenantId = req.query.get('tenantId') || 'default';
      const status = req.query.get('status');
      const priority = req.query.get('priority');
      const type = req.query.get('type');
      const assignedTo = req.query.get('assignedTo');
      const limit = parseInt(req.query.get('limit') || '50');
      const offset = parseInt(req.query.get('offset') || '0');

      ctx.log(`Fetching escalations for tenant ${tenantId}`);

      const container = getContainer('escalations');

      // Build query
      let queryConditions = [`c.partitionKey = @tenantId`];
      const parameters: any[] = [{ name: '@tenantId', value: tenantId }];

      if (status) {
        queryConditions.push(`c.status = @status`);
        parameters.push({ name: '@status', value: status });
      }
      if (priority) {
        queryConditions.push(`c.priority = @priority`);
        parameters.push({ name: '@priority', value: priority });
      }
      if (type) {
        queryConditions.push(`c.type = @type`);
        parameters.push({ name: '@type', value: type });
      }
      if (assignedTo) {
        queryConditions.push(`c.assignedTo = @assignedTo`);
        parameters.push({ name: '@assignedTo', value: assignedTo });
      }

      const query = {
        query: `SELECT * FROM c WHERE ${queryConditions.join(' AND ')} ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
        parameters: [...parameters, 
          { name: '@offset', value: offset },
          { name: '@limit', value: limit }
        ],
      };

      const { resources: escalations } = await container.items.query<EscalationDocument>(query).fetchAll();

      // Calculate statistics
      const stats = await getEscalationStats(tenantId);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalations,
          statistics: stats,
          pagination: {
            limit,
            offset,
            total: stats.total,
          },
        }),
      };
    } catch (error: any) {
      ctx.error('Error fetching escalations:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch escalations',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET ESCALATION BY ID
// ==========================================

app.http('getEscalation', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'escalations/{id}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const escalationId = req.params.id;
      const tenantId = req.query.get('tenantId') || 'default';

      if (!escalationId) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Escalation ID is required' }),
        };
      }

      ctx.log(`Fetching escalation ${escalationId}`);

      const container = getContainer('escalations');
      const { resource: escalation } = await container.item(escalationId, tenantId).read<EscalationDocument>();

      if (!escalation) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Escalation not found' }),
        };
      }

      // Get comments
      const comments = await getEscalationComments(escalationId, tenantId);

      // Get history
      const history = await getEscalationHistory(escalationId, tenantId);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalation,
          comments,
          history,
        }),
      };
    } catch (error: any) {
      ctx.error('Error fetching escalation:', error);

      if (error.code === 404) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Escalation not found' }),
        };
      }

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch escalation',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// UPDATE ESCALATION
// ==========================================

app.http('updateEscalation', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'escalations/{id}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const escalationId = req.params.id;
      const body = await req.json();
      const validationResult = UpdateEscalationRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const updates = validationResult.data;
      const tenantId = req.query.get('tenantId') || 'default';
      const updatedBy = req.query.get('userId') || 'system';
      const updatedByName = req.query.get('userName') || 'System';

      ctx.log(`Updating escalation ${escalationId}`);

      const container = getContainer('escalations');
      const { resource: escalation } = await container.item(escalationId, tenantId).read<EscalationDocument>();

      if (!escalation) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Escalation not found' }),
        };
      }

      // Update fields
      const oldStatus = escalation.status;
      const oldPriority = escalation.priority;

      if (updates.status) {
        escalation.status = updates.status;
        
        if (updates.status === 'resolved') {
          escalation.resolvedBy = updatedBy;
          escalation.resolvedByName = updatedByName;
          escalation.resolutionTime = new Date().toISOString();
          escalation.resolutionNotes = updates.resolutionNotes;
        }
        
        if (updates.status === 'closed') {
          escalation.closedAt = new Date().toISOString();
        }
        
        if (updates.status === 'acknowledged') {
          escalation.acknowledgedAt = new Date().toISOString();
        }
      }

      if (updates.priority) {
        escalation.priority = updates.priority;
        // Recalculate SLA
        const resolutionTimeMinutes = getResolutionTimeMinutes(updates.priority);
        const dueDate = new Date(Date.now() + resolutionTimeMinutes * 60000);
        escalation.dueDate = dueDate.toISOString();
        escalation.resolutionTimeTarget = resolutionTimeMinutes;
      }

      if (updates.assignedTo) {
        escalation.assignedTo = updates.assignedTo;
      }

      if (updates.tags) {
        escalation.tags = updates.tags;
      }

      escalation.updatedAt = new Date().toISOString();

      await container.items.upsert(escalation);

      // Add history entries
      if (updates.status && updates.status !== oldStatus) {
        await addHistoryEntry(
          escalationId,
          'status_changed',
          updatedBy,
          updatedByName,
          tenantId,
          oldStatus,
          updates.status
        );
      }

      if (updates.priority && updates.priority !== oldPriority) {
        await addHistoryEntry(
          escalationId,
          'priority_changed',
          updatedBy,
          updatedByName,
          tenantId,
          oldPriority,
          updates.priority
        );
      }

      // TODO: Send notifications

      ctx.log(`Escalation updated: ${escalationId}`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          escalation,
        }),
      };
    } catch (error: any) {
      ctx.error('Error updating escalation:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to update escalation',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// ADD COMMENT
// ==========================================

app.http('addEscalationComment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'escalations/{id}/comments',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const escalationId = req.params.id;
      const body = await req.json();
      const validationResult = AddCommentRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const { content, isInternal = false } = validationResult.data;
      const tenantId = req.query.get('tenantId') || 'default';
      const authorId = req.query.get('userId') || 'system';
      const authorName = req.query.get('userName') || 'System';

      ctx.log(`Adding comment to escalation ${escalationId}`);

      // Verify escalation exists
      const container = getContainer('escalations');
      const { resource: escalation } = await container.item(escalationId, tenantId).read();

      if (!escalation) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Escalation not found' }),
        };
      }

      // Create comment
      const commentId = `CMT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const comment: EscalationCommentDocument = {
        id: commentId,
        escalationId,
        content,
        authorId,
        authorName,
        createdAt: new Date().toISOString(),
        isInternal,
        partitionKey: tenantId,
      };

      const commentsContainer = getContainer('escalation-comments');
      await commentsContainer.items.create(comment);

      // Add history entry
      await addHistoryEntry(escalationId, 'commented', authorId, authorName, tenantId);

      // Update escalation
      escalation.updatedAt = new Date().toISOString();
      await container.items.upsert(escalation);

      ctx.log(`Comment added to escalation ${escalationId}`);

      return {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          comment,
        }),
      };
    } catch (error: any) {
      ctx.error('Error adding comment:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to add comment',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function getEscalationStats(tenantId: string) {
  const container = getContainer('escalations');
  const { resources: escalations } = await container.items.query<EscalationDocument>({
    query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId',
    parameters: [{ name: '@tenantId', value: tenantId }],
  }).fetchAll();

  const stats = {
    total: escalations.length,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    overdue: 0,
  };

  const now = new Date();

  for (const esc of escalations) {
    stats.byStatus[esc.status] = (stats.byStatus[esc.status] || 0) + 1;
    stats.byPriority[esc.priority] = (stats.byPriority[esc.priority] || 0) + 1;
    stats.byType[esc.type] = (stats.byType[esc.type] || 0) + 1;
    
    if (esc.dueDate && new Date(esc.dueDate) < now && esc.status !== 'resolved' && esc.status !== 'closed') {
      stats.overdue++;
    }
  }

  return stats;
}

async function getEscalationComments(escalationId: string, tenantId: string) {
  const container = getContainer('escalation-comments');
  const { resources: comments } = await container.items.query<EscalationCommentDocument>({
    query: 'SELECT * FROM c WHERE c.escalationId = @escalationId AND c.partitionKey = @tenantId ORDER BY c.createdAt ASC',
    parameters: [
      { name: '@escalationId', value: escalationId },
      { name: '@tenantId', value: tenantId },
    ],
  }).fetchAll();

  return comments;
}

async function getEscalationHistory(escalationId: string, tenantId: string) {
  const container = getContainer('escalation-history');
  const { resources: history } = await container.items.query<EscalationHistoryDocument>({
    query: 'SELECT * FROM c WHERE c.escalationId = @escalationId AND c.partitionKey = @tenantId ORDER BY c.timestamp ASC',
    parameters: [
      { name: '@escalationId', value: escalationId },
      { name: '@tenantId', value: tenantId },
    ],
  }).fetchAll();

  return history;
}

async function addHistoryEntry(
  escalationId: string,
  action: string,
  performedBy: string,
  performedByName: string,
  tenantId: string,
  oldValue?: any,
  newValue?: any
) {
  const historyId = `HIS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const entry: EscalationHistoryDocument = {
    id: historyId,
    escalationId,
    action,
    performedBy,
    performedByName,
    timestamp: new Date().toISOString(),
    oldValue,
    newValue,
    partitionKey: tenantId,
  };

  const container = getContainer('escalation-history');
  await container.items.create(entry);
}

function getDefaultPriority(type: string): string {
  const priorityMap: Record<string, string> = {
    storage_overflow: 'critical',
    storage_quota_warning: 'high',
    document_validation_failed: 'medium',
    document_approval_overdue: 'high',
    document_signing_failed: 'high',
    sharepoint_sync_failed: 'high',
    system_error: 'critical',
    security_breach: 'critical',
    user_access_issue: 'high',
    workflow_blocked: 'high',
    deadline_missed: 'medium',
    api_integration_failed: 'high',
    custom: 'medium',
  };

  return priorityMap[type] || 'medium';
}

function getCategoryForType(type: string): string {
  if (type.includes('storage') || type.includes('system') || type.includes('api')) {
    return 'technical';
  }
  if (type.includes('security')) {
    return 'security';
  }
  if (type.includes('deadline') || type.includes('approval')) {
    return 'business';
  }
  return 'technical';
}

function getResolutionTimeMinutes(priority: string): number {
  const timeMap: Record<string, number> = {
    low: 48 * 60,        // 48 hours
    medium: 24 * 60,     // 24 hours
    high: 4 * 60,        // 4 hours
    critical: 60,        // 1 hour
  };

  return timeMap[priority] || 24 * 60;
}
