import { UserRole } from '@/shared/lib/rbac';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface Employee extends User {
  classification: 'Manager' | 'Senior' | 'Associate' | 'Junior';
  office: string;
  role: string;
  department: string;
  // RBAC роли
  userRoles?: UserRole[];
  organizationId?: string;
  departmentId?: string;
  officeId?: string;
}

export interface Client extends User {
  phone: string;
  email: string;
  firmName: string;
  firmAddress: string;
  // RBAC роли (для клиентов обычно CLIENT_END_USER)
  userRoles?: UserRole[];
  organizationId?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager?: string; // Manager name (can be expanded to Employee reference later)
  managerId?: number; // Reference to Employee ID who manages this department
}

// Офис
export interface Office {
  id: number;
  name: string;
  address?: string;
  city?: string;
  country?: string;
} 