import { apiClient } from './apiClient';

export interface DocumentVersion {
  id: string;
  partitionKey: string;
  documentId: string;
  versionNumber: number;
  documentSnapshot: {
    name: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    blobUrl: string;
    status: string;
    category?: string;
    tags: string[];
    metadata: any;
  };
  versionMetadata: {
    createdBy: string;
    createdByEmail: string;
    createdAt: string;
    changeType: 'created' | 'updated' | 'status_changed' | 'renamed' | 'moved' | 'approved' | 'rejected';
    changeDescription: string;
    previousVersion?: number;
    validationStatus?: string;
    approvalStatus?: string;
    signatureStatus?: string;
  };
  auditInfo?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    workflowId?: string;
  };
}

export interface DocumentHistoryEvent {
  id: string;
  partitionKey: string;
  documentId: string;
  versionId?: string;
  eventType: 'upload' | 'download' | 'view' | 'edit' | 'rename' | 'move' | 'delete' | 'share' | 'lock' | 'unlock' | 'validate' | 'approve' | 'sign';
  eventDetails: {
    action: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    workflowStepId?: string;
  };
  userInfo: {
    userId: string;
    userEmail: string;
    userName: string;
    userRoles: string[];
  };
  timestamp: string;
  auditInfo: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
}

export interface DocumentHistoryResponse {
  success: boolean;
  data: {
    documentId: string;
    documentName: string;
    currentVersion: number;
    versions: DocumentVersion[];
    historyEvents: DocumentHistoryEvent[];
    totalVersions: number;
  };
}

export interface CreateVersionRequest {
  eventType: 'upload' | 'download' | 'view' | 'edit' | 'rename' | 'move' | 'delete' | 'share' | 'lock' | 'unlock' | 'validate' | 'approve' | 'sign';
  eventDetails: {
    action: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    workflowStepId?: string;
  };
  reason?: string;
}

export interface VersionComparisonResult {
  documentId: string;
  version1: DocumentVersion;
  version2: DocumentVersion;
  differences: Record<string, { old: any; new: any }>;
  comparedBy: string;
  comparedAt: string;
}

export const documentVersionsApi = {
  /**
   * Get document version history
   */
  async getDocumentHistory(documentId: string): Promise<DocumentHistoryResponse> {
    try {
      console.log(`Fetching version history for document ${documentId}`);
      
      const response = await apiClient.get<DocumentHistoryResponse>(`/documents/${documentId}/versions`);
      
      console.log('Document history retrieved:', response);
      return response;
    } catch (error) {
      console.error('Failed to get document history:', error);
      throw error;
    }
  },

  /**
   * Get specific document version
   */
  async getDocumentVersion(documentId: string, versionNumber: number): Promise<{ success: boolean; data: DocumentVersion }> {
    try {
      console.log(`Fetching document ${documentId} version ${versionNumber}`);
      
      const response = await apiClient.get<{ success: boolean; data: DocumentVersion }>(`/documents/${documentId}/versions/${versionNumber}`);
      
      console.log('Document version retrieved:', response);
      return response;
    } catch (error) {
      console.error('Failed to get document version:', error);
      throw error;
    }
  },

  /**
   * Create new document version
   */
  async createDocumentVersion(documentId: string, data: CreateVersionRequest): Promise<{ success: boolean; data: DocumentVersion; message: string }> {
    try {
      console.log(`Creating new version for document ${documentId}:`, data);
      
      const response = await apiClient.post<{ success: boolean; data: DocumentVersion; message: string }>(`/documents/${documentId}/versions`, data);
      
      console.log('Document version created:', response);
      return response;
    } catch (error) {
      console.error('Failed to create document version:', error);
      throw error;
    }
  },

  /**
   * Restore document from version
   */
  async restoreDocumentFromVersion(documentId: string, versionNumber: number): Promise<{
    success: boolean;
    message: string;
    data: {
      documentId: string;
      restoredFromVersion: number;
      restoredAt: string;
      restoredBy: string;
    };
  }> {
    try {
      console.log(`Restoring document ${documentId} from version ${versionNumber}`);
      
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          documentId: string;
          restoredFromVersion: number;
          restoredAt: string;
          restoredBy: string;
        };
      }>(`/documents/${documentId}/versions/${versionNumber}/restore`);
      
      console.log('Document restored from version:', response);
      return response;
    } catch (error) {
      console.error('Failed to restore document from version:', error);
      throw error;
    }
  },

  /**
   * Compare two document versions
   */
  async compareVersions(documentId: string, version1: number, version2: number): Promise<VersionComparisonResult> {
    try {
      console.log(`Comparing document ${documentId} versions ${version1} and ${version2}`);
      
      // This would be implemented as a separate endpoint in the backend
      const [v1Response, v2Response] = await Promise.all([
        this.getDocumentVersion(documentId, version1),
        this.getDocumentVersion(documentId, version2)
      ]);

      const differences = this.calculateDifferences(v1Response.data.documentSnapshot, v2Response.data.documentSnapshot);

      const result: VersionComparisonResult = {
        documentId,
        version1: v1Response.data,
        version2: v2Response.data,
        differences,
        comparedBy: 'current-user', // Would be filled from auth context
        comparedAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      console.error('Failed to compare versions:', error);
      throw error;
    }
  },

  /**
   * Download specific version of document
   */
  async downloadDocumentVersion(documentId: string, versionNumber: number): Promise<Blob> {
    try {
      console.log(`Downloading document ${documentId} version ${versionNumber}`);
      
      const versionResponse = await this.getDocumentVersion(documentId, versionNumber);
      
      if (!versionResponse.data.documentSnapshot.blobUrl) {
        throw new Error('Document version has no downloadable content');
      }

      // Download the blob from the URL
      const response = await fetch(versionResponse.data.documentSnapshot.blobUrl);
      if (!response.ok) {
        throw new Error('Failed to download document version');
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download document version:', error);
      throw error;
    }
  },

  /**
   * Get formatted version change description
   */
  getVersionChangeDescription(version: DocumentVersion): string {
    const { changeType, changeDescription } = version.versionMetadata;
    
    const typeLabels: Record<string, string> = {
      'created': '📝 Created',
      'updated': '✏️ Updated',
      'status_changed': '🔄 Status Changed',
      'renamed': '📝 Renamed',
      'moved': '📁 Moved',
      'approved': '✅ Approved',
      'rejected': '❌ Rejected'
    };

    const typeLabel = typeLabels[changeType] || '📝 Modified';
    return `${typeLabel}: ${changeDescription}`;
  },

  /**
   * Format version timestamp for display
   */
  formatVersionTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return 'Less than an hour ago';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hour${Math.floor(diffHours) > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} day${Math.floor(diffDays) > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  /**
   * Get version status color for UI
   */
  getVersionStatusColor(version: DocumentVersion): 'success' | 'warning' | 'danger' | 'neutral' {
    const { changeType } = version.versionMetadata;
    
    switch (changeType) {
      case 'created':
        return 'success';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'status_changed':
        return 'warning';
      default:
        return 'neutral';
    }
  },

  /**
   * Calculate differences between two document snapshots
   */
  calculateDifferences(snapshot1: any, snapshot2: any): Record<string, { old: any; new: any }> {
    const differences: Record<string, { old: any; new: any }> = {};
    const fieldsToCompare = ['name', 'fileName', 'fileSize', 'status', 'category', 'tags'];

    for (const field of fieldsToCompare) {
      if (JSON.stringify(snapshot1[field]) !== JSON.stringify(snapshot2[field])) {
        differences[field] = {
          old: snapshot1[field],
          new: snapshot2[field]
        };
      }
    }

    return differences;
  },

  /**
   * Check if user can restore from version (permissions)
   */
  canRestoreVersion(version: DocumentVersion, currentUserEmail?: string): boolean {
    // Business logic for restore permissions
    // For now, assume users can restore their own documents or if they're admin
    return true; // This would be replaced with proper permission checking
  },

  /**
   * Get version size in human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};
