import { UserRole, Permission } from '@/shared/lib/rbac';

/**
 * Типы для управления ролями пользователей
 */

export interface RoleManagementState {
  selectedRoles: UserRole[];
  availableRoles: UserRole[];
  isAssigning: boolean;
  error: string | null;
}

export interface RoleAssignmentData {
  userId: string;
  roles: UserRole[];
  organizationId?: string;
  departmentId?: string;
  officeId?: string;
  expiresAt?: Date;
}

export interface RoleSelectorProps {
  selectedRoles: UserRole[];
  availableRoles: UserRole[];
  onRoleChange: (roles: UserRole[]) => void;
  disabled?: boolean;
  multiple?: boolean;
}

export interface PermissionsListProps {
  permissions: Permission[];
  title?: string;
  compact?: boolean;
}

export interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentRoles: UserRole[];
  onAssign: (data: RoleAssignmentData) => Promise<void>;
  isLoading?: boolean;
}
