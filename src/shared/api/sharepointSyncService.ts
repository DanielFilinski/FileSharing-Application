/**
 * SharePoint Sync API Service
 * Frontend service for SharePoint synchronization management
 */

import {
  SyncItem,
  SyncOperation,
  SyncDirection,
  SyncPriority,
  SyncStatus,
  ConflictResolutionStrategy,
  SyncMetrics,
  SyncRequest,
  SyncResponse,
  BatchSyncRequest,
  BatchSyncResponse,
  ConflictResolutionRequest,
} from '../lib/sharepoint/types';

// ==========================================
// TYPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface SyncStatusResponse {
  syncItems: SyncItem[];
  statistics: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    conflict: number;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface SyncMetricsResponse {
  metrics: SyncMetrics;
  period: string;
}

// ==========================================
// SHAREPOINT SYNC SERVICE
// ==========================================

class SharePointSyncService {
  private baseUrl = '/api/sharepoint/sync';

  // ==========================================
  // SYNC CONTROL
  // ==========================================

  /**
   * Start sync process
   */
  async startSync(options?: {
    tenantId?: string;
    organizationId?: string;
    userId?: string;
  }): Promise<ApiResponse<{ message: string; syncItemCount: number; processingCount: number }>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (options?.organizationId) params.append('organizationId', options.organizationId);
      if (options?.userId) params.append('userId', options.userId);

      const response = await fetch(`${this.baseUrl}/start?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to start sync',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error starting sync:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  /**
   * Stop sync process
   */
  async stopSync(options?: {
    tenantId?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);

      const response = await fetch(`${this.baseUrl}/stop?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to stop sync',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error stopping sync:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // SYNC ITEMS
  // ==========================================

  /**
   * Add single sync item
   */
  async addSyncItem(
    request: SyncRequest,
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<{ syncItemId: string; status: SyncStatus; message: string }>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (options?.organizationId) params.append('organizationId', options.organizationId);
      if (options?.userId) params.append('userId', options.userId);

      const response = await fetch(`${this.baseUrl}/item?${params.toString()}`, {
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
          error: result.error || 'Failed to add sync item',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error adding sync item:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  /**
   * Add batch sync items
   */
  async addBatchSync(
    request: BatchSyncRequest,
    options?: {
      tenantId?: string;
      organizationId?: string;
    }
  ): Promise<ApiResponse<BatchSyncResponse>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (options?.organizationId) params.append('organizationId', options.organizationId);

      const response = await fetch(`${this.baseUrl}/batch?${params.toString()}`, {
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
          error: result.error || 'Failed to add batch sync',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error adding batch sync:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(
    filters?: {
      limit?: number;
      offset?: number;
    },
    options?: {
      tenantId?: string;
    }
  ): Promise<ApiResponse<SyncStatusResponse>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`${this.baseUrl}/status?${params.toString()}`);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch sync status',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error fetching sync status:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  /**
   * Get sync item by ID
   */
  async getSyncItem(
    syncItemId: string,
    options?: {
      tenantId?: string;
    }
  ): Promise<ApiResponse<{ syncItem: SyncItem }>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);

      const response = await fetch(`${this.baseUrl}/item/${syncItemId}?${params.toString()}`);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch sync item',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error fetching sync item:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // CONFLICT RESOLUTION
  // ==========================================

  /**
   * Resolve sync conflict
   */
  async resolveConflict(
    request: ConflictResolutionRequest,
    options?: {
      tenantId?: string;
    }
  ): Promise<ApiResponse<{ conflictId: string; resolution: ConflictResolutionStrategy; message: string }>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);

      const response = await fetch(`${this.baseUrl}/conflict/resolve?${params.toString()}`, {
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
          error: result.error || 'Failed to resolve conflict',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error resolving conflict:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // SYNC MANAGEMENT
  // ==========================================

  /**
   * Clear completed sync items
   */
  async clearCompletedSyncItems(
    options?: {
      tenantId?: string;
      olderThan?: string; // ISO date string
    }
  ): Promise<ApiResponse<{ deletedCount: number; message: string }>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      if (options?.olderThan) params.append('olderThan', options.olderThan);

      const response = await fetch(`${this.baseUrl}/clear-completed?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to clear completed sync items',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error clearing completed sync items:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  /**
   * Get sync metrics
   */
  async getSyncMetrics(
    period: 'day' | 'week' | 'month' = 'day',
    options?: {
      tenantId?: string;
    }
  ): Promise<ApiResponse<SyncMetricsResponse>> {
    try {
      const params = new URLSearchParams();
      if (options?.tenantId) params.append('tenantId', options.tenantId);
      params.append('period', period);

      const response = await fetch(`${this.baseUrl}/metrics?${params.toString()}`);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch sync metrics',
          details: result.details,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error fetching sync metrics:', error);
      return {
        success: false,
        error: 'Network error',
        details: error.message,
      };
    }
  }

  // ==========================================
  // CONVENIENCE METHODS
  // ==========================================

  /**
   * Upload file to SharePoint
   */
  async uploadFile(
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<{ syncItemId: string; status: SyncStatus }>> {
    return this.addSyncItem({
      localPath,
      sharePointPath,
      operation: 'upload',
      direction: 'local_to_sharepoint',
      priority,
    }, options);
  }

  /**
   * Download file from SharePoint
   */
  async downloadFile(
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<{ syncItemId: string; status: SyncStatus }>> {
    return this.addSyncItem({
      localPath,
      sharePointPath,
      operation: 'download',
      direction: 'sharepoint_to_local',
      priority,
    }, options);
  }

  /**
   * Update file in SharePoint
   */
  async updateFile(
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    conflictResolution?: ConflictResolutionStrategy,
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<{ syncItemId: string; status: SyncStatus }>> {
    return this.addSyncItem({
      localPath,
      sharePointPath,
      operation: 'update',
      direction: 'bidirectional',
      priority,
      conflictResolution,
    }, options);
  }

  /**
   * Delete file from SharePoint
   */
  async deleteFile(
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<{ syncItemId: string; status: SyncStatus }>> {
    return this.addSyncItem({
      localPath,
      sharePointPath,
      operation: 'delete',
      direction: 'bidirectional',
      priority,
    }, options);
  }

  /**
   * Sync entire folder
   */
  async syncFolder(
    localPath: string,
    sharePointPath: string,
    direction: SyncDirection = 'bidirectional',
    priority: SyncPriority = 'normal',
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<BatchSyncResponse>> {
    // In production, this would scan the folder and create individual sync items
    const batchId = `FOLDER-SYNC-${Date.now()}`;
    
    return this.addBatchSync({
      batchId,
      items: [
        {
          localPath: `${localPath}/`,
          sharePointPath: `${sharePointPath}/`,
          operation: 'upload',
          direction,
          priority,
        }
      ],
      priority,
    }, options);
  }

  /**
   * Force sync (ignore conflicts)
   */
  async forceSync(
    localPath: string,
    sharePointPath: string,
    operation: SyncOperation,
    direction: SyncDirection,
    options?: {
      tenantId?: string;
      organizationId?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<{ syncItemId: string; status: SyncStatus }>> {
    return this.addSyncItem({
      localPath,
      sharePointPath,
      operation,
      direction,
      force: true,
      conflictResolution: 'local_wins', // Force local version
    }, options);
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Check if sync item exists
   */
  async syncItemExists(syncItemId: string): Promise<boolean> {
    const result = await this.getSyncItem(syncItemId);
    return result.success;
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(options?: { tenantId?: string }): Promise<number> {
    const result = await this.getSyncStatus({ limit: 1 }, options);
    if (result.success && result.data) {
      return result.data.statistics.pending;
    }
    return 0;
  }

  /**
   * Get failed sync count
   */
  async getFailedSyncCount(options?: { tenantId?: string }): Promise<number> {
    const result = await this.getSyncStatus({ limit: 1 }, options);
    if (result.success && result.data) {
      return result.data.statistics.failed;
    }
    return 0;
  }

  /**
   * Get conflict count
   */
  async getConflictCount(options?: { tenantId?: string }): Promise<number> {
    const result = await this.getSyncStatus({ limit: 1 }, options);
    if (result.success && result.data) {
      return result.data.statistics.conflict;
    }
    return 0;
  }

  /**
   * Check sync health
   */
  async checkSyncHealth(options?: { tenantId?: string }): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: SyncMetrics | null;
  }> {
    try {
      const [statusResult, metricsResult] = await Promise.all([
        this.getSyncStatus({ limit: 1 }, options),
        this.getSyncMetrics('day', options),
      ]);

      const issues: string[] = [];
      let healthy = true;

      if (statusResult.success && statusResult.data) {
        const stats = statusResult.data.statistics;
        
        if (stats.failed > 0) {
          issues.push(`${stats.failed} failed sync items`);
          healthy = false;
        }
        
        if (stats.conflict > 0) {
          issues.push(`${stats.conflict} unresolved conflicts`);
          healthy = false;
        }
      } else {
        issues.push('Unable to fetch sync status');
        healthy = false;
      }

      return {
        healthy,
        issues,
        metrics: metricsResult.success ? metricsResult.data?.metrics || null : null,
      };
    } catch (error) {
      return {
        healthy: false,
        issues: ['Sync health check failed'],
        metrics: null,
      };
    }
  }
}

// Export singleton instance
export const sharePointSyncService = new SharePointSyncService();
