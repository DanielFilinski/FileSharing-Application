import { ApiClient } from './client';
import { errorHandler } from '../lib/errorHandler';
import { mockDocuments, mockApiResponse } from './mockData';

// Base URL for API - get from environment variables or use local
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     'http://localhost:7071/api';

// Development mode flag
const isDevelopment = import.meta.env.DEV;

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Mock API для разработки
export const mockApi = {
  async getDocuments() {
    console.log('🔧 Using mock API for documents');
    return mockApiResponse({ documents: mockDocuments });
  },
  
  async uploadDocument(data: any) {
    console.log('🔧 Using mock API for upload:', data);
    return mockApiResponse({ 
      message: 'File uploaded successfully (mock)',
      document: {
        id: `mock-${Date.now()}`,
        ...data,
        status: 'Active',
        createdAt: new Date().toISOString()
      }
    });
  }
};

// Wrapper для автоматического переключения между реальным API и mock
export const api = {
  async getDocuments() {
    if (isDevelopment) {
      try {
        return await apiClient.get('/documents');
      } catch (error) {
        console.warn('API server not available, using mock data:', error);
        return await mockApi.getDocuments();
      }
    }
    return await apiClient.get('/documents');
  },
  
  async uploadDocument(data: any) {
    if (isDevelopment) {
      try {
        return await apiClient.post('/saveOneDriveDocument', data);
      } catch (error) {
        console.warn('API server not available, using mock upload:', error);
        return await mockApi.uploadDocument(data);
      }
    }
    return await apiClient.post('/saveOneDriveDocument', data);
  }
};

// Update API client for integration with error handler
const originalRequest = apiClient['request'].bind(apiClient);
apiClient['request'] = async function<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  retryCount: number = 0
): Promise<any> {
  try {
    return await originalRequest<T>(endpoint, options, retryCount);
  } catch (error) {
    await errorHandler.handleApiError(error, {
      showNotification: true,
      retry: true,
      maxRetries: 3,
      retryDelay: 1000,
    });
    throw error;
  }
};

// Export types for use in other modules
export type { ApiResponse, ApiError } from './client';
export { ApiClient };

// Dashboard Service
export { 
  dashboardService,
  type DashboardClient,
  type DashboardDocument, 
  type UserProfile,
  type DashboardStats,
  type ActivityItem,
  type DeadlineItem
} from './dashboardService';

// Legacy services
export { documentsService } from './documentsService';
export { oneDriveService } from './oneDriveService';