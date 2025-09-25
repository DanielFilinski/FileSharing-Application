import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';
import config from '../config';

// Schema for new document creation request
const CreateNewDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.enum(['document', 'spreadsheet', 'presentation', 'form']),
  template: z.string().optional(),
  description: z.string().optional(),
  metadata: z.object({
    documentType: z.string().optional(),
    documentSubtype: z.string().optional(),
    period: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }).optional(),
  openMode: z.enum(['local', 'online']).default('online')
});

// Template content mapping
const TEMPLATES = {
  document: {
    'blank-doc': { content: '', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    'letter': { content: 'Business Letter Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    'report': { content: 'Report Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    'memo': { content: 'Memo Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  },
  spreadsheet: {
    'blank-sheet': { content: '', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    'budget': { content: 'Budget Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    'invoice': { content: 'Invoice Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    'timesheet': { content: 'Timesheet Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  },
  presentation: {
    'blank-pres': { content: '', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    'business': { content: 'Business Pitch Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    'quarterly': { content: 'Quarterly Review Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    'training': { content: 'Training Template Content', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
  },
  form: {
    'blank-form': { content: '', mimeType: 'text/html' },
    'survey': { content: 'Survey Form Template Content', mimeType: 'text/html' },
    'application': { content: 'Application Form Template Content', mimeType: 'text/html' },
    'feedback': { content: 'Feedback Form Template Content', mimeType: 'text/html' }
  }
};

export async function createNewDocument(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Create new document function processed a request.');

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
    context.log(`User ${userInfo.displayName} is creating a new document`);
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
    const parsed = CreateNewDocumentSchema.safeParse(body);
    
    if (!parsed.success) {
      return {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid request data',
          details: parsed.error.flatten()
        })
      };
    }

    const { name, type, template, description, metadata, openMode } = parsed.data;

    // Get template content
    const templateData = template ? TEMPLATES[type]?.[template] : TEMPLATES[type]['blank-doc'] || TEMPLATES[type]['blank-sheet'] || TEMPLATES[type]['blank-pres'] || TEMPLATES[type]['blank-form'];
    
    if (!templateData) {
      return {
        status: 400,
        body: JSON.stringify({ error: 'Invalid template specified' })
      };
    }

    // Generate unique document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tenantId = userInfo.tenantId || 'default';
    
    // Create document object
    const documentData = {
      id: documentId,
      partitionKey: tenantId,
      name: name,
      fileName: `${name}.${type === 'document' ? 'docx' : type === 'spreadsheet' ? 'xlsx' : type === 'presentation' ? 'pptx' : 'html'}`,
      fileSize: templateData.content.length,
      mimeType: templateData.mimeType,
      blobUrl: `https://storage.example.com/documents/${documentId}`,
      status: 'draft',
      category: metadata?.documentType || type,
      tags: [type, template || 'blank'],
      metadata: {
        createdBy: userInfo.displayName || userInfo.userPrincipalName,
        createdAt: new Date().toISOString(),
        modifiedBy: userInfo.displayName || userInfo.userPrincipalName,
        modifiedAt: new Date().toISOString(),
        officeId: userInfo.officeLocation,
        departmentId: userInfo.department,
        documentType: metadata?.documentType,
        documentSubtype: metadata?.documentSubtype,
        period: metadata?.period,
        startDate: metadata?.startDate,
        endDate: metadata?.endDate,
        template: template,
        openMode: openMode,
        isLocked: false,
        version: 1,
        priority: 'medium'
      },
      permissions: {
        owners: [userInfo.userPrincipalName || userInfo.displayName],
        viewers: [],
        editors: [],
        approvers: []
      },
      content: templateData.content // Store template content
    };

    // Save to Cosmos DB
    const container = getContainer('documents');
    const { resource } = await container.items.create(documentData);

    context.log(`Document ${name} created successfully with ID: ${documentId}`);

    // Return success response with document data and editor URLs
    return {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Document created successfully',
        document: resource,
        editorUrls: {
          online: `${config.editorBaseUrl}/online/${documentId}?token=${accessToken}`,
          local: `${config.apiBaseUrl}/documents/${documentId}/download?token=${accessToken}`
        }
      })
    };

  } catch (error) {
    context.error('Error creating document:', error);
    return {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to create document'
      })
    };
  }
}

app.http('createNewDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/create',
  handler: createNewDocument
});
