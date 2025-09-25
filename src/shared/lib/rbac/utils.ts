import { 
  Permission, 
  UserRole, 
  UserWithRoles, 
  OrganizationRoleContext, 
  PermissionCheck,
  RoleAssignment 
} from './types';
import { getRolePermissions, getPermissionsForRoles, ROLE_DEFINITIONS } from './permissions';

// Реэкспорт для совместимости
export { getPermissionsForRoles } from './permissions';

/**
 * Утилиты для работы с системой ролей и разрешений
 */

/**
 * Проверить, имеет ли пользователь определенное разрешение
 */
export const checkUserPermission = (
  user: UserWithRoles | null,
  permission: Permission,
  context?: OrganizationRoleContext
): PermissionCheck => {
  if (!user) {
    return {
      granted: false,
      reason: 'User not authenticated'
    };
  }

  if (!user.roles || user.roles.length === 0) {
    return {
      granted: false,
      reason: 'User has no roles assigned',
      missingPermissions: [permission]
    };
  }

  // Проверяем контекст организации
  if (context?.organizationId && user.organizationId !== context.organizationId) {
    return {
      granted: false,
      reason: 'User does not belong to the required organization'
    };
  }

  const userPermissions = getPermissionsForRoles(user.roles);
  const hasPermission = userPermissions.includes(permission);

  if (!hasPermission) {
    // Найти роль с наивысшим приоритетом, которая имеет это разрешение
    const requiredRole = Object.values(ROLE_DEFINITIONS)
      .filter(role => role.permissions.includes(permission))
      .sort((a, b) => a.priority - b.priority)[0];

    return {
      granted: false,
      reason: `Permission ${permission} not granted for user roles: ${user.roles.join(', ')}`,
      requiredRole: requiredRole?.id,
      missingPermissions: [permission]
    };
  }

  return {
    granted: true
  };
};

/**
 * Проверить, имеет ли пользователь любое из указанных разрешений
 */
export const checkUserHasAnyPermission = (
  user: UserWithRoles | null,
  permissions: Permission[],
  context?: OrganizationRoleContext
): PermissionCheck => {
  if (!user || !permissions.length) {
    return { granted: false, reason: 'Invalid input' };
  }

  const results = permissions.map(permission => 
    checkUserPermission(user, permission, context)
  );

  const hasAny = results.some(result => result.granted);

  if (hasAny) {
    return { granted: true };
  }

  const missingPermissions = permissions.filter((permission, index) => 
    !results[index].granted
  );

  return {
    granted: false,
    reason: `User does not have any of the required permissions: ${permissions.join(', ')}`,
    missingPermissions
  };
};

/**
 * Проверить, имеет ли пользователь все указанные разрешения
 */
export const checkUserHasAllPermissions = (
  user: UserWithRoles | null,
  permissions: Permission[],
  context?: OrganizationRoleContext
): PermissionCheck => {
  if (!user || !permissions.length) {
    return { granted: false, reason: 'Invalid input' };
  }

  const results = permissions.map(permission => 
    checkUserPermission(user, permission, context)
  );

  const missingPermissions = permissions.filter((permission, index) => 
    !results[index].granted
  );

  if (missingPermissions.length === 0) {
    return { granted: true };
  }

  return {
    granted: false,
    reason: `User is missing required permissions: ${missingPermissions.join(', ')}`,
    missingPermissions
  };
};

/**
 * Проверить, имеет ли пользователь определенную роль
 */
export const checkUserHasRole = (
  user: UserWithRoles | null,
  role: UserRole
): boolean => {
  return user?.roles?.includes(role) || false;
};

/**
 * Проверить, имеет ли пользователь любую из указанных ролей
 */
export const checkUserHasAnyRole = (
  user: UserWithRoles | null,
  roles: UserRole[]
): boolean => {
  if (!user?.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

/**
 * Получить наивысшую роль пользователя по приоритету
 */
export const getUserHighestRole = (user: UserWithRoles | null): UserRole | null => {
  if (!user?.roles || user.roles.length === 0) return null;

  return user.roles.reduce((highest, current) => {
    const currentPriority = ROLE_DEFINITIONS[current]?.priority || 0;
    const highestPriority = ROLE_DEFINITIONS[highest]?.priority || 0;
    
    return currentPriority > highestPriority ? current : highest;
  });
};

/**
 * Проверить, может ли пользователь назначить роль другому пользователю
 */
export const canUserAssignRole = (
  assignerUser: UserWithRoles | null,
  targetRole: UserRole
): boolean => {
  if (!assignerUser?.roles) return false;

  // Проверяем, имеет ли пользователь право назначать роли
  const hasAssignPermission = checkUserPermission(
    assignerUser, 
    Permission.USERS_ASSIGN_ROLES
  ).granted;

  if (!hasAssignPermission) return false;

  // Проверяем приоритет ролей
  const highestUserRole = getUserHighestRole(assignerUser);
  if (!highestUserRole) return false;

  const userPriority = ROLE_DEFINITIONS[highestUserRole]?.priority || 0;
  const targetPriority = ROLE_DEFINITIONS[targetRole]?.priority || 0;

  return userPriority > targetPriority;
};

/**
 * Получить роли, которые может назначить пользователь
 */
export const getAssignableRoles = (
  assignerUser: UserWithRoles | null
): UserRole[] => {
  if (!assignerUser?.roles) return [];

  const hasAssignPermission = checkUserPermission(
    assignerUser, 
    Permission.USERS_ASSIGN_ROLES
  ).granted;

  if (!hasAssignPermission) return [];

  const highestUserRole = getUserHighestRole(assignerUser);
  if (!highestUserRole) return [];

  const userPriority = ROLE_DEFINITIONS[highestUserRole]?.priority || 0;

  return Object.values(ROLE_DEFINITIONS)
    .filter(role => role.priority < userPriority)
    .map(role => role.id);
};

/**
 * Создать назначение роли
 */
export const createRoleAssignment = (
  userId: string,
  role: UserRole,
  context: OrganizationRoleContext,
  assignedBy: string,
  expiresAt?: Date
): RoleAssignment => {
  return {
    id: `${userId}-${role}-${Date.now()}`,
    userId,
    role,
    context,
    assignedBy,
    assignedAt: new Date(),
    expiresAt,
    isActive: true
  };
};

/**
 * Проверить, активно ли назначение роли
 */
export const isRoleAssignmentActive = (assignment: RoleAssignment): boolean => {
  if (!assignment.isActive) return false;
  
  if (assignment.expiresAt && assignment.expiresAt < new Date()) {
    return false;
  }
  
  return true;
};

/**
 * Фильтровать активные назначения ролей
 */
export const getActiveRoleAssignments = (
  assignments: RoleAssignment[]
): RoleAssignment[] => {
  return assignments.filter(isRoleAssignmentActive);
};

/**
 * Получить роли из активных назначений
 */
export const getRolesFromAssignments = (
  assignments: RoleAssignment[]
): UserRole[] => {
  return getActiveRoleAssignments(assignments).map(assignment => assignment.role);
};

/**
 * Проверить, является ли пользователь администратором
 */
export const isUserAdmin = (user: UserWithRoles | null): boolean => {
  return checkUserHasAnyRole(user, [
    UserRole.ORGANIZATION_OWNER,
    UserRole.ADMINISTRATOR,
    UserRole.TECHNICAL_SUPPORT
  ]);
};

/**
 * Проверить, является ли пользователь клиентом
 */
export const isUserClient = (user: UserWithRoles | null): boolean => {
  return checkUserHasRole(user, UserRole.CLIENT_END_USER);
};

/**
 * Получить отображаемое имя роли
 */
export const getRoleDisplayName = (role: UserRole): string => {
  return ROLE_DEFINITIONS[role]?.name || role;
};

/**
 * Получить иконку роли
 */
export const getRoleIcon = (role: UserRole): string => {
  return ROLE_DEFINITIONS[role]?.icon || '👤';
};

/**
 * Получить описание роли
 */
export const getRoleDescription = (role: UserRole): string => {
  return ROLE_DEFINITIONS[role]?.description || '';
};
