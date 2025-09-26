import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  RBACContextValue, 
  UserWithRoles, 
  Permission, 
  UserRole, 
  OrganizationRoleContext, 
  PermissionCheck 
} from './types';
import { 
  checkUserPermission 
} from './utils';
import {
  getPermissionsForRoles
} from './permissions';
import { AuthService } from '../auth';

/**
 * React контекст для управления ролями и разрешениями
 */

const RBACContext = createContext<RBACContextValue | null>(null);

interface RBACProviderProps {
  children: ReactNode;
  authService?: AuthService;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ 
  children, 
  authService 
}) => {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Получить разрешения пользователя (с учетом demo режима)
  const permissions: Permission[] = user?.roles 
    ? getPermissionsForRoles(user.roles) 
    : [];

  // Получить роли пользователя
  const roles: UserRole[] = user?.roles || [];

  // Проверить разрешение
  const checkPermission = (
    permission: Permission, 
    context?: OrganizationRoleContext
  ): PermissionCheck => {
    return checkUserPermission(user, permission, context);
  };

  // Обновить роли пользователя
  const refreshUserRoles = async (): Promise<void> => {
    if (!authService) {
      console.warn('AuthService не предоставлен в RBACProvider');
      return;
    }

    try {
      setIsLoading(true);
      
      // Получить информацию о пользователе из auth service
      const userInfo = await authService.getUserInfo();
      
      if (userInfo) {
        // TODO: Здесь нужно будет добавить запрос к API для получения ролей пользователя
        // Пока что используем заглушку
        const userWithRoles: UserWithRoles = {
          id: userInfo.id || '',
          email: userInfo.email || '',
          displayName: userInfo.displayName || '',
          roles: [UserRole.REGULAR_EMPLOYEE], // По умолчанию
          organizationId: userInfo.tenantId,
        };

        setUser(userWithRoles);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Ошибка при обновлении ролей пользователя:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Инициализация при монтировании
  useEffect(() => {
    refreshUserRoles();
  }, [authService]);

    // Слушать изменения аутентификации
    useEffect(() => {
      if (!authService) return;

      // TODO: Добавить подписку на изменения в AuthService если необходимо
      // const handleAuthChange = () => {
      //   refreshUserRoles();
      // };
      // authService.onAuthStateChanged(handleAuthChange);

      // return () => {
      //   authService.offAuthStateChanged(handleAuthChange);
      // };
    }, [authService]);

  const contextValue: RBACContextValue = {
    user,
    permissions,
    roles,
    isLoading,
    checkPermission,
    refreshUserRoles,
  };

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};

/**
 * Хук для использования RBAC контекста
 */
export const useRBAC = (): RBACContextValue => {
  const context = useContext(RBACContext);
  
  if (!context) {
    throw new Error('useRBAC должен использоваться внутри RBACProvider');
  }
  
  return context;
};

/**
 * HOC для компонентов, требующих определенных разрешений
 */
export const withPermissions = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions?: Permission[],
  requiredRoles?: UserRole[],
  fallback?: ReactNode
) => {
  return (props: any) => {
    const { user, checkPermission } = useRBAC();

    // Проверить роли
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user?.roles?.includes(role)
      );
      
      if (!hasRequiredRole) {
        return fallback || <div>У вас нет необходимых прав доступа</div>;
      }
    }

    // Проверить разрешения
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        checkPermission(permission).granted
      );
      
      if (!hasRequiredPermissions) {
        return fallback || <div>У вас нет необходимых разрешений</div>;
      }
    }

    return <WrappedComponent {...props} />;
  };
};

// PermissionGate перенесен в guards.tsx для избежания циркулярных зависимостей
