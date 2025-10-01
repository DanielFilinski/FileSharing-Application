/**
 * useSharePointSync Hook
 * React hook for SharePoint synchronization management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  sharePointSyncService,
  type ApiResponse,
  type SyncStatusResponse,
  type SyncMetricsResponse,
} from '../api/sharepointSyncService';
import {
  SyncItem,
  SyncOperation,
  SyncDirection,
  SyncPriority,
  SyncStatus,
  ConflictResolutionStrategy,
  SyncRequest,
  BatchSyncRequest,
  ConflictResolutionRequest,
  SyncMetrics,
} from '../lib/sharepoint/types';

// ==========================================
// HOOK STATE INTERFACES
// ==========================================

interface UseSyncStatusState {
  syncItems: SyncItem[];
  statistics: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    conflict: number;
  };
  loading: boolean;
  error: string | null;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  } | null;
}

interface UseSyncMetricsState {
  metrics: SyncMetrics | null;
  loading: boolean;
  error: string | null;
}

interface UseSyncHealthState {
  healthy: boolean;
  issues: string[];
  loading: boolean;
  error: string | null;
}

// ==========================================
// MAIN SYNC STATUS HOOK
// ==========================================

export const useSyncStatus = (
  filters?: {
    limit?: number;
    offset?: number;
  },
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    tenantId?: string;
  }
) => {
  const [state, setState] = useState<UseSyncStatusState>({
    syncItems: [],
    statistics: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      conflict: 0,
    },
    loading: true,
    error: null,
    pagination: null,
  });

  const fetchSyncStatus = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await sharePointSyncService.getSyncStatus(filters, {
        tenantId: options?.tenantId,
      });

      if (result.success && result.data) {
        setState({
          syncItems: result.data.syncItems,
          statistics: result.data.statistics,
          loading: false,
          error: null,
          pagination: result.data.pagination,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch sync status',
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Network error',
      }));
    }
  }, [filters, options?.tenantId]);

  // Auto-refresh
  useEffect(() => {
    fetchSyncStatus();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(fetchSyncStatus, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSyncStatus, options?.autoRefresh, options?.refreshInterval]);

  const addSyncItem = useCallback(async (
    request: SyncRequest,
    userId?: string
  ): Promise<ApiResponse<{ syncItemId: string; status: SyncStatus }>> => {
    const result = await sharePointSyncService.addSyncItem(request, {
      tenantId: options?.tenantId,
      userId,
    });

    if (result.success) {
      // Refresh sync status after adding new item
      fetchSyncStatus();
    }

    return result;
  }, [fetchSyncStatus, options?.tenantId]);

  const addBatchSync = useCallback(async (
    request: BatchSyncRequest
  ): Promise<ApiResponse<any>> => {
    const result = await sharePointSyncService.addBatchSync(request, {
      tenantId: options?.tenantId,
    });

    if (result.success) {
      // Refresh sync status after adding batch
      fetchSyncStatus();
    }

    return result;
  }, [fetchSyncStatus, options?.tenantId]);

  const clearCompleted = useCallback(async (olderThan?: string) => {
    const result = await sharePointSyncService.clearCompletedSyncItems({
      tenantId: options?.tenantId,
      olderThan,
    });

    if (result.success) {
      // Refresh sync status after clearing
      fetchSyncStatus();
    }

    return result;
  }, [fetchSyncStatus, options?.tenantId]);

  return {
    ...state,
    fetchSyncStatus,
    addSyncItem,
    addBatchSync,
    clearCompleted,
  };
};

// ==========================================
// SYNC METRICS HOOK
// ==========================================

export const useSyncMetrics = (
  period: 'day' | 'week' | 'month' = 'day',
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    tenantId?: string;
  }
) => {
  const [state, setState] = useState<UseSyncMetricsState>({
    metrics: null,
    loading: true,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await sharePointSyncService.getSyncMetrics(period, {
        tenantId: options?.tenantId,
      });

      if (result.success && result.data) {
        setState({
          metrics: result.data.metrics,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch sync metrics',
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Network error',
      }));
    }
  }, [period, options?.tenantId]);

  // Auto-refresh
  useEffect(() => {
    fetchMetrics();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(fetchMetrics, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, options?.autoRefresh, options?.refreshInterval]);

  return {
    ...state,
    fetchMetrics,
  };
};

// ==========================================
// SYNC HEALTH HOOK
// ==========================================

export const useSyncHealth = (
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    tenantId?: string;
  }
) => {
  const [state, setState] = useState<UseSyncHealthState>({
    healthy: true,
    issues: [],
    loading: true,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const health = await sharePointSyncService.checkSyncHealth({
        tenantId: options?.tenantId,
      });

      setState({
        healthy: health.healthy,
        issues: health.issues,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Health check failed',
      }));
    }
  }, [options?.tenantId]);

  // Auto-refresh
  useEffect(() => {
    checkHealth();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(checkHealth, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [checkHealth, options?.autoRefresh, options?.refreshInterval]);

  return {
    ...state,
    checkHealth,
  };
};

// ==========================================
// SYNC ACTIONS HOOK
// ==========================================

export const useSyncActions = (options?: {
  tenantId?: string;
  organizationId?: string;
}) => {
  const uploadFile = useCallback(async (
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    userId?: string
  ) => {
    return sharePointSyncService.uploadFile(
      localPath,
      sharePointPath,
      priority,
      {
        tenantId: options?.tenantId,
        organizationId: options?.organizationId,
        userId,
      }
    );
  }, [options?.tenantId, options?.organizationId]);

  const downloadFile = useCallback(async (
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    userId?: string
  ) => {
    return sharePointSyncService.downloadFile(
      localPath,
      sharePointPath,
      priority,
      {
        tenantId: options?.tenantId,
        organizationId: options?.organizationId,
        userId,
      }
    );
  }, [options?.tenantId, options?.organizationId]);

  const updateFile = useCallback(async (
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    conflictResolution?: ConflictResolutionStrategy,
    userId?: string
  ) => {
    return sharePointSyncService.updateFile(
      localPath,
      sharePointPath,
      priority,
      conflictResolution,
      {
        tenantId: options?.tenantId,
        organizationId: options?.organizationId,
        userId,
      }
    );
  }, [options?.tenantId, options?.organizationId]);

  const deleteFile = useCallback(async (
    localPath: string,
    sharePointPath: string,
    priority: SyncPriority = 'normal',
    userId?: string
  ) => {
    return sharePointSyncService.deleteFile(
      localPath,
      sharePointPath,
      priority,
      {
        tenantId: options?.tenantId,
        organizationId: options?.organizationId,
        userId,
      }
    );
  }, [options?.tenantId, options?.organizationId]);

  const syncFolder = useCallback(async (
    localPath: string,
    sharePointPath: string,
    direction: SyncDirection = 'bidirectional',
    priority: SyncPriority = 'normal',
    userId?: string
  ) => {
    return sharePointSyncService.syncFolder(
      localPath,
      sharePointPath,
      direction,
      priority,
      {
        tenantId: options?.tenantId,
        organizationId: options?.organizationId,
        userId,
      }
    );
  }, [options?.tenantId, options?.organizationId]);

  const forceSync = useCallback(async (
    localPath: string,
    sharePointPath: string,
    operation: SyncOperation,
    direction: SyncDirection,
    userId?: string
  ) => {
    return sharePointSyncService.forceSync(
      localPath,
      sharePointPath,
      operation,
      direction,
      {
        tenantId: options?.tenantId,
        organizationId: options?.organizationId,
        userId,
      }
    );
  }, [options?.tenantId, options?.organizationId]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: ConflictResolutionStrategy,
    resolvedBy: string,
    notes?: string
  ) => {
    return sharePointSyncService.resolveConflict(
      {
        conflictId,
        resolution,
        resolvedBy,
        notes,
      },
      {
        tenantId: options?.tenantId,
      }
    );
  }, [options?.tenantId]);

  const startSync = useCallback(async (userId?: string) => {
    return sharePointSyncService.startSync({
      tenantId: options?.tenantId,
      organizationId: options?.organizationId,
      userId,
    });
  }, [options?.tenantId, options?.organizationId]);

  const stopSync = useCallback(async () => {
    return sharePointSyncService.stopSync({
      tenantId: options?.tenantId,
    });
  }, [options?.tenantId]);

  return {
    uploadFile,
    downloadFile,
    updateFile,
    deleteFile,
    syncFolder,
    forceSync,
    resolveConflict,
    startSync,
    stopSync,
  };
};

// ==========================================
// SYNC ITEM HOOK
// ==========================================

export const useSyncItem = (
  syncItemId: string | null,
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    tenantId?: string;
  }
) => {
  const [syncItem, setSyncItem] = useState<SyncItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncItem = useCallback(async () => {
    if (!syncItemId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sharePointSyncService.getSyncItem(syncItemId, {
        tenantId: options?.tenantId,
      });

      if (result.success && result.data) {
        setSyncItem(result.data.syncItem);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch sync item');
      }
    } catch (error: any) {
      setError(error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [syncItemId, options?.tenantId]);

  useEffect(() => {
    fetchSyncItem();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(fetchSyncItem, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSyncItem, options?.autoRefresh, options?.refreshInterval]);

  return {
    syncItem,
    loading,
    error,
    fetchSyncItem,
  };
};

// ==========================================
// SYNC COUNTERS HOOK
// ==========================================

export const useSyncCounters = (options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  tenantId?: string;
}) => {
  const [counters, setCounters] = useState({
    pending: 0,
    failed: 0,
    conflict: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pendingResult, failedResult, conflictResult, statusResult] = await Promise.all([
        sharePointSyncService.getPendingSyncCount({ tenantId: options?.tenantId }),
        sharePointSyncService.getFailedSyncCount({ tenantId: options?.tenantId }),
        sharePointSyncService.getConflictCount({ tenantId: options?.tenantId }),
        sharePointSyncService.getSyncStatus({ limit: 1 }, { tenantId: options?.tenantId }),
      ]);

      setCounters({
        pending: pendingResult,
        failed: failedResult,
        conflict: conflictResult,
        total: statusResult.success && statusResult.data ? statusResult.data.statistics.total : 0,
      });
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch counters');
    } finally {
      setLoading(false);
    }
  }, [options?.tenantId]);

  useEffect(() => {
    fetchCounters();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(fetchCounters, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCounters, options?.autoRefresh, options?.refreshInterval]);

  return {
    ...counters,
    loading,
    error,
    fetchCounters,
  };
};
