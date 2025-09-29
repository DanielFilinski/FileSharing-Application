/**
 * SharePoint Site Provisioning for End Users
 * Automatically creates SharePoint sites with proper folder structure for each End User
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

// POST Create SharePoint site for End User
app.http('createEndUserSite', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/provision-site',
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
        endUserId, 
        endUserName, 
        endUserEmail, 
        organizationId,
        firmName 
      } = await req.json();

      if (!endUserId || !endUserName || !endUserEmail || !organizationId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End User ID, name, email, and organization ID are required' })
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

      ctx.log(`Creating SharePoint site for End User: ${endUserName} (${endUserId})`);

      // Generate site name and display name
      const siteName = GraphClientService.generateSafeName(`docs-${endUserId}-${endUserName}`);
      const displayName = `Documents - ${endUserName}${firmName ? ` (${firmName})` : ''}`;
      const description = `Document workspace for ${endUserName} (${endUserEmail})`;

      // Create SharePoint site
      const graphService = GraphClientService.getInstance();
      
      try {
        const newSite = await graphService.createSite(
          accessToken,
          tenantId,
          displayName,
          siteName,
          description
        );

        ctx.log(`SharePoint site created: ${newSite.id} for End User: ${endUserName}`);

        // Wait for site provisioning (SharePoint sites take time to be fully ready)
        ctx.log('Waiting for site provisioning...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

        // Get the created site details
        let createdSite;
        let retries = 0;
        const maxRetries = 6; // 1 minute total wait
        
        while (retries < maxRetries) {
          try {
            createdSite = await graphService.getSite(accessToken, tenantId, newSite.id);
            if (createdSite && createdSite.webUrl) {
              break;
            }
          } catch (error) {
            ctx.log(`Site not ready yet, retrying... (${retries + 1}/${maxRetries})`);
          }
          retries++;
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds between retries
        }

        if (!createdSite) {
          throw new Error('Site created but not accessible yet. Please try again later.');
        }

        // Get drive information
        const drive = await graphService.getDrive(accessToken, tenantId, newSite.id);

        // Create folder structure according to Project Description
        await createFolderStructure(graphService, accessToken, tenantId, newSite.id, ctx);

        // Set permissions for End User
        await setEndUserPermissions(graphService, accessToken, tenantId, newSite.id, endUserEmail, ctx);

        // Save SharePoint site information to CosmosDB
        const siteInfo = await saveSiteInfoToDatabase(
          newSite, 
          createdSite,
          drive,
          endUserId, 
          organizationId,
          ctx
        );

        // Update End User record with SharePoint site information
        await updateEndUserWithSite(endUserId, organizationId, siteInfo, ctx);

        return {
          status: 201,
          headers: corsHeaders,
          body: JSON.stringify({
            message: 'SharePoint site created successfully',
            site: {
              id: newSite.id,
              displayName: createdSite.displayName,
              url: createdSite.webUrl,
              driveId: drive.id,
              status: 'created'
            },
            folders: ['DMS', 'Portal', 'Portal/To End User', 'Portal/From End User']
          })
        };

      } catch (siteError: any) {
        ctx.error('SharePoint site creation failed:', siteError);
        
        // If site creation fails due to naming conflicts, try with a different name
        if (siteError.message?.includes('already exists') || siteError.message?.includes('conflict')) {
          const alternativeSiteName = `${siteName}-${Date.now()}`;
          ctx.log(`Retrying with alternative name: ${alternativeSiteName}`);
          
          const retryResult = await graphService.createSite(
            accessToken,
            tenantId,
            displayName,
            alternativeSiteName,
            description
          );

          return {
            status: 201,
            headers: corsHeaders,
            body: JSON.stringify({
              message: 'SharePoint site created with alternative name',
              site: {
                id: retryResult.id,
                displayName: retryResult.displayName,
                url: retryResult.webUrl,
                status: 'created_with_alternative_name'
              }
            })
          };
        }

        throw siteError;
      }

    } catch (error: any) {
      ctx.error('SharePoint site provisioning error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Site provisioning failed',
          message: error.message,
          details: 'Please check logs for more information'
        })
      };
    }
  }
});

// Helper function to create folder structure
async function createFolderStructure(
  graphService: GraphClientService,
  accessToken: string,
  tenantId: string,
  siteId: string,
  ctx: InvocationContext
) {
  const folders = [
    'DMS', // Internal storage for employees
    'Portal', // Portal for End User communication  
    'Portal/To End User', // From company to End User
    'Portal/From End User' // From End User to company
  ];

  for (const folderPath of folders) {
    try {
      const folderParts = folderPath.split('/');
      let currentPath = '';

      for (const part of folderParts) {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        try {
          // Check if folder exists by trying to get it
          await graphService.listItems(accessToken, tenantId, siteId, currentPath);
          ctx.log(`Folder already exists: ${currentPath}`);
        } catch {
          // Folder doesn't exist, create it
          try {
            await graphService.createFolder(accessToken, tenantId, siteId, part, parentPath);
            ctx.log(`Created folder: ${currentPath} in site ${siteId}`);
          } catch (createError: any) {
            ctx.warn(`Failed to create folder ${currentPath}: ${createError.message}`);
          }
        }
      }
    } catch (error: any) {
      ctx.error(`Failed to process folder ${folderPath}:`, error);
    }
  }
}

// Helper function to set End User permissions
async function setEndUserPermissions(
  graphService: GraphClientService,
  accessToken: string,
  tenantId: string,
  siteId: string,
  endUserEmail: string,
  ctx: InvocationContext
) {
  try {
    // Grant read permissions to End User
    await graphService.setSitePermissions(accessToken, tenantId, siteId, endUserEmail, 'read');
    ctx.log(`Permissions granted to End User: ${endUserEmail} for site ${siteId}`);
  } catch (error: any) {
    ctx.error(`Failed to set permissions for ${endUserEmail}:`, error);
    // Don't fail the entire process if permissions fail
  }
}

// Helper function to save site info to CosmosDB
async function saveSiteInfoToDatabase(
  newSite: any,
  createdSite: any,
  drive: any,
  endUserId: string,
  organizationId: string,
  ctx: InvocationContext
) {
  try {
    const siteInfo = {
      id: `site_${newSite.id}`,
      partitionKey: organizationId,
      type: 'sharepoint-site',
      
      // SharePoint information
      sharePointSiteId: newSite.id,
      sharePointUrl: createdSite.webUrl,
      sharePointDriveId: drive.id,
      siteName: createdSite.name,
      displayName: createdSite.displayName,
      description: createdSite.description,
      
      // Relationship
      endUserId,
      organizationId,
      
      // Status
      status: 'active',
      provisionedAt: new Date().toISOString(),
      
      // Folder structure
      folders: ['DMS', 'Portal', 'Portal/To End User', 'Portal/From End User'],
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const container = getContainer('sharepoint-sites');
    await container.items.create(siteInfo);

    ctx.log(`SharePoint site info saved to database: ${newSite.id}`);
    return siteInfo;
  } catch (error: any) {
    ctx.error('Failed to save site info to database:', error);
    throw new Error(`Database save failed: ${error.message}`);
  }
}

// Helper function to update End User record with SharePoint site info
async function updateEndUserWithSite(
  endUserId: string,
  organizationId: string,
  siteInfo: any,
  ctx: InvocationContext
) {
  try {
    const container = getContainer('end-users');
    const { resource: endUser } = await container.item(endUserId, organizationId).read();
    
    if (!endUser) {
      ctx.error(`End User not found: ${endUserId}`);
      return;
    }

    // Update End User with SharePoint site information
    const updatedEndUser = {
      ...endUser,
      sharePointSite: {
        siteId: siteInfo.sharePointSiteId,
        siteUrl: siteInfo.sharePointUrl,
        driveId: siteInfo.sharePointDriveId,
        displayName: siteInfo.displayName,
        created: siteInfo.provisionedAt
      },
      updatedAt: new Date().toISOString()
    };

    await container.item(endUserId, organizationId).replace(updatedEndUser);
    ctx.log(`End User updated with SharePoint site info: ${endUserId}`);
  } catch (error: any) {
    ctx.error('Failed to update End User with site info:', error);
    // Don't fail the entire process if this fails
  }
}
