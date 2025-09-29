# 🎯 Implementation Plan - Final Sprint

*Детальный план реализации последних 5% функциональности проекта*

---

## 📊 **АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ**

### **✅ Что уже реализовано:**
- **Teams Integration:** 92% - полная SDK интеграция, компоненты, API
- **SharePoint Integration:** 97% - автосоздание сайтов, документооборот
- **End User Context:** 100% - полная реализация и интеграция
- **Document Operations UI:** 85% - диалоги, формы, обработчики событий
- **RBAC Frontend:** 100% - 9 ролей, 63 разрешения, полные UI компоненты
- **Authentication:** 95% - OnBehalfOfUserCredential во всех функциях

### **⚠️ Что нужно доделать:**
1. **Document Operations Backend:** реальные операции вместо console.log
2. **RBAC Middleware:** централизованная защита всех API endpoints
3. **Workflow Engine:** автоматизация процессов документооборота

---

## 📋 **ПЛАН РЕАЛИЗАЦИИ - 3 НЕДЕЛИ**

### **WEEK 1: ADVANCED DOCUMENT OPERATIONS (Days 1-5)**

#### **Day 1-2: Backend Advanced Operations**

**Создаем:** `api/src/functions/advancedDocumentOperations.ts`

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';

// Schemas для валидации
const PinDocumentSchema = z.object({
  documentId: z.string().min(1),
  pinned: z.boolean()
});

const MoveDocumentSchema = z.object({
  documentIds: z.array(z.string()),
  targetFolder: z.string().min(1),
  moveType: z.enum(['move', 'copy'])
});

const BulkOperationSchema = z.object({
  documentIds: z.array(z.string()),
  operation: z.enum(['delete', 'archive', 'restore']),
  metadata?: z.record(z.any())
});

// PIN TO TOP functionality
app.http('pinDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/{documentId}/pin',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Authentication
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      return { status: 401, body: JSON.stringify({ error: 'No access token' }) };
    }

    try {
      const credential = new OnBehalfOfUserCredential(accessToken, config);
      const userInfo = await credential.getUserInfo();
      
      const documentId = req.params.get('documentId');
      const { pinned } = await req.json();

      const documentsContainer = getContainer('documents');
      const { resource: document } = await documentsContainer.item(documentId).read();

      if (!document) {
        return { status: 404, body: JSON.stringify({ error: 'Document not found' }) };
      }

      // Check permissions (user must be owner or editor)
      const hasPermission = document.permissions.owners.includes(userInfo.userPrincipalName) ||
                           document.permissions.editors.includes(userInfo.userPrincipalName);
      
      if (!hasPermission) {
        return { status: 403, body: JSON.stringify({ error: 'Insufficient permissions' }) };
      }

      // Update document
      const updateOps = [
        { op: pinned ? 'add' : 'remove', path: '/pinned', value: pinned },
        { op: 'add', path: '/pinnedBy', value: userInfo.userPrincipalName },
        { op: 'add', path: '/pinnedAt', value: new Date().toISOString() },
        { op: 'add', path: '/lastModified', value: new Date().toISOString() }
      ];

      await documentsContainer.item(documentId).patch(updateOps);

      // Log activity
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `pin-${documentId}-${Date.now()}`,
        partitionKey: userInfo.tenantId,
        type: 'document-pin',
        documentId,
        userId: userInfo.objectId,
        userName: userInfo.displayName,
        action: pinned ? 'pinned' : 'unpinned',
        timestamp: new Date().toISOString()
      });

      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          pinned,
          documentId,
          pinnedBy: userInfo.displayName,
          pinnedAt: new Date().toISOString()
        })
      };

    } catch (error: any) {
      ctx.error('Pin document error:', error);
      return { status: 500, body: JSON.stringify({ error: error.message }) };
    }
  }
});

// MOVE/COPY DOCUMENTS functionality
app.http('moveDocuments', {
  methods: ['POST'],
  authLevel: 'anonymous', 
  route: 'documents/move',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Similar authentication pattern...
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!accessToken) return { status: 401, body: JSON.stringify({ error: 'No access token' }) };

    try {
      const credential = new OnBehalfOfUserCredential(accessToken, config);
      const userInfo = await credential.getUserInfo();
      
      const { documentIds, targetFolder, moveType } = await req.json();
      const documentsContainer = getContainer('documents');
      
      const results = [];
      
      for (const documentId of documentIds) {
        const { resource: document } = await documentsContainer.item(documentId).read();
        
        if (!document) {
          results.push({ documentId, success: false, error: 'Document not found' });
          continue;
        }

        // Check permissions
        const hasPermission = document.permissions.owners.includes(userInfo.userPrincipalName) ||
                             document.permissions.editors.includes(userInfo.userPrincipalName);
        
        if (!hasPermission) {
          results.push({ documentId, success: false, error: 'Insufficient permissions' });
          continue;
        }

        if (moveType === 'copy') {
          // Create copy
          const newDocument = {
            ...document,
            id: `copy-${documentId}-${Date.now()}`,
            name: `Copy of ${document.name}`,
            folderPath: targetFolder,
            createdAt: new Date().toISOString(),
            createdBy: userInfo.userPrincipalName,
            lastModified: new Date().toISOString()
          };
          
          await documentsContainer.items.create(newDocument);
          results.push({ documentId, success: true, action: 'copied', newId: newDocument.id });
          
        } else {
          // Move document
          const updateOps = [
            { op: 'replace', path: '/folderPath', value: targetFolder },
            { op: 'add', path: '/movedAt', value: new Date().toISOString() },
            { op: 'add', path: '/movedBy', value: userInfo.userPrincipalName },
            { op: 'add', path: '/lastModified', value: new Date().toISOString() }
          ];

          await documentsContainer.item(documentId).patch(updateOps);
          results.push({ documentId, success: true, action: 'moved' });
        }
      }

      // Log bulk activity
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `bulk-${moveType}-${Date.now()}`,
        partitionKey: userInfo.tenantId,
        type: 'bulk-operation',
        operation: moveType,
        documentIds,
        targetFolder,
        userId: userInfo.objectId,
        userName: userInfo.displayName,
        results,
        timestamp: new Date().toISOString()
      });

      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          operation: moveType,
          results,
          targetFolder
        })
      };

    } catch (error: any) {
      ctx.error('Move documents error:', error);
      return { status: 500, body: JSON.stringify({ error: error.message }) };
    }
  }
});

// BULK OPERATIONS functionality  
app.http('bulkDocumentOperations', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/bulk',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Similar pattern for bulk delete, archive, restore operations...
    // Implementation details follow same authentication and permission patterns
  }
});
```

#### **Day 3-4: Frontend Integration**

**Обновляем:** `src/pages/documents/ui/BaseDocumentsPage.tsx`

```typescript
// Replace console.log implementations with real API calls
const handleDocumentOperation = async (operation: string, documentIds: string[], data?: any) => {
  try {
    switch (operation) {
      case 'pin':
        for (const documentId of documentIds) {
          await DocumentApiClient.pinDocument(documentId, true);
        }
        break;
        
      case 'move':
        await DocumentApiClient.moveDocuments(documentIds, data.targetFolder, 'move');
        break;
        
      case 'copy':
        await DocumentApiClient.moveDocuments(documentIds, data.targetFolder, 'copy');
        break;
        
      case 'bulk-delete':
        await DocumentApiClient.bulkOperation(documentIds, 'delete');
        break;
        
      // ... other operations
    }
    
    // Refresh document list
    await refreshDocuments();
    setSelectedItems(new Set());
    
  } catch (error) {
    console.error(`${operation} operation failed:`, error);
    notificationService.error('Operation Failed', error.message);
  }
};
```

**Создаем:** `src/shared/api/advancedDocumentApi.ts`

```typescript
export class AdvancedDocumentApiClient {
  static async pinDocument(documentId: string, pinned: boolean): Promise<any> {
    return await apiClient.post(`/documents/${documentId}/pin`, { pinned });
  }

  static async moveDocuments(documentIds: string[], targetFolder: string, moveType: 'move' | 'copy'): Promise<any> {
    return await apiClient.post('/documents/move', {
      documentIds,
      targetFolder,
      moveType
    });
  }

  static async bulkOperation(documentIds: string[], operation: string, metadata?: any): Promise<any> {
    return await apiClient.post('/documents/bulk', {
      documentIds,
      operation,
      metadata
    });
  }
}
```

#### **Day 5: Testing & UI Polish**
- Comprehensive testing всех new operations
- UI improvements для bulk selection
- Error handling и user feedback
- Integration testing с SharePoint

---

### **WEEK 2: RBAC MIDDLEWARE (Days 1-5)**

#### **Day 1-2: Core RBAC Middleware**

**Создаем:** `api/src/shared/middleware/rbacMiddleware.ts`

```typescript
import { HttpRequest } from '@azure/functions';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../db/cosmos';
import config from '../../config';

interface RBACResult {
  allowed: boolean;
  user?: any;
  roles?: string[];
  permissions?: string[];
  error?: string;
}

export const requirePermissions = (requiredPermissions: string[]) => {
  return async (req: HttpRequest): Promise<RBACResult> => {
    try {
      // Extract and validate token
      const token = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return { allowed: false, error: 'No authentication token provided' };
      }

      // Get user info using OnBehalfOfUserCredential
      const credential = new OnBehalfOfUserCredential(token, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await credential.getUserInfo();
      
      // Get user roles from CosmosDB
      const usersContainer = getContainer('users');
      let userRecord;
      
      try {
        const { resource } = await usersContainer.item(userInfo.objectId).read();
        userRecord = resource;
      } catch (error) {
        // User not found in database - create default record
        userRecord = {
          id: userInfo.objectId,
          partitionKey: userInfo.tenantId,
          email: userInfo.userPrincipalName,
          displayName: userInfo.displayName,
          roles: ['EndUser'], // Default role
          createdAt: new Date().toISOString()
        };
        
        await usersContainer.items.create(userRecord);
      }

      // Calculate user permissions from roles
      const userPermissions = await calculatePermissionsFromRoles(userRecord.roles);
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return {
          allowed: false,
          user: userInfo,
          roles: userRecord.roles,
          permissions: userPermissions,
          error: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
        };
      }

      return {
        allowed: true,
        user: userInfo,
        roles: userRecord.roles,
        permissions: userPermissions
      };

    } catch (error) {
      return {
        allowed: false,
        error: `Authentication failed: ${error.message}`
      };
    }
  };
};

async function calculatePermissionsFromRoles(roles: string[]): Promise<string[]> {
  // Role to permissions mapping
  const rolePermissions: Record<string, string[]> = {
    'Administrator': [
      'USERS_CREATE', 'USERS_READ', 'USERS_UPDATE', 'USERS_DELETE',
      'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE', 'DOCUMENTS_DELETE',
      'STORAGE_CONFIG', 'VALIDATION_CONFIG', 'APPROVAL_CONFIG',
      'SHAREPOINT_MANAGE', 'TEAMS_MANAGE'
    ],
    'Manager': [
      'USERS_READ', 'USERS_UPDATE',
      'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE', 'DOCUMENTS_DELETE',
      'APPROVAL_MANAGE', 'SHAREPOINT_READ'
    ],
    'Employee': [
      'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE',
      'SHAREPOINT_READ'
    ],
    'EndUser': [
      'DOCUMENTS_READ'
    ]
  };

  const allPermissions = new Set<string>();
  
  for (const role of roles) {
    const permissions = rolePermissions[role] || [];
    permissions.forEach(permission => allPermissions.add(permission));
  }

  return Array.from(allPermissions);
}

// Helper function to create RBAC-protected Azure Function
export const createProtectedFunction = (
  requiredPermissions: string[],
  handler: (req: HttpRequest, context: any, authResult: RBACResult) => Promise<any>
) => {
  return async (req: HttpRequest, context: any) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      };
    }

    // Check RBAC
    const authResult = await requirePermissions(requiredPermissions)(req);
    
    if (!authResult.allowed) {
      return {
        status: authResult.error?.includes('token') ? 401 : 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify({ 
          error: authResult.error,
          requiredPermissions 
        })
      };
    }

    // Log access for audit
    await logAccess(authResult.user, req, requiredPermissions);

    // Call the actual handler
    return await handler(req, context, authResult);
  };
};

async function logAccess(user: any, req: HttpRequest, permissions: string[]) {
  try {
    const auditContainer = getContainer('audit-logs');
    await auditContainer.items.create({
      id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      partitionKey: user.tenantId,
      type: 'api-access',
      userId: user.objectId,
      userDisplayName: user.displayName,
      endpoint: req.url,
      method: req.method,
      requiredPermissions: permissions,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('User-Agent')
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to log access:', error);
  }
}
```

#### **Day 3-4: Apply Middleware to All Functions**

**Обновляем все API функции для использования middleware:**

```typescript
// Example: api/src/functions/documents.ts
import { createProtectedFunction } from '../shared/middleware/rbacMiddleware';

app.http('getDocuments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents',
  handler: createProtectedFunction(
    ['DOCUMENTS_READ'], // Required permissions
    async (req, context, authResult) => {
      // Original function logic here
      // authResult.user contains authenticated user info
      // authResult.permissions contains user's permissions
      
      const container = getContainer('documents');
      const tenantId = authResult.user.tenantId;
      
      // Filter documents based on user's tenant and permissions
      const query = {
        query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId ORDER BY c.lastModified DESC',
        parameters: [{ name: '@tenantId', value: tenantId }]
      };
      
      const { resources } = await container.items.query(query).fetchAll();
      
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resources)
      };
    }
  )
});
```

#### **Day 5: Testing & Audit System**
- Test all protected endpoints
- Verify permission-based access
- Implement audit log viewing interface
- Role assignment testing

---

### **WEEK 3: WORKFLOW ENGINE (Days 1-5)**

#### **Day 1-3: Core Workflow Engine**

**Создаем:** `api/src/functions/workflowEngine.ts`

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createProtectedFunction } from '../shared/middleware/rbacMiddleware';
import { getContainer } from '../shared/db/cosmos';

interface WorkflowInstance {
  id: string;
  partitionKey: string;
  documentId: string;
  type: 'approval' | 'review' | 'signature';
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  businessRules?: any;
}

interface WorkflowStep {
  id: string;
  name: string;
  assigneeId: string;
  assigneeName: string;
  action: 'approve' | 'review' | 'sign' | 'notify';
  status: 'pending' | 'completed' | 'skipped' | 'rejected';
  completedAt?: string;
  completedBy?: string;
  comments?: string;
  deadline?: string;
}

// CREATE WORKFLOW
app.http('createWorkflow', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'workflows',
  handler: createProtectedFunction(
    ['DOCUMENTS_UPDATE', 'APPROVAL_MANAGE'],
    async (req, context, authResult) => {
      const { documentId, workflowType, approvers, businessRules } = await req.json();
      
      // Generate workflow steps based on type and approvers
      const steps: WorkflowStep[] = approvers.map((approver: any, index: number) => ({
        id: `step-${index + 1}`,
        name: `${workflowType} - Step ${index + 1}`,
        assigneeId: approver.id,
        assigneeName: approver.name,
        action: workflowType === 'approval' ? 'approve' : 'review',
        status: 'pending',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));

      const workflow: WorkflowInstance = {
        id: `workflow-${documentId}-${Date.now()}`,
        partitionKey: authResult.user.tenantId,
        documentId,
        type: workflowType,
        steps,
        currentStep: 0,
        status: 'pending',
        createdBy: authResult.user.userPrincipalName,
        createdAt: new Date().toISOString(),
        businessRules
      };

      // Save workflow
      const workflowsContainer = getContainer('workflows');
      await workflowsContainer.items.create(workflow);

      // Send initial notifications
      await sendWorkflowNotifications(workflow, steps[0]);

      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          workflowId: workflow.id,
          currentStep: steps[0]
        })
      };
    }
  )
});

// ADVANCE WORKFLOW  
app.http('advanceWorkflow', {
  methods: ['POST'],
  authLevel: 'anonymous', 
  route: 'workflows/{workflowId}/advance',
  handler: createProtectedFunction(
    ['DOCUMENTS_UPDATE'],
    async (req, context, authResult) => {
      const workflowId = req.params.get('workflowId');
      const { action, comments } = await req.json();
      
      const workflowsContainer = getContainer('workflows');
      const { resource: workflow } = await workflowsContainer.item(workflowId).read();
      
      if (!workflow) {
        return { status: 404, body: JSON.stringify({ error: 'Workflow not found' }) };
      }

      // Validate user can perform this action
      const currentStep = workflow.steps[workflow.currentStep];
      if (currentStep.assigneeId !== authResult.user.objectId) {
        return { status: 403, body: JSON.stringify({ error: 'Not authorized for this step' }) };
      }

      // Update current step
      workflow.steps[workflow.currentStep] = {
        ...currentStep,
        status: action === 'approve' || action === 'review' ? 'completed' : 'rejected',
        completedAt: new Date().toISOString(),
        completedBy: authResult.user.userPrincipalName,
        comments
      };

      // Advance workflow
      if (action === 'approve' || action === 'review') {
        workflow.currentStep++;
        
        if (workflow.currentStep >= workflow.steps.length) {
          // Workflow completed
          workflow.status = 'completed';
          workflow.completedAt = new Date().toISOString();
          
          // Update document status
          await updateDocumentStatus(workflow.documentId, 'approved');
        } else {
          // Move to next step
          workflow.status = 'in-progress';
          await sendWorkflowNotifications(workflow, workflow.steps[workflow.currentStep]);
        }
      } else {
        // Workflow rejected
        workflow.status = 'cancelled';
        await updateDocumentStatus(workflow.documentId, 'rejected');
      }

      // Save updated workflow
      await workflowsContainer.item(workflowId).patch([
        { op: 'replace', path: '/steps', value: workflow.steps },
        { op: 'replace', path: '/currentStep', value: workflow.currentStep },
        { op: 'replace', path: '/status', value: workflow.status },
        { op: 'add', path: '/lastModified', value: new Date().toISOString() }
      ]);

      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          workflow: workflow,
          nextStep: workflow.currentStep < workflow.steps.length ? 
                   workflow.steps[workflow.currentStep] : null
        })
      };
    }
  )
});

async function sendWorkflowNotifications(workflow: WorkflowInstance, step: WorkflowStep) {
  // Send Teams notification, email, etc.
  // Implementation depends on notification preferences
}

async function updateDocumentStatus(documentId: string, status: string) {
  const documentsContainer = getContainer('documents');
  await documentsContainer.item(documentId).patch([
    { op: 'replace', path: '/status', value: status },
    { op: 'add', path: '/lastModified', value: new Date().toISOString() }
  ]);
}
```

#### **Day 4-5: Frontend Workflow UI & Testing**

**Создаем workflow UI components и тестируем всю систему**

---

## 🎯 **SUCCESS CRITERIA**

### **Week 1 Completion:**
- [ ] Pin to Top functionality working
- [ ] Move/Copy between folders functional  
- [ ] Bulk operations implemented
- [ ] SharePoint integration maintained
- [ ] All document operations from Project Description working

### **Week 2 Completion:**
- [ ] All API endpoints protected with RBAC
- [ ] Permission-based data filtering
- [ ] Audit logging for all operations
- [ ] Role management through UI working

### **Week 3 Completion:**  
- [ ] Document approval workflows functional
- [ ] Multi-step processes working
- [ ] Teams notifications integrated
- [ ] Workflow history and reporting

---

## 🚀 **READY FOR EXECUTION**

**Статус:** Plan finalized, ready to begin implementation  
**First Task:** Advanced Document Operations Backend  
**Timeline:** 3 weeks to 100% project completion  

*Implementation Plan Created: January 2025* ✅
