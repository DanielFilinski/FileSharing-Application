import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/api';

type EnhancedEmployee = {
  id: string;
  organizationId: string;
  azureAdUserId: string;
  officeId: string;
  departmentId: string;
  classification: 'Manager' | 'Senior' | 'Associate' | 'Junior';
  role: string;
  isActive: boolean;
  displayName?: string;
  email?: string;
  jobTitle?: string;
  officeLocation?: string;
  createdAt: string;
  updatedAt: string;
};

export const useEnhancedUsers = () => {
  const [employees, setEmployees] = useState<EnhancedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const employeesRes = await apiClient.get('/users/employees');
      setEmployees(employeesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncWithAzureAd = useCallback(async () => {
    try {
      await apiClient.post('/users/sync-azure-ad');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync with Azure AD');
    }
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { employees, loading, error, fetchAll, syncWithAzureAd };
};



