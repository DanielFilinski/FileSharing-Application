import { Permission, UserRole, RoleMetadata } from './types';

/**
 * Определения разрешений для каждой роли в системе
 */

export const ROLE_DEFINITIONS: Record<UserRole, RoleMetadata> = {
  [UserRole.ORGANIZATION_OWNER]: {
    id: UserRole.ORGANIZATION_OWNER,
    name: 'Organization Owner',
    description: 'Владелец организации с полным контролем над системой',
    priority: 100,
    category: 'system',
    icon: '👑',
    permissions: [
      // Все системные права
      Permission.SYSTEM_ADMIN,
      Permission.SYSTEM_CONFIG,
      Permission.SYSTEM_ANALYTICS,
      
      // Полное управление организацией
      Permission.ORG_MANAGE,
      Permission.ORG_SETTINGS,
      Permission.ORG_BILLING,
      
      // Полное управление пользователями
      Permission.USERS_VIEW,
      Permission.USERS_CREATE,
      Permission.USERS_EDIT,
      Permission.USERS_DELETE,
      Permission.USERS_ASSIGN_ROLES,
      
      // Управление структурой
      Permission.DEPT_MANAGE,
      Permission.OFFICE_MANAGE,
      
      // Управление хранилищем
      Permission.STORAGE_CONFIG,
      Permission.STORAGE_VIEW,
      
      // Полные права на документы
      Permission.DOCS_VIEW_ALL,
      Permission.DOCS_CREATE,
      Permission.DOCS_EDIT,
      Permission.DOCS_DELETE,
      Permission.DOCS_SHARE,
      Permission.DOCS_UPLOAD,
      Permission.DOCS_DOWNLOAD,
      
      // Управление процессами
      Permission.DOCS_VALIDATE,
      Permission.DOCS_VALIDATE_SETTINGS,
      Permission.DOCS_APPROVE,
      Permission.DOCS_APPROVE_DEPT,
      Permission.DOCS_APPROVE_SETTINGS,
      Permission.DOCS_SIGN,
      Permission.DOCS_SIGN_SETTINGS,
      
      // Рабочие процессы
      Permission.WORKFLOW_CREATE,
      Permission.WORKFLOW_MANAGE,
      Permission.WORKFLOW_VIEW,
      
      // Настройки
      Permission.VALIDATION_CONFIG,
      Permission.APPROVAL_CONFIG,
    ]
  },

  [UserRole.ADMINISTRATOR]: {
    id: UserRole.ADMINISTRATOR,
    name: 'Administrator',
    description: 'Системный администратор с полными техническими правами',
    priority: 90,
    category: 'system',
    icon: '⚙️',
    permissions: [
      Permission.SYSTEM_CONFIG,
      Permission.SYSTEM_ANALYTICS,
      
      Permission.ORG_MANAGE,
      Permission.ORG_SETTINGS,
      
      Permission.USERS_VIEW,
      Permission.USERS_CREATE,
      Permission.USERS_EDIT,
      Permission.USERS_DELETE,
      Permission.USERS_ASSIGN_ROLES,
      
      Permission.DEPT_MANAGE,
      Permission.OFFICE_MANAGE,
      
      Permission.STORAGE_CONFIG,
      Permission.STORAGE_VIEW,
      
      Permission.DOCS_VIEW_ALL,
      Permission.DOCS_CREATE,
      Permission.DOCS_EDIT,
      Permission.DOCS_DELETE,
      Permission.DOCS_SHARE,
      Permission.DOCS_UPLOAD,
      Permission.DOCS_DOWNLOAD,
      
      Permission.DOCS_VALIDATE_SETTINGS,
      Permission.DOCS_APPROVE_SETTINGS,
      Permission.DOCS_SIGN_SETTINGS,
      
      Permission.WORKFLOW_CREATE,
      Permission.WORKFLOW_MANAGE,
      Permission.WORKFLOW_VIEW,
      
      Permission.VALIDATION_CONFIG,
      Permission.APPROVAL_CONFIG,
    ]
  },

  [UserRole.TECHNICAL_SUPPORT]: {
    id: UserRole.TECHNICAL_SUPPORT,
    name: 'Technical Support',
    description: 'Техническая поддержка с правами администратора',
    priority: 85,
    category: 'system',
    icon: '🛠️',
    permissions: [
      Permission.SYSTEM_CONFIG,
      Permission.SYSTEM_ANALYTICS,
      
      Permission.ORG_SETTINGS,
      
      Permission.USERS_VIEW,
      Permission.USERS_CREATE,
      Permission.USERS_EDIT,
      Permission.USERS_DELETE,
      Permission.USERS_ASSIGN_ROLES,
      
      Permission.STORAGE_CONFIG,
      Permission.STORAGE_VIEW,
      
      Permission.DOCS_VIEW_ALL,
      Permission.DOCS_CREATE,
      Permission.DOCS_EDIT,
      Permission.DOCS_SHARE,
      Permission.DOCS_UPLOAD,
      Permission.DOCS_DOWNLOAD,
      
      Permission.DOCS_VALIDATE_SETTINGS,
      Permission.DOCS_APPROVE_SETTINGS,
      
      Permission.WORKFLOW_VIEW,
      Permission.WORKFLOW_MANAGE,
      
      Permission.VALIDATION_CONFIG,
      Permission.APPROVAL_CONFIG,
    ]
  },

  [UserRole.SERVICE_PROVIDER]: {
    id: UserRole.SERVICE_PROVIDER,
    name: 'Service Provider',
    description: 'Поставщик услуг с административными правами в организации',
    priority: 80,
    category: 'admin',
    icon: '🏢',
    permissions: [
      Permission.ORG_SETTINGS,
      
      Permission.USERS_VIEW,
      Permission.USERS_CREATE,
      Permission.USERS_EDIT,
      Permission.USERS_DELETE,
      
      Permission.DEPT_MANAGE,
      
      Permission.STORAGE_CONFIG,
      Permission.STORAGE_VIEW,
      
      Permission.DOCS_VIEW_ALL,
      Permission.DOCS_CREATE,
      Permission.DOCS_EDIT,
      Permission.DOCS_SHARE,
      Permission.DOCS_UPLOAD,
      Permission.DOCS_DOWNLOAD,
      
      Permission.WORKFLOW_CREATE,
      Permission.WORKFLOW_MANAGE,
      Permission.WORKFLOW_VIEW,
      
      Permission.VALIDATION_CONFIG,
      Permission.APPROVAL_CONFIG,
    ]
  },

  [UserRole.DEPARTMENT_TEAM_LEAD]: {
    id: UserRole.DEPARTMENT_TEAM_LEAD,
    name: 'Department Team Lead',
    description: 'Руководитель департамента с правами управления командой',
    priority: 70,
    category: 'admin',
    icon: '👨‍💼',
    permissions: [
      Permission.USERS_VIEW,
      
      Permission.DOCS_VIEW_ALL,
      Permission.DOCS_CREATE,
      Permission.DOCS_EDIT,
      Permission.DOCS_SHARE,
      Permission.DOCS_UPLOAD,
      Permission.DOCS_DOWNLOAD,
      
      Permission.DOCS_APPROVE_DEPT,
      Permission.DOCS_VALIDATE,
      
      Permission.WORKFLOW_VIEW,
      Permission.WORKFLOW_MANAGE,
    ]
  },

  [UserRole.DOCUMENT_VALIDATOR]: {
    id: UserRole.DOCUMENT_VALIDATOR,
    name: 'Document Validator',
    description: 'Специалист по валидации документов',
    priority: 60,
    category: 'user',
    icon: '🔍',
    permissions: [
      Permission.DOCS_VIEW_ASSIGNED,
      Permission.DOCS_DOWNLOAD,
      
      Permission.DOCS_VALIDATE,
      
      Permission.WORKFLOW_VIEW,
    ]
  },

  [UserRole.DOCUMENT_APPROVER]: {
    id: UserRole.DOCUMENT_APPROVER,
    name: 'Document Approver',
    description: 'Специалист по одобрению документов',
    priority: 65,
    category: 'user',
    icon: '✅',
    permissions: [
      Permission.DOCS_VIEW_ALL,
      Permission.DOCS_DOWNLOAD,
      
      Permission.DOCS_APPROVE,
      Permission.DOCS_APPROVE_DEPT,
      
      Permission.WORKFLOW_VIEW,
    ]
  },

  [UserRole.REGULAR_EMPLOYEE]: {
    id: UserRole.REGULAR_EMPLOYEE,
    name: 'Regular Employee',
    description: 'Обычный сотрудник с базовыми правами',
    priority: 50,
    category: 'user',
    icon: '👤',
    permissions: [
      Permission.DOCS_VIEW_ASSIGNED,
      Permission.DOCS_CREATE,
      Permission.DOCS_EDIT,
      Permission.DOCS_UPLOAD,
      Permission.DOCS_DOWNLOAD,
      Permission.DOCS_SIGN,
      
      Permission.WORKFLOW_VIEW,
    ]
  },

  [UserRole.CLIENT_END_USER]: {
    id: UserRole.CLIENT_END_USER,
    name: 'Client (End User)',
    description: 'Внешний клиент с ограниченными правами',
    priority: 30,
    category: 'client',
    icon: '👨‍💻',
    permissions: [
      Permission.DOCS_VIEW_ASSIGNED,
      Permission.DOCS_UPLOAD,
      Permission.DOCS_DOWNLOAD,
      Permission.DOCS_SIGN,
    ]
  },
};

/**
 * Получить разрешения для роли
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_DEFINITIONS[role]?.permissions || [];
};

/**
 * Получить все разрешения для списка ролей
 */
export const getPermissionsForRoles = (roles: UserRole[]): Permission[] => {
  const allPermissions = new Set<Permission>();
  
  roles.forEach(role => {
    getRolePermissions(role).forEach(permission => {
      allPermissions.add(permission);
    });
  });
  
  return Array.from(allPermissions);
};

/**
 * Проверить, имеет ли роль определенное разрешение
 */
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  return getRolePermissions(role).includes(permission);
};

/**
 * Получить роли по категории
 */
export const getRolesByCategory = (category: RoleMetadata['category']): UserRole[] => {
  return Object.values(ROLE_DEFINITIONS)
    .filter(role => role.category === category)
    .map(role => role.id);
};

/**
 * Получить роли отсортированные по приоритету
 */
export const getRolesSortedByPriority = (): UserRole[] => {
  return Object.values(ROLE_DEFINITIONS)
    .sort((a, b) => b.priority - a.priority)
    .map(role => role.id);
};

/**
 * Проверить, может ли пользователь с одной ролью назначить другую роль
 */
export const canAssignRole = (assignerRole: UserRole, targetRole: UserRole): boolean => {
  const assignerPriority = ROLE_DEFINITIONS[assignerRole]?.priority || 0;
  const targetPriority = ROLE_DEFINITIONS[targetRole]?.priority || 0;
  
  // Можно назначить роль только с меньшим приоритетом
  return assignerPriority > targetPriority;
};
