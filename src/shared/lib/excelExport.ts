/**
 * Excel Export Utility
 * 
 * Provides functionality for exporting user data to Excel files.
 * Supports both employees and clients data with proper formatting.
 * 
 * @features
 * - Export to XLSX format
 * - Formatted headers and data
 * - Support for filtered data export
 * - Automatic file download
 */

import type { Employee, Client, Department } from '@/entities/user';

/**
 * Export configuration interface
 */
export interface ExportConfig {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Default export configuration
 */
const DEFAULT_CONFIG: Required<ExportConfig> = {
  filename: 'export',
  includeHeaders: true,
  dateFormat: 'YYYY-MM-DD'
};

/**
 * Converts data to CSV format
 * This is a simplified CSV export. In a real application, you would use
 * libraries like 'xlsx' or 'exceljs' for proper Excel file generation.
 * 
 * @param data - Data to convert
 * @param headers - Column headers
 * @returns CSV string
 */
const convertToCSV = (data: any[][], headers: string[]): string => {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const csvRow = row.map(cell => {
      // Handle cells that contain commas, quotes, or newlines
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    csvRows.push(csvRow.join(','));
  });
  
  return csvRows.join('\n');
};

/**
 * Triggers file download
 * @param content - File content
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 */
const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv') => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  window.URL.revokeObjectURL(url);
};

/**
 * Exports employees data to Excel/CSV file
 * @param employees - Array of employee data
 * @param config - Export configuration
 */
export const exportEmployees = async (
  employees: Employee[], 
  config: ExportConfig = {}
): Promise<void> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Define headers
  const headers = [
    'Employee ID',
    'First Name',
    'Last Name',
    'Classification',
    'Office',
    'Role',
    'Department'
  ];
  
  // Convert employees to data rows
  const dataRows = employees.map(emp => [
    `EMP${String(emp.id).padStart(3, '0')}`,
    emp.firstName,
    emp.lastName,
    emp.classification,
    emp.office,
    emp.role || '',
    emp.department || ''
  ]);
  
  // Convert to CSV
  const csvContent = convertToCSV(dataRows, headers);
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${finalConfig.filename}_employees_${timestamp}.csv`;
  
  // Download file
  downloadFile(csvContent, filename);
};

/**
 * Exports clients data to Excel/CSV file
 * @param clients - Array of client data
 * @param config - Export configuration
 */
export const exportClients = async (
  clients: Client[], 
  config: ExportConfig = {}
): Promise<void> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Define headers
  const headers = [
    'Client ID',
    'First Name',
    'Last Name',
    'Phone',
    'Email',
    'Firm Name',
    'Firm Address'
  ];
  
  // Convert clients to data rows
  const dataRows = clients.map(client => [
    `CLT${String(client.id).padStart(3, '0')}`,
    client.firstName,
    client.lastName,
    client.phone,
    client.email,
    client.firmName || '',
    client.firmAddress || ''
  ]);
  
  // Convert to CSV
  const csvContent = convertToCSV(dataRows, headers);
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${finalConfig.filename}_clients_${timestamp}.csv`;
  
  // Download file
  downloadFile(csvContent, filename);
};

/**
 * Exports departments data to Excel/CSV file
 * @param departments - Array of department data
 * @param config - Export configuration
 */
export const exportDepartments = async (
  departments: Department[], 
  config: ExportConfig = {}
): Promise<void> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Define headers
  const headers = [
    'Department ID',
    'Name',
    'Description'
  ];
  
  // Convert departments to data rows
  const dataRows = departments.map(dept => [
    `DEP${String(dept.id).padStart(3, '0')}`,
    dept.name,
    dept.description || ''
  ]);
  
  // Convert to CSV
  const csvContent = convertToCSV(dataRows, headers);
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${finalConfig.filename}_departments_${timestamp}.csv`;
  
  // Download file
  downloadFile(csvContent, filename);
};

/**
 * Exports all user data to a single Excel/CSV file with multiple sheets
 * Note: This creates a single CSV with all data. For true multi-sheet Excel,
 * you would need to use a library like 'exceljs'.
 * 
 * @param data - Object containing all user data
 * @param config - Export configuration
 */
export const exportAllUserData = async (
  data: {
    employees: Employee[];
    clients: Client[];
    departments: Department[];
  },
  config: ExportConfig = {}
): Promise<void> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const sections: string[] = [];
  
  // Employees section
  if (data.employees.length > 0) {
    const empHeaders = ['Employee ID', 'First Name', 'Last Name', 'Classification', 'Office', 'Role', 'Department'];
    const empRows = data.employees.map(emp => [
      `EMP${String(emp.id).padStart(3, '0')}`,
      emp.firstName,
      emp.lastName,
      emp.classification,
      emp.office,
      emp.role || '',
      emp.department || ''
    ]);
    
    sections.push('EMPLOYEES');
    sections.push(convertToCSV(empRows, empHeaders));
    sections.push(''); // Empty line
  }
  
  // Clients section
  if (data.clients.length > 0) {
    const clientHeaders = ['Client ID', 'First Name', 'Last Name', 'Phone', 'Email', 'Firm Name', 'Firm Address'];
    const clientRows = data.clients.map(client => [
      `CLT${String(client.id).padStart(3, '0')}`,
      client.firstName,
      client.lastName,
      client.phone,
      client.email,
      client.firmName || '',
      client.firmAddress || ''
    ]);
    
    sections.push('CLIENTS');
    sections.push(convertToCSV(clientRows, clientHeaders));
    sections.push(''); // Empty line
  }
  
  // Departments section
  if (data.departments.length > 0) {
    const deptHeaders = ['Department ID', 'Name', 'Description'];
    const deptRows = data.departments.map(dept => [
      `DEP${String(dept.id).padStart(3, '0')}`,
      dept.name,
      dept.description || ''
    ]);
    
    sections.push('DEPARTMENTS');
    sections.push(convertToCSV(deptRows, deptHeaders));
  }
  
  const finalContent = sections.join('\n');
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${finalConfig.filename}_all_users_${timestamp}.csv`;
  
  // Download file
  downloadFile(finalContent, filename);
};

/**
 * Generates sample template files for import
 * @param type - Type of template to generate
 */
export const generateImportTemplate = (type: 'employees' | 'clients'): void => {
  if (type === 'employees') {
    const headers = ['First Name', 'Last Name', 'Classification', 'Office', 'Role', 'Department'];
    const sampleData = [
      ['John', 'Doe', 'Manager', 'New York', 'Operations Manager', 'Operations'],
      ['Jane', 'Smith', 'Senior', 'Chicago', 'Senior Analyst', 'Finance'],
      ['Bob', 'Johnson', 'Associate', 'Los Angeles', 'Developer', 'IT']
    ];
    
    const csvContent = convertToCSV(sampleData, headers);
    downloadFile(csvContent, 'employee_import_template.csv');
  } else {
    const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Firm Name', 'Firm Address'];
    const sampleData = [
      ['Robert', 'Wilson', '(555) 123-4567', 'robert.wilson@example.com', 'Wilson & Associates', '123 Main St, Boston, MA'],
      ['Lisa', 'Anderson', '(555) 987-6543', 'lisa.anderson@techcorp.com', 'TechCorp Inc.', '456 Tech Ave, Seattle, WA']
    ];
    
    const csvContent = convertToCSV(sampleData, headers);
    downloadFile(csvContent, 'client_import_template.csv');
  }
};
