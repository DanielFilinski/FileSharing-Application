import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';
import config from '../config';

// Schema for unlock document request
const UnlockDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  force: z.boolean().default(false) // Allow force unlock for admins
});

export async function unlockDocument(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Unlock document function processed a request.');

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
    context.log(`User ${userInfo.displayName} is unlocking a document`);
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
    const parsed = UnlockDocumentSchema.safeParse(body);
    
    if (!parsed.success) {
      return {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid request data',
          details: parsed.error.flatten()
        })
      };
    }

    const { documentId, force } = parsed.data;
    const tenantId = userInfo.tenantId || 'default';
    const userPrincipal = userInfo.userPrincipalName || userInfo.displayName;

    // Get document from database
    const container = getContainer('documents');
    const { resource: document } = await container.item(documentId, tenantId).read();

    if (!document) {
      return {
        status: 404,
        body: JSON.stringify({ error: 'Document not found' })
      };
    }

    // Check if document is actually locked
    if (!document.metadata.isLocked) {
      return {
        status: 200,
        body: JSON.stringify({ 
          message: 'Document is already unlocked',
          document: {
            id: document.id,
            name: document.name,
            isLocked: false
          }
        })
      };
    }

    // Check permissions - only the user who locked it or owners can unlock
    const isOwner = document.permissions.owners.includes(userPrincipal);
    const isLocker = document.metadata.lockedBy === userPrincipal;
    
    if (!isLocker && !isOwner && !force) {
      return {
        status: 403,
        body: JSON.stringify({ 
          error: 'Access denied. Only the user who locked the document or document owners can unlock it.',
          lockedBy: document.metadata.lockedBy
        })
      };
    }

    // Force unlock check for admins (can be implemented based on user roles)
    if (force && !isOwner) {
      // Here you could add additional admin role checks
      context.log(`Force unlock requested by ${userPrincipal} for document ${documentId}`);
    }

    // Update document to unlock
    const updateData = {
      ...document,
      metadata: {
        ...document.metadata,
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        modifiedBy: userPrincipal,
        modifiedAt: new Date().toISOString(),
        unlockedBy: userPrincipal,
        unlockedAt: new Date().toISOString()
      }
    };
    
    const { resource: updatedDocument } = await container.item(documentId, tenantId).replace(updateData);
    
    context.log(`Document ${documentId} unlocked by ${userPrincipal}${force ? ' (forced)' : ''}`);

    // Return success response
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Document unlocked successfully',
        document: {
          id: updatedDocument.id,
          name: updatedDocument.name,
          isLocked: updatedDocument.metadata.isLocked,
          unlockedBy: updatedDocument.metadata.unlockedBy,
          unlockedAt: updatedDocument.metadata.unlockedAt,
          lastModified: updatedDocument.metadata.modifiedAt
        }
      })
    };

  } catch (error) {
    context.error('Error unlocking document:', error);
    return {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to unlock document'
      })
    };
  }
}

app.http('unlockDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/unlock',
  handler: unlockDocument
});
