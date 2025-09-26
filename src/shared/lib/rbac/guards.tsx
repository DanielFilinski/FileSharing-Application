import React, { ReactNode } from 'react';
import { Permission, UserRole } from './types';
import { usePermissions } from './hooks';

/**
 * Компоненты-защитники для условного рендеринга на основе ролей и разрешений
 */

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Универсальный компонент для условного рендеринга на основе разрешений
 */
interface PermissionGateProps {
  children: ReactNode;
  permissions?: Permission[];
  roles?: UserRole[];
  fallback?: ReactNode;
  requireAll?: boolean; // true - требовать все разрешения, false - любое
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  roles = [],
  fallback = null,
  requireAll = false
}) => {
  const { 
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission 
  } = usePermissions();

  // Debug информация для отладки (можно убрать после тестирования)
  // React.useEffect(() => {
  //   if (permissions.length > 0) {
  //     console.log('🔐 PermissionGate check:', {
  //       permissions,
  //       hasRequiredPermissions: requireAll 
  //         ? hasAllPermissions(permissions)
  //         : hasAnyPermission(permissions)
  //     });
  //   }
  // }, [permissions, hasAllPermissions, hasAnyPermission, requireAll]);

  // Проверить роли
  if (roles.length > 0) {
    const hasRequiredRole = requireAll
      ? roles.every(role => hasAnyRole([role]))
      : hasAnyRole(roles);
    
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Проверить разрешения
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Защитник для админов
 */
interface AdminGuardProps extends GuardProps {}

export const AdminGuard: React.FC<AdminGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasAnyRole } = usePermissions();
  
  const isAdmin = hasAnyRole([
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.TECHNICAL_SUPPORT
  ]);

  return isAdmin ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для владельца организации
 */
interface OrgOwnerGuardProps extends GuardProps {}

export const OrgOwnerGuard: React.FC<OrgOwnerGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasRole } = usePermissions();
  
  const isOrgOwner = hasRole(UserRole.ORGANIZATION_OWNER);

  return isOrgOwner ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для системных администраторов
 */
interface SystemAdminGuardProps extends GuardProps {}

export const SystemAdminGuard: React.FC<SystemAdminGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasAnyRole } = usePermissions();
  
  const isSystemAdmin = hasAnyRole([
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.TECHNICAL_SUPPORT
  ]);

  return isSystemAdmin ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для менеджеров (руководители + админы)
 */
interface ManagerGuardProps extends GuardProps {}

export const ManagerGuard: React.FC<ManagerGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasAnyRole } = usePermissions();
  
  const isManager = hasAnyRole([
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.TECHNICAL_SUPPORT,
    UserRole.SERVICE_PROVIDER,
    UserRole.DEPARTMENT_TEAM_LEAD
  ]);

  return isManager ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для сотрудников (не клиентов)
 */
interface EmployeeGuardProps extends GuardProps {}

export const EmployeeGuard: React.FC<EmployeeGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasRole } = usePermissions();
  
  const isEmployee = !hasRole(UserRole.CLIENT_END_USER);

  return isEmployee ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для клиентов
 */
interface ClientGuardProps extends GuardProps {}

export const ClientGuard: React.FC<ClientGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasRole } = usePermissions();
  
  const isClient = hasRole(UserRole.CLIENT_END_USER);

  return isClient ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для валидаторов документов
 */
interface ValidatorGuardProps extends GuardProps {}

export const ValidatorGuard: React.FC<ValidatorGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = usePermissions();
  
  const canValidate = hasPermission(Permission.DOCS_VALIDATE);

  return canValidate ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для аппруверов документов
 */
interface ApproverGuardProps extends GuardProps {}

export const ApproverGuard: React.FC<ApproverGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = usePermissions();
  
  const canApprove = hasPermission(Permission.DOCS_APPROVE);

  return canApprove ? <>{children}</> : <>{fallback}</>;
};

/**
 * Комбинированный защитник для настроек
 */
interface SettingsGuardProps extends GuardProps {}

export const SettingsGuard: React.FC<SettingsGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasAnyPermission } = usePermissions();
  
  const canAccessSettings = hasAnyPermission([
    Permission.ORG_SETTINGS,
    Permission.STORAGE_CONFIG,
    Permission.USERS_VIEW,
    Permission.VALIDATION_CONFIG,
    Permission.APPROVAL_CONFIG
  ]);

  return canAccessSettings ? <>{children}</> : <>{fallback}</>;
};

/**
 * Защитник для управления пользователями
 */
interface UserManagementGuardProps extends GuardProps {}

export const UserManagementGuard: React.FC<UserManagementGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { hasAnyPermission } = usePermissions();
  
  const canManageUsers = hasAnyPermission([
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE
  ]);

  return canManageUsers ? <>{children}</> : <>{fallback}</>;
};
