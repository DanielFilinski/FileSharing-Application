/**
 * SharePoint Basic Operations Azure Functions
 * Provides basic SharePoint operations via Microsoft Graph API
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { GraphClientService } from '../shared/graphClient';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import config from '../config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET SharePoint site information
app.http('getSharePointSite', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sites/{siteId}',
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

      const siteId = req.params.get('siteId');
      if (!siteId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Site ID is required' })
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

      // Get SharePoint site
      const graphService = GraphClientService.getInstance();
      const site = await graphService.getSite(accessToken, tenantId, siteId);

      ctx.log(`SharePoint site retrieved: ${site.displayName} (${siteId})`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          site,
          tenantId
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint site get error:', error);
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

// GET SharePoint files in a folder
app.http('getSharePointFiles', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sites/{siteId}/files',
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

      const siteId = req.params.get('siteId');
      const folderPath = req.query.get('folderPath') || '';

      if (!siteId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Site ID is required' })
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

      // List files in SharePoint
      const graphService = GraphClientService.getInstance();
      const items = await graphService.listItems(accessToken, tenantId, siteId, folderPath);

      ctx.log(`SharePoint files listed: ${items.value?.length || 0} items in ${folderPath || 'root'}`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          items: items.value || [],
          folderPath,
          count: items.value?.length || 0
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint files get error:', error);
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

// POST Create folder in SharePoint
app.http('createSharePointFolder', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/sites/{siteId}/folders',
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

      const siteId = req.params.get('siteId');
      if (!siteId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Site ID is required' })
        };
      }

      const { folderName, parentPath } = await req.json();
      if (!folderName || !folderName.trim()) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Folder name is required' })
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

      // Create folder in SharePoint
      const graphService = GraphClientService.getInstance();
      const folder = await graphService.createFolder(
        accessToken, 
        tenantId, 
        siteId, 
        folderName.trim(), 
        parentPath
      );

      ctx.log(`SharePoint folder created: ${folderName} in site ${siteId}`);

      return {
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Folder created successfully',
          folder: {
            id: folder.id,
            name: folder.name,
            webUrl: folder.webUrl,
            parentPath
          }
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint folder creation error:', error);
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

// GET SharePoint drive information
app.http('getSharePointDrive', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sites/{siteId}/drive',
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

      const siteId = req.params.get('siteId');
      if (!siteId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Site ID is required' })
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

      // Get SharePoint drive
      const graphService = GraphClientService.getInstance();
      const drive = await graphService.getDrive(accessToken, tenantId, siteId);

      ctx.log(`SharePoint drive retrieved: ${drive.name} (${siteId})`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          drive: {
            id: drive.id,
            name: drive.name,
            webUrl: drive.webUrl,
            driveType: drive.driveType,
            quota: drive.quota
          }
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint drive get error:', error);
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

// GET Download URL for SharePoint file
app.http('getSharePointDownloadUrl', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sites/{siteId}/items/{itemId}/download',
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

      const siteId = req.params.get('siteId');
      const itemId = req.params.get('itemId');

      if (!siteId || !itemId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Site ID and Item ID are required' })
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

      // Get download URL
      const graphService = GraphClientService.getInstance();
      const downloadUrl = await graphService.getDownloadUrl(accessToken, tenantId, siteId, itemId);

      ctx.log(`SharePoint download URL generated for item: ${itemId}`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          downloadUrl,
          itemId,
          siteId
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint download URL error:', error);
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
