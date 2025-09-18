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
}

export interface Client extends User {
  phone: string;
  email: string;
  firmName: string;
  firmAddress: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
} 