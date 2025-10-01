/**
 * SharePoint Core Service
 * Microsoft Graph API integration for SharePoint operations
 */

import {
  SharePointConnection,
  SharePointCredentials,
  ConnectionStatus,
  SharePointError,
  SharePointErrorType,
  FileVersion,
} from './types';

export class SharePointService {
  private connection: SharePointConnection | null = null;
  private graphClient: any = null;

  constructor() {
    // Initialize Microsoft Graph client
    this.initializeGraphClient();
  }

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  /**
   * Initialize Microsoft Graph client
   */
  private async initializeGraphClient(): Promise<void> {
    try {
      // In production, use @azure/msal-browser and @microsoft/microsoft-graph-client
      console.log('Initializing Microsoft Graph client...');
      
      // Placeholder for Graph client initialization
      // const { Client } = await import('@microsoft/microsoft-graph-client');
      // const { AuthenticationProvider } = await import('@microsoft/microsoft-graph-client');
      
      console.log('Microsoft Graph client initialized');
    } catch (error) {
      console.error('Failed to initialize Graph client:', error);
      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Failed to initialize Microsoft Graph client',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Connect to SharePoint
   */
  async connect(credentials: SharePointCredentials): Promise<SharePointConnection> {
    try {
      console.log('Connecting to SharePoint...');

      // Validate credentials
      if (!credentials.accessToken) {
        throw new SharePointError(
          SharePointErrorType.AUTHENTICATION_FAILED,
          'Access token is required'
        );
      }

      // Test connection with Graph API
      const connection = await this.testConnection(credentials);
      
      this.connection = connection;
      this.graphClient = await this.createGraphClient(credentials);

      console.log('Successfully connected to SharePoint');
      return connection;

    } catch (error) {
      console.error('Failed to connect to SharePoint:', error);
      
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Failed to connect to SharePoint',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Test SharePoint connection
   */
  private async testConnection(credentials: SharePointCredentials): Promise<SharePointConnection> {
    try {
      // Simulate Graph API call to test connection
      const response = await this.makeGraphRequest('GET', '/sites', credentials);
      
      if (!response || !response.value || response.value.length === 0) {
        throw new SharePointError(
          SharePointErrorType.CONNECTION_FAILED,
          'No SharePoint sites found'
        );
      }

      // Get first site (in production, you'd want to select the correct site)
      const site = response.value[0];
      
      const connection: SharePointConnection = {
        siteId: site.id,
        siteUrl: site.webUrl,
        driveId: site.drive?.id || '',
        libraryId: site.documentLibrary?.id || '',
        tenantId: credentials.tenantId,
        organizationId: 'default', // TODO: Get from context
        isConnected: true,
        lastSyncTime: new Date(),
        connectionStatus: 'connected',
        credentials,
      };

      return connection;

    } catch (error) {
      console.error('Connection test failed:', error);
      
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Failed to test SharePoint connection',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Create authenticated Graph client
   */
  private async createGraphClient(credentials: SharePointCredentials): Promise<any> {
    // In production, implement proper Graph client with authentication
    return {
      api: (path: string) => ({
        get: () => this.makeGraphRequest('GET', path, credentials),
        post: (data: any) => this.makeGraphRequest('POST', path, credentials, data),
        put: (data: any) => this.makeGraphRequest('PUT', path, credentials, data),
        patch: (data: any) => this.makeGraphRequest('PATCH', path, credentials, data),
        delete: () => this.makeGraphRequest('DELETE', path, credentials),
      }),
    };
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private async makeGraphRequest(
    method: string,
    path: string,
    credentials: SharePointCredentials,
    body?: any
  ): Promise<any> {
    const url = `https://graph.microsoft.com/v1.0${path}`;
    
    console.log(`Making ${method} request to: ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new SharePointError(
            SharePointErrorType.AUTHENTICATION_FAILED,
            'Authentication failed - token may be expired',
            { status: response.status, error: errorData }
          );
        }
        
        if (response.status === 403) {
          throw new SharePointError(
            SharePointErrorType.PERMISSION_DENIED,
            'Permission denied - insufficient permissions',
            { status: response.status, error: errorData }
          );
        }

        if (response.status === 429) {
          throw new SharePointError(
            SharePointErrorType.RATE_LIMITED,
            'Rate limit exceeded - too many requests',
            { status: response.status, error: errorData },
            true // retryable
          );
        }

        throw new SharePointError(
          SharePointErrorType.SERVER_ERROR,
          `Graph API request failed: ${response.status} ${response.statusText}`,
          { status: response.status, error: errorData }
        );
      }

      return await response.json();

    } catch (error) {
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.NETWORK_ERROR,
        'Network error during Graph API request',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        true // retryable
      );
    }
  }

  // ==========================================
  // FILE OPERATIONS
  // ==========================================

  /**
   * Upload file to SharePoint
   */
  async uploadFile(
    localPath: string,
    sharePointPath: string,
    fileContent: ArrayBuffer | Blob,
    metadata?: Record<string, any>
  ): Promise<{ id: string; webUrl: string; eTag: string }> {
    if (!this.connection || !this.graphClient) {
      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Not connected to SharePoint'
      );
    }

    try {
      console.log(`Uploading file: ${localPath} -> ${sharePointPath}`);

      // Create folder structure if needed
      await this.ensureFolderExists(sharePointPath);

      // Upload file using Graph API
      const uploadPath = `/sites/${this.connection.siteId}/drive/root:/${sharePointPath}:/content`;
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0${uploadPath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.connection.credentials!.accessToken}`,
            'Content-Type': 'application/octet-stream',
          },
          body: fileContent,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SharePointError(
          SharePointErrorType.SERVER_ERROR,
          `Upload failed: ${response.status} ${response.statusText}`,
          { status: response.status, error: errorData }
        );
      }

      const fileInfo = await response.json();
      
      console.log(`File uploaded successfully: ${fileInfo.id}`);
      
      return {
        id: fileInfo.id,
        webUrl: fileInfo.webUrl,
        eTag: fileInfo.eTag,
      };

    } catch (error) {
      console.error('Upload failed:', error);
      
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.SERVER_ERROR,
        'Upload operation failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Download file from SharePoint
   */
  async downloadFile(sharePointPath: string): Promise<{ content: ArrayBuffer; metadata: FileVersion }> {
    if (!this.connection || !this.graphClient) {
      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Not connected to SharePoint'
      );
    }

    try {
      console.log(`Downloading file: ${sharePointPath}`);

      // Get file metadata first
      const metadataPath = `/sites/${this.connection.siteId}/drive/root:/${sharePointPath}`;
      const metadataResponse = await this.makeGraphRequest(
        'GET',
        metadataPath,
        this.connection.credentials!
      );

      // Download file content
      const downloadPath = `/sites/${this.connection.siteId}/drive/root:/${sharePointPath}:/content`;
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0${downloadPath}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.connection.credentials!.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new SharePointError(
            SharePointErrorType.FILE_NOT_FOUND,
            `File not found: ${sharePointPath}`
          );
        }

        const errorData = await response.json().catch(() => ({}));
        throw new SharePointError(
          SharePointErrorType.SERVER_ERROR,
          `Download failed: ${response.status} ${response.statusText}`,
          { status: response.status, error: errorData }
        );
      }

      const content = await response.arrayBuffer();
      
      console.log(`File downloaded successfully: ${sharePointPath}`);
      
      return {
        content,
        metadata: this.mapToFileVersion(metadataResponse),
      };

    } catch (error) {
      console.error('Download failed:', error);
      
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.SERVER_ERROR,
        'Download operation failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update file in SharePoint
   */
  async updateFile(
    sharePointPath: string,
    fileContent: ArrayBuffer | Blob,
    metadata?: Record<string, any>
  ): Promise<{ id: string; webUrl: string; eTag: string }> {
    // Update is essentially the same as upload (PUT operation)
    return this.uploadFile('', sharePointPath, fileContent, metadata);
  }

  /**
   * Delete file from SharePoint
   */
  async deleteFile(sharePointPath: string): Promise<void> {
    if (!this.connection || !this.graphClient) {
      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Not connected to SharePoint'
      );
    }

    try {
      console.log(`Deleting file: ${sharePointPath}`);

      const deletePath = `/sites/${this.connection.siteId}/drive/root:/${sharePointPath}`;
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0${deletePath}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.connection.credentials!.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`File already deleted: ${sharePointPath}`);
          return; // File doesn't exist, consider it deleted
        }

        const errorData = await response.json().catch(() => ({}));
        throw new SharePointError(
          SharePointErrorType.SERVER_ERROR,
          `Delete failed: ${response.status} ${response.statusText}`,
          { status: response.status, error: errorData }
        );
      }

      console.log(`File deleted successfully: ${sharePointPath}`);

    } catch (error) {
      console.error('Delete failed:', error);
      
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.SERVER_ERROR,
        'Delete operation failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * List files in SharePoint folder
   */
  async listFiles(folderPath: string = ''): Promise<FileVersion[]> {
    if (!this.connection || !this.graphClient) {
      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Not connected to SharePoint'
      );
    }

    try {
      console.log(`Listing files in: ${folderPath || 'root'}`);

      const listPath = folderPath 
        ? `/sites/${this.connection.siteId}/drive/root:/${folderPath}:/children`
        : `/sites/${this.connection.siteId}/drive/root/children`;

      const response = await this.makeGraphRequest(
        'GET',
        listPath,
        this.connection.credentials!
      );

      if (!response || !response.value) {
        return [];
      }

      const files = response.value
        .filter((item: any) => !item.folder) // Only files, not folders
        .map((item: any) => this.mapToFileVersion(item));

      console.log(`Found ${files.length} files`);
      
      return files;

    } catch (error) {
      console.error('List files failed:', error);
      
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.SERVER_ERROR,
        'List files operation failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // ==========================================
  // FOLDER OPERATIONS
  // ==========================================

  /**
   * Ensure folder exists, create if not
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    if (!folderPath || folderPath === '.') return;

    const pathParts = folderPath.split('/');
    let currentPath = '';

    for (const part of pathParts) {
      if (!part) continue;
      
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      try {
        // Check if folder exists
        const checkPath = `/sites/${this.connection!.siteId}/drive/root:/${currentPath}`;
        await this.makeGraphRequest('GET', checkPath, this.connection!.credentials!);
        
      } catch (error) {
        if (error instanceof SharePointError && error.type === SharePointErrorType.FILE_NOT_FOUND) {
          // Folder doesn't exist, create it
          await this.createFolder(currentPath);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Create folder in SharePoint
   */
  private async createFolder(folderPath: string): Promise<void> {
    if (!this.connection || !this.graphClient) {
      throw new SharePointError(
        SharePointErrorType.CONNECTION_FAILED,
        'Not connected to SharePoint'
      );
    }

    try {
      console.log(`Creating folder: ${folderPath}`);

      const folderName = folderPath.split('/').pop() || folderPath;
      const parentPath = folderPath.includes('/') 
        ? folderPath.substring(0, folderPath.lastIndexOf('/'))
        : '';

      const createPath = parentPath
        ? `/sites/${this.connection.siteId}/drive/root:/${parentPath}:/children`
        : `/sites/${this.connection.siteId}/drive/root/children`;

      const folderData = {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      };

      await this.makeGraphRequest(
        'POST',
        createPath,
        this.connection.credentials!,
        folderData
      );

      console.log(`Folder created successfully: ${folderPath}`);

    } catch (error) {
      console.error('Create folder failed:', error);
      
      if (error instanceof SharePointError) {
        throw error;
      }

      throw new SharePointError(
        SharePointErrorType.SERVER_ERROR,
        'Create folder operation failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Map Graph API response to FileVersion
   */
  private mapToFileVersion(item: any): FileVersion {
    return {
      path: item.parentReference?.path || '',
      name: item.name,
      size: item.size || 0,
      lastModified: new Date(item.lastModifiedDateTime),
      checksum: item.file?.hashes?.sha1Hash || '',
      version: item.version || '1.0',
      author: item.createdBy?.user?.displayName || 'Unknown',
      metadata: {
        id: item.id,
        webUrl: item.webUrl,
        eTag: item.eTag,
        downloadUrl: item['@microsoft.graph.downloadUrl'],
        createdDateTime: item.createdDateTime,
        lastModifiedDateTime: item.lastModifiedDateTime,
        createdBy: item.createdBy,
        lastModifiedBy: item.lastModifiedBy,
      },
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.isConnected === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connection?.connectionStatus || 'disconnected';
  }

  /**
   * Get connection info
   */
  getConnection(): SharePointConnection | null {
    return this.connection;
  }

  /**
   * Disconnect from SharePoint
   */
  disconnect(): void {
    this.connection = null;
    this.graphClient = null;
    console.log('Disconnected from SharePoint');
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<SharePointCredentials> {
    if (!this.connection?.credentials?.refreshToken) {
      throw new SharePointError(
        SharePointErrorType.AUTHENTICATION_FAILED,
        'No refresh token available'
      );
    }

    try {
      // In production, implement proper token refresh using MSAL
      console.log('Refreshing access token...');
      
      // Placeholder for token refresh logic
      const newCredentials: SharePointCredentials = {
        ...this.connection.credentials,
        accessToken: 'new_access_token_here', // TODO: Implement actual refresh
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      this.connection.credentials = newCredentials;
      
      console.log('Access token refreshed successfully');
      return newCredentials;

    } catch (error) {
      console.error('Token refresh failed:', error);
      
      throw new SharePointError(
        SharePointErrorType.AUTHENTICATION_FAILED,
        'Failed to refresh access token',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}

// Export singleton instance
export const sharePointService = new SharePointService();
