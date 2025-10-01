import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { createProtectedFunction, RBAC_CONFIGS } from '../shared/middleware/rbacMiddleware';
import { auditMiddleware } from '../shared/audit/auditMiddleware';
import { AuditActions } from '../../../src/shared/types/audit';
import { z } from 'zod';

// Enhanced User Management Schemas
const EmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  classification: z.enum(['Manager', 'Senior', 'Associate', 'Junior']),
  office: z.string().min(1, 'Office is required'),
  role: z.string().optional(),
  department: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
  workSchedule: z.object({
    startTime: z.string(),
    endTime: z.string(),
    timezone: z.string(),
    workDays: z.array(z.number().min(0).max(6))
  }).optional()
});

const ClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  firmName: z.string().optional(),
  firmAddress: z.string().optional(),
  businessType: z.string().optional(),
  isActive: z.boolean().default(true),
  accessLevel: z.enum(['read', 'write', 'admin']).default('read'),
  assignedServiceProvider: z.string().optional(),
  documentsAccess: z.array(z.string()).optional()
});

const DepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  managerId: z.string().min(1, 'Manager ID is required'),
  managerName: z.string().min(1, 'Manager name is required'),
  officeId: z.string().optional(),
  permissions: z.object({
    canCreateUsers: z.boolean().default(false),
    canManageDocuments: z.boolean().default(true),
    canApproveDocuments: z.boolean().default(false),
    canManageWorkflows: z.boolean().default(false)
  }).optional(),
  hierarchy: z.object({
    parentDepartmentId: z.string().optional(),
    level: z.number().default(1),
    children: z.array(z.string()).default([])
  }).optional()
});

const BulkUserUpdateSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID required'),
  updates: z.object({
    isActive: z.boolean().optional(),
    departmentId: z.string().optional(),
    role: z.string().optional(),
    permissions: z.array(z.string()).optional()
  })
});

const ExcelImportSchema = z.object({
  userType: z.enum(['employees', 'clients']),
  data: z.array(z.record(z.any())).min(1, 'Import data is required'),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateEmails: z.boolean().default(true)
  }).optional()
});

// Enhanced Employee Interface
interface EnhancedEmployee {
  id: string;
  partitionKey: string; // tenantId
  type: 'employee';
  
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  classification: string;
  office: string;
  role?: string;
  department?: string;
  departmentId?: string;
  managerId?: string;
  phone?: string;
  
  // Enhanced Fields
  isActive: boolean;
  permissions: string[];
  skills: string[];
  certifications: string[];
  profilePicture?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  workSchedule?: {
    startTime: string;
    endTime: string;
    timezone: string;
    workDays: number[];
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastLoginAt?: string;
}

// Enhanced Client Interface
interface EnhancedClient {
  id: string;
  partitionKey: string; // tenantId
  type: 'client';
  
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  firmName?: string;
  firmAddress?: string;
  businessType?: string;
  
  // Enhanced Fields
  isActive: boolean;
  accessLevel: 'read' | 'write' | 'admin';
  assignedServiceProvider?: string;
  documentsAccess: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastActivityAt?: string;
}

// Department Interface
interface Department {
  id: string;
  partitionKey: string; // tenantId
  type: 'department';
  
  name: string;
  description?: string;
  managerId: string;
  managerName: string;
  officeId?: string;
  employees: string[]; // Array of employee IDs
  
  permissions: {
    canCreateUsers: boolean;
    canManageDocuments: boolean;
    canApproveDocuments: boolean;
    canManageWorkflows: boolean;
  };
  
  hierarchy: {
    parentDepartmentId?: string;
    level: number;
    children: string[];
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// POST /api/users/employees - Create new employee
app.http('createEmployee', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/employees',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_CREATE,
    auditMiddleware(AuditActions.USER_CREATED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = EmployeeSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid employee data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const employeeData = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Check if employee with email already exists
        const usersContainer = getContainer('users');
        const existingEmployee = await usersContainer.items.query({
          query: 'SELECT * FROM c WHERE c.email = @email AND c.type = "employee" AND c.partitionKey = @tenantId',
          parameters: [
            { name: '@email', value: employeeData.email },
            { name: '@tenantId', value: user.tenantId }
          ]
        }).fetchAll();
        
        if (existingEmployee.resources.length > 0) {
          return {
            status: 409,
            body: JSON.stringify({
              error: 'Employee with this email already exists'
            })
          };
        }
        
        // Create employee object
        const employee: EnhancedEmployee = {
          id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partitionKey: user.tenantId,
          type: 'employee',
          ...employeeData,
          permissions: employeeData.permissions || [],
          skills: employeeData.skills || [],
          certifications: employeeData.certifications || [],
          createdAt: now,
          updatedAt: now,
          createdBy: user.email
        };
        
        // Save to database
        await usersContainer.items.create(employee);
        
        // Update department if specified
        if (employeeData.departmentId) {
          await updateDepartmentEmployeeList(employeeData.departmentId, employee.id, 'add');
        }
        
        ctx.log(`Employee created: ${employee.email} by ${user.email}`);
        
        return {
          status: 201,
          body: JSON.stringify({
            success: true,
            employee: {
              id: employee.id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              classification: employee.classification,
              office: employee.office,
              department: employee.department,
              isActive: employee.isActive
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Error creating employee:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to create employee',
            message: error.message
          })
        };
      }
    }
  )
});

// PUT /api/users/employees/:id - Update employee
app.http('updateEmployee', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'users/employees/{id}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_EDIT,
    auditMiddleware(AuditActions.USER_UPDATED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const employeeId = req.params.id;
        const body = await req.json();
        const parsed = EmployeeSchema.partial().safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid employee data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const user = authResult.user!;
        const usersContainer = getContainer('users');
        
        // Get existing employee
        const { resource: existingEmployee } = await usersContainer.item(employeeId).read();
        
        if (!existingEmployee || existingEmployee.type !== 'employee') {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Employee not found' })
          };
        }
        
        // Check permissions
        const canEdit = existingEmployee.createdBy === user.email || 
                       authResult.roles?.includes('Administrator') ||
                       authResult.roles?.includes('Manager');
                       
        if (!canEdit) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Insufficient permissions to edit this employee' })
          };
        }
        
        // Handle department change
        const oldDepartmentId = existingEmployee.departmentId;
        const newDepartmentId = parsed.data.departmentId;
        
        if (oldDepartmentId !== newDepartmentId) {
          if (oldDepartmentId) {
            await updateDepartmentEmployeeList(oldDepartmentId, employeeId, 'remove');
          }
          if (newDepartmentId) {
            await updateDepartmentEmployeeList(newDepartmentId, employeeId, 'add');
          }
        }
        
        // Update employee
        const updatedEmployee = {
          ...existingEmployee,
          ...parsed.data,
          updatedAt: new Date().toISOString(),
          updatedBy: user.email
        };
        
        await usersContainer.item(employeeId).replace(updatedEmployee);
        
        ctx.log(`Employee updated: ${employeeId} by ${user.email}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            employee: {
              id: updatedEmployee.id,
              firstName: updatedEmployee.firstName,
              lastName: updatedEmployee.lastName,
              email: updatedEmployee.email,
              classification: updatedEmployee.classification,
              office: updatedEmployee.office,
              department: updatedEmployee.department,
              isActive: updatedEmployee.isActive
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Error updating employee:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to update employee',
            message: error.message
          })
        };
      }
    }
  )
});

// DELETE /api/users/employees/:id - Delete employee
app.http('deleteEmployee', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'users/employees/{id}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_DELETE,
    auditMiddleware(AuditActions.USER_DELETED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const employeeId = req.params.id;
        const user = authResult.user!;
        const usersContainer = getContainer('users');
        
        // Get existing employee
        const { resource: existingEmployee } = await usersContainer.item(employeeId).read();
        
        if (!existingEmployee || existingEmployee.type !== 'employee') {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Employee not found' })
          };
        }
        
        // Check permissions
        const canDelete = authResult.roles?.includes('Administrator') ||
                         authResult.roles?.includes('Manager');
                         
        if (!canDelete) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Insufficient permissions to delete employee' })
          };
        }
        
        // Soft delete - mark as inactive instead of hard delete
        const deletedEmployee = {
          ...existingEmployee,
          isActive: false,
          deletedAt: new Date().toISOString(),
          deletedBy: user.email
        };
        
        await usersContainer.item(employeeId).replace(deletedEmployee);
        
        // Remove from department
        if (existingEmployee.departmentId) {
          await updateDepartmentEmployeeList(existingEmployee.departmentId, employeeId, 'remove');
        }
        
        ctx.log(`Employee deleted: ${employeeId} by ${user.email}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Employee deleted successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Error deleting employee:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to delete employee',
            message: error.message
          })
        };
      }
    }
  )
});

// POST /api/users/clients - Create new client
app.http('createClient', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/clients',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_CREATE,
    auditMiddleware(AuditActions.USER_CREATED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = ClientSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid client data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const clientData = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Check if client with email already exists
        const usersContainer = getContainer('users');
        const existingClient = await usersContainer.items.query({
          query: 'SELECT * FROM c WHERE c.email = @email AND c.type = "client" AND c.partitionKey = @tenantId',
          parameters: [
            { name: '@email', value: clientData.email },
            { name: '@tenantId', value: user.tenantId }
          ]
        }).fetchAll();
        
        if (existingClient.resources.length > 0) {
          return {
            status: 409,
            body: JSON.stringify({
              error: 'Client with this email already exists'
            })
          };
        }
        
        // Create client object
        const client: EnhancedClient = {
          id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partitionKey: user.tenantId,
          type: 'client',
          ...clientData,
          documentsAccess: clientData.documentsAccess || [],
          createdAt: now,
          updatedAt: now,
          createdBy: user.email
        };
        
        // Save to database
        await usersContainer.items.create(client);
        
        ctx.log(`Client created: ${client.email} by ${user.email}`);
        
        return {
          status: 201,
          body: JSON.stringify({
            success: true,
            client: {
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              firmName: client.firmName,
              isActive: client.isActive,
              accessLevel: client.accessLevel
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Error creating client:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to create client',
            message: error.message
          })
        };
      }
    }
  )
});

// POST /api/users/departments - Create new department
app.http('createDepartment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/departments',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_CREATE,
    auditMiddleware(AuditActions.DEPARTMENT_CREATED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = DepartmentSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid department data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const departmentData = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Check if department with name already exists
        const departmentsContainer = getContainer('departments');
        const existingDepartment = await departmentsContainer.items.query({
          query: 'SELECT * FROM c WHERE c.name = @name AND c.partitionKey = @tenantId',
          parameters: [
            { name: '@name', value: departmentData.name },
            { name: '@tenantId', value: user.tenantId }
          ]
        }).fetchAll();
        
        if (existingDepartment.resources.length > 0) {
          return {
            status: 409,
            body: JSON.stringify({
              error: 'Department with this name already exists'
            })
          };
        }
        
        // Create department object
        const department: Department = {
          id: `dept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partitionKey: user.tenantId,
          type: 'department',
          ...departmentData,
          employees: [],
          permissions: departmentData.permissions || {
            canCreateUsers: false,
            canManageDocuments: true,
            canApproveDocuments: false,
            canManageWorkflows: false
          },
          hierarchy: departmentData.hierarchy || {
            level: 1,
            children: []
          },
          createdAt: now,
          updatedAt: now,
          createdBy: user.email
        };
        
        // Save to database
        await departmentsContainer.items.create(department);
        
        ctx.log(`Department created: ${department.name} by ${user.email}`);
        
        return {
          status: 201,
          body: JSON.stringify({
            success: true,
            department: {
              id: department.id,
              name: department.name,
              description: department.description,
              managerName: department.managerName,
              employeeCount: department.employees.length
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Error creating department:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to create department',
            message: error.message
          })
        };
      }
    }
  )
});

// POST /api/users/import-excel - Import users from Excel
app.http('importUsersFromExcel', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/import-excel',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_CREATE,
    auditMiddleware(AuditActions.USERS_IMPORTED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = ExcelImportSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid import data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const { userType, data, options } = parsed.data;
        const user = authResult.user!;
        const results = {
          success: 0,
          failed: 0,
          skipped: 0,
          errors: [] as string[]
        };
        
        const usersContainer = getContainer('users');
        
        for (const row of data) {
          try {
            // Validate and transform data based on user type
            let userData;
            if (userType === 'employees') {
              userData = EmployeeSchema.parse({
                firstName: row.firstName || row['First Name'],
                lastName: row.lastName || row['Last Name'],
                email: row.email || row['Email'],
                classification: row.classification || row['Classification'],
                office: row.office || row['Office'],
                role: row.role || row['Role'],
                department: row.department || row['Department'],
                phone: row.phone || row['Phone']
              });
            } else {
              userData = ClientSchema.parse({
                firstName: row.firstName || row['First Name'],
                lastName: row.lastName || row['Last Name'],
                email: row.email || row['Email'],
                phone: row.phone || row['Phone'],
                firmName: row.firmName || row['Firm Name'],
                firmAddress: row.firmAddress || row['Firm Address']
              });
            }
            
            // Check for duplicates if skipDuplicates is true
            if (options?.skipDuplicates) {
              const existingUser = await usersContainer.items.query({
                query: 'SELECT * FROM c WHERE c.email = @email AND c.type = @type AND c.partitionKey = @tenantId',
                parameters: [
                  { name: '@email', value: userData.email },
                  { name: '@type', value: userType === 'employees' ? 'employee' : 'client' },
                  { name: '@tenantId', value: user.tenantId }
                ]
              }).fetchAll();
              
              if (existingUser.resources.length > 0) {
                results.skipped++;
                continue;
              }
            }
            
            // Create user object
            const now = new Date().toISOString();
            const newUser = {
              id: `${userType === 'employees' ? 'emp' : 'client'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              partitionKey: user.tenantId,
              type: userType === 'employees' ? 'employee' : 'client',
              ...userData,
              createdAt: now,
              updatedAt: now,
              createdBy: user.email
            };
            
            // Save to database
            await usersContainer.items.create(newUser);
            results.success++;
            
          } catch (error: any) {
            results.failed++;
            results.errors.push(`Row ${data.indexOf(row) + 1}: ${error.message}`);
          }
        }
        
        ctx.log(`Excel import completed: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            results: {
              total: data.length,
              ...results
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Error importing users from Excel:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to import users from Excel',
            message: error.message
          })
        };
      }
    }
  )
});

// POST /api/users/bulk-update - Bulk update users
app.http('bulkUpdateUsers', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/bulk-update',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_EDIT,
    auditMiddleware(AuditActions.USERS_BULK_UPDATED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = BulkUserUpdateSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid bulk update data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const { userIds, updates } = parsed.data;
        const user = authResult.user!;
        const results = {
          success: 0,
          failed: 0,
          errors: [] as string[]
        };
        
        const usersContainer = getContainer('users');
        
        for (const userId of userIds) {
          try {
            const { resource: existingUser } = await usersContainer.item(userId).read();
            
            if (!existingUser) {
              results.failed++;
              results.errors.push(`User ${userId}: Not found`);
              continue;
            }
            
            // Update user
            const updatedUser = {
              ...existingUser,
              ...updates,
              updatedAt: new Date().toISOString(),
              updatedBy: user.email
            };
            
            await usersContainer.item(userId).replace(updatedUser);
            results.success++;
            
          } catch (error: any) {
            results.failed++;
            results.errors.push(`User ${userId}: ${error.message}`);
          }
        }
        
        ctx.log(`Bulk update completed: ${results.success} success, ${results.failed} failed`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            results: {
              total: userIds.length,
              ...results
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Error bulk updating users:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to bulk update users',
            message: error.message
          })
        };
      }
    }
  )
});

// GET /api/users/export-excel - Export users to Excel
app.http('exportUsersToExcel', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/export-excel',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_VIEW,
    auditMiddleware(AuditActions.USERS_EXPORTED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const userType = req.query.get('userType') || 'all';
        const filters: any = {};
        
        // Parse query parameters for filters
        if (req.query.get('department')) filters.department = req.query.get('department');
        if (req.query.get('office')) filters.office = req.query.get('office');
        if (req.query.get('isActive') !== null) filters.isActive = req.query.get('isActive') === 'true';
        if (req.query.get('accessLevel')) filters.accessLevel = req.query.get('accessLevel');
        
        const user = authResult.user!;
        const usersContainer = getContainer('users');
        
        let query = 'SELECT * FROM c WHERE c.partitionKey = @tenantId';
        const parameters = [{ name: '@tenantId', value: user.tenantId }];
        
        if (userType !== 'all') {
          query += ' AND c.type = @type';
          parameters.push({ name: '@type', value: userType === 'employees' ? 'employee' : 'client' });
        }
        
        if (filters.department) {
          query += ' AND c.department = @department';
          parameters.push({ name: '@department', value: filters.department });
        }
        
        if (filters.office) {
          query += ' AND c.office = @office';
          parameters.push({ name: '@office', value: filters.office });
        }
        
        if (filters.isActive !== undefined) {
          query += ' AND c.isActive = @isActive';
          parameters.push({ name: '@isActive', value: filters.isActive });
        }
        
        if (filters.accessLevel) {
          query += ' AND c.accessLevel = @accessLevel';
          parameters.push({ name: '@accessLevel', value: filters.accessLevel });
        }
        
        const { resources: users } = await usersContainer.items.query({
          query,
          parameters
        }).fetchAll();
        
        // Generate Excel data
        let excelData: any[] = [];
        let headers: string[] = [];
        
        if (userType === 'employees' || userType === 'all') {
          const employees = users.filter(u => u.type === 'employee');
          if (employees.length > 0) {
            headers = [
              'First Name', 'Last Name', 'Email', 'Classification', 'Office', 
              'Role', 'Department', 'Phone', 'Is Active', 'Skills', 'Certifications'
            ];
            
            excelData = employees.map(emp => ({
              'First Name': emp.firstName || '',
              'Last Name': emp.lastName || '',
              'Email': emp.email || '',
              'Classification': emp.classification || '',
              'Office': emp.office || '',
              'Role': emp.role || '',
              'Department': emp.department || '',
              'Phone': emp.phone || '',
              'Is Active': emp.isActive ? 'Yes' : 'No',
              'Skills': emp.skills ? emp.skills.join(', ') : '',
              'Certifications': emp.certifications ? emp.certifications.join(', ') : ''
            }));
          }
        }
        
        if (userType === 'clients' || userType === 'all') {
          const clients = users.filter(u => u.type === 'client');
          if (clients.length > 0) {
            if (userType === 'all' && excelData.length > 0) {
              // Add separator row for clients
              excelData.push({});
            }
            
            const clientHeaders = [
              'First Name', 'Last Name', 'Email', 'Phone', 'Firm Name', 
              'Firm Address', 'Business Type', 'Access Level', 'Is Active'
            ];
            
            if (userType === 'clients') {
              headers = clientHeaders;
            }
            
            const clientData = clients.map(client => ({
              'First Name': client.firstName || '',
              'Last Name': client.lastName || '',
              'Email': client.email || '',
              'Phone': client.phone || '',
              'Firm Name': client.firmName || '',
              'Firm Address': client.firmAddress || '',
              'Business Type': client.businessType || '',
              'Access Level': client.accessLevel || '',
              'Is Active': client.isActive ? 'Yes' : 'No'
            }));
            
            excelData = userType === 'all' ? [...excelData, ...clientData] : clientData;
          }
        }
        
        // Generate CSV content (simplified Excel export)
        let csvContent = '';
        if (headers.length > 0) {
          csvContent += headers.join(',') + '\n';
          excelData.forEach(row => {
            const values = headers.map(header => {
              const value = row[header] || '';
              // Escape commas and quotes in CSV
              if (value.includes(',') || value.includes('"')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            });
            csvContent += values.join(',') + '\n';
          });
        }
        
        ctx.log(`Excel export completed: ${excelData.length} records for ${user.email}`);
        
        return {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
            'Cache-Control': 'no-cache'
          },
          body: csvContent
        };
        
      } catch (error: any) {
        ctx.error('Error exporting users to Excel:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to export users to Excel',
            message: error.message
          })
        };
      }
    }
  )
});

// GET /api/users/search - Search users
app.http('searchUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/search',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_VIEW,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const query = req.query.get('query');
        const userType = req.query.get('userType');
        
        if (!query || query.trim().length < 2) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Search query must be at least 2 characters long'
            })
          };
        }
        
        const user = authResult.user!;
        const usersContainer = getContainer('users');
        
        let searchQuery = `
          SELECT * FROM c 
          WHERE c.partitionKey = @tenantId 
          AND (
            CONTAINS(LOWER(c.firstName), LOWER(@searchQuery)) OR
            CONTAINS(LOWER(c.lastName), LOWER(@searchQuery)) OR
            CONTAINS(LOWER(c.email), LOWER(@searchQuery))
          )
        `;
        
        const parameters = [
          { name: '@tenantId', value: user.tenantId },
          { name: '@searchQuery', value: query.trim() }
        ];
        
        if (userType) {
          searchQuery += ' AND c.type = @type';
          parameters.push({ name: '@type', value: userType === 'employees' ? 'employee' : 'client' });
        }
        
        searchQuery += ' ORDER BY c.firstName, c.lastName';
        
        const { resources: users } = await usersContainer.items.query({
          query: searchQuery,
          parameters
        }).fetchAll();
        
        ctx.log(`User search completed: "${query}" returned ${users.length} results`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            users: users.map(u => ({
              id: u.id,
              type: u.type,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              classification: u.classification,
              office: u.office,
              isActive: u.isActive,
              accessLevel: u.accessLevel
            }))
          })
        };
        
      } catch (error: any) {
        ctx.error('Error searching users:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to search users',
            message: error.message
          })
        };
      }
    }
  )
});

// GET /api/users/:id/activity - Get user activity
app.http('getUserActivity', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{id}/activity',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_VIEW,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const userId = req.params.id;
        const limit = parseInt(req.query.get('limit') || '50');
        
        const user = authResult.user!;
        
        // Get audit logs for the user
        const auditContainer = getContainer('audit');
        const { resources: activities } = await auditContainer.items.query({
          query: `
            SELECT * FROM c 
            WHERE c.userId = @userId 
            AND c.partitionKey = @tenantId 
            ORDER BY c.timestamp DESC
          `,
          parameters: [
            { name: '@userId', value: userId },
            { name: '@tenantId', value: user.tenantId }
          ]
        }).fetchAll();
        
        // Limit results
        const limitedActivities = activities.slice(0, limit);
        
        ctx.log(`User activity retrieved: ${limitedActivities.length} activities for user ${userId}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            activities: limitedActivities.map(activity => ({
              id: activity.id,
              action: activity.action,
              timestamp: activity.timestamp,
              details: activity.details,
              ipAddress: activity.ipAddress,
              userAgent: activity.userAgent
            }))
          })
        };
        
      } catch (error: any) {
        ctx.error('Error getting user activity:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to get user activity',
            message: error.message
          })
        };
      }
    }
  )
});

// POST /api/users/sync-azure-ad - Sync with Azure AD
app.http('syncWithAzureAD', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/sync-azure-ad',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_CREATE,
    auditMiddleware(AuditActions.USERS_SYNCED),
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const user = authResult.user!;
        
        // This would integrate with Microsoft Graph API to sync users
        // For now, return a mock response
        const results = {
          success: 0,
          failed: 0,
          skipped: 0,
          errors: [] as string[]
        };
        
        ctx.log(`Azure AD sync initiated by ${user.email}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            results: {
              total: 0,
              ...results
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Error syncing with Azure AD:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Failed to sync with Azure AD',
            message: error.message
          })
        };
      }
    }
  )
});

// Helper function to update department employee list
async function updateDepartmentEmployeeList(departmentId: string, employeeId: string, action: 'add' | 'remove') {
  const departmentsContainer = getContainer('departments');
  const { resource: department } = await departmentsContainer.item(departmentId).read();
  
  if (!department) return;
  
  let employees = department.employees || [];
  
  if (action === 'add') {
    if (!employees.includes(employeeId)) {
      employees.push(employeeId);
    }
  } else {
    employees = employees.filter(id => id !== employeeId);
  }
  
  await departmentsContainer.item(departmentId).patch([
    { op: 'replace', path: '/employees', value: employees },
    { op: 'replace', path: '/updatedAt', value: new Date().toISOString() }
  ]);
}
