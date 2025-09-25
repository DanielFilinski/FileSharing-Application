import { ApiClient, type ApiResponse } from './client';
import { type Document } from '@/entities/document/api/documentsApi';

// Types for new document operations
export interface CreateDocumentRequest {
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'form';
  template?: string;
  description?: string;
  metadata?: {
    documentType?: string;
    documentSubtype?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  };
  openMode: 'local' | 'online';
}

export interface OpenDocumentRequest {
  documentId: string;
  mode: 'local' | 'online';
  action: 'view' | 'edit';
}

export interface UnlockDocumentRequest {
  documentId: string;
  force?: boolean;
}

export interface CreateDocumentResponse {
  message: string;
  document: Document;
  editorUrls: {
    online: string;
    local: string;
  };
}

export interface OpenDocumentResponse {
  message: string;
  document: {
    id: string;
    name: string;
    type: string;
    status: string;
    isLocked: boolean;
    lockedBy?: string;
    lastModified: string;
    permissions: {
      canView: boolean;
      canEdit: boolean;
      isOwner: boolean;
    };
  };
  access: {
    mode: 'local' | 'online';
    action: 'view' | 'edit';
    editorUrl: string;
    downloadUrl: string;
    expiresAt: string;
  };
}

export interface UnlockDocumentResponse {
  message: string;
  document: {
    id: string;
    name: string;
    isLocked: boolean;
    unlockedBy?: string;
    unlockedAt?: string;
    lastModified: string;
  };
}

/**
 * Service for handling document operations with Azure Functions
 */
export class DocumentsService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Create a new document from template
   */
  async createDocument(data: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    try {
      const response: ApiResponse<CreateDocumentResponse> = await this.apiClient.post(
        '/documents/create',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document. Please try again.');
    }
  }

  /**
   * Open an existing document for viewing or editing
   */
  async openDocument(data: OpenDocumentRequest): Promise<OpenDocumentResponse> {
    try {
      const response: ApiResponse<OpenDocumentResponse> = await this.apiClient.post(
        '/documents/open',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error opening document:', error);
      
      // Handle specific error cases
      if (error.status === 404) {
        throw new Error('Document not found.');
      } else if (error.status === 403) {
        throw new Error('You do not have permission to access this document.');
      } else if (error.status === 423) {
        throw new Error('Document is currently locked by another user.');
      }
      
      throw new Error('Failed to open document. Please try again.');
    }
  }

  /**
   * Unlock a document (stop editing session)
   */
  async unlockDocument(data: UnlockDocumentRequest): Promise<UnlockDocumentResponse> {
    try {
      const response: ApiResponse<UnlockDocumentResponse> = await this.apiClient.post(
        '/documents/unlock',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error unlocking document:', error);
      
      // Handle specific error cases
      if (error.status === 404) {
        throw new Error('Document not found.');
      } else if (error.status === 403) {
        throw new Error('You do not have permission to unlock this document.');
      }
      
      throw new Error('Failed to unlock document. Please try again.');
    }
  }

  /**
   * Open document in online editor (Office Online/Microsoft 365)
   */
  async openInOnlineEditor(documentId: string, action: 'view' | 'edit' = 'edit'): Promise<string> {
    const response = await this.openDocument({
      documentId,
      mode: 'online',
      action
    });
    
    // Return the editor URL for direct navigation
    return response.access.editorUrl;
  }

  /**
   * Download document for local editing
   */
  async downloadForLocalEditing(documentId: string): Promise<string> {
    const response = await this.openDocument({
      documentId,
      mode: 'local',
      action: 'edit'
    });
    
    // Return the download URL
    return response.access.downloadUrl;
  }

  /**
   * Bulk open multiple documents
   */
  async openMultipleDocuments(
    documentIds: string[], 
    mode: 'local' | 'online' = 'online',
    action: 'view' | 'edit' = 'edit'
  ): Promise<OpenDocumentResponse[]> {
    try {
      // Open documents concurrently with error handling
      const promises = documentIds.map(async (documentId) => {
        try {
          return await this.openDocument({ documentId, mode, action });
        } catch (error) {
          console.error(`Failed to open document ${documentId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      
      // Filter out failed requests
      return results.filter((result): result is OpenDocumentResponse => result !== null);
    } catch (error) {
      console.error('Error opening multiple documents:', error);
      throw new Error('Failed to open some documents. Please check your permissions and try again.');
    }
  }

  /**
   * Auto-unlock documents when user closes editor (cleanup)
   */
  async cleanupEditingSessions(documentIds: string[]): Promise<void> {
    try {
      // Unlock all documents concurrently
      const promises = documentIds.map(async (documentId) => {
        try {
          await this.unlockDocument({ documentId });
        } catch (error) {
          // Log but don't throw - cleanup should be best effort
          console.warn(`Failed to unlock document ${documentId}:`, error);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Don't throw - cleanup should be silent
    }
  }

  /**
   * Check if document is available for editing (not locked by others)
   */
  async checkDocumentAvailability(documentId: string): Promise<{
    available: boolean;
    isLocked: boolean;
    lockedBy?: string;
    lockedAt?: string;
  }> {
    try {
      // Try to open in view mode to check status
      const response = await this.openDocument({
        documentId,
        mode: 'online',
        action: 'view'
      });
      
      return {
        available: !response.document.isLocked || response.document.permissions.canEdit,
        isLocked: response.document.isLocked,
        lockedBy: response.document.lockedBy
      };
    } catch (error) {
      if (error.status === 423) {
        // Document is locked
        return {
          available: false,
          isLocked: true,
          lockedBy: error.details?.lockedBy
        };
      }
      throw error;
    }
  }
}
