import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { createProtectedFunction, RBAC_CONFIGS } from '../shared/middleware/rbacMiddleware';
import { DocumentVersioningService } from '../shared/versioning/versioningService';
import { z } from 'zod';

// Document Version Schema
const DocumentVersionSchema = z.object({
  id: z.string(),
  partitionKey: z.string(),
  documentId: z.string(),
  versionNumber: z.number(),
  documentSnapshot: z.object({
    name: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    blobUrl: z.string(),
    status: z.string(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    metadata: z.any()
  }),
  versionMetadata: z.object({
    createdBy: z.string(),
    createdByEmail: z.string(),
    createdAt: z.string(),
    changeType: z.enum(['created', 'updated', 'status_changed', 'renamed', 'moved', 'approved', 'rejected']),
    changeDescription: z.string(),
    previousVersion: z.number().optional(),
    validationStatus: z.string().optional(),
    approvalStatus: z.string().optional(),
    signatureStatus: z.string().optional()
  }),
  auditInfo: z.object({
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    sessionId: z.string().optional(),
    workflowId: z.string().optional()
  }).optional()
});

const DocumentHistoryEventSchema = z.object({
  eventType: z.enum(['upload', 'download', 'view', 'edit', 'rename', 'move', 'delete', 'share', 'lock', 'unlock', 'validate', 'approve', 'sign']),
  eventDetails: z.object({
    action: z.string(),
    oldValue: z.any().optional(),
    newValue: z.any().optional(),
    reason: z.string().optional(),
    workflowStepId: z.string().optional()
  }),
  reason: z.string().optional()
});

// CREATE NEW DOCUMENT VERSION
// POST /api/documents/{documentId}/versions
app.http('createDocumentVersion', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/versions',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_WRITE,
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
        const parsed = DocumentHistoryEventSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid request data',
              details: parsed.error.flatten()
            })
          };
        }

        const { eventType, eventDetails, reason } = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();

        // 1. Get current document
        const documentsContainer = getContainer('documents');
        const { resource: currentDocument } = await documentsContainer.item(documentId).read();
        
        if (!currentDocument) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Document not found' })
          };
        }

        // 2. Check if user has access to document
        const hasAccess = 
          currentDocument.permissions?.owners?.includes(user.email) ||
          currentDocument.permissions?.editors?.includes(user.email) ||
          authResult.roles?.includes('Administrator') ||
          authResult.roles?.includes('Manager');

        if (!hasAccess) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Insufficient permissions',
              message: 'You do not have permission to create versions for this document'
            })
          };
        }

        // 3. Get latest version number
        const versionsContainer = getContainer('document-versions');
        const versionQuery = {
          query: 'SELECT TOP 1 c.versionNumber FROM c WHERE c.partitionKey = @documentId ORDER BY c.versionNumber DESC',
          parameters: [{ name: '@documentId', value: documentId }]
        };
        const { resources: versionResults } = await versionsContainer.items.query(versionQuery).fetchAll();
        const latestVersionNumber = versionResults.length > 0 ? versionResults[0].versionNumber : 0;
        const newVersionNumber = latestVersionNumber + 1;

        // 4. Create new version
        const newVersion = {
          id: `version-${documentId}-${newVersionNumber}`,
          partitionKey: documentId,
          documentId,
          versionNumber: newVersionNumber,
          documentSnapshot: {
            name: currentDocument.name,
            fileName: currentDocument.fileName,
            fileSize: currentDocument.fileSize,
            mimeType: currentDocument.mimeType,
            blobUrl: currentDocument.blobUrl,
            status: currentDocument.status,
            category: currentDocument.category,
            tags: currentDocument.tags || [],
            metadata: currentDocument.metadata
          },
          versionMetadata: {
            createdBy: user.displayName || user.email,
            createdByEmail: user.email,
            createdAt: now,
            changeType: eventType === 'upload' ? 'created' : 'updated',
            changeDescription: eventDetails.action,
            previousVersion: latestVersionNumber > 0 ? latestVersionNumber : undefined,
            validationStatus: currentDocument.status === 'pending validation' ? 'pending' : undefined,
            approvalStatus: currentDocument.status === 'pending' ? 'pending' : undefined
          },
          auditInfo: {
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            userAgent: req.headers.get('user-agent'),
            sessionId: req.headers.get('x-session-id'),
            workflowId: eventDetails.workflowStepId
          }
        };

        // 5. Store new version
        const { resource: createdVersion } = await versionsContainer.items.create(newVersion);

        // 6. Update main document version number
        await documentsContainer.item(documentId).patch([
          { op: 'replace', path: '/metadata/version', value: newVersionNumber },
          { op: 'replace', path: '/metadata/modifiedAt', value: now },
          { op: 'replace', path: '/metadata/modifiedBy', value: user.email }
        ]);

        // 7. Create history event
        await createHistoryEvent(documentId, eventType, eventDetails, user, now, createdVersion.id, ctx);

        ctx.log(`Document version created: ${createdVersion.id} for document ${documentId} by ${user.displayName}`);

        return {
          status: 201,
          body: JSON.stringify({
            success: true,
            data: createdVersion,
            message: 'Document version created successfully'
          })
        };

      } catch (error: any) {
        ctx.error('Create document version error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to create document version'
          })
        };
      }
    }
  )
});

// GET DOCUMENT VERSION HISTORY
// GET /api/documents/{documentId}/versions
app.http('getDocumentVersionHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/versions',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_READ,
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
        const userRoles = authResult.roles!;

        // 1. Check access to main document
        const documentsContainer = getContainer('documents');
        const { resource: document } = await documentsContainer.item(documentId).read();
        
        if (!document) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Document not found' })
          };
        }

        // 2. Check permissions - Document Validators and Approvers should have access per PROGECT.md
        const hasAccess = 
          document.permissions?.owners?.includes(user.email) ||
          document.permissions?.viewers?.includes(user.email) ||
          document.permissions?.editors?.includes(user.email) ||
          document.permissions?.approvers?.includes(user.email) ||
          userRoles.includes('Administrator') ||
          userRoles.includes('Manager') ||
          userRoles.includes('Document Validator') ||
          userRoles.includes('Document Approver');

        if (!hasAccess) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Insufficient permissions',
              message: 'You do not have permission to view version history for this document'
            })
          };
        }

        // 3. Get version history
        const versionsContainer = getContainer('document-versions');
        const versionsQuery = {
          query: 'SELECT * FROM c WHERE c.partitionKey = @documentId ORDER BY c.versionNumber DESC',
          parameters: [{ name: '@documentId', value: documentId }]
        };
        
        const { resources: versions } = await versionsContainer.items.query(versionsQuery).fetchAll();

        // 4. Get detailed history events
        const historyContainer = getContainer('document-history-events');
        const historyQuery = {
          query: 'SELECT * FROM c WHERE c.partitionKey = @documentId ORDER BY c.timestamp DESC',
          parameters: [{ name: '@documentId', value: documentId }]
        };
        
        const { resources: historyEvents } = await historyContainer.items.query(historyQuery).fetchAll();

        ctx.log(`Retrieved ${versions.length} versions and ${historyEvents.length} history events for document ${documentId}`);

        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              documentId,
              documentName: document.name,
              currentVersion: document.metadata?.version || 1,
              versions,
              historyEvents,
              totalVersions: versions.length
            }
          })
        };

      } catch (error: any) {
        ctx.error('Get document version history error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve document version history'
          })
        };
      }
    }
  )
});

// GET SPECIFIC DOCUMENT VERSION
// GET /api/documents/{documentId}/versions/{versionNumber}
app.http('getDocumentVersion', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/versions/{versionNumber}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_READ,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const documentId = req.params.get('documentId');
        const versionNumberStr = req.params.get('versionNumber');
        
        if (!documentId || !versionNumberStr) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Document ID and version number are required' })
          };
        }

        const versionNumber = parseInt(versionNumberStr);
        if (isNaN(versionNumber) || versionNumber < 1) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Invalid version number' })
          };
        }

        const user = authResult.user!;
        
        // 1. Check access to main document
        const documentsContainer = getContainer('documents');
        const { resource: document } = await documentsContainer.item(documentId).read();
        
        if (!document) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Document not found' })
          };
        }

        // 2. Check permissions
        const hasAccess = 
          document.permissions?.owners?.includes(user.email) ||
          document.permissions?.viewers?.includes(user.email) ||
          document.permissions?.editors?.includes(user.email) ||
          authResult.roles?.includes('Administrator') ||
          authResult.roles?.includes('Manager');

        if (!hasAccess) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Insufficient permissions',
              message: 'You do not have permission to view this document version'
            })
          };
        }

        // 3. Get specific version
        const versionsContainer = getContainer('document-versions');
        const versionId = `version-${documentId}-${versionNumber}`;
        
        const { resource: version } = await versionsContainer.item(versionId, documentId).read();
        
        if (!version) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Version not found' })
          };
        }

        // 4. Log access event
        await createHistoryEvent(documentId, 'view', { action: `Viewed version ${versionNumber}` }, user, new Date().toISOString(), versionId, ctx);

        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: version
          })
        };

      } catch (error: any) {
        ctx.error('Get document version error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve document version'
          })
        };
      }
    }
  )
});

// RESTORE DOCUMENT FROM VERSION
// POST /api/documents/{documentId}/versions/{versionNumber}/restore
app.http('restoreDocumentFromVersion', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/versions/{versionNumber}/restore',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_WRITE,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const documentId = req.params.get('documentId');
        const versionNumberStr = req.params.get('versionNumber');
        
        if (!documentId || !versionNumberStr) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Document ID and version number are required' })
          };
        }

        const versionNumber = parseInt(versionNumberStr);
        if (isNaN(versionNumber) || versionNumber < 1) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Invalid version number' })
          };
        }

        const user = authResult.user!;
        const now = new Date().toISOString();

        // 1. Check access to main document
        const documentsContainer = getContainer('documents');
        const { resource: currentDocument } = await documentsContainer.item(documentId).read();
        
        if (!currentDocument) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Document not found' })
          };
        }

        // 2. Check permissions (only owners and admins can restore)
        const hasAccess = 
          currentDocument.permissions?.owners?.includes(user.email) ||
          authResult.roles?.includes('Administrator') ||
          authResult.roles?.includes('Manager');

        if (!hasAccess) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Insufficient permissions',
              message: 'Only document owners and administrators can restore versions'
            })
          };
        }

        // 3. Get version to restore
        const versionsContainer = getContainer('document-versions');
        const versionId = `version-${documentId}-${versionNumber}`;
        
        const { resource: versionToRestore } = await versionsContainer.item(versionId, documentId).read();
        
        if (!versionToRestore) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Version not found' })
          };
        }

        // 4. Create backup of current state before restore
        await createNewVersionFromDocument(currentDocument, 'updated', `Auto-backup before restore to version ${versionNumber}`, user, now, ctx);

        // 5. Restore document from version
        const snapshot = versionToRestore.documentSnapshot;
        const restoreUpdates = [
          { op: 'replace', path: '/name', value: snapshot.name },
          { op: 'replace', path: '/fileName', value: snapshot.fileName },
          { op: 'replace', path: '/fileSize', value: snapshot.fileSize },
          { op: 'replace', path: '/mimeType', value: snapshot.mimeType },
          { op: 'replace', path: '/blobUrl', value: snapshot.blobUrl },
          { op: 'replace', path: '/status', value: snapshot.status },
          { op: 'replace', path: '/category', value: snapshot.category },
          { op: 'replace', path: '/tags', value: snapshot.tags },
          { op: 'replace', path: '/metadata/modifiedBy', value: user.email },
          { op: 'replace', path: '/metadata/modifiedAt', value: now }
        ];

        await documentsContainer.item(documentId).patch(restoreUpdates);

        // 6. Create new version for the restore action
        await createNewVersionFromDocument(
          { ...currentDocument, ...snapshot }, 
          'updated', 
          `Restored from version ${versionNumber}`, 
          user, 
          now, 
          ctx
        );

        // 7. Create history event
        await createHistoryEvent(
          documentId, 
          'edit', 
          { 
            action: `Document restored from version ${versionNumber}`,
            oldValue: { version: currentDocument.metadata?.version },
            newValue: { restoredFromVersion: versionNumber }
          }, 
          user, 
          now, 
          versionId, 
          ctx
        );

        ctx.log(`Document ${documentId} restored from version ${versionNumber} by ${user.displayName}`);

        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            message: `Document successfully restored from version ${versionNumber}`,
            data: {
              documentId,
              restoredFromVersion: versionNumber,
              restoredAt: now,
              restoredBy: user.email
            }
          })
        };

      } catch (error: any) {
        ctx.error('Restore document from version error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to restore document from version'
          })
        };
      }
    }
  )
});

// HELPER FUNCTIONS

async function createHistoryEvent(
  documentId: string,
  eventType: string,
  eventDetails: any,
  user: any,
  timestamp: string,
  versionId?: string,
  ctx?: InvocationContext
) {
  try {
    const historyContainer = getContainer('document-history-events');
    
    const historyEvent = {
      id: `event-${documentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      partitionKey: documentId,
      documentId,
      versionId,
      eventType,
      eventDetails,
      userInfo: {
        userId: user.objectId || user.id,
        userEmail: user.email,
        userName: user.displayName || user.email,
        userRoles: user.roles || []
      },
      timestamp,
      auditInfo: {
        ipAddress: 'unknown', // Would be passed from request
        userAgent: 'unknown', // Would be passed from request
        sessionId: 'unknown'  // Would be passed from request
      }
    };

    await historyContainer.items.create(historyEvent);
    ctx?.log(`History event created: ${historyEvent.id}`);
  } catch (error) {
    ctx?.error('Failed to create history event:', error);
  }
}

// COMPARE VERSIONS
// GET /api/documents/{documentId}/versions/{version1}/compare/{version2}
app.http('compareVersions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/versions/{version1}/compare/{version2}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_READ,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const documentId = req.params.get('documentId');
        const version1 = parseInt(req.params.get('version1') || '0');
        const version2 = parseInt(req.params.get('version2') || '0');

        if (!documentId || !version1 || !version2) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Document ID and both version numbers are required' })
          };
        }

        const comparison = await DocumentVersioningService.compareVersions(documentId, version1, version2);

        return {
          status: 200,
          body: JSON.stringify(comparison)
        };

      } catch (error: any) {
        ctx.error('Error comparing versions:', error);
        return {
          status: 500,
          body: JSON.stringify({ error: error.message })
        };
      }
    }
  )
});

// GET VERSION HISTORY WITH EVENTS
// GET /api/documents/{documentId}/history
app.http('getVersionHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/history',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_READ,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const documentId = req.params.get('documentId');
        if (!documentId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Document ID is required' })
          };
        }

        const url = new URL(req.url);
        const includeEvents = url.searchParams.get('includeEvents') !== 'false';

        const history = await DocumentVersioningService.getVersionHistory(documentId, includeEvents);

        return {
          status: 200,
          body: JSON.stringify(history)
        };

      } catch (error: any) {
        ctx.error('Error getting version history:', error);
        return {
          status: 500,
          body: JSON.stringify({ error: error.message })
        };
      }
    }
  )
});

// GET PAGINATED VERSIONS
// GET /api/documents/{documentId}/versions?limit=20&offset=0
app.http('getDocumentVersionsPaginated', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/versions',
  handler: createProtectedFunction(
    RBAC_CONFIGS.DOCUMENTS_READ,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const documentId = req.params.get('documentId');
        if (!documentId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'Document ID is required' })
          };
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const result = await DocumentVersioningService.getDocumentVersions(documentId, limit, offset);

        return {
          status: 200,
          body: JSON.stringify(result)
        };

      } catch (error: any) {
        ctx.error('Error getting document versions:', error);
        return {
          status: 500,
          body: JSON.stringify({ error: error.message })
        };
      }
    }
  )
});

async function createNewVersionFromDocument(
  document: any,
  changeType: string,
  description: string,
  user: any,
  timestamp: string,
  ctx?: InvocationContext
) {
  try {
    const versionsContainer = getContainer('document-versions');
    
    // Get latest version number
    const versionQuery = {
      query: 'SELECT TOP 1 c.versionNumber FROM c WHERE c.partitionKey = @documentId ORDER BY c.versionNumber DESC',
      parameters: [{ name: '@documentId', value: document.id }]
    };
    const { resources: versionResults } = await versionsContainer.items.query(versionQuery).fetchAll();
    const latestVersionNumber = versionResults.length > 0 ? versionResults[0].versionNumber : 0;
    const newVersionNumber = latestVersionNumber + 1;

    const newVersion = {
      id: `version-${document.id}-${newVersionNumber}`,
      partitionKey: document.id,
      documentId: document.id,
      versionNumber: newVersionNumber,
      documentSnapshot: {
        name: document.name,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        blobUrl: document.blobUrl,
        status: document.status,
        category: document.category,
        tags: document.tags || [],
        metadata: document.metadata
      },
      versionMetadata: {
        createdBy: user.displayName || user.email,
        createdByEmail: user.email,
        createdAt: timestamp,
        changeType,
        changeDescription: description,
        previousVersion: latestVersionNumber > 0 ? latestVersionNumber : undefined
      },
      auditInfo: {}
    };

    await versionsContainer.items.create(newVersion);
    ctx?.log(`Version created: ${newVersion.id}`);
    
    return newVersion;
  } catch (error) {
    ctx?.error('Failed to create version:', error);
    throw error;
  }
}
