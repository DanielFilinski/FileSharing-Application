/**
 * Главный экспорт RBAC (Role-Based Access Control) системы
 */

// Типы
export type {
  Permission,
  UserRole,
  RoleMetadata,
  UserWithRoles,
  OrganizationRoleContext,
  RoleAssignment,
  PermissionCheck,
  RBACConfig,
  UsePermissionsResult,
  RBACContextValue,
} from './types';

// Енумы
export { Permission, UserRole } from './types';

// Определения ролей и разрешений
export {
  ROLE_DEFINITIONS,
  getRolePermissions,
  getPermissionsForRoles,
  roleHasPermission,
  getRolesByCategory,
  getRolesSortedByPriority,
  canAssignRole,
} from './permissions';

// Утилиты
export {
  checkUserPermission,
  checkUserHasAnyPermission,
  checkUserHasAllPermissions,
  checkUserHasRole,
  checkUserHasAnyRole,
  getUserHighestRole,
  canUserAssignRole,
  getAssignableRoles,
  createRoleAssignment,
  isRoleAssignmentActive,
  getActiveRoleAssignments,
  getRolesFromAssignments,
  isUserAdmin,
  isUserClient,
  getRoleDisplayName,
  getRoleIcon,
  getRoleDescription,
} from './utils';

// React контекст и провайдеры
export {
  RBACProvider,
  useRBAC,
  withPermissions,
  PermissionGate,
} from './context';

// Защитники компонентов
export {
  AdminGuard,
  OrgOwnerGuard,
  SystemAdminGuard,
  ManagerGuard,
  EmployeeGuard,
  ClientGuard,
  ValidatorGuard,
  ApproverGuard,
  SettingsGuard,
  UserManagementGuard,
} from './guards';

// Хуки
export {
  usePermissions,
  useAdminPermissions,
  useDocumentPermissions,
  useSettingsPermissions,
  useWorkflowPermissions,
  useClientPermissions,
  useAvailableActions,
  useNavigationPermissions,
} from './hooks';
