import { HttpRequest, InvocationContext } from '@azure/functions';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../db/cosmos';
import config from '../../config';
import { z } from 'zod';

export interface RBACResult {
  allowed: boolean;
  user?: {
    objectId: string;
    userPrincipalName: string;
    displayName: string;
    email: string;
    tenantId: string;
  };
  roles?: string[];
  permissions?: string[];
  error?: string;
}

export interface RBACConfig {
  requiredPermissions: string[];
  allowAnonymous?: boolean;
  requireOwnership?: boolean; // For document-specific operations
  customValidator?: (user: any, context: any) => Promise<boolean>;
}

// Standard RBAC Permissions mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Administrator': [
    'USERS_CREATE', 'USERS_READ', 'USERS_UPDATE', 'USERS_DELETE',
    'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE', 'DOCUMENTS_DELETE',
    'DOCUMENTS_ADMIN',
    'STORAGE_CONFIG', 'VALIDATION_CONFIG', 'APPROVAL_CONFIG',
    'SHAREPOINT_MANAGE', 'TEAMS_MANAGE',
    'ENDUSERS_CREATE', 'ENDUSERS_READ', 'ENDUSERS_UPDATE', 'ENDUSERS_DELETE',
    'ACTIVITIES_READ', 'AUDIT_READ'
  ],
  'Manager': [
    'USERS_READ', 'USERS_UPDATE',
    'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE', 'DOCUMENTS_DELETE',
    'APPROVAL_MANAGE', 'SHAREPOINT_READ', 'TEAMS_READ',
    'ENDUSERS_CREATE', 'ENDUSERS_READ', 'ENDUSERS_UPDATE',
    'ACTIVITIES_READ'
  ],
  'Employee': [
    'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE',
    'SHAREPOINT_READ', 'TEAMS_READ',
    'ENDUSERS_READ'
  ],
  'EndUser': [
    'DOCUMENTS_READ'
  ],
  'Viewer': [
    'DOCUMENTS_READ'
  ]
};

// Permission validation schema
const PermissionSchema = z.array(z.string()).min(1, 'At least one permission required');

/**
 * Core RBAC middleware function
 */
export const requirePermissions = (config: RBACConfig) => {
  return async (req: HttpRequest, context?: InvocationContext): Promise<RBACResult> => {
    const ctx = context || { log: console.log, error: console.error } as any;
    
    try {
      // Validate config
      const permissionValidation = PermissionSchema.safeParse(config.requiredPermissions);
      if (!permissionValidation.success) {
        return { 
          allowed: false, 
          error: 'Invalid RBAC configuration: ' + permissionValidation.error.message 
        };
      }

      // Handle anonymous access
      if (config.allowAnonymous) {
        return { allowed: true, roles: ['anonymous'], permissions: [] };
      }

      // Extract and validate token
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { 
          allowed: false, 
          error: 'No valid authentication token provided' 
        };
      }

      const token = authHeader.replace('Bearer ', '').trim();
      if (!token) {
        return { 
          allowed: false, 
          error: 'Empty authentication token' 
        };
      }

      // Get user info using OnBehalfOfUserCredential
      const credential = new OnBehalfOfUserCredential(token, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await credential.getUserInfo();
      
      const user = {
        objectId: userInfo.objectId,
        userPrincipalName: userInfo.userPrincipalName,
        displayName: userInfo.displayName,
        email: userInfo.userPrincipalName || userInfo.email,
        tenantId: userInfo.tenantId || config.tenantId
      };

      ctx.log?.(`RBAC: Authenticating user ${user.displayName} (${user.email})`);

      // Get user roles from CosmosDB
      const usersContainer = getContainer('users');
      let userRecord;
      
      try {
        const { resource } = await usersContainer.item(user.objectId).read();
        userRecord = resource;
        ctx.log?.(`RBAC: Found user record with roles: ${userRecord?.roles?.join(', ') || 'none'}`);
      } catch (error) {
        // User not found in database - create default record
        ctx.log?.(`RBAC: User not found in database, creating default record`);
        
        userRecord = {
          id: user.objectId,
          partitionKey: user.tenantId,
          email: user.email,
          displayName: user.displayName,
          userPrincipalName: user.userPrincipalName,
          roles: ['Employee'], // Default role
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };
        
        try {
          await usersContainer.items.create(userRecord);
          ctx.log?.(`RBAC: Created new user record with default Employee role`);
        } catch (createError) {
          ctx.error?.(`RBAC: Failed to create user record:`, createError);
          // Continue with default roles if database creation fails
        }
      }

      const userRoles = userRecord?.roles || ['Employee'];
      const userPermissions = await calculatePermissionsFromRoles(userRoles);
      
      ctx.log?.(`RBAC: User permissions: ${userPermissions.join(', ')}`);

      // Check if user has all required permissions
      const hasAllPermissions = config.requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = config.requiredPermissions.filter(permission => 
          !userPermissions.includes(permission)
        );
        
        ctx.log?.(`RBAC: Access denied. Missing permissions: ${missingPermissions.join(', ')}`);
        
        return {
          allowed: false,
          user,
          roles: userRoles,
          permissions: userPermissions,
          error: `Insufficient permissions. Required: ${config.requiredPermissions.join(', ')}. Missing: ${missingPermissions.join(', ')}`
        };
      }

      // Run custom validator if provided
      if (config.customValidator) {
        const customResult = await config.customValidator(user, { req, userRoles, userPermissions });
        if (!customResult) {
          ctx.log?.(`RBAC: Custom validation failed`);
          return {
            allowed: false,
            user,
            roles: userRoles,
            permissions: userPermissions,
            error: 'Custom authorization validation failed'
          };
        }
      }

      ctx.log?.(`RBAC: Access granted for user ${user.displayName}`);

      return {
        allowed: true,
        user,
        roles: userRoles,
        permissions: userPermissions
      };

    } catch (error: any) {
      ctx.error?.('RBAC: Authentication error:', error);
      return {
        allowed: false,
        error: `Authentication failed: ${error.message || 'Unknown error'}`
      };
    }
  };
};

/**
 * Calculate permissions from user roles
 */
async function calculatePermissionsFromRoles(roles: string[]): Promise<string[]> {
  const allPermissions = new Set<string>();
  
  for (const role of roles) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    permissions.forEach(permission => allPermissions.add(permission));
  }

  return Array.from(allPermissions);
}

/**
 * Helper function to create RBAC-protected Azure Function
 */
export const createProtectedFunction = (
  rbacConfig: RBACConfig,
  handler: (req: HttpRequest, context: InvocationContext, authResult: RBACResult) => Promise<any>
) => {
  return async (req: HttpRequest, context: InvocationContext) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return {
        status: 200,
        headers: corsHeaders
      };
    }

    try {
      context.log(`RBAC: Processing ${req.method} ${req.url} - Required permissions: ${rbacConfig.requiredPermissions.join(', ')}`);

      // Check RBAC
      const authResult = await requirePermissions(rbacConfig)(req, context);
      
      if (!authResult.allowed) {
        const status = authResult.error?.includes('token') || authResult.error?.includes('Authentication') ? 401 : 403;
        
        context.log(`RBAC: Access denied (${status}): ${authResult.error}`);
        
        return {
          status,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: status === 401 ? 'Authentication required' : 'Access denied',
            message: authResult.error,
            requiredPermissions: rbacConfig.requiredPermissions,
            userPermissions: authResult.permissions || []
          })
        };
      }

      // Log successful access for audit
      await logAccess(authResult.user!, req, rbacConfig.requiredPermissions, context);

      context.log(`RBAC: Access granted to ${authResult.user?.displayName} with roles: ${authResult.roles?.join(', ')}`);

      // Call the actual handler
      const result = await handler(req, context, authResult);
      
      // Ensure CORS headers are included in response
      return {
        ...result,
        headers: {
          ...corsHeaders,
          ...result.headers
        }
      };

    } catch (error: any) {
      context.error('RBAC: Protected function error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Internal server error',
          message: 'An error occurred while processing the request'
        })
      };
    }
  };
};

/**
 * Log access for audit trail
 */
async function logAccess(
  user: any, 
  req: HttpRequest, 
  permissions: string[], 
  context: InvocationContext
) {
  try {
    const auditContainer = getContainer('audit-logs');
    const auditRecord = {
      id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      partitionKey: user.tenantId,
      type: 'api-access',
      userId: user.objectId,
      userDisplayName: user.displayName,
      userEmail: user.email,
      endpoint: req.url,
      method: req.method,
      requiredPermissions: permissions,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('User-Agent') || 'Unknown',
      ipAddress: req.headers.get('X-Forwarded-For') || req.headers.get('X-Real-IP') || 'Unknown'
    };

    await auditContainer.items.create(auditRecord);
    context.log(`RBAC: Logged access for audit: ${user.email} -> ${req.method} ${req.url}`);
    
  } catch (error) {
    // Don't fail the request if audit logging fails
    context.error('RBAC: Failed to log access for audit:', error);
  }
}

/**
 * Document ownership validator
 */
export const createDocumentOwnershipValidator = (documentIdParam: string = 'documentId') => {
  return async (user: any, context: { req: HttpRequest }) => {
    try {
      const documentId = context.req.params.get(documentIdParam);
      if (!documentId) {
        // If no document ID, let the main handler handle the validation error
        return true;
      }

      const documentsContainer = getContainer('documents');
      const { resource: document } = await documentsContainer.item(documentId).read();
      
      if (!document) {
        // Document not found - let main handler return 404
        return true;
      }

      // Check if user is owner, editor, or creator
      const hasAccess = document.permissions?.owners?.includes(user.userPrincipalName) ||
                       document.permissions?.editors?.includes(user.userPrincipalName) ||
                       document.createdBy === user.userPrincipalName;

      return hasAccess;
    } catch (error) {
      // On error, deny access
      return false;
    }
  };
};

/**
 * Predefined RBAC configurations for common use cases
 */
export const RBAC_CONFIGS = {
  DOCUMENTS_READ: {
    requiredPermissions: ['DOCUMENTS_READ']
  },
  DOCUMENTS_WRITE: {
    requiredPermissions: ['DOCUMENTS_UPDATE']
  },
  DOCUMENTS_ADMIN: {
    requiredPermissions: ['DOCUMENTS_ADMIN']
  },
  DOCUMENTS_OWNER: {
    requiredPermissions: ['DOCUMENTS_UPDATE'],
    customValidator: createDocumentOwnershipValidator()
  },
  USERS_MANAGE: {
    requiredPermissions: ['USERS_UPDATE']
  },
  ENDUSERS_MANAGE: {
    requiredPermissions: ['ENDUSERS_UPDATE']
  },
  SETTINGS_MANAGE: {
    requiredPermissions: ['STORAGE_CONFIG', 'VALIDATION_CONFIG']
  },
  TEAMS_OPERATIONS: {
    requiredPermissions: ['TEAMS_MANAGE']
  },
  SHAREPOINT_OPERATIONS: {
    requiredPermissions: ['SHAREPOINT_MANAGE']
  }
} as const;
