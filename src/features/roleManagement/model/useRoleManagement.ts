import { useState, useCallback } from 'react';
import { UserRole } from '@/shared/lib/rbac';
import { usePermissions, useRBAC, getAssignableRoles } from '@/shared/lib/rbac';
import { notificationService } from '@/shared/lib/notifications';
import { RoleManagementState, RoleAssignmentData } from './types';

/**
 * Хук для управления ролями пользователей
 */
export const useRoleManagement = () => {
  const { userRoles } = usePermissions();
  const { user } = useRBAC();
  
  const [state, setState] = useState<RoleManagementState>({
    selectedRoles: [],
    availableRoles: [],
    isAssigning: false,
    error: null,
  });

  // Получить роли, которые текущий пользователь может назначить
  const getAvailableRoles = useCallback(() => {
    const assignableRoles = getAssignableRoles(user);
    setState(prev => ({ ...prev, availableRoles: assignableRoles }));
    return assignableRoles;
  }, [user]);

  // Назначить роли пользователю
  const assignRoles = useCallback(async (data: RoleAssignmentData) => {
    setState(prev => ({ ...prev, isAssigning: true, error: null }));
    
    try {
      // TODO: Реализовать API вызов для назначения ролей
      // await roleApi.assignRoles(data);
      
      // Временная заглушка
      console.log('Assigning roles:', data);
      
      // Симуляция асинхронного запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notificationService.success(
        'Роли назначены',
        `Роли успешно назначены пользователю`
      );
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      notificationService.error(
        'Ошибка назначения ролей',
        errorMessage
      );
      
      return false;
    } finally {
      setState(prev => ({ ...prev, isAssigning: false }));
    }
  }, []);

  // Удалить роли у пользователя
  const removeRoles = useCallback(async (userId: string, roles: UserRole[]) => {
    setState(prev => ({ ...prev, isAssigning: true, error: null }));
    
    try {
      // TODO: Реализовать API вызов для удаления ролей
      console.log('Removing roles:', { userId, roles });
      
      // Симуляция асинхронного запроса
      await new Promise(resolve => setTimeout(resolve, 500));
      
      notificationService.success(
        'Роли удалены',
        `Роли успешно удалены у пользователя`
      );
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      notificationService.error(
        'Ошибка удаления ролей',
        errorMessage
      );
      
      return false;
    } finally {
      setState(prev => ({ ...prev, isAssigning: false }));
    }
  }, []);

  // Обновить выбранные роли
  const updateSelectedRoles = useCallback((roles: UserRole[]) => {
    setState(prev => ({ ...prev, selectedRoles: roles }));
  }, []);

  // Сбросить состояние
  const reset = useCallback(() => {
    setState({
      selectedRoles: [],
      availableRoles: [],
      isAssigning: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getAvailableRoles,
    assignRoles,
    removeRoles,
    updateSelectedRoles,
    reset,
  };
};
