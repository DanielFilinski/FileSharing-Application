/**
 * Excel Import Utility
 * 
 * Provides functionality for parsing and validating Excel files
 * for bulk import of employees and clients data.
 * 
 * @features
 * - XLSX file parsing
 * - Data validation and type checking
 * - Error reporting for invalid data
 * - Support for both employees and clients import
 */

import type { Employee, Client } from '@/entities/user';

// Supported file types for import
export const SUPPORTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel' // .xls
];

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Import result interface
export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  totalRows: number;
  validRows: number;
}

// Import error interface
export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

// Expected Excel column headers for employees
export const EMPLOYEE_HEADERS = {
  firstName: 'First Name',
  lastName: 'Last Name',
  classification: 'Classification',
  office: 'Office',
  role: 'Role',
  department: 'Department'
};

// Expected Excel column headers for clients
export const CLIENT_HEADERS = {
  firstName: 'First Name',
  lastName: 'Last Name',
  phone: 'Phone',
  email: 'Email',
  firmName: 'Firm Name',
  firmAddress: 'Firm Address'
};

/**
 * Validates file before processing
 * @param file - File to validate
 * @returns Promise with validation result
 */
export const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  // Check file type
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload an Excel file (.xlsx or .xls)'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 5MB limit. Please upload a smaller file.'
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty. Please upload a file with data.'
    };
  }

  return { valid: true };
};

/**
 * Parses Excel file and returns raw data
 * Note: This is a mock implementation. In a real app, you would use
 * libraries like xlsx, exceljs, or similar.
 * 
 * @param file - Excel file to parse
 * @returns Promise with parsed data
 */
export const parseExcelFile = async (file: File): Promise<any[][]> => {
  // Mock implementation - in reality, you'd use a library like 'xlsx'
  // This simulates reading an Excel file and returning rows of data
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // Mock data for demonstration - replace with actual Excel parsing
      const mockData = [
        ['First Name', 'Last Name', 'Classification', 'Office', 'Role', 'Department'],
        ['John', 'Doe', 'Manager', 'New York', 'Operations Manager', 'Operations'],
        ['Jane', 'Smith', 'Senior', 'Chicago', 'Senior Analyst', 'Finance'],
        ['Bob', 'Johnson', 'Associate', 'Los Angeles', 'Developer', 'IT']
      ];
      
      setTimeout(() => resolve(mockData), 500); // Simulate processing time
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validates and converts row data to Employee object
 * @param rowData - Raw row data from Excel
 * @param headers - Column headers mapping
 * @param rowIndex - Row index for error reporting
 * @returns Validation result
 */
export const validateEmployeeRow = (
  rowData: any[],
  headers: Record<string, number>,
  rowIndex: number
): { valid: boolean; employee?: Omit<Employee, 'id'>; errors: ImportError[] } => {
  const errors: ImportError[] = [];
  const employee: Partial<Employee> = {};

  // Validate First Name
  const firstName = rowData[headers.firstName]?.toString().trim();
  if (!firstName) {
    errors.push({
      row: rowIndex,
      field: 'firstName',
      message: 'First name is required',
      value: rowData[headers.firstName]
    });
  } else if (firstName.length < 2) {
    errors.push({
      row: rowIndex,
      field: 'firstName',
      message: 'First name must be at least 2 characters',
      value: firstName
    });
  } else {
    employee.firstName = firstName;
  }

  // Validate Last Name
  const lastName = rowData[headers.lastName]?.toString().trim();
  if (!lastName) {
    errors.push({
      row: rowIndex,
      field: 'lastName',
      message: 'Last name is required',
      value: rowData[headers.lastName]
    });
  } else if (lastName.length < 2) {
    errors.push({
      row: rowIndex,
      field: 'lastName',
      message: 'Last name must be at least 2 characters',
      value: lastName
    });
  } else {
    employee.lastName = lastName;
  }

  // Validate Classification
  const classification = rowData[headers.classification]?.toString().trim();
  const validClassifications = ['Manager', 'Senior', 'Associate', 'Junior'];
  if (!classification) {
    errors.push({
      row: rowIndex,
      field: 'classification',
      message: 'Classification is required',
      value: rowData[headers.classification]
    });
  } else if (!validClassifications.includes(classification)) {
    errors.push({
      row: rowIndex,
      field: 'classification',
      message: `Classification must be one of: ${validClassifications.join(', ')}`,
      value: classification
    });
  } else {
    employee.classification = classification as Employee['classification'];
  }

  // Validate Office
  const office = rowData[headers.office]?.toString().trim();
  if (!office) {
    errors.push({
      row: rowIndex,
      field: 'office',
      message: 'Office is required',
      value: rowData[headers.office]
    });
  } else {
    employee.office = office;
  }

  // Optional fields
  employee.role = rowData[headers.role]?.toString().trim() || '';
  employee.department = rowData[headers.department]?.toString().trim() || '';

  return {
    valid: errors.length === 0,
    employee: errors.length === 0 ? (employee as Omit<Employee, 'id'>) : undefined,
    errors
  };
};

/**
 * Validates and converts row data to Client object
 * @param rowData - Raw row data from Excel
 * @param headers - Column headers mapping
 * @param rowIndex - Row index for error reporting
 * @returns Validation result
 */
export const validateClientRow = (
  rowData: any[],
  headers: Record<string, number>,
  rowIndex: number
): { valid: boolean; client?: Omit<Client, 'id'>; errors: ImportError[] } => {
  const errors: ImportError[] = [];
  const client: Partial<Client> = {};

  // Validate First Name
  const firstName = rowData[headers.firstName]?.toString().trim();
  if (!firstName) {
    errors.push({
      row: rowIndex,
      field: 'firstName',
      message: 'First name is required',
      value: rowData[headers.firstName]
    });
  } else {
    client.firstName = firstName;
  }

  // Validate Last Name
  const lastName = rowData[headers.lastName]?.toString().trim();
  if (!lastName) {
    errors.push({
      row: rowIndex,
      field: 'lastName',
      message: 'Last name is required',
      value: rowData[headers.lastName]
    });
  } else {
    client.lastName = lastName;
  }

  // Validate Phone
  const phone = rowData[headers.phone]?.toString().trim();
  if (!phone) {
    errors.push({
      row: rowIndex,
      field: 'phone',
      message: 'Phone is required',
      value: rowData[headers.phone]
    });
  } else {
    client.phone = phone;
  }

  // Validate Email
  const email = rowData[headers.email]?.toString().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: 'Email is required',
      value: rowData[headers.email]
    });
  } else if (!emailRegex.test(email)) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: 'Invalid email format',
      value: email
    });
  } else {
    client.email = email;
  }

  // Optional fields
  client.firmName = rowData[headers.firmName]?.toString().trim() || '';
  client.firmAddress = rowData[headers.firmAddress]?.toString().trim() || '';

  return {
    valid: errors.length === 0,
    client: errors.length === 0 ? (client as Omit<Client, 'id'>) : undefined,
    errors
  };
};

/**
 * Main import function for employees
 * @param file - Excel file to import
 * @returns Promise with import results
 */
export const importEmployees = async (file: File): Promise<ImportResult<Omit<Employee, 'id'>>> => {
  // Validate file
  const fileValidation = await validateFile(file);
  if (!fileValidation.valid) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: fileValidation.error! }],
      totalRows: 0,
      validRows: 0
    };
  }

  try {
    // Parse Excel file
    const rawData = await parseExcelFile(file);
    
    if (rawData.length < 2) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', message: 'File must contain header row and at least one data row' }],
        totalRows: 0,
        validRows: 0
      };
    }

    // Map headers to column indices
    const headerRow = rawData[0];
    const headers: Record<string, number> = {};
    
    Object.entries(EMPLOYEE_HEADERS).forEach(([key, headerName]) => {
      const index = headerRow.findIndex((h: string) => 
        h?.toString().toLowerCase().trim() === headerName.toLowerCase()
      );
      if (index !== -1) {
        headers[key] = index;
      }
    });

    // Check for required headers
    const requiredHeaders = ['firstName', 'lastName', 'classification', 'office'];
    const missingHeaders = requiredHeaders.filter(header => !(header in headers));
    
    if (missingHeaders.length > 0) {
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          field: 'headers',
          message: `Missing required columns: ${missingHeaders.map(h => EMPLOYEE_HEADERS[h as keyof typeof EMPLOYEE_HEADERS]).join(', ')}`
        }],
        totalRows: rawData.length - 1,
        validRows: 0
      };
    }

    // Process data rows
    const employees: Omit<Employee, 'id'>[] = [];
    const allErrors: ImportError[] = [];
    
    for (let i = 1; i < rawData.length; i++) {
      const result = validateEmployeeRow(rawData[i], headers, i + 1);
      
      if (result.valid && result.employee) {
        employees.push(result.employee);
      } else {
        allErrors.push(...result.errors);
      }
    }

    return {
      success: allErrors.length === 0,
      data: employees,
      errors: allErrors,
      totalRows: rawData.length - 1,
      validRows: employees.length
    };

  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: 'Failed to parse Excel file' }],
      totalRows: 0,
      validRows: 0
    };
  }
};

/**
 * Main import function for clients
 * @param file - Excel file to import
 * @returns Promise with import results
 */
export const importClients = async (file: File): Promise<ImportResult<Omit<Client, 'id'>>> => {
  // Validate file
  const fileValidation = await validateFile(file);
  if (!fileValidation.valid) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: fileValidation.error! }],
      totalRows: 0,
      validRows: 0
    };
  }

  try {
    // Parse Excel file
    const rawData = await parseExcelFile(file);
    
    if (rawData.length < 2) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', message: 'File must contain header row and at least one data row' }],
        totalRows: 0,
        validRows: 0
      };
    }

    // Map headers to column indices
    const headerRow = rawData[0];
    const headers: Record<string, number> = {};
    
    Object.entries(CLIENT_HEADERS).forEach(([key, headerName]) => {
      const index = headerRow.findIndex((h: string) => 
        h?.toString().toLowerCase().trim() === headerName.toLowerCase()
      );
      if (index !== -1) {
        headers[key] = index;
      }
    });

    // Check for required headers
    const requiredHeaders = ['firstName', 'lastName', 'phone', 'email'];
    const missingHeaders = requiredHeaders.filter(header => !(header in headers));
    
    if (missingHeaders.length > 0) {
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          field: 'headers',
          message: `Missing required columns: ${missingHeaders.map(h => CLIENT_HEADERS[h as keyof typeof CLIENT_HEADERS]).join(', ')}`
        }],
        totalRows: rawData.length - 1,
        validRows: 0
      };
    }

    // Process data rows
    const clients: Omit<Client, 'id'>[] = [];
    const allErrors: ImportError[] = [];
    
    for (let i = 1; i < rawData.length; i++) {
      const result = validateClientRow(rawData[i], headers, i + 1);
      
      if (result.valid && result.client) {
        clients.push(result.client);
      } else {
        allErrors.push(...result.errors);
      }
    }

    return {
      success: allErrors.length === 0,
      data: clients,
      errors: allErrors,
      totalRows: rawData.length - 1,
      validRows: clients.length
    };

  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: 'Failed to parse Excel file' }],
      totalRows: 0,
      validRows: 0
    };
  }
};
