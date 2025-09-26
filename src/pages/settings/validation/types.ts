export interface Employee {
  id: string;
  name: string;
  department: string;
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Office {
  id: string;
  name: string;
}

export interface OfficeValidators {
  [key: string]: Employee[];
}

export interface DocumentType {
  id: string;
  name: string;
}

export interface DepartmentValidators {
  [key: string]: Employee[];
}

export interface DocumentValidators {
  [key: string]: Employee[];
}

export type ValidationType = 'employee' | 'office' | 'department' | 'document';