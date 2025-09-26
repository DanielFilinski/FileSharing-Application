import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';

export interface DashboardStats {
  totalDocuments: number;
  pendingValidation: number;
  pendingSigning: number;
  pendingApproval: number;
  completionPercentage: number;
}

app.http('getDashboardStats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/stats',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const container = getContainer('documents');
      const tenantId = req.query.get('tenantId') || 'default';
      
      // Query all documents for the tenant
      const query = {
        query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId',
        parameters: [
          { name: '@tenantId', value: tenantId }
        ],
      };
      
      const { resources: documents } = await container.items.query(query).fetchAll();
      
      // Calculate statistics
      const totalDocuments = documents.length;
      const pendingValidation = documents.filter(doc => doc.status === 'pending').length;
      const pendingSigning = documents.filter(doc => doc.status === 'draft').length;
      const pendingApproval = documents.filter(doc => doc.status === 'pending').length;
      const approvedDocuments = documents.filter(doc => doc.status === 'approved').length;
      const completionPercentage = totalDocuments > 0 
        ? Math.floor((approvedDocuments / totalDocuments) * 100) 
        : 0;
      
      const stats: DashboardStats = {
        totalDocuments,
        pendingValidation,
        pendingSigning,
        pendingApproval,
        completionPercentage,
      };
      
      ctx.log(`Dashboard stats calculated: ${JSON.stringify(stats)}`);
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stats),
      };
    } catch (error) {
      ctx.error('Error calculating dashboard stats:', error);
      
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Failed to calculate dashboard statistics',
          details: error.message,
        }),
      };
    }
  },
});
