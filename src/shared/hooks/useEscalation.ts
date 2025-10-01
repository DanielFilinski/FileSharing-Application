/**
 * useEscalation Hook
 * React hook for escalation management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  escalationService,
  type ApiResponse,
  type EscalationsResponse,
  type EscalationDetailsResponse,
} from '../api/escalationService';
import {
  Escalation,
  CreateEscalationRequest,
  UpdateEscalationRequest,
  EscalationComment,
  EscalationMetrics,
} from '../lib/escalation/types';

// ==========================================
// HOOK STATE INTERFACES
// ==========================================

interface UseEscalationsState {
  escalations: Escalation[];
  statistics: EscalationMetrics | null;
  loading: boolean;
  error: string | null;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  } | null;
}

interface UseEscalationState {
  escalation: Escalation | null;
  comments: EscalationComment[];
  history: any[];
  loading: boolean;
  error: string | null;
}

// ==========================================
// MAIN ESCALATIONS HOOK
// ==========================================

export const useEscalations = (
  filters?: {
    status?: string;
    priority?: string;
    type?: string;
    assignedTo?: string;
  },
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    tenantId?: string;
  }
) => {
  const [state, setState] = useState<UseEscalationsState>({
    escalations: [],
    statistics: null,
    loading: true,
    error: null,
    pagination: null,
  });

  const fetchEscalations = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await escalationService.getEscalations(filters, {
        tenantId: options?.tenantId,
      });

      if (result.success && result.data) {
        setState({
          escalations: result.data.escalations,
          statistics: result.data.statistics,
          loading: false,
          error: null,
          pagination: result.data.pagination,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch escalations',
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
    fetchEscalations();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(fetchEscalations, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEscalations, options?.autoRefresh, options?.refreshInterval]);

  const createEscalation = useCallback(async (
    request: CreateEscalationRequest,
    userId?: string,
    userName?: string
  ): Promise<ApiResponse<Escalation>> => {
    const result = await escalationService.createEscalation(request, {
      tenantId: options?.tenantId,
      userId,
      userName,
    });

    if (result.success) {
      // Refresh escalations after creating new one
      fetchEscalations();
    }

    return result;
  }, [fetchEscalations, options?.tenantId]);

  return {
    ...state,
    fetchEscalations,
    createEscalation,
  };
};

// ==========================================
// SINGLE ESCALATION HOOK
// ==========================================

export const useEscalation = (
  escalationId: string | null,
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    tenantId?: string;
  }
) => {
  const [state, setState] = useState<UseEscalationState>({
    escalation: null,
    comments: [],
    history: [],
    loading: true,
    error: null,
  });

  const fetchEscalation = useCallback(async () => {
    if (!escalationId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await escalationService.getEscalation(escalationId, {
        tenantId: options?.tenantId,
      });

      if (result.success && result.data) {
        setState({
          escalation: result.data.escalation,
          comments: result.data.comments,
          history: result.data.history,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch escalation',
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Network error',
      }));
    }
  }, [escalationId, options?.tenantId]);

  useEffect(() => {
    fetchEscalation();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(fetchEscalation, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEscalation, options?.autoRefresh, options?.refreshInterval]);

  const updateEscalation = useCallback(async (
    updates: UpdateEscalationRequest,
    userId?: string,
    userName?: string
  ): Promise<ApiResponse<Escalation>> => {
    if (!escalationId) {
      return {
        success: false,
        error: 'No escalation ID provided',
      };
    }

    const result = await escalationService.updateEscalation(escalationId, updates, {
      tenantId: options?.tenantId,
      userId,
      userName,
    });

    if (result.success) {
      // Refresh escalation after update
      fetchEscalation();
    }

    return result;
  }, [escalationId, fetchEscalation, options?.tenantId]);

  const addComment = useCallback(async (
    content: string,
    isInternal: boolean = false,
    userId?: string,
    userName?: string
  ): Promise<ApiResponse<EscalationComment>> => {
    if (!escalationId) {
      return {
        success: false,
        error: 'No escalation ID provided',
      };
    }

    const result = await escalationService.addComment(escalationId, content, {
      isInternal,
      tenantId: options?.tenantId,
      userId,
      userName,
    });

    if (result.success) {
      // Refresh escalation after adding comment
      fetchEscalation();
    }

    return result;
  }, [escalationId, fetchEscalation, options?.tenantId]);

  // Quick actions
  const acknowledge = useCallback(async (userId?: string, userName?: string) => {
    return updateEscalation({ status: 'acknowledged' }, userId, userName);
  }, [updateEscalation]);

  const start = useCallback(async (userId?: string, userName?: string) => {
    return updateEscalation({ status: 'in_progress' }, userId, userName);
  }, [updateEscalation]);

  const resolve = useCallback(async (resolutionNotes: string, userId?: string, userName?: string) => {
    return updateEscalation({ 
      status: 'resolved',
      resolutionNotes,
    }, userId, userName);
  }, [updateEscalation]);

  const close = useCallback(async (userId?: string, userName?: string) => {
    return updateEscalation({ status: 'closed' }, userId, userName);
  }, [updateEscalation]);

  const assign = useCallback(async (assignedTo: string, userId?: string, userName?: string) => {
    return updateEscalation({ assignedTo }, userId, userName);
  }, [updateEscalation]);

  return {
    ...state,
    fetchEscalation,
    updateEscalation,
    addComment,
    acknowledge,
    start,
    resolve,
    close,
    assign,
  };
};

// ==========================================
// ESCALATION ACTIONS HOOK
// ==========================================

export const useEscalationActions = (options?: {
  tenantId?: string;
}) => {
  const createStorageOverflow = useCallback(async (
    userId: string,
    userName: string,
    usedStorage: number,
    totalStorage: number,
    percentage: number
  ) => {
    return escalationService.createStorageOverflowEscalation(
      userId,
      userName,
      usedStorage,
      totalStorage,
      percentage,
      {
        tenantId: options?.tenantId,
      }
    );
  }, [options?.tenantId]);

  const createStorageWarning = useCallback(async (
    userId: string,
    userName: string,
    usedStorage: number,
    totalStorage: number,
    percentage: number
  ) => {
    return escalationService.createStorageWarningEscalation(
      userId,
      userName,
      usedStorage,
      totalStorage,
      percentage,
      {
        tenantId: options?.tenantId,
      }
    );
  }, [options?.tenantId]);

  const createDeadlineMissed = useCallback(async (
    documentId: string,
    documentName: string,
    deadline: Date,
    assignedTo: string
  ) => {
    return escalationService.createDeadlineMissedEscalation(
      documentId,
      documentName,
      deadline,
      assignedTo,
      {
        tenantId: options?.tenantId,
      }
    );
  }, [options?.tenantId]);

  const createValidationFailed = useCallback(async (
    documentId: string,
    documentName: string,
    errorMessage: string,
    validatorId: string
  ) => {
    return escalationService.createValidationFailedEscalation(
      documentId,
      documentName,
      errorMessage,
      validatorId,
      {
        tenantId: options?.tenantId,
      }
    );
  }, [options?.tenantId]);

  const createSystemError = useCallback(async (
    errorMessage: string,
    errorCode?: string,
    errorStack?: string
  ) => {
    return escalationService.createSystemErrorEscalation(
      errorMessage,
      errorCode,
      errorStack,
      {
        tenantId: options?.tenantId,
      }
    );
  }, [options?.tenantId]);

  const createSharePointSyncFailed = useCallback(async (
    documentId: string,
    documentName: string,
    errorMessage: string
  ) => {
    return escalationService.createSharePointSyncFailedEscalation(
      documentId,
      documentName,
      errorMessage,
      {
        tenantId: options?.tenantId,
      }
    );
  }, [options?.tenantId]);

  return {
    createStorageOverflow,
    createStorageWarning,
    createDeadlineMissed,
    createValidationFailed,
    createSystemError,
    createSharePointSyncFailed,
  };
};

// ==========================================
// STATISTICS HOOK
// ==========================================

export const useEscalationStatistics = (options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  tenantId?: string;
}) => {
  const [statistics, setStatistics] = useState<EscalationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await escalationService.getStatistics({
        tenantId: options?.tenantId,
      });

      if (result.success && result.data) {
        setStatistics(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch statistics');
      }
    } catch (error: any) {
      setError(error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [options?.tenantId]);

  useEffect(() => {
    fetchStatistics();

    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(fetchStatistics, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatistics, options?.autoRefresh, options?.refreshInterval]);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
};
