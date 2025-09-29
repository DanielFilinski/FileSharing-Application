/**
 * SharePoint Document Operations
 * Upload, download, and manage documents in SharePoint with End User context
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { GraphClientService } from '../shared/graphClient';
import { getContainer } from '../shared/db/cosmos';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import config from '../config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// POST Upload file to SharePoint
app.http('uploadToSharePoint', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/upload',
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
        fileBuffer,
        fileName,
        endUserId,
        folderType, // 'dms' | 'portal-to-end-user' | 'portal-from-end-user'
        metadata = {}
      } = await req.json();

      if (!fileBuffer || !fileName || !endUserId || !folderType) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'File buffer, file name, End User ID, and folder type are required' 
          })
        };
      }

      // Get user info for tenant ID
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await oboCredential.getUserInfo();
      const tenantId = userInfo.tenantId || config.tenantId;

      ctx.log(`Uploading file to SharePoint: ${fileName} for End User: ${endUserId}`);

      // Get End User information and SharePoint site
      const endUsersContainer = getContainer('end-users');
      const { resource: endUser } = await endUsersContainer.item(endUserId, tenantId).read();

      if (!endUser) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End User not found' })
        };
      }

      if (!endUser.sharePointSite) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'End User does not have a SharePoint site. Please create one first.' 
          })
        };
      }

      // Determine folder path based on folder type
      const folderPath = GraphClientService.getFolderPath(folderType);
      
      // Convert file buffer array to Buffer
      const buffer = Buffer.from(fileBuffer);

      // Upload file to SharePoint
      const graphService = GraphClientService.getInstance();
      const driveItem = await graphService.uploadFile(
        accessToken,
        tenantId,
        endUser.sharePointSite.siteId,
        fileName,
        buffer,
        folderPath
      );

      ctx.log(`File uploaded to SharePoint: ${fileName} (${driveItem.id})`);

      // Save document metadata to CosmosDB
      const documentRecord = {
        id: `sp_${driveItem.id}`,
        partitionKey: endUserId,
        type: 'sharepoint-document',
        
        // SharePoint specific information
        sharePointItemId: driveItem.id,
        sharePointSiteId: endUser.sharePointSite.siteId,
        sharePointDriveId: endUser.sharePointSite.driveId,
        
        // Basic document information
        name: fileName,
        webUrl: driveItem.webUrl,
        downloadUrl: driveItem['@microsoft.graph.downloadUrl'] || driveItem.webUrl,
        size: driveItem.size,
        mimeType: driveItem.file?.mimeType || 'application/octet-stream',
        
        // Folder structure context
        folderType,
        folderPath,
        
        // End User context
        endUserId,
        endUserName: endUser.displayName,
        endUserEmail: endUser.email,
        organizationId: endUser.organizationId,
        
        // File metadata
        metadata,
        tags: metadata.tags || [],
        
        // Timestamps
        createdAt: new Date().toISOString(),
        lastModifiedAt: driveItem.lastModifiedDateTime || new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: userInfo.oid
      };

      const documentsContainer = getContainer('documents');
      await documentsContainer.items.create(documentRecord);

      ctx.log(`Document metadata saved: ${documentRecord.id}`);

      return {
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'File uploaded successfully to SharePoint',
          document: {
            id: documentRecord.id,
            name: fileName,
            webUrl: driveItem.webUrl,
            downloadUrl: documentRecord.downloadUrl,
            size: driveItem.size,
            folderType,
            folderPath,
            sharePointItemId: driveItem.id
          },
          endUser: {
            id: endUser.id,
            name: endUser.displayName,
            sharePointSite: endUser.sharePointSite
          }
        })
      };

    } catch (error: any) {
      ctx.error('SharePoint upload error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'File upload failed',
          message: error.message 
        })
      };
    }
  }
});

// GET Open SharePoint document
app.http('openSharePointDocument', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/open/{documentId}',
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

      const documentId = req.params.get('documentId');
      const openMode = req.query.get('mode') || 'view'; // 'view' | 'edit'

      if (!documentId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document ID is required' })
        };
      }

      // Get user info for tenant ID
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await oboCredential.getUserInfo();
      const tenantId = userInfo.tenantId || config.tenantId;

      ctx.log(`Opening SharePoint document: ${documentId} (mode: ${openMode})`);

      // Get document from CosmosDB
      const documentsContainer = getContainer('documents');
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @documentId OR c.sharePointItemId = @documentId',
        parameters: [
          { name: '@documentId', value: documentId }
        ]
      };

      const { resources: documents } = await documentsContainer.items.query(querySpec).fetchAll();
      const document = documents[0];

      if (!document || !document.sharePointItemId) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document not found in SharePoint' })
        };
      }

      // Get current document information from SharePoint
      const graphService = GraphClientService.getInstance();
      const graphClient = await graphService.initializeClient(accessToken, tenantId);
      
      const driveItem = await graphClient
        .api(`/sites/${document.sharePointSiteId}/drive/items/${document.sharePointItemId}`)
        .get();

      let openUrl = driveItem.webUrl;
      
      // If opening in edit mode, append web=1 parameter for Office Online
      if (openMode === 'edit') {
        openUrl = `${driveItem.webUrl}?web=1`;
      }

      // Update last access time
      const updateOps = [
        { op: 'replace', path: '/lastAccessTime', value: new Date().toISOString() },
        { op: 'replace', path: '/lastAccessedBy', value: userInfo.oid }
      ];

      try {
        await documentsContainer.item(document.id, document.partitionKey).patch(updateOps);
      } catch (patchError) {
        ctx.warn('Failed to update last access time:', patchError);
      }

      ctx.log(`Document opened: ${document.name} for End User: ${document.endUserId}`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          openUrl,
          document: {
            id: document.id,
            name: document.name,
            webUrl: driveItem.webUrl,
            downloadUrl: driveItem['@microsoft.graph.downloadUrl'] || driveItem.webUrl,
            lastModifiedDateTime: driveItem.lastModifiedDateTime,
            size: driveItem.size,
            folderType: document.folderType,
            endUser: {
              id: document.endUserId,
              name: document.endUserName
            }
          },
          mode: openMode
        })
      };

    } catch (error: any) {
      ctx.error('SharePoint document open error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Failed to open document',
          message: error.message 
        })
      };
    }
  }
});

// GET List End User documents from SharePoint
app.http('getEndUserDocuments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/enduser/{endUserId}/documents',
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

      const endUserId = req.params.get('endUserId');
      const folderType = req.query.get('folderType'); // Optional filter

      if (!endUserId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End User ID is required' })
        };
      }

      // Get user info for tenant ID
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await oboCredential.getUserInfo();
      const tenantId = userInfo.tenantId || config.tenantId;

      ctx.log(`Getting documents for End User: ${endUserId} (folder: ${folderType || 'all'})`);

      // Query documents from CosmosDB
      let query = 'SELECT * FROM c WHERE c.endUserId = @endUserId AND c.type = "sharepoint-document"';
      const parameters = [
        { name: '@endUserId', value: endUserId }
      ];

      if (folderType) {
        query += ' AND c.folderType = @folderType';
        parameters.push({ name: '@folderType', value: folderType });
      }

      query += ' ORDER BY c.uploadedAt DESC';

      const documentsContainer = getContainer('documents');
      const { resources: documents } = await documentsContainer.items.query({
        query,
        parameters
      }).fetchAll();

      ctx.log(`Found ${documents.length} documents for End User: ${endUserId}`);

      // Enhance documents with current SharePoint information
      const graphService = GraphClientService.getInstance();
      const enhancedDocuments = [];

      for (const doc of documents) {
        try {
          const graphClient = await graphService.initializeClient(accessToken, tenantId);
          const driveItem = await graphClient
            .api(`/sites/${doc.sharePointSiteId}/drive/items/${doc.sharePointItemId}`)
            .get();

          enhancedDocuments.push({
            id: doc.id,
            name: doc.name,
            webUrl: doc.webUrl,
            downloadUrl: driveItem['@microsoft.graph.downloadUrl'] || doc.downloadUrl,
            size: driveItem.size,
            lastModifiedDateTime: driveItem.lastModifiedDateTime,
            folderType: doc.folderType,
            folderPath: doc.folderPath,
            uploadedAt: doc.uploadedAt,
            uploadedBy: doc.uploadedBy,
            metadata: doc.metadata,
            tags: doc.tags || [],
            sharePointItemId: doc.sharePointItemId
          });
        } catch (error) {
          // If can't get current info from SharePoint, use cached data
          ctx.warn(`Failed to get current SharePoint info for ${doc.id}:`, error);
          enhancedDocuments.push({
            id: doc.id,
            name: doc.name,
            webUrl: doc.webUrl,
            downloadUrl: doc.downloadUrl,
            size: doc.size,
            folderType: doc.folderType,
            folderPath: doc.folderPath,
            uploadedAt: doc.uploadedAt,
            metadata: doc.metadata,
            tags: doc.tags || [],
            sharePointItemId: doc.sharePointItemId,
            warning: 'Using cached data - document may have been modified'
          });
        }
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          documents: enhancedDocuments,
          count: enhancedDocuments.length,
          endUserId,
          folderType: folderType || 'all'
        })
      };

    } catch (error: any) {
      ctx.error('Get End User documents error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Failed to get documents',
          message: error.message 
        })
      };
    }
  }
});
