/**
 * Dashboard Action Required API
 * Returns documents that require immediate user action
 * Supports filtering by action type, priority, and user assignment
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';

export interface ActionRequiredDocument {
  id: string;
  name: string;
  fileName: string;
  status: 'review' | 'sign' | 'approve' | 'validate';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string;
  assignedTo: string;
  assignedToId: string;
  clientName?: string;
  clientId?: string;
  documentType?: string;
  metadata?: {
    createdAt: string;
    createdBy: string;
    priority?: string;
  };
}

app.http('getDashboardActionRequired', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/action-required',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const tenantId = req.query.get('tenantId') || 'default';
      const userId = req.query.get('userId');
      const limit = parseInt(req.query.get('limit') || '10');
      const actionType = req.query.get('actionType'); // review, sign, approve, validate
      
      const container = getContainer('documents');
      
      // Build query conditions
      const queryConditions: string[] = ['c.partitionKey = @tenantId'];
      const parameters: any[] = [{ name: '@tenantId', value: tenantId }];
      
      // Filter by user assignment if provided
      if (userId) {
        queryConditions.push(`(
          ARRAY_CONTAINS(c.metadata.validators, @userId) OR
          ARRAY_CONTAINS(c.metadata.approvers, @userId) OR
          ARRAY_CONTAINS(c.metadata.signers, @userId) OR
          c.metadata.reviewerId = @userId
        )`);
        parameters.push({ name: '@userId', value: userId });
      }
      
      // Only include documents that need action
      queryConditions.push(`c.status IN ('pending', 'draft', 'review_required')`);
      
      // Build query
      const query = {
        query: `SELECT * FROM c WHERE ${queryConditions.join(' AND ')} ORDER BY c.metadata.priority DESC, c.metadata.deadline ASC`,
        parameters,
      };
      
      const { resources: documents } = await container.items.query(query).fetchAll();
      
      ctx.log(`Found ${documents.length} action required documents`);
      
      // Transform documents to ActionRequiredDocument format
      const actionRequiredDocs: ActionRequiredDocument[] = documents.map(doc => {
        // Determine action type based on document status and metadata
        let actionStatus: ActionRequiredDocument['status'] = 'review';
        
        if (doc.status === 'pending' && doc.metadata?.validators?.length > 0) {
          actionStatus = 'validate';
        } else if (doc.status === 'pending' && doc.metadata?.approvers?.length > 0) {
          actionStatus = 'approve';
        } else if (doc.status === 'draft' && doc.metadata?.signers?.length > 0) {
          actionStatus = 'sign';
        }
        
        // Determine priority
        const priority = determinePriority(doc);
        
        // Calculate due date
        const dueDate = doc.metadata?.deadline || calculateDefaultDueDate(doc, actionStatus);
        
        return {
          id: doc.id,
          name: doc.name || doc.fileName,
          fileName: doc.fileName,
          status: actionStatus,
          priority,
          dueDate,
          assignedTo: doc.metadata?.assignedTo || 'Unassigned',
          assignedToId: doc.metadata?.assignedToId || '',
          clientName: doc.metadata?.clientName,
          clientId: doc.metadata?.clientId,
          documentType: doc.category || doc.metadata?.documentType,
          metadata: {
            createdAt: doc.metadata?.createdAt || new Date().toISOString(),
            createdBy: doc.metadata?.createdBy || 'System',
            priority: doc.metadata?.priority,
          },
        };
      });
      
      // Filter by action type if specified
      let filteredDocs = actionRequiredDocs;
      if (actionType) {
        filteredDocs = actionRequiredDocs.filter(doc => doc.status === actionType);
      }
      
      // Sort by priority and due date
      filteredDocs.sort((a, b) => {
        // Priority order: urgent > high > medium > low
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by due date (earliest first)
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      
      // Limit results
      const limitedDocs = filteredDocs.slice(0, limit);
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          documents: limitedDocs,
          total: filteredDocs.length,
          limit,
        }),
      };
    } catch (error) {
      ctx.error('Error fetching action required documents:', error);
      
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to fetch action required documents',
          details: error.message,
        }),
      };
    }
  },
});

/**
 * Determine document priority based on various factors
 */
function determinePriority(doc: any): 'urgent' | 'high' | 'medium' | 'low' {
  // Check explicit priority
  if (doc.metadata?.priority) {
    const priority = doc.metadata.priority.toLowerCase();
    if (['urgent', 'high', 'medium', 'low'].includes(priority)) {
      return priority as any;
    }
  }
  
  // Calculate based on deadline
  if (doc.metadata?.deadline) {
    const deadline = new Date(doc.metadata.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline < 0) return 'urgent'; // Overdue
    if (hoursUntilDeadline < 24) return 'urgent'; // Less than 24 hours
    if (hoursUntilDeadline < 72) return 'high'; // Less than 3 days
    if (hoursUntilDeadline < 168) return 'medium'; // Less than 7 days
  }
  
  // Check document type priority
  const highPriorityTypes = ['tax', 'legal', 'compliance', 'regulatory'];
  if (doc.category && highPriorityTypes.some(type => 
    doc.category.toLowerCase().includes(type)
  )) {
    return 'high';
  }
  
  // Default
  return 'medium';
}

/**
 * Calculate default due date based on document type and action
 */
function calculateDefaultDueDate(
  doc: any, 
  actionType: 'review' | 'sign' | 'approve' | 'validate'
): string {
  const now = new Date();
  
  // Default timeframes by action type (in hours)
  const defaultTimeframes = {
    validate: 48, // 2 days for validation
    review: 72, // 3 days for review
    approve: 24, // 1 day for approval
    sign: 48, // 2 days for signature
  };
  
  const hoursToAdd = defaultTimeframes[actionType] || 72;
  const dueDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  
  return dueDate.toISOString();
}

// CORS preflight handler
app.http('getDashboardActionRequiredOptions', {
  methods: ['OPTIONS'],
  authLevel: 'anonymous',
  route: 'dashboard/action-required',
  handler: async (): Promise<HttpResponseInit> => {
    return {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  },
});

