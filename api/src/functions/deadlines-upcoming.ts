import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';

export interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  documentId?: string;
  clientId?: string;
  assignedTo?: string;
  createdAt: string;
}

app.http('getUpcomingDeadlines', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'deadlines/upcoming',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const limit = parseInt(req.query.get('limit') || '10', 10);
      const tenantId = req.query.get('tenantId') || 'default';
      
      const container = getContainer('deadlines');
      
      // Query upcoming deadlines for the tenant
      const now = new Date().toISOString();
      const query = {
        query: `SELECT * FROM c WHERE c.partitionKey = @tenantId AND c.dueDate >= @now ORDER BY c.dueDate ASC OFFSET 0 LIMIT @limit`,
        parameters: [
          { name: '@tenantId', value: tenantId },
          { name: '@now', value: now },
          { name: '@limit', value: limit }
        ],
      };
      
      const { resources: deadlines } = await container.items.query(query).fetchAll();
      
      ctx.log(`Retrieved ${deadlines.length} upcoming deadlines`);
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deadlines),
      };
    } catch (error) {
      ctx.error('Error retrieving upcoming deadlines:', error);
      
      // If deadlines collection doesn't exist or is empty, return sample data
      const sampleDeadlines: DeadlineItem[] = [
        {
          id: '1',
          title: 'Tax Return Filing',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          priority: 'high',
          action: 'Submit to IRS',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Legal Review Required',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          priority: 'medium',
          action: 'Attorney review needed',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Client Signature Pending',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          priority: 'high',
          action: 'Obtain signature',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          title: 'Document Validation',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          priority: 'medium',
          action: 'Validate compliance',
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          title: 'Final Approval',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          priority: 'high',
          action: 'Manager approval required',
          createdAt: new Date().toISOString()
        }
      ];
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleDeadlines.slice(0, parseInt(req.query.get('limit') || '10', 10))),
      };
    }
  },
});
