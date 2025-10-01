/**
 * Escalation API Service
 * Frontend service for escalation management
 */

import {
  Escalation,
  CreateEscalationRequest,
  UpdateEscalationRequest,
  EscalationComment,
  EscalationMetrics,
  EscalationStatistics,
} from '../lib/escalation/types';

// ==========================================
// TYPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface EscalationsResponse {
  escalations: Escalation[];
  statistics: EscalationMetrics;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface EscalationDetailsResponse {
  escalation: Escalation;
  comments: EscalationComment[];
  history: any[];
}

// ==========================================
// ESCALATION SERVICE
// ==========================================

class EscalationService {
  private baseUrl = '/api/escalations';

  // ==========================================
  // CREATE ESCALATION
  // ==========================================

  /**
   * Create new escalation
   */
  async createEscalation(
    request: CreateEscalationRequest,
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (options?.organizationId) params.append('organizationId', options.organizationId);
      if (options?.userId) params.append('userId', options.userId);
      if (options?.userName) params.append('userName', options.userName);

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create escalation',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result.escalation,
      };
    } catch (error: any) {
      console.error('Error creating escalation:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // GET ESCALATIONS
  // ==========================================

  /**
   * Get escalations with filters
   */
  async getEscalations(filters?: {
    status?: string;
    priority?: string;
    type?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }, options?: {
    tenantId?: string;
  }): Promise<ApiResponse<EscalationsResponse>> {
    try {
      const params = new URLSearchParams();
      
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch escalations',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error fetching escalations:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  /**
   * Get escalation by ID
   */
  async getEscalation(
    escalationId: string,
    options?: {
      tenantId?: string;
    }
  ): Promise<ApiResponse<EscalationDetailsResponse>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);

      const response = await fetch(`${this.baseUrl}/${escalationId}?${params.toString()}`);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch escalation',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error fetching escalation:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // UPDATE ESCALATION
  // ==========================================

  /**
   * Update escalation
   */
  async updateEscalation(
    escalationId: string,
    updates: UpdateEscalationRequest,
    options?: {
      tenantId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (options?.userId) params.append('userId', options.userId);
      if (options?.userName) params.append('userName', options.userName);

      const response = await fetch(`${this.baseUrl}/${escalationId}?${params.toString()}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to update escalation',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result.escalation,
      };
    } catch (error: any) {
      console.error('Error updating escalation:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // COMMENTS
  // ==========================================

  /**
   * Add comment to escalation
   */
  async addComment(
    escalationId: string,
    content: string,
    options?: {
      isInternal?: boolean;
      tenantId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<EscalationComment>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (options?.userId) params.append('userId', options.userId);
      if (options?.userName) params.append('userName', options.userName);

      const response = await fetch(`${this.baseUrl}/${escalationId}/comments?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          isInternal: options?.isInternal || false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to add comment',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result.comment,
      };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // QUICK ACTIONS
  // ==========================================

  /**
   * Acknowledge escalation
   */
  async acknowledgeEscalation(
    escalationId: string,
    options?: {
      tenantId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.updateEscalation(
      escalationId,
      { status: 'acknowledged' },
      options
    );
  }

  /**
   * Start working on escalation
   */
  async startEscalation(
    escalationId: string,
    options?: {
      tenantId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.updateEscalation(
      escalationId,
      { status: 'in_progress' },
      options
    );
  }

  /**
   * Resolve escalation
   */
  async resolveEscalation(
    escalationId: string,
    resolutionNotes: string,
    options?: {
      tenantId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.updateEscalation(
      escalationId,
      { 
        status: 'resolved',
        resolutionNotes,
      },
      options
    );
  }

  /**
   * Close escalation
   */
  async closeEscalation(
    escalationId: string,
    options?: {
      tenantId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.updateEscalation(
      escalationId,
      { status: 'closed' },
      options
    );
  }

  /**
   * Assign escalation
   */
  async assignEscalation(
    escalationId: string,
    assignedTo: string,
    options?: {
      tenantId?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.updateEscalation(
      escalationId,
      { assignedTo },
      options
    );
  }

  // ==========================================
  // STORAGE ESCALATIONS
  // ==========================================

  /**
   * Create storage overflow escalation
   */
  async createStorageOverflowEscalation(
    userId: string,
    userName: string,
    usedStorage: number,
    totalStorage: number,
    percentage: number,
    options?: {
      tenantId?: string;
      organizationId?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.createEscalation({
      type: 'storage_overflow',
      title: `Storage Quota Exceeded - ${userName}`,
      description: `User ${userName} has exceeded storage quota. Used: ${Math.round(percentage)}% of allocated storage.`,
      priority: percentage >= 95 ? 'critical' : 'high',
      category: 'technical',
      affectedUserId: userId,
      details: {
        usedStorage,
        totalStorage,
        percentage,
        threshold: 95,
      },
      tags: ['storage', 'quota', 'overflow'],
    }, options);
  }

  /**
   * Create storage warning escalation
   */
  async createStorageWarningEscalation(
    userId: string,
    userName: string,
    usedStorage: number,
    totalStorage: number,
    percentage: number,
    options?: {
      tenantId?: string;
      organizationId?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.createEscalation({
      type: 'storage_quota_warning',
      title: `Storage Warning - ${userName}`,
      description: `User ${userName} is approaching storage quota limit. Used: ${Math.round(percentage)}% of allocated storage.`,
      priority: 'medium',
      category: 'technical',
      affectedUserId: userId,
      details: {
        usedStorage,
        totalStorage,
        percentage,
        threshold: 80,
      },
      tags: ['storage', 'quota', 'warning'],
    }, options);
  }

  // ==========================================
  // DOCUMENT ESCALATIONS
  // ==========================================

  /**
   * Create document deadline missed escalation
   */
  async createDeadlineMissedEscalation(
    documentId: string,
    documentName: string,
    deadline: Date,
    assignedTo: string,
    options?: {
      tenantId?: string;
      organizationId?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.createEscalation({
      type: 'deadline_missed',
      title: `Deadline Missed - ${documentName}`,
      description: `Document "${documentName}" has passed its deadline of ${deadline.toLocaleString()}.`,
      priority: 'high',
      category: 'business',
      affectedDocumentId: documentId,
      details: {
        documentName,
        deadline: deadline.toISOString(),
        assignedTo,
        daysOverdue: Math.floor((Date.now() - deadline.getTime()) / (1000 * 60 * 60 * 24)),
      },
      tags: ['deadline', 'overdue', 'document'],
    }, options);
  }

  /**
   * Create document validation failed escalation
   */
  async createValidationFailedEscalation(
    documentId: string,
    documentName: string,
    errorMessage: string,
    validatorId: string,
    options?: {
      tenantId?: string;
      organizationId?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.createEscalation({
      type: 'document_validation_failed',
      title: `Validation Failed - ${documentName}`,
      description: `Document validation failed: ${errorMessage}`,
      priority: 'medium',
      category: 'business',
      affectedDocumentId: documentId,
      details: {
        documentName,
        errorMessage,
        validatorId,
      },
      tags: ['validation', 'failed', 'document'],
    }, options);
  }

  // ==========================================
  // SYSTEM ESCALATIONS
  // ==========================================

  /**
   * Create system error escalation
   */
  async createSystemErrorEscalation(
    errorMessage: string,
    errorCode?: string,
    errorStack?: string,
    options?: {
      tenantId?: string;
      organizationId?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.createEscalation({
      type: 'system_error',
      title: `System Error - ${errorCode || 'Unknown'}`,
      description: errorMessage,
      priority: 'critical',
      category: 'technical',
      details: {
        errorMessage,
        errorCode,
        errorStack,
        timestamp: new Date().toISOString(),
      },
      tags: ['system', 'error', 'critical'],
    }, options);
  }

  /**
   * Create SharePoint sync failed escalation
   */
  async createSharePointSyncFailedEscalation(
    documentId: string,
    documentName: string,
    errorMessage: string,
    options?: {
      tenantId?: string;
      organizationId?: string;
    }
  ): Promise<ApiResponse<Escalation>> {
    return this.createEscalation({
      type: 'sharepoint_sync_failed',
      title: `SharePoint Sync Failed - ${documentName}`,
      description: `Failed to sync document with SharePoint: ${errorMessage}`,
      priority: 'high',
      category: 'technical',
      affectedDocumentId: documentId,
      details: {
        documentName,
        errorMessage,
        syncType: 'bidirectional',
      },
      tags: ['sharepoint', 'sync', 'failed'],
    }, options);
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Get escalation statistics
   */
  async getStatistics(options?: {
    tenantId?: string;
  }): Promise<ApiResponse<EscalationMetrics>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);

      const response = await fetch(`${this.baseUrl}?${params.toString()}&stats=true`);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch statistics',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result.statistics,
      };
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  /**
   * Check if escalation exists
   */
  async escalationExists(escalationId: string): Promise<boolean> {
    const result = await this.getEscalation(escalationId);
    return result.success;
  }
}

// Export singleton instance
export const escalationService = new EscalationService();
