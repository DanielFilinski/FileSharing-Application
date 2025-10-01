import { ApiClient } from './client';
import { errorHandler } from '../lib/errorHandler';
import { mockDocuments, mockApiResponse } from './mockData';
import { notificationService, temporarilyDisableErrorNotifications } from '../lib/notifications';

// Base URL for API - get from environment variables or use local
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     'http://localhost:7071/api';

// Development mode flag
const isDevelopment = import.meta.env.DEV;

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Error tracking for batch error detection
let errorCount = 0;
let errorTrackingResetTime = Date.now();
const MAX_ERRORS_BEFORE_DISABLE = 5; // Max errors before temporarily disabling notifications
const ERROR_TRACKING_WINDOW = 10000; // 10 seconds window to track errors
const DISABLE_DURATION = 30000; // 30 seconds to disable notifications

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

// Helper function to check and handle batch errors
function handleBatchErrors(): void {
  const now = Date.now();
  
  // Reset error count if tracking window expired
  if (now - errorTrackingResetTime > ERROR_TRACKING_WINDOW) {
    errorCount = 0;
    errorTrackingResetTime = now;
  }
  
  errorCount++;
  
  // If too many errors in the time window, temporarily disable notifications
  if (errorCount >= MAX_ERRORS_BEFORE_DISABLE && notificationService.isErrorNotificationsEnabled()) {
    console.warn(`Too many errors (${errorCount}) in short time. Temporarily disabling error notifications.`);
    temporarilyDisableErrorNotifications(DISABLE_DURATION);
    
    // Show single notification about disabling notifications
    notificationService.warning(
      'Error Notifications Disabled',
      `Too many errors detected. Error notifications temporarily disabled for ${DISABLE_DURATION / 1000} seconds.`
    );
  }
}

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
    // Track batch errors
    handleBatchErrors();
    
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
  type DeadlineItem,
  type ActionRequiredDocument
} from './dashboardService';

// Legacy services
export { documentsService } from './documentsService';
export { oneDriveService } from './oneDriveService';

// E2EE Service
export { e2eeService, E2EEService } from './e2eeService';

// MFA Service
export { mfaService, MFAService } from './mfaService';

// Escalation Service
export { escalationService } from './escalationService';

// Export notification control functions for debugging
export { 
  disableErrorNotifications, 
  enableErrorNotifications, 
  temporarilyDisableErrorNotifications 
} from '../lib/notifications';