import { apiClient } from './apiClient';

export interface PinDocumentRequest {
  pinned: boolean;
}

export interface MoveDocumentsRequest {
  documentIds: string[];
  targetFolder: string;
  moveType: 'move' | 'copy';
}

export interface BulkOperationRequest {
  documentIds: string[];
  operation: 'delete' | 'archive' | 'restore' | 'tag';
  metadata?: {
    tags?: string[];
    [key: string]: any;
  };
}

export interface DocumentActivity {
  id: string;
  type: string;
  documentId: string;
  documentName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  timestamp: string;
  metadata?: any;
}

export interface OperationResult {
  documentId: string;
  success: boolean;
  action?: string;
  error?: string;
  description?: string;
  documentName?: string;
  newDocumentId?: string;
  targetFolder?: string;
  previousFolder?: string;
}

export interface BulkOperationResponse {
  success: boolean;
  operation: string;
  results: OperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  message: string;
  targetFolder?: string;
}

export class AdvancedDocumentApiClient {
  /**
   * Pin or unpin a document to top
   */
  static async pinDocument(documentId: string, pinned: boolean): Promise<any> {
    try {
      console.log(`${pinned ? 'Pinning' : 'Unpinning'} document ${documentId}`);
      
      const response = await apiClient.post(`/documents/${documentId}/pin`, {
        pinned
      });
      
      console.log('Pin operation successful:', response);
      return response;
    } catch (error) {
      console.error(`Failed to ${pinned ? 'pin' : 'unpin'} document:`, error);
      throw error;
    }
  }

  /**
   * Move or copy documents to a different folder
   */
  static async moveDocuments(
    documentIds: string[], 
    targetFolder: string, 
    moveType: 'move' | 'copy'
  ): Promise<BulkOperationResponse> {
    try {
      console.log(`${moveType === 'move' ? 'Moving' : 'Copying'} ${documentIds.length} documents to ${targetFolder}`);
      
      const response = await apiClient.post('/documents/move', {
        documentIds,
        targetFolder,
        moveType
      });
      
      console.log(`${moveType} operation successful:`, response);
      return response as BulkOperationResponse;
    } catch (error) {
      console.error(`Failed to ${moveType} documents:`, error);
      throw error;
    }
  }

  /**
   * Perform bulk operations on multiple documents
   */
  static async bulkOperation(
    documentIds: string[], 
    operation: 'delete' | 'archive' | 'restore' | 'tag',
    metadata?: { tags?: string[]; [key: string]: any }
  ): Promise<BulkOperationResponse> {
    try {
      console.log(`Performing bulk ${operation} operation on ${documentIds.length} documents`);
      
      const response = await apiClient.post('/documents/bulk', {
        documentIds,
        operation,
        metadata
      });
      
      console.log(`Bulk ${operation} operation successful:`, response);
      return response as BulkOperationResponse;
    } catch (error) {
      console.error(`Failed to perform bulk ${operation} operation:`, error);
      throw error;
    }
  }

  /**
   * Get activity history for a document
   */
  static async getDocumentActivities(documentId: string): Promise<{
    success: boolean;
    documentId: string;
    activities: DocumentActivity[];
    count: number;
  }> {
    try {
      console.log(`Getting activities for document ${documentId}`);
      
      const response = await apiClient.get(`/documents/${documentId}/activities`);
      
      console.log('Document activities retrieved:', response);
      return response;
    } catch (error) {
      console.error('Failed to get document activities:', error);
      throw error;
    }
  }

  /**
   * Helper method to get available folders for move/copy operations
   */
  static getAvailableFolders(): Array<{ id: string; name: string; path: string }> {
    return [
      { id: 'documents', name: 'Documents', path: 'documents' },
      { id: 'dms', name: 'DMS', path: 'dms' },
      { id: 'portal-to-enduser', name: 'Portal/To End User', path: 'portal/to-end-user' },
      { id: 'portal-from-enduser', name: 'Portal/From End User', path: 'portal/from-end-user' },
      { id: 'client-files', name: 'Client Files', path: 'client-files' },
      { id: 'tax-documents', name: 'Tax Documents', path: 'tax-documents' },
      { id: 'contracts', name: 'Contracts', path: 'contracts' },
      { id: 'reports', name: 'Reports', path: 'reports' },
      { id: 'archive', name: 'Archive', path: 'archive' },
      { id: 'templates', name: 'Templates', path: 'templates' }
    ];
  }

  /**
   * Validate folder path
   */
  static isValidFolder(folderPath: string): boolean {
    const availableFolders = this.getAvailableFolders();
    return availableFolders.some(folder => folder.path === folderPath || folder.id === folderPath);
  }

  /**
   * Get folder display name from path
   */
  static getFolderDisplayName(folderPath: string): string {
    const availableFolders = this.getAvailableFolders();
    const folder = availableFolders.find(f => f.path === folderPath || f.id === folderPath);
    return folder?.name || folderPath;
  }

  /**
   * Helper method to format operation results for display
   */
  static formatOperationResults(results: OperationResult[]): {
    successful: OperationResult[];
    failed: OperationResult[];
    successMessages: string[];
    errorMessages: string[];
  } {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const successMessages = successful.map(r => {
      if (r.action === 'moved') {
        return `${r.documentName || r.documentId} moved to ${this.getFolderDisplayName(r.targetFolder || '')}`;
      } else if (r.action === 'copied') {
        return `${r.documentName || r.documentId} copied to ${this.getFolderDisplayName(r.targetFolder || '')}`;
      } else if (r.description) {
        return `${r.documentName || r.documentId} ${r.description}`;
      } else {
        return `${r.documentName || r.documentId} processed successfully`;
      }
    });

    const errorMessages = failed.map(r => 
      `${r.documentId}: ${r.error}`
    );

    return {
      successful,
      failed,
      successMessages,
      errorMessages
    };
  }

  /**
   * Helper method to validate bulk operation request
   */
  static validateBulkRequest(
    documentIds: string[], 
    operation: string, 
    targetFolder?: string
  ): { valid: boolean; error?: string } {
    if (!documentIds || documentIds.length === 0) {
      return { valid: false, error: 'No documents selected' };
    }

    if (documentIds.length > 100) {
      return { valid: false, error: 'Too many documents selected (maximum 100)' };
    }

    if ((operation === 'move' || operation === 'copy') && targetFolder) {
      if (!this.isValidFolder(targetFolder)) {
        return { valid: false, error: 'Invalid target folder' };
      }
    }

    const validOperations = ['delete', 'archive', 'restore', 'tag', 'move', 'copy', 'pin', 'unpin'];
    if (!validOperations.includes(operation)) {
      return { valid: false, error: 'Invalid operation' };
    }

    return { valid: true };
  }
}

export default AdvancedDocumentApiClient;
