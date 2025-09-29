/**
 * Microsoft Graph Client Service
 * Provides centralized access to Microsoft Graph API for SharePoint operations
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import config from '../config';

export class GraphClientService {
  private static instance: GraphClientService;
  private graphClients: Map<string, Client> = new Map();

  static getInstance(): GraphClientService {
    if (!GraphClientService.instance) {
      GraphClientService.instance = new GraphClientService();
    }
    return GraphClientService.instance;
  }

  /**
   * Initialize Graph Client with On-Behalf-Of authentication
   */
  async initializeClient(accessToken: string, tenantId: string): Promise<Client> {
    const clientKey = `${tenantId}_${accessToken.substring(0, 20)}`;
    
    if (this.graphClients.has(clientKey)) {
      return this.graphClients.get(clientKey)!;
    }

    try {
      // Create On-Behalf-Of credential
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      // Initialize Graph Client
      const graphClient = Client.init({
        authProvider: async (done) => {
          try {
            const token = await oboCredential.getToken([
              'https://graph.microsoft.com/Sites.ReadWrite.All',
              'https://graph.microsoft.com/Files.ReadWrite.All',
              'https://graph.microsoft.com/Sites.Manage.All'
            ]);
            
            done(null, token?.token);
          } catch (error) {
            done(error, null);
          }
        }
      });

      this.graphClients.set(clientKey, graphClient);
      return graphClient;
    } catch (error: any) {
      console.error('Failed to initialize Graph Client:', error);
      throw new Error(`Graph Client initialization failed: ${error.message}`);
    }
  }

  /**
   * Get SharePoint site information
   */
  async getSite(accessToken: string, tenantId: string, siteId: string): Promise<any> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      const site = await client.api(`/sites/${siteId}`).get();
      return site;
    } catch (error: any) {
      console.error(`Failed to get site ${siteId}:`, error);
      throw new Error(`Site retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get SharePoint drive (document library)
   */
  async getDrive(accessToken: string, tenantId: string, siteId: string): Promise<any> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      const drive = await client.api(`/sites/${siteId}/drive`).get();
      return drive;
    } catch (error: any) {
      console.error(`Failed to get drive for site ${siteId}:`, error);
      throw new Error(`Drive retrieval failed: ${error.message}`);
    }
  }

  /**
   * List files and folders in SharePoint location
   */
  async listItems(
    accessToken: string, 
    tenantId: string, 
    siteId: string, 
    folderPath?: string
  ): Promise<any> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      let apiPath = `/sites/${siteId}/drive/root/children`;
      
      if (folderPath && folderPath.trim()) {
        apiPath = `/sites/${siteId}/drive/root:/${folderPath.trim()}:/children`;
      }

      const items = await client.api(apiPath).get();
      return items;
    } catch (error: any) {
      console.error(`Failed to list items in ${folderPath || 'root'}:`, error);
      throw new Error(`Item listing failed: ${error.message}`);
    }
  }

  /**
   * Create folder in SharePoint
   */
  async createFolder(
    accessToken: string,
    tenantId: string,
    siteId: string,
    folderName: string,
    parentPath?: string
  ): Promise<any> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      let apiPath = `/sites/${siteId}/drive/root/children`;
      
      if (parentPath && parentPath.trim()) {
        apiPath = `/sites/${siteId}/drive/root:/${parentPath.trim()}:/children`;
      }

      const folder = await client.api(apiPath).post({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      });

      return folder;
    } catch (error: any) {
      console.error(`Failed to create folder ${folderName}:`, error);
      throw new Error(`Folder creation failed: ${error.message}`);
    }
  }

  /**
   * Upload file to SharePoint
   */
  async uploadFile(
    accessToken: string,
    tenantId: string,
    siteId: string,
    fileName: string,
    fileBuffer: Buffer,
    folderPath?: string
  ): Promise<any> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      let uploadPath = `/sites/${siteId}/drive/root:/${fileName}:/content`;
      
      if (folderPath && folderPath.trim()) {
        uploadPath = `/sites/${siteId}/drive/root:/${folderPath.trim()}/${fileName}:/content`;
      }

      const driveItem = await client.api(uploadPath).put(fileBuffer);
      return driveItem;
    } catch (error: any) {
      console.error(`Failed to upload file ${fileName}:`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(
    accessToken: string,
    tenantId: string,
    siteId: string,
    itemId: string
  ): Promise<string> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      const driveItem = await client.api(`/sites/${siteId}/drive/items/${itemId}`).get();
      return driveItem['@microsoft.graph.downloadUrl'] || driveItem.webUrl;
    } catch (error: any) {
      console.error(`Failed to get download URL for item ${itemId}:`, error);
      throw new Error(`Download URL retrieval failed: ${error.message}`);
    }
  }

  /**
   * Create SharePoint site
   */
  async createSite(
    accessToken: string,
    tenantId: string,
    displayName: string,
    name: string,
    description: string
  ): Promise<any> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      const siteRequest = {
        displayName,
        name: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description,
        template: 'STS#3', // Team Site template
        webTemplate: 'STS',
        language: 1033 // English
      };

      // Create site through SharePoint Admin API
      const newSite = await client.api('/sites/root/sites').post(siteRequest);
      return newSite;
    } catch (error: any) {
      console.error(`Failed to create site ${displayName}:`, error);
      throw new Error(`Site creation failed: ${error.message}`);
    }
  }

  /**
   * Set site permissions
   */
  async setSitePermissions(
    accessToken: string,
    tenantId: string,
    siteId: string,
    userEmail: string,
    role: 'read' | 'write' | 'owner' = 'read'
  ): Promise<any> {
    const client = await this.initializeClient(accessToken, tenantId);
    
    try {
      const permission = await client.api(`/sites/${siteId}/permissions`).post({
        recipients: [{ email: userEmail }],
        message: "Access to document workspace",
        requireSignIn: true,
        sendInvitation: false,
        roles: [role]
      });

      return permission;
    } catch (error: any) {
      console.error(`Failed to set permissions for ${userEmail}:`, error);
      throw new Error(`Permission setting failed: ${error.message}`);
    }
  }

  /**
   * Clean up cached clients (call periodically to prevent memory leaks)
   */
  clearCache(): void {
    this.graphClients.clear();
  }

  /**
   * Utility method to generate SharePoint-safe names
   */
  static generateSafeName(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Utility method to get folder path based on type
   */
  static getFolderPath(folderType: 'dms' | 'portal-to-end-user' | 'portal-from-end-user'): string {
    switch (folderType) {
      case 'dms':
        return 'DMS';
      case 'portal-to-end-user':
        return 'Portal/To End User';
      case 'portal-from-end-user':
        return 'Portal/From End User';
      default:
        return 'Portal';
    }
  }
}

export default GraphClientService;
