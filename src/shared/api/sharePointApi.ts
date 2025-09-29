/**
 * SharePoint API Client
 * Frontend integration with SharePoint Azure Functions
 */

import { apiClient } from './apiClient';
import { EndUser } from '../types/endUser.types';

export interface SharePointUploadData {
  file: File;
  endUserId: string;
  folderType: 'dms' | 'portal-to-end-user' | 'portal-from-end-user';
  metadata?: {
    tags?: string[];
    description?: string;
    category?: string;
    [key: string]: any;
  };
}

export interface SharePointDocument {
  id: string;
  name: string;
  webUrl: string;
  downloadUrl: string;
  size: number;
  lastModifiedDateTime?: string;
  folderType: string;
  folderPath: string;
  uploadedAt: string;
  uploadedBy?: string;
  metadata?: any;
  tags?: string[];
  sharePointItemId: string;
  warning?: string;
}

export interface SharePointSite {
  id: string;
  displayName: string;
  url: string;
  driveId: string;
  status: string;
}

export interface EndUserDocumentsResponse {
  documents: SharePointDocument[];
  count: number;
  endUserId: string;
  folderType: string;
}

export class SharePointApiClient {
  
  /**
   * Create SharePoint site for End User
   */
  static async createEndUserSite(endUser: EndUser): Promise<SharePointSite> {
    try {
      const response = await apiClient.post('/sharepoint/provision-site', {
        endUserId: endUser.id,
        endUserName: endUser.displayName,
        endUserEmail: endUser.email,
        organizationId: endUser.organizationId,
        firmName: endUser.firmName
      });
      
      return response.site;
    } catch (error: any) {
      console.error('Failed to create SharePoint site:', error);
      throw new Error(error.message || 'Failed to create SharePoint site');
    }
  }
  
  /**
   * Upload file to SharePoint
   */
  static async uploadToSharePoint(uploadData: SharePointUploadData): Promise<SharePointDocument> {
    try {
      const { file, endUserId, folderType, metadata = {} } = uploadData;
      
      // Convert file to array buffer
      const fileBuffer = await file.arrayBuffer();
      const fileBufferArray = Array.from(new Uint8Array(fileBuffer));
      
      const response = await apiClient.post('/sharepoint/upload', {
        fileBuffer: fileBufferArray,
        fileName: file.name,
        endUserId,
        folderType,
        metadata: {
          ...metadata,
          originalSize: file.size,
          originalType: file.type,
          uploadedFrom: 'web-client'
        }
      });
      
      return response.document;
    } catch (error: any) {
      console.error('Failed to upload to SharePoint:', error);
      throw new Error(error.message || 'Failed to upload file to SharePoint');
    }
  }
  
  /**
   * Open SharePoint document
   */
  static async openSharePointDocument(
    documentId: string,
    mode: 'view' | 'edit' = 'view'
  ): Promise<{ openUrl: string; document: SharePointDocument }> {
    try {
      const response = await apiClient.get(`/sharepoint/open/${documentId}?mode=${mode}`);
      return response;
    } catch (error: any) {
      console.error('Failed to open SharePoint document:', error);
      throw new Error(error.message || 'Failed to open document in SharePoint');
    }
  }
  
  /**
   * Get End User documents from SharePoint
   */
  static async getEndUserDocuments(
    endUserId: string,
    folderType?: string
  ): Promise<EndUserDocumentsResponse> {
    try {
      let url = `/sharepoint/enduser/${endUserId}/documents`;
      if (folderType) {
        url += `?folderType=${folderType}`;
      }
      
      const response = await apiClient.get(url);
      return response;
    } catch (error: any) {
      console.error('Failed to get End User documents:', error);
      throw new Error(error.message || 'Failed to get documents from SharePoint');
    }
  }
  
  /**
   * Get SharePoint site information
   */
  static async getSharePointSite(siteId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/sharepoint/sites/${siteId}`);
      return response.site;
    } catch (error: any) {
      console.error('Failed to get SharePoint site:', error);
      throw new Error(error.message || 'Failed to get SharePoint site');
    }
  }
  
  /**
   * Get files in SharePoint folder
   */
  static async getSharePointFiles(
    siteId: string,
    folderPath?: string
  ): Promise<{ items: any[]; count: number }> {
    try {
      let url = `/sharepoint/sites/${siteId}/files`;
      if (folderPath) {
        url += `?folderPath=${encodeURIComponent(folderPath)}`;
      }
      
      const response = await apiClient.get(url);
      return response;
    } catch (error: any) {
      console.error('Failed to get SharePoint files:', error);
      throw new Error(error.message || 'Failed to get files from SharePoint');
    }
  }
  
  /**
   * Create folder in SharePoint
   */
  static async createSharePointFolder(
    siteId: string,
    folderName: string,
    parentPath?: string
  ): Promise<{ folder: any }> {
    try {
      const response = await apiClient.post(`/sharepoint/sites/${siteId}/folders`, {
        folderName,
        parentPath
      });
      
      return response;
    } catch (error: any) {
      console.error('Failed to create SharePoint folder:', error);
      throw new Error(error.message || 'Failed to create folder in SharePoint');
    }
  }
  
  /**
   * Get SharePoint drive information
   */
  static async getSharePointDrive(siteId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/sharepoint/sites/${siteId}/drive`);
      return response.drive;
    } catch (error: any) {
      console.error('Failed to get SharePoint drive:', error);
      throw new Error(error.message || 'Failed to get SharePoint drive');
    }
  }
  
  /**
   * Get download URL for SharePoint file
   */
  static async getDownloadUrl(siteId: string, itemId: string): Promise<string> {
    try {
      const response = await apiClient.get(`/sharepoint/sites/${siteId}/items/${itemId}/download`);
      return response.downloadUrl;
    } catch (error: any) {
      console.error('Failed to get download URL:', error);
      throw new Error(error.message || 'Failed to get download URL');
    }
  }
  
  /**
   * Helper method to determine folder type based on user role and context
   */
  static determineFolderType(
    isEmployee: boolean,
    isToEndUser: boolean
  ): 'dms' | 'portal-to-end-user' | 'portal-from-end-user' {
    if (isEmployee) {
      if (isToEndUser) {
        return 'portal-to-end-user';
      } else {
        return 'dms';
      }
    } else {
      return 'portal-from-end-user';
    }
  }
  
  /**
   * Helper method to get human-readable folder name
   */
  static getFolderDisplayName(folderType: string): string {
    switch (folderType) {
      case 'dms':
        return 'Internal Documents (DMS)';
      case 'portal-to-end-user':
        return 'To End User';
      case 'portal-from-end-user':
        return 'From End User';
      default:
        return 'Documents';
    }
  }
  
  /**
   * Helper method to get folder icon
   */
  static getFolderIcon(folderType: string): string {
    switch (folderType) {
      case 'dms':
        return '🏢'; // Building/office icon
      case 'portal-to-end-user':
        return '📤'; // Outbox icon
      case 'portal-from-end-user':
        return '📥'; // Inbox icon
      default:
        return '📁'; // Generic folder icon
    }
  }
  
  /**
   * Bulk upload multiple files
   */
  static async bulkUploadToSharePoint(
    files: FileList,
    endUserId: string,
    folderType: 'dms' | 'portal-to-end-user' | 'portal-from-end-user',
    metadata?: any
  ): Promise<{ successful: SharePointDocument[]; failed: { file: string; error: string }[] }> {
    const successful: SharePointDocument[] = [];
    const failed: { file: string; error: string }[] = [];
    
    for (const file of Array.from(files)) {
      try {
        const document = await this.uploadToSharePoint({
          file,
          endUserId,
          folderType,
          metadata
        });
        
        successful.push(document);
      } catch (error: any) {
        failed.push({
          file: file.name,
          error: error.message
        });
      }
    }
    
    return { successful, failed };
  }
  
  /**
   * Search documents across all folders for End User
   */
  static async searchEndUserDocuments(
    endUserId: string,
    searchTerm: string
  ): Promise<SharePointDocument[]> {
    try {
      const response = await this.getEndUserDocuments(endUserId);
      
      if (!searchTerm.trim()) {
        return response.documents;
      }
      
      const term = searchTerm.toLowerCase().trim();
      
      return response.documents.filter(doc => {
        return (
          doc.name.toLowerCase().includes(term) ||
          doc.metadata?.description?.toLowerCase().includes(term) ||
          doc.tags?.some(tag => tag.toLowerCase().includes(term))
        );
      });
    } catch (error: any) {
      console.error('Failed to search documents:', error);
      throw new Error(error.message || 'Failed to search documents');
    }
  }
  
  /**
   * Get documents by folder type for End User
   */
  static async getDocumentsByFolder(
    endUserId: string,
    folderType: 'dms' | 'portal-to-end-user' | 'portal-from-end-user'
  ): Promise<SharePointDocument[]> {
    try {
      const response = await this.getEndUserDocuments(endUserId, folderType);
      return response.documents;
    } catch (error: any) {
      console.error(`Failed to get ${folderType} documents:`, error);
      throw new Error(error.message || `Failed to get ${folderType} documents`);
    }
  }
  
  /**
   * Validate file before upload
   */
  static validateFile(
    file: File,
    maxSizeInMB: number = 100,
    allowedTypes?: string[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      errors.push(`File size exceeds ${maxSizeInMB}MB limit`);
    }
    
    // Check file type
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      const isAllowed = allowedTypes.some(type => 
        fileType.includes(type.toLowerCase()) ||
        (fileExtension && type.toLowerCase().includes(fileExtension))
      );
      
      if (!isAllowed) {
        errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }
    }
    
    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      errors.push('File name cannot be empty');
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
      errors.push('File name contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const sharePointApi = SharePointApiClient;
