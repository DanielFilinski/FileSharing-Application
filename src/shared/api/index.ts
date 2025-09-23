import { ApiClient } from './client';
import { errorHandler } from '../lib/errorHandler';

// Base URL for API - get from environment variables or use local
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     'https://your-function-app.azurewebsites.net/api' ||
                     'http://localhost:7071/api';

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

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