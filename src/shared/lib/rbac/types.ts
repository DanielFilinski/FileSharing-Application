/**
 * RBAC (Role-Based Access Control) типы для системы управления файлами
 */

// Базовые разрешения системы
export enum Permission {
  // Системные разрешения
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_ANALYTICS = 'system:analytics',
  
  // Управление организацией
  ORG_MANAGE = 'org:manage',
  ORG_SETTINGS = 'org:settings',
  ORG_BILLING = 'org:billing',
  
  // Управление пользователями
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_ASSIGN_ROLES = 'users:assign_roles',
  
  // Управление департаментами и офисами
  DEPT_MANAGE = 'dept:manage',
  OFFICE_MANAGE = 'office:manage',
  
  // Управление хранилищем
  STORAGE_CONFIG = 'storage:config',
  STORAGE_VIEW = 'storage:view',
  
  // Управление документами
  DOCS_VIEW_ALL = 'docs:view_all',
  DOCS_VIEW_ASSIGNED = 'docs:view_assigned',
  DOCS_CREATE = 'docs:create',
  DOCS_EDIT = 'docs:edit',
  DOCS_DELETE = 'docs:delete',
  DOCS_SHARE = 'docs:share',
  DOCS_UPLOAD = 'docs:upload',
  DOCS_DOWNLOAD = 'docs:download',
  
  // Валидация документов
  DOCS_VALIDATE = 'docs:validate',
  DOCS_VALIDATE_SETTINGS = 'docs:validate_settings',
  
  // Аппрувал документов  
  DOCS_APPROVE = 'docs:approve',
  DOCS_APPROVE_DEPT = 'docs:approve_dept',
  DOCS_APPROVE_SETTINGS = 'docs:approve_settings',
  
  // Цифровые подписи
  SIGNATURE_CONFIG = 'signature:config',
  SIGNATURE_SIGN = 'signature:sign',
  SIGNATURE_REQUEST = 'signature:request',
  
  // Подписание документов
  DOCS_SIGN = 'docs:sign',
  DOCS_SIGN_SETTINGS = 'docs:sign_settings',
  
  // Рабочие процессы
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_MANAGE = 'workflow:manage',
  WORKFLOW_VIEW = 'workflow:view',
  
  // Настройки валидации и аппрувала
  VALIDATION_CONFIG = 'validation:config',
  APPROVAL_CONFIG = 'approval:config',
}

// Роли пользователей в системе
export enum UserRole {
  ORGANIZATION_OWNER = 'organization_owner',
  ADMINISTRATOR = 'administrator', 
  TECHNICAL_SUPPORT = 'technical_support',
  SERVICE_PROVIDER = 'service_provider',
  DEPARTMENT_TEAM_LEAD = 'department_team_lead',
  REGULAR_EMPLOYEE = 'regular_employee',
  CLIENT_END_USER = 'client_end_user',
  DOCUMENT_VALIDATOR = 'document_validator',
  DOCUMENT_APPROVER = 'document_approver',
}

// Метаданные роли
export interface RoleMetadata {
  id: UserRole;
  name: string;
  description: string;
  permissions: Permission[];
  priority: number; // Приоритет роли (чем выше, тем больше прав)
  category: 'system' | 'admin' | 'user' | 'client';
  icon: string;
}

// Пользователь с ролями
export interface UserWithRoles {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  organizationId?: string;
  departmentId?: string;
  officeId?: string;
}

// Контекст ролей для организации
export interface OrganizationRoleContext {
  organizationId: string;
  departmentId?: string;
  officeId?: string;
  documentType?: string;
}

// Назначение роли пользователю
export interface RoleAssignment {
  id: string;
  userId: string;
  role: UserRole;
  context: OrganizationRoleContext;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// Результат проверки разрешений
export interface PermissionCheck {
  granted: boolean;
  reason?: string;
  requiredRole?: UserRole;
  missingPermissions?: Permission[];
}

// Конфигурация RBAC
export interface RBACConfig {
  enableRoleHierarchy: boolean;
  allowMultipleRoles: boolean;
  defaultRole: UserRole;
  organizationId?: string;
}

// Хук для проверки разрешений
export interface UsePermissionsResult {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  checkPermission: (permission: Permission, context?: OrganizationRoleContext) => PermissionCheck;
  userRoles: UserRole[];
  isLoading: boolean;
}

// Провайдер RBAC контекста
export interface RBACContextValue {
  user: UserWithRoles | null;
  permissions: Permission[];
  roles: UserRole[];
  isLoading: boolean;
  checkPermission: (permission: Permission, context?: OrganizationRoleContext) => PermissionCheck;
  refreshUserRoles: () => Promise<void>;
}
