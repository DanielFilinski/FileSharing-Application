/**
 * API Client Configuration
 * Main client instance for API communication
 */

import { ApiClient } from './client';

// Get the base API URL from environment or default to local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';

// Create the main API client instance
const baseApiClient = new ApiClient(API_BASE_URL);

// Set authentication token from storage if available
const token = localStorage.getItem('authToken');
if (token) {
  baseApiClient.setToken(token);
}

// Enhanced API client that unwraps responses for easier usage
export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await baseApiClient.get<T>(endpoint);
    return response.data;
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await baseApiClient.post<T>(endpoint, data);
    return response.data;
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await baseApiClient.put<T>(endpoint, data);
    return response.data;
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await baseApiClient.delete<T>(endpoint);
    return response.data;
  },

  async uploadFile<T>(
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await baseApiClient.uploadFile<T>(endpoint, file, onProgress);
    return response.data;
  },

  // Update authentication token
  setToken(token: string | null): void {
    baseApiClient.setToken(token);
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  },

  // Configure retry behavior
  setRetryConfig(attempts: number, delay: number): void {
    baseApiClient.setRetryConfig(attempts, delay);
  },

  // Direct access to base client for advanced usage
  getBaseClient(): ApiClient {
    return baseApiClient;
  }
};

// Listen for auth token changes in other tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'authToken') {
    const newToken = event.newValue;
    baseApiClient.setToken(newToken);
  }
});

