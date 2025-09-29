import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';
import config from '../config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Validation schemas
const PinDocumentSchema = z.object({
  pinned: z.boolean()
});

const MoveDocumentSchema = z.object({
  documentIds: z.array(z.string().min(1)),
  targetFolder: z.string().min(1),
  moveType: z.enum(['move', 'copy'])
});

const BulkOperationSchema = z.object({
  documentIds: z.array(z.string().min(1)),
  operation: z.enum(['delete', 'archive', 'restore', 'tag']),
  metadata: z.record(z.any()).optional()
});

// PIN TO TOP functionality
app.http('pinDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/pin',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    // Authentication
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const credential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await credential.getUserInfo();
      const documentId = req.params.get('documentId');

      if (!documentId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document ID is required' })
        };
      }

      // Validate request body
      const body = await req.json();
      const parsed = PinDocumentSchema.safeParse(body);

      if (!parsed.success) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid request data',
            details: parsed.error.flatten()
          })
        };
      }

      const { pinned } = parsed.data;

      // Get document from database
      const documentsContainer = getContainer('documents');
      const { resource: document } = await documentsContainer.item(documentId).read();

      if (!document) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document not found' })
        };
      }

      // Check permissions (user must be owner or editor)
      const userPrincipal = userInfo.userPrincipalName || userInfo.email;
      const hasPermission = document.permissions?.owners?.includes(userPrincipal) ||
                           document.permissions?.editors?.includes(userPrincipal) ||
                           document.createdBy === userPrincipal;

      if (!hasPermission) {
        return {
          status: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Insufficient permissions to pin/unpin this document' })
        };
      }

      // Update document with pin status
      const updateOps = [
        { op: pinned ? 'add' : 'remove', path: '/pinned', value: pinned },
        { op: 'add', path: '/pinnedBy', value: userPrincipal },
        { op: 'add', path: '/pinnedAt', value: new Date().toISOString() },
        { op: 'replace', path: '/lastModified', value: new Date().toISOString() },
        { op: 'replace', path: '/lastModifiedBy', value: userPrincipal }
      ];

      await documentsContainer.item(documentId).patch(updateOps);

      // Log activity
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `pin-${documentId}-${Date.now()}`,
        partitionKey: userInfo.tenantId || 'default',
        type: 'document-pin',
        documentId,
        documentName: document.name,
        userId: userInfo.objectId,
        userName: userInfo.displayName,
        userEmail: userPrincipal,
        action: pinned ? 'pinned' : 'unpinned',
        timestamp: new Date().toISOString(),
        metadata: {
          documentType: document.type,
          folderPath: document.folderPath
        }
      });

      ctx.log(`Document ${documentId} ${pinned ? 'pinned' : 'unpinned'} by ${userInfo.displayName}`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          documentId,
          pinned,
          pinnedBy: userInfo.displayName,
          pinnedAt: new Date().toISOString(),
          message: `Document ${pinned ? 'pinned to top' : 'unpinned'} successfully`
        })
      };

    } catch (error: any) {
      ctx.error('Pin document error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});

// MOVE/COPY DOCUMENTS functionality
app.http('moveDocuments', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/move',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    // Authentication
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const credential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await credential.getUserInfo();

      // Validate request body
      const body = await req.json();
      const parsed = MoveDocumentSchema.safeParse(body);

      if (!parsed.success) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid request data',
            details: parsed.error.flatten()
          })
        };
      }

      const { documentIds, targetFolder, moveType } = parsed.data;
      const documentsContainer = getContainer('documents');
      const results = [];
      const userPrincipal = userInfo.userPrincipalName || userInfo.email;

      ctx.log(`${moveType} operation started for ${documentIds.length} documents by ${userInfo.displayName}`);

      for (const documentId of documentIds) {
        try {
          const { resource: document } = await documentsContainer.item(documentId).read();

          if (!document) {
            results.push({
              documentId,
              success: false,
              error: 'Document not found'
            });
            continue;
          }

          // Check permissions
          const hasPermission = document.permissions?.owners?.includes(userPrincipal) ||
                               document.permissions?.editors?.includes(userPrincipal) ||
                               document.createdBy === userPrincipal;

          if (!hasPermission) {
            results.push({
              documentId,
              success: false,
              error: 'Insufficient permissions'
            });
            continue;
          }

          if (moveType === 'copy') {
            // Create copy of document
            const newDocumentId = `copy-${documentId}-${Date.now()}`;
            const newDocument = {
              ...document,
              id: newDocumentId,
              name: `Copy of ${document.name}`,
              folderPath: targetFolder,
              createdAt: new Date().toISOString(),
              createdBy: userPrincipal,
              lastModified: new Date().toISOString(),
              lastModifiedBy: userPrincipal,
              // Reset certain fields for the copy
              pinned: false,
              pinnedBy: null,
              pinnedAt: null,
              version: 1,
              // Preserve permissions
              permissions: document.permissions
            };

            await documentsContainer.items.create(newDocument);

            results.push({
              documentId,
              success: true,
              action: 'copied',
              newDocumentId,
              newName: newDocument.name,
              targetFolder
            });

            ctx.log(`Document ${documentId} copied to ${newDocumentId} in folder ${targetFolder}`);

          } else {
            // Move document
            const updateOps = [
              { op: 'replace', path: '/folderPath', value: targetFolder },
              { op: 'add', path: '/movedAt', value: new Date().toISOString() },
              { op: 'add', path: '/movedBy', value: userPrincipal },
              { op: 'replace', path: '/lastModified', value: new Date().toISOString() },
              { op: 'replace', path: '/lastModifiedBy', value: userPrincipal }
            ];

            await documentsContainer.item(documentId).patch(updateOps);

            results.push({
              documentId,
              success: true,
              action: 'moved',
              targetFolder,
              previousFolder: document.folderPath
            });

            ctx.log(`Document ${documentId} moved from ${document.folderPath} to ${targetFolder}`);
          }

        } catch (error: any) {
          ctx.error(`Error processing document ${documentId}:`, error);
          results.push({
            documentId,
            success: false,
            error: `Processing error: ${error.message}`
          });
        }
      }

      // Log bulk activity
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `bulk-${moveType}-${Date.now()}`,
        partitionKey: userInfo.tenantId || 'default',
        type: 'bulk-operation',
        operation: moveType,
        documentIds,
        targetFolder,
        userId: userInfo.objectId,
        userName: userInfo.displayName,
        userEmail: userPrincipal,
        results,
        timestamp: new Date().toISOString(),
        summary: {
          total: documentIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          operation: moveType,
          targetFolder,
          results,
          summary: {
            total: documentIds.length,
            successful: successCount,
            failed: failCount
          },
          message: `${moveType} operation completed: ${successCount} successful, ${failCount} failed`
        })
      };

    } catch (error: any) {
      ctx.error('Move documents error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});

// BULK OPERATIONS functionality
app.http('bulkDocumentOperations', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/bulk',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    // Authentication
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const credential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await credential.getUserInfo();

      // Validate request body
      const body = await req.json();
      const parsed = BulkOperationSchema.safeParse(body);

      if (!parsed.success) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid request data',
            details: parsed.error.flatten()
          })
        };
      }

      const { documentIds, operation, metadata } = parsed.data;
      const documentsContainer = getContainer('documents');
      const results = [];
      const userPrincipal = userInfo.userPrincipalName || userInfo.email;

      ctx.log(`Bulk ${operation} operation started for ${documentIds.length} documents by ${userInfo.displayName}`);

      for (const documentId of documentIds) {
        try {
          const { resource: document } = await documentsContainer.item(documentId).read();

          if (!document) {
            results.push({
              documentId,
              success: false,
              error: 'Document not found'
            });
            continue;
          }

          // Check permissions (owners and editors can perform bulk operations)
          const hasPermission = document.permissions?.owners?.includes(userPrincipal) ||
                               document.permissions?.editors?.includes(userPrincipal) ||
                               document.createdBy === userPrincipal;

          if (!hasPermission) {
            results.push({
              documentId,
              success: false,
              error: 'Insufficient permissions'
            });
            continue;
          }

          let updateOps = [];
          let actionDescription = '';

          switch (operation) {
            case 'delete':
              // Soft delete - mark as deleted
              updateOps = [
                { op: 'add', path: '/deleted', value: true },
                { op: 'add', path: '/deletedAt', value: new Date().toISOString() },
                { op: 'add', path: '/deletedBy', value: userPrincipal },
                { op: 'replace', path: '/status', value: 'deleted' }
              ];
              actionDescription = 'soft deleted';
              break;

            case 'archive':
              updateOps = [
                { op: 'add', path: '/archived', value: true },
                { op: 'add', path: '/archivedAt', value: new Date().toISOString() },
                { op: 'add', path: '/archivedBy', value: userPrincipal },
                { op: 'replace', path: '/status', value: 'archived' }
              ];
              actionDescription = 'archived';
              break;

            case 'restore':
              updateOps = [
                { op: 'remove', path: '/deleted' },
                { op: 'remove', path: '/archived' },
                { op: 'replace', path: '/status', value: 'active' },
                { op: 'add', path: '/restoredAt', value: new Date().toISOString() },
                { op: 'add', path: '/restoredBy', value: userPrincipal }
              ];
              actionDescription = 'restored';
              break;

            case 'tag':
              if (metadata?.tags) {
                updateOps = [
                  { op: 'add', path: '/tags', value: metadata.tags },
                  { op: 'add', path: '/taggedAt', value: new Date().toISOString() },
                  { op: 'add', path: '/taggedBy', value: userPrincipal }
                ];
                actionDescription = `tagged with: ${metadata.tags.join(', ')}`;
              } else {
                results.push({
                  documentId,
                  success: false,
                  error: 'No tags provided for tagging operation'
                });
                continue;
              }
              break;

            default:
              results.push({
                documentId,
                success: false,
                error: `Unknown operation: ${operation}`
              });
              continue;
          }

          // Add common update operations
          updateOps.push(
            { op: 'replace', path: '/lastModified', value: new Date().toISOString() },
            { op: 'replace', path: '/lastModifiedBy', value: userPrincipal }
          );

          await documentsContainer.item(documentId).patch(updateOps);

          results.push({
            documentId,
            success: true,
            action: operation,
            description: actionDescription,
            documentName: document.name
          });

          ctx.log(`Document ${documentId} (${document.name}) ${actionDescription}`);

        } catch (error: any) {
          ctx.error(`Error processing document ${documentId} for ${operation}:`, error);
          results.push({
            documentId,
            success: false,
            error: `Processing error: ${error.message}`
          });
        }
      }

      // Log bulk activity
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `bulk-${operation}-${Date.now()}`,
        partitionKey: userInfo.tenantId || 'default',
        type: 'bulk-operation',
        operation,
        documentIds,
        userId: userInfo.objectId,
        userName: userInfo.displayName,
        userEmail: userPrincipal,
        metadata,
        results,
        timestamp: new Date().toISOString(),
        summary: {
          total: documentIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          operation,
          results,
          summary: {
            total: documentIds.length,
            successful: successCount,
            failed: failCount
          },
          message: `Bulk ${operation} operation completed: ${successCount} successful, ${failCount} failed`
        })
      };

    } catch (error: any) {
      ctx.error('Bulk operation error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});

// GET DOCUMENT ACTIVITIES (for audit trail)
app.http('getDocumentActivities', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/activities',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    // Authentication
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const credential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await credential.getUserInfo();
      const documentId = req.params.get('documentId');

      if (!documentId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document ID is required' })
        };
      }

      // Get activities for this document
      const activitiesContainer = getContainer('activities');
      const query = {
        query: 'SELECT * FROM c WHERE c.documentId = @documentId ORDER BY c.timestamp DESC',
        parameters: [{ name: '@documentId', value: documentId }]
      };

      const { resources: activities } = await activitiesContainer.items.query(query).fetchAll();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          documentId,
          activities,
          count: activities.length
        })
      };

    } catch (error: any) {
      ctx.error('Get document activities error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});
