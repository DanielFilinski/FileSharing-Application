import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { createProtectedFunction, RBAC_CONFIGS } from '../shared/middleware/rbacMiddleware';
import { DocumentVersioningService } from '../shared/versioning/versioningService';
import { auditMiddleware } from '../shared/audit/auditMiddleware';
import { AuditActions } from '../../../src/shared/types/audit';
import { z } from 'zod';

const DocumentSchema = z.object({
  partitionKey: z.string(),
  name: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  blobUrl: z.string().url(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'archived']).default('draft'),
  category: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.object({
    createdBy: z.string(),
    createdAt: z.string(),
    modifiedBy: z.string().optional(),
    modifiedAt: z.string().optional(),
    officeId: z.string().optional(),
    departmentId: z.string().optional(),
    clientId: z.string().optional(),
    approvalFlow: z.enum(['parallel', 'consecutive']).optional(),
    validators: z.array(z.string()).optional().default([]),
    signers: z.array(z.string()).optional().default([]),
    deadline: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('low'),
    isLocked: z.boolean().default(false),
    lockedBy: z.string().optional(),
    lockedAt: z.string().optional(),
    version: z.number().default(1),
    parentDocumentId: z.string().optional(),
  }),
  permissions: z.object({
    owners: z.array(z.string()).default([]),
    viewers: z.array(z.string()).default([]),
    editors: z.array(z.string()).default([]),
    approvers: z.array(z.string()).default([]),
  }).default({ owners: [], viewers: [], editors: [], approvers: [] }),
});

// Protected GET /api/documents - Get documents with RBAC
app.http('getDocumentsProtected', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents-protected',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_READ,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const container = getContainer('documents');
        const status = req.query.get('status');
        const category = req.query.get('category');
        const endUserId = req.query.get('endUserId');
        
        // Build query based on user permissions and tenant
        const tenantId = authResult.user!.tenantId;
        
        let queryConditions = [`c.partitionKey = @tenantId`];
        const parameters: any[] = [{ name: '@tenantId', value: tenantId }];
        
        // Add filters
        if (status) {
          queryConditions.push(`c.status = @status`);
          parameters.push({ name: '@status', value: status });
        }
        
        if (category) {
          queryConditions.push(`c.category = @category`);
          parameters.push({ name: '@category', value: category });
        }
        
        if (endUserId) {
          queryConditions.push(`c.endUserId = @endUserId`);
          parameters.push({ name: '@endUserId', value: endUserId });
        }
        
        // Role-based data filtering
        const userRoles = authResult.roles!;
        const userEmail = authResult.user!.email;
        
        if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) {
          // Non-admin users can only see documents they have access to
          queryConditions.push(`(
            ARRAY_CONTAINS(c.permissions.owners, @userEmail) OR
            ARRAY_CONTAINS(c.permissions.editors, @userEmail) OR
            ARRAY_CONTAINS(c.permissions.viewers, @userEmail) OR
            c.metadata.createdBy = @userEmail
          )`);
          parameters.push({ name: '@userEmail', value: userEmail });
        }
        
        const query = {
          query: `SELECT * FROM c WHERE ${queryConditions.join(' AND ')} ORDER BY c.metadata.createdAt DESC`,
          parameters
        };
        
        ctx.log(`RBAC Documents Query: ${query.query}`);
        const { resources: documents } = await container.items.query(query).fetchAll();
        
        // Additional permission-based filtering for sensitive data
        const filteredDocuments = documents.map(doc => {
          // Hide sensitive metadata for viewers
          if (userRoles.includes('EndUser') || userRoles.includes('Viewer')) {
            return {
              ...doc,
              metadata: {
                ...doc.metadata,
                validators: undefined,
                signers: undefined,
                approvalFlow: undefined
              }
            };
          }
          return doc;
        });
        
        ctx.log(`RBAC Documents: Returning ${filteredDocuments.length} documents for user ${authResult.user!.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: filteredDocuments,
            count: filteredDocuments.length,
            userAccess: {
              roles: userRoles,
              permissions: authResult.permissions
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected documents query error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve documents'
          })
        };
      }
    }
  )
});

// Protected POST /api/documents - Create document with RBAC
app.http('createDocumentProtected', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents-protected',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_WRITE,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = DocumentSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid document data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const documentData = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Set document ownership and metadata
        const document = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...documentData,
          partitionKey: user.tenantId,
          metadata: {
            ...documentData.metadata,
            createdBy: user.email,
            createdAt: now,
            modifiedBy: user.email,
            modifiedAt: now
          },
          permissions: {
            owners: [user.email],
            viewers: documentData.permissions?.viewers || [],
            editors: documentData.permissions?.editors || [],
            approvers: documentData.permissions?.approvers || []
          }
        };
        
        // Store in database
        const container = getContainer('documents');
        const { resource: createdDocument } = await container.items.create(document);
        
        // Create initial version for the document
        try {
          await DocumentVersioningService.createVersionFromDocument(
            createdDocument.id,
            user,
            {
              changeType: 'created',
              changeDescription: 'Document created',
              auditInfo: {
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                sessionId: req.headers.get('x-session-id') || `session-${Date.now()}`
              }
            },
            ctx
          );
        } catch (versionError) {
          ctx.warn('Failed to create initial document version:', versionError);
          // Don't fail the document creation if versioning fails
        }
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-${document.id}-created`,
          partitionKey: user.tenantId,
          type: 'document-created',
          documentId: document.id,
          documentName: document.name,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            documentSize: document.fileSize,
            documentType: document.mimeType,
            category: document.category
          }
        });
        
        ctx.log(`RBAC Documents: Created document ${document.id} by ${user.displayName}`);
        
        return {
          status: 201,
          body: JSON.stringify({
            success: true,
            data: createdDocument,
            message: 'Document created successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected document creation error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to create document'
          })
        };
      }
    }
  )
});

// Protected PUT /api/documents/{id} - Update document with ownership check
app.http('updateDocumentProtected', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'documents-protected/{documentId}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_OWNER, // Uses ownership validator
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const documentId = req.params.get('documentId');
        if (!documentId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Document ID is required' })
          };
        }
        
        const body = await req.json();
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Get existing document
        const container = getContainer('documents');
        const { resource: existingDocument } = await container.item(documentId).read();
        
        if (!existingDocument) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Document not found' })
          };
        }
        
        // Update document
        const updates = [
          { op: 'replace', path: '/name', value: body.name || existingDocument.name },
          { op: 'replace', path: '/status', value: body.status || existingDocument.status },
          { op: 'replace', path: '/category', value: body.category || existingDocument.category },
          { op: 'replace', path: '/tags', value: body.tags || existingDocument.tags },
          { op: 'replace', path: '/metadata/modifiedBy', value: user.email },
          { op: 'replace', path: '/metadata/modifiedAt', value: now }
        ];
        
        await container.item(documentId).patch(updates);
        
        // Get updated document
        const { resource: updatedDocument } = await container.item(documentId).read();
        
        // Create version for the update
        try {
          const changeDescription = getChangeDescription(body, existingDocument);
          await DocumentVersioningService.createVersionFromDocument(
            documentId,
            user,
            {
              changeType: body.status !== existingDocument.status ? 'status_changed' : 'updated',
              changeDescription,
              auditInfo: {
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                sessionId: req.headers.get('x-session-id') || `session-${Date.now()}`
              }
            },
            ctx
          );
        } catch (versionError) {
          ctx.warn('Failed to create document version on update:', versionError);
          // Don't fail the update if versioning fails
        }
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-${documentId}-updated-${Date.now()}`,
          partitionKey: user.tenantId,
          type: 'document-updated',
          documentId,
          documentName: updatedDocument.name,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            changes: Object.keys(body),
            previousStatus: existingDocument.status,
            newStatus: updatedDocument.status
          }
        });
        
        ctx.log(`RBAC Documents: Updated document ${documentId} by ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: updatedDocument,
            message: 'Document updated successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected document update error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to update document'
          })
        };
      }
    }
  )
});

// Protected DELETE /api/documents/{id} - Delete document with ownership check
app.http('deleteDocumentProtected', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'documents-protected/{documentId}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_OWNER, // Uses ownership validator
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const documentId = req.params.get('documentId');
        if (!documentId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Document ID is required' })
          };
        }
        
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Get existing document for logging
        const container = getContainer('documents');
        const { resource: existingDocument } = await container.item(documentId).read();
        
        if (!existingDocument) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Document not found' })
          };
        }
        
        // Soft delete - mark as deleted
        const updates = [
          { op: 'add', path: '/deleted', value: true },
          { op: 'add', path: '/deletedAt', value: now },
          { op: 'add', path: '/deletedBy', value: user.email },
          { op: 'replace', path: '/status', value: 'deleted' },
          { op: 'replace', path: '/metadata/modifiedBy', value: user.email },
          { op: 'replace', path: '/metadata/modifiedAt', value: now }
        ];
        
        await container.item(documentId).patch(updates);
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-${documentId}-deleted-${Date.now()}`,
          partitionKey: user.tenantId,
          type: 'document-deleted',
          documentId,
          documentName: existingDocument.name,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            originalStatus: existingDocument.status,
            deletionType: 'soft-delete'
          }
        });
        
        ctx.log(`RBAC Documents: Deleted document ${documentId} by ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Document deleted successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected document deletion error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to delete document'
          })
        };
      }
    }
  )
});

// Helper function to generate change description for versioning
function getChangeDescription(updates: any, existingDocument: any): string {
  const changes: string[] = [];
  
  if (updates.name && updates.name !== existingDocument.name) {
    changes.push(`renamed from "${existingDocument.name}" to "${updates.name}"`);
  }
  
  if (updates.status && updates.status !== existingDocument.status) {
    changes.push(`status changed from "${existingDocument.status}" to "${updates.status}"`);
  }
  
  if (updates.category && updates.category !== existingDocument.category) {
    changes.push(`category changed from "${existingDocument.category}" to "${updates.category}"`);
  }
  
  if (updates.tags && JSON.stringify(updates.tags) !== JSON.stringify(existingDocument.tags)) {
    changes.push('tags updated');
  }
  
  if (changes.length === 0) {
    return 'Document updated';
  }
  
  return 'Document ' + changes.join(', ');
}
