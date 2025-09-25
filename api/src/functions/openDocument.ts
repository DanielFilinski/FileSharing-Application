import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';
import config from '../config';

// Schema for open document request
const OpenDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  mode: z.enum(['local', 'online']).default('online'),
  action: z.enum(['view', 'edit']).default('edit')
});

export async function openDocument(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Open document function processed a request.');

  // Check request method
  if (req.method !== 'POST') {
    return {
      status: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check authorization token
  const accessToken: string = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
  if (!accessToken) {
    return {
      status: 401,
      body: JSON.stringify({ error: 'No access token provided' })
    };
  }

  // Initialize authentication
  const oboAuthConfig: OnBehalfOfCredentialAuthConfig = {
    authorityHost: config.authorityHost,
    clientId: config.clientId,
    tenantId: config.tenantId,
    clientSecret: config.clientSecret
  };

  let oboCredential: OnBehalfOfUserCredential;
  let userInfo: any;
  
  try {
    oboCredential = new OnBehalfOfUserCredential(accessToken, oboAuthConfig);
    userInfo = await oboCredential.getUserInfo();
    context.log(`User ${userInfo.displayName} is opening a document`);
  } catch (e) {
    context.error(e);
    return {
      status: 401,
      body: JSON.stringify({ error: 'Invalid access token' })
    };
  }

  try {
    // Parse request body
    const body = await req.json();
    const parsed = OpenDocumentSchema.safeParse(body);
    
    if (!parsed.success) {
      return {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid request data',
          details: parsed.error.flatten()
        })
      };
    }

    const { documentId, mode, action } = parsed.data;
    const tenantId = userInfo.tenantId || 'default';

    // Get document from database
    const container = getContainer('documents');
    const { resource: document } = await container.item(documentId, tenantId).read();

    if (!document) {
      return {
        status: 404,
        body: JSON.stringify({ error: 'Document not found' })
      };
    }

    // Check permissions
    const userPrincipal = userInfo.userPrincipalName || userInfo.displayName;
    const hasViewAccess = document.permissions.viewers.includes(userPrincipal) || 
                         document.permissions.editors.includes(userPrincipal) ||
                         document.permissions.owners.includes(userPrincipal);
    
    const hasEditAccess = document.permissions.editors.includes(userPrincipal) ||
                         document.permissions.owners.includes(userPrincipal);

    if (!hasViewAccess) {
      return {
        status: 403,
        body: JSON.stringify({ error: 'Access denied. You do not have permission to view this document.' })
      };
    }

    if (action === 'edit' && !hasEditAccess) {
      return {
        status: 403,
        body: JSON.stringify({ error: 'Access denied. You do not have permission to edit this document.' })
      };
    }

    // Check if document is locked by another user
    if (action === 'edit' && document.metadata.isLocked && 
        document.metadata.lockedBy !== userPrincipal) {
      return {
        status: 423, // Locked
        body: JSON.stringify({ 
          error: 'Document is locked by another user',
          lockedBy: document.metadata.lockedBy,
          lockedAt: document.metadata.lockedAt
        })
      };
    }

    // Lock document for editing if needed
    if (action === 'edit' && !document.metadata.isLocked) {
      const updateData = {
        ...document,
        metadata: {
          ...document.metadata,
          isLocked: true,
          lockedBy: userPrincipal,
          lockedAt: new Date().toISOString(),
          modifiedBy: userPrincipal,
          modifiedAt: new Date().toISOString()
        }
      };
      
      await container.item(documentId, tenantId).replace(updateData);
      context.log(`Document ${documentId} locked by ${userPrincipal}`);
    }

    // Generate access URLs based on mode and document type
    let editorUrl: string;
    let downloadUrl: string;
    
    if (mode === 'online') {
      // Generate online editor URL based on document type
      const editorType = getEditorType(document.mimeType);
      editorUrl = `${config.editorBaseUrl}/${editorType}/${documentId}?token=${accessToken}&mode=${action}`;
      downloadUrl = `${config.apiBaseUrl}/documents/${documentId}/download?token=${accessToken}`;
    } else {
      // Generate local download URL
      downloadUrl = `${config.apiBaseUrl}/documents/${documentId}/download?token=${accessToken}&force=true`;
      editorUrl = downloadUrl;
    }

    // Log access for audit
    context.log(`Document ${document.name} opened by ${userPrincipal} in ${mode} mode for ${action}`);

    // Return success response
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Document opened successfully',
        document: {
          id: document.id,
          name: document.name,
          type: getDocumentType(document.mimeType),
          status: document.status,
          isLocked: document.metadata.isLocked,
          lockedBy: document.metadata.lockedBy,
          lastModified: document.metadata.modifiedAt,
          permissions: {
            canView: hasViewAccess,
            canEdit: hasEditAccess,
            isOwner: document.permissions.owners.includes(userPrincipal)
          }
        },
        access: {
          mode: mode,
          action: action,
          editorUrl: editorUrl,
          downloadUrl: downloadUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      })
    };

  } catch (error) {
    context.error('Error opening document:', error);
    return {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to open document'
      })
    };
  }
}

// Helper function to get editor type based on MIME type
function getEditorType(mimeType: string): string {
  switch (mimeType) {
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return 'word';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return 'excel';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.ms-powerpoint':
      return 'powerpoint';
    case 'application/pdf':
      return 'pdf';
    case 'text/html':
    case 'text/plain':
      return 'text';
    default:
      return 'generic';
  }
}

// Helper function to get document type based on MIME type
function getDocumentType(mimeType: string): string {
  switch (mimeType) {
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return 'document';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return 'spreadsheet';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.ms-powerpoint':
      return 'presentation';
    case 'text/html':
      return 'form';
    default:
      return 'document';
  }
}

app.http('openDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/open',
  handler: openDocument
});
