/**
 * End User API Client
 * Handles all API communication for End User management
 */

import { apiClient } from './apiClient';
import {
  EndUser,
  EndUserFormData,
  EndUserUpdateData,
  EndUsersResponse,
  EndUserResponse,
  END_USER_ENDPOINTS
} from '../types/endUser.types';

export class EndUserApiClient {
  
  /**
   * Get all end users for the current organization
   */
  static async getEndUsers(): Promise<EndUsersResponse> {
    try {
      const response = await apiClient.get<EndUsersResponse>(END_USER_ENDPOINTS.list);
      return response;
    } catch (error: any) {
      console.error('Error fetching end users:', error);
      throw new Error(error.message || 'Failed to fetch end users');
    }
  }
  
  /**
   * Get a specific end user by ID
   */
  static async getEndUserById(id: string): Promise<EndUser> {
    try {
      const response = await apiClient.get<EndUser>(END_USER_ENDPOINTS.get(id));
      return response;
    } catch (error: any) {
      console.error(`Error fetching end user ${id}:`, error);
      throw new Error(error.message || 'Failed to fetch end user');
    }
  }
  
  /**
   * Create a new end user
   */
  static async createEndUser(data: EndUserFormData): Promise<EndUser> {
    try {
      // Validate required fields
      if (!data.firstName?.trim()) {
        throw new Error('First name is required');
      }
      if (!data.lastName?.trim()) {
        throw new Error('Last name is required');
      }
      if (!data.email?.trim()) {
        throw new Error('Email is required');
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Valid email address is required');
      }
      
      const response = await apiClient.post<EndUserResponse>(
        END_USER_ENDPOINTS.create,
        data
      );
      
      return response.endUser;
    } catch (error: any) {
      console.error('Error creating end user:', error);
      throw new Error(error.message || 'Failed to create end user');
    }
  }
  
  /**
   * Update an existing end user
   */
  static async updateEndUser(id: string, data: EndUserUpdateData): Promise<EndUser> {
    try {
      if (!id?.trim()) {
        throw new Error('End user ID is required');
      }
      
      // Validate email if provided
      if (data.email && data.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new Error('Valid email address is required');
        }
      }
      
      const response = await apiClient.put<EndUserResponse>(
        END_USER_ENDPOINTS.update(id),
        data
      );
      
      return response.endUser;
    } catch (error: any) {
      console.error(`Error updating end user ${id}:`, error);
      throw new Error(error.message || 'Failed to update end user');
    }
  }
  
  /**
   * Deactivate an end user (soft delete)
   */
  static async deactivateEndUser(id: string): Promise<EndUser> {
    try {
      return await this.updateEndUser(id, { isActive: false });
    } catch (error: any) {
      console.error(`Error deactivating end user ${id}:`, error);
      throw new Error(error.message || 'Failed to deactivate end user');
    }
  }
  
  /**
   * Activate an end user
   */
  static async activateEndUser(id: string): Promise<EndUser> {
    try {
      return await this.updateEndUser(id, { isActive: true });
    } catch (error: any) {
      console.error(`Error activating end user ${id}:`, error);
      throw new Error(error.message || 'Failed to activate end user');
    }
  }
  
  /**
   * Update end user permissions
   */
  static async updateEndUserPermissions(
    id: string, 
    permissions: EndUser['permissions']
  ): Promise<EndUser> {
    try {
      return await this.updateEndUser(id, { permissions });
    } catch (error: any) {
      console.error(`Error updating end user permissions ${id}:`, error);
      throw new Error(error.message || 'Failed to update end user permissions');
    }
  }
  
  /**
   * Bulk operations
   */
  static async bulkUpdateEndUsers(
    updates: Array<{ id: string; data: EndUserUpdateData }>
  ): Promise<EndUser[]> {
    try {
      const promises = updates.map(({ id, data }) => 
        this.updateEndUser(id, data)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successful: EndUser[] = [];
      const failed: string[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push(updates[index].id);
          console.error(`Failed to update end user ${updates[index].id}:`, result.reason);
        }
      });
      
      if (failed.length > 0) {
        console.warn(`Failed to update ${failed.length} end users:`, failed);
      }
      
      return successful;
    } catch (error: any) {
      console.error('Error in bulk update:', error);
      throw new Error('Failed to perform bulk update');
    }
  }
  
  /**
   * Search end users by query
   */
  static async searchEndUsers(query: string): Promise<EndUser[]> {
    try {
      const response = await this.getEndUsers();
      
      if (!query?.trim()) {
        return response.endUsers;
      }
      
      const searchTerm = query.toLowerCase().trim();
      
      return response.endUsers.filter(endUser => {
        return (
          endUser.displayName?.toLowerCase().includes(searchTerm) ||
          endUser.email?.toLowerCase().includes(searchTerm) ||
          endUser.firmName?.toLowerCase().includes(searchTerm) ||
          endUser.firstName?.toLowerCase().includes(searchTerm) ||
          endUser.lastName?.toLowerCase().includes(searchTerm)
        );
      });
    } catch (error: any) {
      console.error('Error searching end users:', error);
      throw new Error(error.message || 'Failed to search end users');
    }
  }
  
  /**
   * Get end users by access level
   */
  static async getEndUsersByAccessLevel(
    accessLevel: EndUser['accessLevel']
  ): Promise<EndUser[]> {
    try {
      const response = await this.getEndUsers();
      return response.endUsers.filter(endUser => 
        endUser.accessLevel === accessLevel && endUser.isActive
      );
    } catch (error: any) {
      console.error(`Error fetching end users with access level ${accessLevel}:`, error);
      throw new Error(error.message || 'Failed to fetch end users by access level');
    }
  }
  
  /**
   * Validate end user data before submission
   */
  static validateEndUserData(data: EndUserFormData): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    
    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    }
    
    if (!data.lastName?.trim()) {
      errors.push('Last name is required');  
    }
    
    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Valid email address is required');
      }
    }
    
    if (data.phone && data.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
      errors.push('Invalid phone number format');
    }
    
    if (!['read', 'write', 'admin'].includes(data.accessLevel)) {
      errors.push('Valid access level is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export default instance for convenience
export const endUserApi = EndUserApiClient;
