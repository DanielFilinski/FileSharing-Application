/**
 * End User related types and interfaces
 * Matches the backend API schema for consistency
 */

export interface EndUser {
  id: string;
  partitionKey: string; // organizationId for multi-tenant isolation
  type: 'end-user';
  
  // Basic Information
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  
  // Organization Context
  organizationId: string;
  serviceProviderId: string; // связь с сотрудником фирмы
  
  // Business Information  
  firmName?: string;
  firmAddress?: string;
  businessType?: string;
  
  // Access Control
  isActive: boolean;
  accessLevel: 'read' | 'write' | 'admin';
  permissions: {
    dmsAccess: boolean;
    portalAccess: boolean;
    documentsAccess: string[]; // document IDs
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastActivityAt?: string;
  
  // Integration
  azureAdUserId?: string;
  teamsUserId?: string;
}

export interface EndUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  firmName?: string;
  firmAddress?: string;
  businessType?: string;
  accessLevel: 'read' | 'write' | 'admin';
}

export interface EndUserUpdateData extends Partial<EndUserFormData> {
  isActive?: boolean;
  permissions?: {
    dmsAccess?: boolean;
    portalAccess?: boolean;
    documentsAccess?: string[];
  };
}

// API Response types
export interface EndUsersResponse {
  endUsers: EndUser[];
  count: number;
  organizationId: string;
}

export interface EndUserResponse {
  message: string;
  endUser: EndUser;
}

export interface EndUserError {
  error: string;
  message?: string;
  details?: any;
}

// Context types for React
export interface EndUserContextValue {
  // Current selected end user
  selectedEndUser: EndUser | null;
  setSelectedEndUser: (endUser: EndUser | null) => void;
  
  // All available end users
  endUsers: EndUser[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshEndUsers: () => Promise<void>;
  createEndUser: (data: EndUserFormData) => Promise<EndUser>;
  updateEndUser: (id: string, data: EndUserUpdateData) => Promise<EndUser>;
  selectEndUser: (endUser: EndUser) => void;
  clearSelection: () => void;
  
  // Utilities
  getEndUserById: (id: string) => EndUser | undefined;
  getEndUsersByAccess: (accessLevel: EndUser['accessLevel']) => EndUser[];
}

// Selector component props
export interface EndUserSelectorProps {
  /** Show only end users with specific access level */
  accessFilter?: EndUser['accessLevel'][];
  
  /** Placeholder text when no end user is selected */
  placeholder?: string;
  
  /** Callback when end user selection changes */
  onChange?: (endUser: EndUser | null) => void;
  
  /** Whether the selector is disabled */
  disabled?: boolean;
  
  /** Size variant of the selector */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Show search functionality */
  searchable?: boolean;
  
  /** Show create new end user button */
  allowCreate?: boolean;
}

// Dialog/Modal props
export interface EndUserDialogProps {
  /** Is dialog open */
  open: boolean;
  
  /** Close dialog callback */
  onClose: () => void;
  
  /** End user to edit (if editing) */
  endUser?: EndUser;
  
  /** Callback when end user is saved */
  onSave?: (endUser: EndUser) => void;
  
  /** Dialog mode */
  mode: 'create' | 'edit' | 'view';
}

// Validation types
export interface EndUserValidationError {
  field: keyof EndUserFormData;
  message: string;
}

export interface EndUserValidationResult {
  isValid: boolean;
  errors: EndUserValidationError[];
}

// Business types enum (can be expanded)
export enum BusinessType {
  INDIVIDUAL = 'individual',
  LLC = 'llc',
  CORPORATION = 'corporation',
  PARTNERSHIP = 'partnership',
  NON_PROFIT = 'non-profit',
  OTHER = 'other'
}

// Access levels with descriptions
export const AccessLevels = {
  read: {
    value: 'read' as const,
    label: 'Read Only',
    description: 'Can view documents but not modify'
  },
  write: {
    value: 'write' as const,
    label: 'Read & Write', 
    description: 'Can view and modify documents'
  },
  admin: {
    value: 'admin' as const,
    label: 'Admin',
    description: 'Full access to documents and settings'
  }
} as const;

// Utility type helpers
export type EndUserAccessLevel = keyof typeof AccessLevels;
export type EndUserPermissionKey = keyof EndUser['permissions'];

// API endpoint paths (for API client)
export const END_USER_ENDPOINTS = {
  list: '/api/end-users',
  create: '/api/end-users',
  get: (id: string) => `/api/end-users/${id}`,
  update: (id: string) => `/api/end-users/${id}`,
  delete: (id: string) => `/api/end-users/${id}`
} as const;
