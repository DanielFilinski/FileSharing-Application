import { apiClient } from '../api';
import { notificationService } from './notifications';
import { errorHandler } from './errorHandler';

// API client usage examples

export class ApiExamples {
  // Get user profile
  static async getUserProfile() {
    try {
      const response = await apiClient.get('/getUserProfile');
      notificationService.success('Profile Loaded', 'User data successfully retrieved');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // Upload file
  static async uploadFile(file: File, onProgress?: (progress: number) => void) {
    try {
      const response = await apiClient.uploadFile('/uploadFile', file, onProgress);
      notificationService.success('File Uploaded', `File ${file.name} successfully uploaded`);
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // Check API health
  static async checkHealth() {
    try {
      const response = await apiClient.get('/healthCheck');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: false });
      throw error;
    }
  }

  // POST request example
  static async createDocument(documentData: any) {
    try {
      const response = await apiClient.post('/documents', documentData);
      notificationService.success('Document Created', 'New document successfully created');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // PUT request example
  static async updateDocument(id: string, documentData: any) {
    try {
      const response = await apiClient.put(`/documents/${id}`, documentData);
      notificationService.success('Document Updated', 'Document successfully updated');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // DELETE request example
  static async deleteDocument(id: string) {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      notificationService.success('Document Deleted', 'Document successfully deleted');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }
}

// React component usage example
export const useApiExamples = () => {
  const uploadFileWithProgress = async (file: File) => {
    try {
      const result = await ApiExamples.uploadFile(file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
        // Here you can update UI with progress
      });
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadFileWithProgress(file);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  return {
    getUserProfile: ApiExamples.getUserProfile,
    uploadFile: uploadFileWithProgress,
    checkHealth: ApiExamples.checkHealth,
    createDocument: ApiExamples.createDocument,
    updateDocument: ApiExamples.updateDocument,
    deleteDocument: ApiExamples.deleteDocument,
    handleFileUpload,
  };
};