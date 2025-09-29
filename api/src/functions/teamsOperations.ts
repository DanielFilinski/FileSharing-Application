import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { Client } from '@microsoft/microsoft-graph-client';
import { getContainer } from '../shared/db/cosmos';
import config from '../config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// POST /api/teams/share-document - Share document to Teams channel
app.http('shareDocumentToTeams', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'teams/share-document',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
      if (!accessToken) {
        return {
          status: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No access token provided' })
        };
      }

      const { documentId, teamId, channelId, message, endUserId } = await req.json();

      ctx.log(`Sharing document ${documentId} to Teams channel ${channelId} in team ${teamId}`);

      // Create OBO credential for Graph API
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      // Get user info
      const userInfo = await oboCredential.getUserInfo();

      // Get Graph client
      const graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await oboCredential.getToken(['https://graph.microsoft.com/.default']);
            return tokenResponse?.token || '';
          }
        }
      });

      // Get document from CosmosDB
      const documentsContainer = getContainer('documents');
      const { resource: document } = await documentsContainer.item(documentId).read();

      if (!document) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document not found' })
        };
      }

      // Create adaptive card for document sharing
      const adaptiveCard = {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.2',
          body: [
            {
              type: 'Container',
              items: [
                {
                  type: 'TextBlock',
                  text: `📄 Document Shared`,
                  weight: 'Bolder',
                  size: 'Medium',
                  color: 'Accent'
                },
                {
                  type: 'TextBlock',
                  text: `**${document.name}**`,
                  weight: 'Bolder',
                  wrap: true
                },
                {
                  type: 'TextBlock',
                  text: `Shared by: ${userInfo.displayName}`,
                  isSubtle: true,
                  spacing: 'Small'
                },
                {
                  type: 'TextBlock',
                  text: message || 'Document shared for your review.',
                  wrap: true,
                  spacing: 'Medium'
                }
              ]
            },
            {
              type: 'FactSet',
              facts: [
                {
                  title: 'Type:',
                  value: document.type || 'Document'
                },
                {
                  title: 'Size:',
                  value: document.size ? `${(document.size / 1024).toFixed(1)} KB` : 'Unknown'
                },
                {
                  title: 'End User:',
                  value: endUserId || 'All Users'
                }
              ]
            }
          ],
          actions: [
            {
              type: 'Action.OpenUrl',
              title: '📖 Open Document',
              url: document.webUrl || document.sharePointUrl || `${config.clientBaseUrl}/documents/${documentId}`
            },
            {
              type: 'Action.OpenUrl',
              title: '🔗 Open in SharePoint',
              url: document.sharePointUrl || `${config.clientBaseUrl}/sharepoint`
            }
          ]
        }
      };

      // Send message to Teams channel
      const messagePayload = {
        body: {
          content: message || `Document "${document.name}" has been shared`,
          contentType: 'text'
        },
        attachments: [adaptiveCard]
      };

      await graphClient
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post(messagePayload);

      // Log activity in CosmosDB
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `teams-share-${documentId}-${Date.now()}`,
        partitionKey: document.partitionKey,
        type: 'teams-document-share',
        documentId,
        teamId,
        channelId,
        userId: userInfo.objectId,
        userName: userInfo.displayName,
        endUserId: endUserId,
        timestamp: new Date().toISOString(),
        action: 'shared-to-teams-channel',
        details: { 
          message,
          documentName: document.name,
          documentType: document.type
        }
      });

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Document shared to Teams channel successfully',
          documentName: document.name,
          channelId
        })
      };

    } catch (error: any) {
      ctx.error('Teams document share error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: error.message,
          details: 'Failed to share document to Teams channel'
        })
      };
    }
  }
});

// GET /api/teams/context - Get Teams context information  
app.http('getTeamsContext', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'teams/context',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
      if (!accessToken) {
        return {
          status: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No access token provided' })
        };
      }

      const teamId = req.query.get('teamId');
      const channelId = req.query.get('channelId');

      if (!teamId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Team ID is required' })
        };
      }

      ctx.log(`Getting Teams context for team: ${teamId}, channel: ${channelId}`);

      // Create OBO credential for Graph API
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      // Get Graph client
      const graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await oboCredential.getToken(['https://graph.microsoft.com/.default']);
            return tokenResponse?.token || '';
          }
        }
      });

      const teamsInfo: any = {};

      // Get team information
      try {
        const team = await graphClient.api(`/teams/${teamId}`).get();
        teamsInfo.team = {
          id: team.id,
          displayName: team.displayName,
          description: team.description,
          webUrl: team.webUrl
        };
      } catch (teamError) {
        ctx.warn(`Could not fetch team info for ${teamId}:`, teamError);
      }

      // Get channel information if provided
      if (channelId) {
        try {
          const channel = await graphClient.api(`/teams/${teamId}/channels/${channelId}`).get();
          teamsInfo.channel = {
            id: channel.id,
            displayName: channel.displayName,
            description: channel.description,
            webUrl: channel.webUrl
          };
        } catch (channelError) {
          ctx.warn(`Could not fetch channel info for ${channelId}:`, channelError);
        }
      }

      // Get SharePoint site associated with the team
      try {
        const site = await graphClient.api(`/groups/${teamId}/sites/root`).get();
        teamsInfo.sharePointSite = {
          id: site.id,
          displayName: site.displayName,
          webUrl: site.webUrl
        };
      } catch (siteError) {
        ctx.warn(`Could not fetch SharePoint site for team ${teamId}:`, siteError);
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          teamsContext: teamsInfo,
          timestamp: new Date().toISOString()
        })
      };

    } catch (error: any) {
      ctx.error('Teams context error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: error.message,
          details: 'Failed to get Teams context information'
        })
      };
    }
  }
});

// POST /api/teams/notify - Send activity feed notification
app.http('sendTeamsNotification', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'teams/notify',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
      if (!accessToken) {
        return {
          status: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No access token provided' })
        };
      }

      const { 
        activityType, 
        documentId, 
        documentName, 
        recipientUserId, 
        templateParameters 
      } = await req.json();

      ctx.log(`Sending Teams notification: ${activityType} for document ${documentId}`);

      // Create OBO credential for Graph API
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      // Get user info
      const userInfo = await oboCredential.getUserInfo();

      // Get Graph client
      const graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await oboCredential.getToken(['https://graph.microsoft.com/.default']);
            return tokenResponse?.token || '';
          }
        }
      });

      // Create activity feed notification
      const activityPayload = {
        topic: {
          source: 'entityUrl',
          value: `${config.clientBaseUrl}/documents/${documentId}`
        },
        activityType: activityType,
        previewText: {
          content: `Document "${documentName}" needs your attention`
        },
        templateParameters: [
          {
            name: 'actor',
            value: userInfo.displayName
          },
          {
            name: 'documentName', 
            value: documentName
          },
          ...Object.entries(templateParameters || {}).map(([name, value]) => ({
            name,
            value: String(value)
          }))
        ],
        recipient: {
          '@odata.type': 'microsoft.graph.aadUserNotificationRecipient',
          userId: recipientUserId
        }
      };

      // Send activity feed notification
      await graphClient
        .api(`/chats/getAllMessages`)
        .post(activityPayload);

      // Log notification activity
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `teams-notification-${documentId}-${Date.now()}`,
        partitionKey: userInfo.tenantId,
        type: 'teams-notification',
        documentId,
        activityType,
        recipientUserId,
        senderId: userInfo.objectId,
        senderName: userInfo.displayName,
        timestamp: new Date().toISOString(),
        action: 'teams-activity-notification-sent',
        details: { 
          documentName,
          templateParameters
        }
      });

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Teams notification sent successfully',
          activityType,
          documentName
        })
      };

    } catch (error: any) {
      ctx.error('Teams notification error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: error.message,
          details: 'Failed to send Teams notification'
        })
      };
    }
  }
});
