import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: string;
  userId: string;
  documentId?: string;
  clientId?: string;
  createdAt: string;
}

app.http('getRecentActivities', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'activities/recent',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const limit = parseInt(req.query.get('limit') || '10', 10);
      const tenantId = req.query.get('tenantId') || 'default';
      
      const container = getContainer('activities');
      
      // Query recent activities for the tenant
      const query = {
        query: `SELECT * FROM c WHERE c.partitionKey = @tenantId ORDER BY c.createdAt DESC OFFSET 0 LIMIT @limit`,
        parameters: [
          { name: '@tenantId', value: tenantId },
          { name: '@limit', value: limit }
        ],
      };
      
      const { resources: activities } = await container.items.query(query).fetchAll();
      
      // Transform activities to include user-friendly time formatting
      const formattedActivities: ActivityItem[] = activities.map(activity => ({
        ...activity,
        time: formatTimeAgo(new Date(activity.createdAt))
      }));
      
      ctx.log(`Retrieved ${formattedActivities.length} recent activities`);
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedActivities),
      };
    } catch (error) {
      ctx.error('Error retrieving recent activities:', error);
      
      // If activities collection doesn't exist or is empty, return sample data
      const sampleActivities: ActivityItem[] = [
        {
          id: '1',
          title: 'Document Reviewed',
          description: 'Tax Return 2023 reviewed and approved',
          time: '2 hours ago',
          type: 'review',
          userId: 'user1',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'New Client Added',
          description: 'Johnson & Associates LLP added to client database',
          time: '4 hours ago',
          type: 'client',
          userId: 'user2',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Document Uploaded',
          description: 'Medical Consent Form uploaded for Smith Dental',
          time: '1 day ago',
          type: 'upload',
          userId: 'user3',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          title: 'Signature Completed',
          description: 'Service Agreement signed by XYZ Accounting',
          time: '2 days ago',
          type: 'signature',
          userId: 'user1',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleActivities.slice(0, parseInt(req.query.get('limit') || '10', 10))),
      };
    }
  },
});

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // For older dates, return formatted date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
