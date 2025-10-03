/**
 * Deploy Enhanced User Management Database Schema
 * This script applies the enhanced user management database schema
 */

import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import { SecretClient } from '@azure/keyvault-secrets';

// Configuration
const COSMOS_ENDPOINT = process.env.COSMOS_DB_ENDPOINT || 'https://your-cosmos-account.documents.azure.com:443/';
const COSMOS_KEY = process.env.COSMOS_DB_KEY || 'your-cosmos-key';
const COSMOS_DATABASE = process.env.COSMOS_DB_DATABASE || 'FileSharingDB';
const KEY_VAULT_URL = process.env.AZURE_KEY_VAULT_URL || 'https://your-keyvault.vault.azure.net/';

// Enhanced User Management Schema for Cosmos DB
const ENHANCED_USER_SCHEMAS = {
  // Enhanced Employee Schema
  employee: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'employee',
    
    // Basic Information
    firstName: 'string',
    lastName: 'string',
    email: 'string',
    classification: 'string', // Manager, Senior, Associate, Junior
    office: 'string',
    role: 'string?',
    department: 'string?',
    departmentId: 'string?',
    managerId: 'string?',
    phone: 'string?',
    
    // Enhanced Fields
    isActive: 'boolean',
    permissions: 'string[]',
    skills: 'string[]',
    certifications: 'string[]',
    profilePicture: 'string?',
    emergencyContact: {
      name: 'string?',
      phone: 'string?',
      relationship: 'string?'
    },
    workSchedule: {
      startTime: 'string?',
      endTime: 'string?',
      timezone: 'string?',
      workDays: 'number[]'
    },
    
    // Metadata
    createdAt: 'string',
    updatedAt: 'string',
    createdBy: 'string',
    lastLoginAt: 'string?',
    updatedBy: 'string?',
    deletedAt: 'string?',
    deletedBy: 'string?'
  },
  
  // Enhanced Client Schema
  client: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'client',
    
    // Basic Information
    firstName: 'string',
    lastName: 'string',
    email: 'string',
    phone: 'string',
    firmName: 'string?',
    firmAddress: 'string?',
    businessType: 'string?',
    
    // Enhanced Fields
    isActive: 'boolean',
    accessLevel: 'string', // read, write, admin
    assignedServiceProvider: 'string?',
    documentsAccess: 'string[]',
    
    // Metadata
    createdAt: 'string',
    updatedAt: 'string',
    createdBy: 'string',
    lastActivityAt: 'string?',
    updatedBy: 'string?',
    deletedAt: 'string?',
    deletedBy: 'string?'
  },
  
  // Enhanced Department Schema
  department: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'department',
    
    name: 'string',
    description: 'string?',
    managerId: 'string',
    managerName: 'string',
    officeId: 'string?',
    employees: 'string[]', // Array of employee IDs
    
    permissions: {
      canCreateUsers: 'boolean',
      canManageDocuments: 'boolean',
      canApproveDocuments: 'boolean',
      canManageWorkflows: 'boolean'
    },
    
    hierarchy: {
      parentDepartmentId: 'string?',
      level: 'number',
      children: 'string[]'
    },
    
    // Metadata
    createdAt: 'string',
    updatedAt: 'string',
    createdBy: 'string',
    updatedBy: 'string?',
    deletedAt: 'string?',
    deletedBy: 'string?'
  },
  
  // User Permissions Schema
  userPermission: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'userPermission',
    
    userId: 'string',
    userType: 'string', // 'employee' or 'client'
    permission: 'string',
    resource: 'string?',
    isGranted: 'boolean',
    
    // Metadata
    createdAt: 'string',
    updatedAt: 'string'
  },
  
  // User Activity Schema
  userActivity: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'userActivity',
    
    userId: 'string',
    activityType: 'string', // 'login', 'logout', 'document_view', etc.
    description: 'string?',
    metadata: 'object?', // JSON metadata
    ipAddress: 'string?',
    userAgent: 'string?',
    
    // Metadata
    createdAt: 'string'
  },
  
  // User Import/Export Schema
  userImportExport: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'userImportExport',
    
    userId: 'string',
    importExportType: 'string', // 'import' or 'export'
    userType: 'string', // 'employees' or 'clients'
    fileName: 'string?',
    fileSize: 'number?',
    recordCount: 'number?',
    successCount: 'number?',
    failedCount: 'number?',
    skippedCount: 'number?',
    errors: 'string[]',
    status: 'string', // 'pending', 'processing', 'completed', 'failed'
    
    // Metadata
    createdAt: 'string',
    completedAt: 'string?'
  },
  
  // Azure AD Sync Schema
  azureAdSync: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'azureAdSync',
    
    syncType: 'string', // 'full', 'incremental', 'users', 'groups'
    status: 'string', // 'pending', 'running', 'completed', 'failed'
    startedAt: 'string',
    completedAt: 'string?',
    recordsProcessed: 'number',
    recordsCreated: 'number',
    recordsUpdated: 'number',
    recordsDeleted: 'number',
    errors: 'string[]',
    metadata: 'object?' // JSON metadata
  },
  
  // User Notifications Schema
  userNotification: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'userNotification',
    
    userId: 'string',
    notificationType: 'string', // 'info', 'warning', 'error', 'success'
    title: 'string',
    message: 'string',
    isRead: 'boolean',
    readAt: 'string?',
    actionUrl: 'string?',
    metadata: 'object?', // JSON metadata
    expiresAt: 'string?',
    
    // Metadata
    createdAt: 'string'
  },
  
  // User Settings Schema
  userSetting: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'userSetting',
    
    userId: 'string',
    settingKey: 'string',
    settingValue: 'string?',
    dataType: 'string', // 'string', 'number', 'boolean', 'json'
    isEncrypted: 'boolean',
    
    // Metadata
    createdAt: 'string',
    updatedAt: 'string'
  },
  
  // User Groups Schema
  userGroup: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'userGroup',
    
    name: 'string',
    description: 'string?',
    groupType: 'string', // 'security', 'distribution', 'dynamic'
    members: 'string[]', // Array of user IDs
    permissions: 'string[]', // Array of permissions
    isActive: 'boolean',
    
    // Metadata
    createdAt: 'string',
    updatedAt: 'string',
    createdBy: 'string',
    updatedBy: 'string?'
  },
  
  // User Group Membership Schema
  userGroupMembership: {
    id: 'string',
    partitionKey: 'string', // tenantId
    type: 'userGroupMembership',
    
    groupId: 'string',
    userId: 'string',
    userType: 'string', // 'employee' or 'client'
    joinedAt: 'string',
    joinedBy: 'string?'
  }
};

// Container configurations
const CONTAINER_CONFIGS = [
  {
    id: 'users',
    partitionKey: '/partitionKey',
    indexingPolicy: {
      includedPaths: [
        { path: '/partitionKey/*' },
        { path: '/type/*' },
        { path: '/email/*' },
        { path: '/firstName/*' },
        { path: '/lastName/*' },
        { path: '/isActive/*' },
        { path: '/classification/*' },
        { path: '/office/*' },
        { path: '/department/*' },
        { path: '/accessLevel/*' }
      ],
      excludedPaths: [
        { path: '/metadata/*' },
        { path: '/workSchedule/*' },
        { path: '/emergencyContact/*' }
      ]
    }
  },
  {
    id: 'departments',
    partitionKey: '/partitionKey',
    indexingPolicy: {
      includedPaths: [
        { path: '/partitionKey/*' },
        { path: '/type/*' },
        { path: '/name/*' },
        { path: '/managerId/*' },
        { path: '/officeId/*' },
        { path: '/isActive/*' }
      ]
    }
  },
  {
    id: 'userPermissions',
    partitionKey: '/partitionKey',
    indexingPolicy: {
      includedPaths: [
        { path: '/partitionKey/*' },
        { path: '/type/*' },
        { path: '/userId/*' },
        { path: '/userType/*' },
        { path: '/permission/*' },
        { path: '/isGranted/*' }
      ]
    }
  },
  {
    id: 'userActivity',
    partitionKey: '/partitionKey',
    indexingPolicy: {
      includedPaths: [
        { path: '/partitionKey/*' },
        { path: '/type/*' },
        { path: '/userId/*' },
        { path: '/activityType/*' },
        { path: '/createdAt/*' }
      ]
    }
  },
  {
    id: 'userNotifications',
    partitionKey: '/partitionKey',
    indexingPolicy: {
      includedPaths: [
        { path: '/partitionKey/*' },
        { path: '/type/*' },
        { path: '/userId/*' },
        { path: '/notificationType/*' },
        { path: '/isRead/*' },
        { path: '/createdAt/*' }
      ]
    }
  },
  {
    id: 'userSettings',
    partitionKey: '/partitionKey',
    indexingPolicy: {
      includedPaths: [
        { path: '/partitionKey/*' },
        { path: '/type/*' },
        { path: '/userId/*' },
        { path: '/settingKey/*' }
      ]
    }
  },
  {
    id: 'userGroups',
    partitionKey: '/partitionKey',
    indexingPolicy: {
      includedPaths: [
        { path: '/partitionKey/*' },
        { path: '/type/*' },
        { path: '/name/*' },
        { path: '/groupType/*' },
        { path: '/isActive/*' }
      ]
    }
  }
];

async function deployEnhancedUserManagement() {
  console.log('🚀 Starting Enhanced User Management deployment...');
  
  try {
    // Initialize Cosmos DB client
    const cosmosClient = new CosmosClient({
      endpoint: COSMOS_ENDPOINT,
      key: COSMOS_KEY
    });
    
    const database = cosmosClient.database(COSMOS_DATABASE);
    
    // Create or update containers
    console.log('📦 Creating/updating containers...');
    for (const config of CONTAINER_CONFIGS) {
      try {
        const { container } = await database.containers.createIfNotExists({
          id: config.id,
          partitionKey: config.partitionKey,
          indexingPolicy: config.indexingPolicy
        });
        console.log(`✅ Container '${config.id}' is ready`);
      } catch (error) {
        console.error(`❌ Failed to create container '${config.id}':`, error);
        throw error;
      }
    }
    
    // Create sample data for testing
    console.log('📝 Creating sample data...');
    await createSampleData(database);
    
    // Create stored procedures and triggers
    console.log('⚙️ Creating stored procedures...');
    await createStoredProcedures(database);
    
    console.log('✅ Enhanced User Management deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

async function createSampleData(database: any) {
  const usersContainer = database.container('users');
  const departmentsContainer = database.container('departments');
  
  // Create sample departments
  const sampleDepartments = [
    {
      id: 'dept-engineering',
      partitionKey: 'tenant-1',
      type: 'department',
      name: 'Engineering',
      description: 'Software development and technical operations',
      managerId: 'emp-manager-1',
      managerName: 'John Smith',
      officeId: 'office-nyc',
      employees: [],
      permissions: {
        canCreateUsers: false,
        canManageDocuments: true,
        canApproveDocuments: true,
        canManageWorkflows: true
      },
      hierarchy: {
        parentDepartmentId: null,
        level: 1,
        children: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    },
    {
      id: 'dept-marketing',
      partitionKey: 'tenant-1',
      type: 'department',
      name: 'Marketing',
      description: 'Marketing and communications',
      managerId: 'emp-manager-2',
      managerName: 'Jane Doe',
      officeId: 'office-chicago',
      employees: [],
      permissions: {
        canCreateUsers: false,
        canManageDocuments: true,
        canApproveDocuments: false,
        canManageWorkflows: false
      },
      hierarchy: {
        parentDepartmentId: null,
        level: 1,
        children: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    }
  ];
  
  for (const dept of sampleDepartments) {
    try {
      await departmentsContainer.items.create(dept);
      console.log(`✅ Created sample department: ${dept.name}`);
    } catch (error) {
      console.log(`⚠️ Department ${dept.name} might already exist`);
    }
  }
  
  // Create sample employees
  const sampleEmployees = [
    {
      id: 'emp-manager-1',
      partitionKey: 'tenant-1',
      type: 'employee',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
      classification: 'Manager',
      office: 'New York',
      role: 'Engineering Manager',
      department: 'Engineering',
      departmentId: 'dept-engineering',
      managerId: null,
      phone: '+1-555-0123',
      isActive: true,
      permissions: ['documents:view', 'documents:create', 'documents:edit', 'users:view', 'workflow:manage'],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Leadership'],
      certifications: ['AWS Certified Solutions Architect', 'PMP'],
      emergencyContact: {
        name: 'Mary Smith',
        phone: '+1-555-0124',
        relationship: 'Spouse'
      },
      workSchedule: {
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'EST',
        workDays: [1, 2, 3, 4, 5]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    },
    {
      id: 'emp-manager-2',
      partitionKey: 'tenant-1',
      type: 'employee',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@company.com',
      classification: 'Manager',
      office: 'Chicago',
      role: 'Marketing Manager',
      department: 'Marketing',
      departmentId: 'dept-marketing',
      managerId: null,
      phone: '+1-555-0125',
      isActive: true,
      permissions: ['documents:view', 'documents:create', 'documents:edit'],
      skills: ['Digital Marketing', 'Content Strategy', 'Brand Management'],
      certifications: ['Google Analytics Certified', 'HubSpot Content Marketing'],
      emergencyContact: {
        name: 'Robert Doe',
        phone: '+1-555-0126',
        relationship: 'Spouse'
      },
      workSchedule: {
        startTime: '08:00',
        endTime: '16:00',
        timezone: 'CST',
        workDays: [1, 2, 3, 4, 5]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    }
  ];
  
  for (const emp of sampleEmployees) {
    try {
      await usersContainer.items.create(emp);
      console.log(`✅ Created sample employee: ${emp.firstName} ${emp.lastName}`);
    } catch (error) {
      console.log(`⚠️ Employee ${emp.firstName} ${emp.lastName} might already exist`);
    }
  }
  
  // Create sample clients
  const sampleClients = [
    {
      id: 'client-1',
      partitionKey: 'tenant-1',
      type: 'client',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@client.com',
      phone: '+1-555-0200',
      firmName: 'Johnson & Associates',
      firmAddress: '123 Business St, New York, NY 10001',
      businessType: 'law',
      isActive: true,
      accessLevel: 'read',
      assignedServiceProvider: 'emp-manager-1',
      documentsAccess: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    }
  ];
  
  for (const client of sampleClients) {
    try {
      await usersContainer.items.create(client);
      console.log(`✅ Created sample client: ${client.firstName} ${client.lastName}`);
    } catch (error) {
      console.log(`⚠️ Client ${client.firstName} ${client.lastName} might already exist`);
    }
  }
}

async function createStoredProcedures(database: any) {
  // Create stored procedure for bulk user operations
  const bulkUserProcedure = {
    id: 'bulkUserOperations',
    body: `
      function bulkUserOperations(operation, users) {
        var collection = getContext().getCollection();
        var response = getContext().getResponse();
        
        var results = {
          success: 0,
          failed: 0,
          errors: []
        };
        
        function processUser(user, index) {
          try {
            if (operation === 'create') {
              collection.createDocument(collection.getSelfLink(), user, function(err, doc) {
                if (err) {
                  results.failed++;
                  results.errors.push('User ' + index + ': ' + err.message);
                } else {
                  results.success++;
                }
                
                if (index === users.length - 1) {
                  response.setBody(results);
                }
              });
            } else if (operation === 'update') {
              collection.replaceDocument(user._self, user, function(err, doc) {
                if (err) {
                  results.failed++;
                  results.errors.push('User ' + index + ': ' + err.message);
                } else {
                  results.success++;
                }
                
                if (index === users.length - 1) {
                  response.setBody(results);
                }
              });
            }
          } catch (error) {
            results.failed++;
            results.errors.push('User ' + index + ': ' + error.message);
            
            if (index === users.length - 1) {
              response.setBody(results);
            }
          }
        }
        
        for (var i = 0; i < users.length; i++) {
          processUser(users[i], i);
        }
      }
    `
  };
  
  // Create stored procedure for user search
  const userSearchProcedure = {
    id: 'searchUsers',
    body: `
      function searchUsers(query, userType, limit) {
        var collection = getContext().getCollection();
        var response = getContext().getResponse();
        
        var searchQuery = 'SELECT * FROM c WHERE ';
        
        if (userType) {
          searchQuery += 'c.type = "' + userType + '" AND ';
        }
        
        searchQuery += '(CONTAINS(LOWER(c.firstName), LOWER("' + query + '")) OR ';
        searchQuery += 'CONTAINS(LOWER(c.lastName), LOWER("' + query + '")) OR ';
        searchQuery += 'CONTAINS(LOWER(c.email), LOWER("' + query + '")))';
        
        if (limit) {
          searchQuery += ' ORDER BY c.firstName, c.lastName LIMIT ' + limit;
        }
        
        collection.queryDocuments(
          collection.getSelfLink(),
          searchQuery,
          function(err, docs) {
            if (err) {
              response.setBody({ error: err.message });
            } else {
              response.setBody({ users: docs });
            }
          }
        );
      }
    `
  };
  
  // Deploy stored procedures to users container
  const usersContainer = database.container('users');
  
  try {
    await usersContainer.scripts.storedProcedures.create(bulkUserProcedure);
    console.log('✅ Created bulkUserOperations stored procedure');
  } catch (error) {
    console.log('⚠️ bulkUserOperations procedure might already exist');
  }
  
  try {
    await usersContainer.scripts.storedProcedures.create(userSearchProcedure);
    console.log('✅ Created searchUsers stored procedure');
  } catch (error) {
    console.log('⚠️ searchUsers procedure might already exist');
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployEnhancedUserManagement()
    .then(() => {
      console.log('🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment failed:', error);
      process.exit(1);
    });
}

export { deployEnhancedUserManagement, ENHANCED_USER_SCHEMAS };

