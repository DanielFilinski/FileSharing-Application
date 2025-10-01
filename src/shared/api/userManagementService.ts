/**
 * Enhanced User Management Service
 * Provides CRUD operations for Employees, Clients, and Departments
 */

import { apiClient } from './index';

// Types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classification: 'Manager' | 'Senior' | 'Associate' | 'Junior';
  office: string;
  role?: string;
  department?: string;
  departmentId?: string;
  managerId?: string;
  phone?: string;
  isActive: boolean;
  permissions: string[];
  skills: string[];
  certifications: string[];
  profilePicture?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  workSchedule?: {
    startTime: string;
    endTime: string;
    timezone: string;
    workDays: number[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastLoginAt?: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  firmName?: string;
  firmAddress?: string;
  businessType?: string;
  isActive: boolean;
  accessLevel: 'read' | 'write' | 'admin';
  assignedServiceProvider?: string;
  documentsAccess: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastActivityAt?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  managerName: string;
  officeId?: string;
  employees: string[];
  permissions: {
    canCreateUsers: boolean;
    canManageDocuments: boolean;
    canApproveDocuments: boolean;
    canManageWorkflows: boolean;
  };
  hierarchy: {
    parentDepartmentId?: string;
    level: number;
    children: string[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  classification: 'Manager' | 'Senior' | 'Associate' | 'Junior';
  office: string;
  role?: string;
  department?: string;
  departmentId?: string;
  managerId?: string;
  phone?: string;
  isActive?: boolean;
  permissions?: string[];
  skills?: string[];
  certifications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  workSchedule?: {
    startTime: string;
    endTime: string;
    timezone: string;
    workDays: number[];
  };
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  firmName?: string;
  firmAddress?: string;
  businessType?: string;
  isActive?: boolean;
  accessLevel?: 'read' | 'write' | 'admin';
  assignedServiceProvider?: string;
  documentsAccess?: string[];
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  managerId: string;
  managerName: string;
  officeId?: string;
  permissions?: {
    canCreateUsers: boolean;
    canManageDocuments: boolean;
    canApproveDocuments: boolean;
    canManageWorkflows: boolean;
  };
  hierarchy?: {
    parentDepartmentId?: string;
    level: number;
    children: string[];
  };
}

export interface BulkUpdateRequest {
  userIds: string[];
  updates: {
    isActive?: boolean;
    departmentId?: string;
    role?: string;
    permissions?: string[];
  };
}

export interface ExcelImportRequest {
  userType: 'employees' | 'clients';
  data: Record<string, any>[];
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateEmails?: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  skipped?: number;
  errors: string[];
  total: number;
}

// User Management Service Class
export class UserManagementService {
  // Employee Operations
  static async createEmployee(employeeData: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
    try {
      const response = await apiClient.post('/users/employees', employeeData);
      return {
        success: true,
        data: response.data.employee
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create employee'
      };
    }
  }

  static async updateEmployee(employeeId: string, updates: Partial<CreateEmployeeRequest>): Promise<ApiResponse<Employee>> {
    try {
      const response = await apiClient.put(`/users/employees/${employeeId}`, updates);
      return {
        success: true,
        data: response.data.employee
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update employee'
      };
    }
  }

  static async deleteEmployee(employeeId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/users/employees/${employeeId}`);
      return {
        success: true,
        message: response.data.message || 'Employee deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete employee'
      };
    }
  }

  static async getEmployee(employeeId: string): Promise<ApiResponse<Employee>> {
    try {
      const response = await apiClient.get(`/users/employees/${employeeId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get employee'
      };
    }
  }

  static async getEmployees(filters?: {
    department?: string;
    office?: string;
    isActive?: boolean;
    classification?: string;
  }): Promise<ApiResponse<Employee[]>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/users/employees?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get employees'
      };
    }
  }

  // Client Operations
  static async createClient(clientData: CreateClientRequest): Promise<ApiResponse<Client>> {
    try {
      const response = await apiClient.post('/users/clients', clientData);
      return {
        success: true,
        data: response.data.client
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create client'
      };
    }
  }

  static async updateClient(clientId: string, updates: Partial<CreateClientRequest>): Promise<ApiResponse<Client>> {
    try {
      const response = await apiClient.put(`/users/clients/${clientId}`, updates);
      return {
        success: true,
        data: response.data.client
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update client'
      };
    }
  }

  static async deleteClient(clientId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/users/clients/${clientId}`);
      return {
        success: true,
        message: response.data.message || 'Client deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete client'
      };
    }
  }

  static async getClient(clientId: string): Promise<ApiResponse<Client>> {
    try {
      const response = await apiClient.get(`/users/clients/${clientId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get client'
      };
    }
  }

  static async getClients(filters?: {
    isActive?: boolean;
    accessLevel?: string;
    assignedServiceProvider?: string;
  }): Promise<ApiResponse<Client[]>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/users/clients?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get clients'
      };
    }
  }

  // Department Operations
  static async createDepartment(departmentData: CreateDepartmentRequest): Promise<ApiResponse<Department>> {
    try {
      const response = await apiClient.post('/users/departments', departmentData);
      return {
        success: true,
        data: response.data.department
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create department'
      };
    }
  }

  static async updateDepartment(departmentId: string, updates: Partial<CreateDepartmentRequest>): Promise<ApiResponse<Department>> {
    try {
      const response = await apiClient.put(`/users/departments/${departmentId}`, updates);
      return {
        success: true,
        data: response.data.department
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update department'
      };
    }
  }

  static async deleteDepartment(departmentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/users/departments/${departmentId}`);
      return {
        success: true,
        message: response.data.message || 'Department deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete department'
      };
    }
  }

  static async getDepartment(departmentId: string): Promise<ApiResponse<Department>> {
    try {
      const response = await apiClient.get(`/users/departments/${departmentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get department'
      };
    }
  }

  static async getDepartments(filters?: {
    officeId?: string;
    managerId?: string;
  }): Promise<ApiResponse<Department[]>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/users/departments?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get departments'
      };
    }
  }

  // Bulk Operations
  static async bulkUpdateUsers(bulkUpdateData: BulkUpdateRequest): Promise<ApiResponse<BulkOperationResult>> {
    try {
      const response = await apiClient.post('/users/bulk-update', bulkUpdateData);
      return {
        success: true,
        data: response.data.results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to bulk update users'
      };
    }
  }

  // Excel Import/Export
  static async importUsersFromExcel(importData: ExcelImportRequest): Promise<ApiResponse<BulkOperationResult>> {
    try {
      const response = await apiClient.post('/users/import-excel', importData);
      return {
        success: true,
        data: response.data.results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to import users from Excel'
      };
    }
  }

  static async exportUsersToExcel(userType: 'employees' | 'clients' | 'all', filters?: any): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('userType', userType);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/users/export-excel?${params.toString()}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to export users to Excel');
    }
  }

  // Utility Methods
  static async searchUsers(query: string, userType?: 'employees' | 'clients'): Promise<ApiResponse<(Employee | Client)[]>> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (userType) {
        params.append('userType', userType);
      }
      
      const response = await apiClient.get(`/users/search?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to search users'
      };
    }
  }

  static async getUserActivity(userId: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/users/${userId}/activity?limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get user activity'
      };
    }
  }

  static async syncWithAzureAD(): Promise<ApiResponse<BulkOperationResult>> {
    try {
      const response = await apiClient.post('/users/sync-azure-ad');
      return {
        success: true,
        data: response.data.results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to sync with Azure AD'
      };
    }
  }
}

// Export default instance
export const userManagementService = UserManagementService;
export default UserManagementService;
