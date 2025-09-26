import { useCallback } from 'react';
import { 
  Permission, 
  UserRole, 
  OrganizationRoleContext, 
  UsePermissionsResult,
  PermissionCheck 
} from './types';
import { useRBAC } from './context';
import { 
  checkUserHasAnyPermission, 
  checkUserHasAllPermissions,
  checkUserHasRole,
  checkUserHasAnyRole 
} from './utils';
import { useDemoMode } from '../demo';

/**
 * Хуки для работы с системой разрешений и ролей
 */

/**
 * Основной хук для работы с разрешениями
 */
export const usePermissions = (): UsePermissionsResult => {
  const { user, isLoading, checkPermission } = useRBAC();
  const { isDemoMode, hasFullAccess } = useDemoMode();

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      // В demo режиме разрешаем все
      if (isDemoMode && hasFullAccess) {
        return true;
      }
      return checkPermission(permission).granted;
    },
    [checkPermission, isDemoMode, hasFullAccess]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      // В demo режиме разрешаем все
      if (isDemoMode && hasFullAccess) {
        return true;
      }
      return checkUserHasAnyPermission(user, permissions).granted;
    },
    [user, isDemoMode, hasFullAccess]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      // В demo режиме разрешаем все
      if (isDemoMode && hasFullAccess) {
        return true;
      }
      return checkUserHasAllPermissions(user, permissions).granted;
    },
    [user, isDemoMode, hasFullAccess]
  );

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      // В demo режиме считаем, что у пользователя есть все роли высокого уровня
      if (isDemoMode && hasFullAccess) {
        return [
          UserRole.ORGANIZATION_OWNER,
          UserRole.ADMINISTRATOR,
          UserRole.TECHNICAL_SUPPORT
        ].includes(role);
      }
      return checkUserHasRole(user, role);
    },
    [user, isDemoMode, hasFullAccess]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      // В demo режиме разрешаем любую административную роль
      if (isDemoMode && hasFullAccess) {
        const adminRoles = [
          UserRole.ORGANIZATION_OWNER,
          UserRole.ADMINISTRATOR,
          UserRole.TECHNICAL_SUPPORT
        ];
        return roles.some(role => adminRoles.includes(role));
      }
      return checkUserHasAnyRole(user, roles);
    },
    [user, isDemoMode, hasFullAccess]
  );

  const checkPermissionWithContext = useCallback(
    (permission: Permission, context?: OrganizationRoleContext): PermissionCheck => {
      // В demo режиме все разрешения предоставляются
      if (isDemoMode && hasFullAccess) {
        return {
          granted: true,
          reason: 'Demo mode - all permissions granted for demonstration purposes'
        };
      }
      return checkPermission(permission, context);
    },
    [checkPermission, isDemoMode, hasFullAccess]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    checkPermission: checkPermissionWithContext,
    userRoles: user?.roles || [],
    isLoading,
  };
};

/**
 * Хук для проверки административных прав
 */
export const useAdminPermissions = () => {
  const { hasAnyRole } = usePermissions();

  const isAdmin = hasAnyRole([
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.TECHNICAL_SUPPORT
  ]);

  const isOrgOwner = hasAnyRole([UserRole.ORGANIZATION_OWNER]);

  const canManageUsers = hasAnyRole([
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.TECHNICAL_SUPPORT,
    UserRole.SERVICE_PROVIDER
  ]);

  const canManageOrg = hasAnyRole([
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.SERVICE_PROVIDER
  ]);

  const canConfigureSystem = hasAnyRole([
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.TECHNICAL_SUPPORT
  ]);

  return {
    isAdmin,
    isOrgOwner,
    canManageUsers,
    canManageOrg,
    canConfigureSystem,
  };
};

/**
 * Хук для проверки прав на документы
 */
export const useDocumentPermissions = () => {
  const { hasPermission, hasAnyRole } = usePermissions();

  const canViewAllDocuments = hasPermission(Permission.DOCS_VIEW_ALL);
  const canCreateDocuments = hasPermission(Permission.DOCS_CREATE);
  const canEditDocuments = hasPermission(Permission.DOCS_EDIT);
  const canDeleteDocuments = hasPermission(Permission.DOCS_DELETE);
  const canUploadDocuments = hasPermission(Permission.DOCS_UPLOAD);
  const canDownloadDocuments = hasPermission(Permission.DOCS_DOWNLOAD);
  const canShareDocuments = hasPermission(Permission.DOCS_SHARE);

  const canValidateDocuments = hasPermission(Permission.DOCS_VALIDATE);
  const canApproveDocuments = hasPermission(Permission.DOCS_APPROVE);
  const canSignDocuments = hasPermission(Permission.DOCS_SIGN);

  const canConfigureValidation = hasPermission(Permission.DOCS_VALIDATE_SETTINGS);
  const canConfigureApproval = hasPermission(Permission.DOCS_APPROVE_SETTINGS);

  const isValidator = hasAnyRole([UserRole.DOCUMENT_VALIDATOR]);
  const isApprover = hasAnyRole([UserRole.DOCUMENT_APPROVER]);

  return {
    canViewAllDocuments,
    canCreateDocuments,
    canEditDocuments,
    canDeleteDocuments,
    canUploadDocuments,
    canDownloadDocuments,
    canShareDocuments,
    canValidateDocuments,
    canApproveDocuments,
    canSignDocuments,
    canConfigureValidation,
    canConfigureApproval,
    isValidator,
    isApprover,
  };
};

/**
 * Хук для проверки прав на настройки
 */
export const useSettingsPermissions = () => {
  const { hasPermission } = usePermissions();

  const canConfigureStorage = hasPermission(Permission.STORAGE_CONFIG);
  const canConfigureOrg = hasPermission(Permission.ORG_SETTINGS);
  const canConfigureValidation = hasPermission(Permission.VALIDATION_CONFIG);
  const canConfigureApproval = hasPermission(Permission.APPROVAL_CONFIG);
  const canManageDepartments = hasPermission(Permission.DEPT_MANAGE);
  const canManageOffices = hasPermission(Permission.OFFICE_MANAGE);

  return {
    canConfigureStorage,
    canConfigureOrg,
    canConfigureValidation,
    canConfigureApproval,
    canManageDepartments,
    canManageOffices,
  };
};

/**
 * Хук для проверки прав на рабочие процессы
 */
export const useWorkflowPermissions = () => {
  const { hasPermission } = usePermissions();

  const canViewWorkflows = hasPermission(Permission.WORKFLOW_VIEW);
  const canCreateWorkflows = hasPermission(Permission.WORKFLOW_CREATE);
  const canManageWorkflows = hasPermission(Permission.WORKFLOW_MANAGE);

  return {
    canViewWorkflows,
    canCreateWorkflows,
    canManageWorkflows,
  };
};

/**
 * Хук для проверки, является ли пользователь клиентом
 */
export const useClientPermissions = () => {
  const { hasRole } = usePermissions();

  const isClient = hasRole(UserRole.CLIENT_END_USER);

  return {
    isClient,
  };
};

/**
 * Хук для получения доступных действий пользователя
 */
export const useAvailableActions = () => {
  const documentPerms = useDocumentPermissions();
  const adminPerms = useAdminPermissions();
  const settingsPerms = useSettingsPermissions();
  const workflowPerms = useWorkflowPermissions();
  const clientPerms = useClientPermissions();

  const availableActions = {
    // Документы
    documents: {
      view: documentPerms.canViewAllDocuments,
      create: documentPerms.canCreateDocuments,
      edit: documentPerms.canEditDocuments,
      delete: documentPerms.canDeleteDocuments,
      upload: documentPerms.canUploadDocuments,
      download: documentPerms.canDownloadDocuments,
      share: documentPerms.canShareDocuments,
      validate: documentPerms.canValidateDocuments,
      approve: documentPerms.canApproveDocuments,
      sign: documentPerms.canSignDocuments,
    },

    // Администрирование
    admin: {
      manageUsers: adminPerms.canManageUsers,
      manageOrg: adminPerms.canManageOrg,
      configureSystem: adminPerms.canConfigureSystem,
    },

    // Настройки
    settings: {
      storage: settingsPerms.canConfigureStorage,
      organization: settingsPerms.canConfigureOrg,
      validation: settingsPerms.canConfigureValidation,
      approval: settingsPerms.canConfigureApproval,
      departments: settingsPerms.canManageDepartments,
      offices: settingsPerms.canManageOffices,
    },

    // Рабочие процессы
    workflows: {
      view: workflowPerms.canViewWorkflows,
      create: workflowPerms.canCreateWorkflows,
      manage: workflowPerms.canManageWorkflows,
    },

    // Специальные роли
    roles: {
      isAdmin: adminPerms.isAdmin,
      isOrgOwner: adminPerms.isOrgOwner,
      isValidator: documentPerms.isValidator,
      isApprover: documentPerms.isApprover,
      isClient: clientPerms.isClient,
    },
  };

  return availableActions;
};

/**
 * Хук для проверки доступности навигационных элементов
 */
export const useNavigationPermissions = () => {
  const actions = useAvailableActions();

  return {
    canAccessDocuments: actions.documents.view || actions.documents.create,
    canAccessSettings: Object.values(actions.settings).some(Boolean),
    canAccessUsers: actions.admin.manageUsers,
    canAccessWorkflows: actions.workflows.view,
    canAccessAdmin: actions.admin.configureSystem,
  };
};
