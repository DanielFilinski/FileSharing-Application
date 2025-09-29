import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { createProtectedFunction, RBAC_CONFIGS } from '../shared/middleware/rbacMiddleware';
import { z } from 'zod';

// User role management schema
const UserRoleUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roles: z.array(z.enum(['Administrator', 'Manager', 'Employee', 'EndUser', 'Viewer']))
    .min(1, 'At least one role is required'),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional()
});

const BulkUserUpdateSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID required'),
  roles: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  operation: z.enum(['activate', 'deactivate', 'update-roles', 'remove-roles'])
});

// Protected GET /api/users-protected - Get all users with RBAC
app.http('getUsersProtected', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users-protected',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_MANAGE,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const container = getContainer('users');
        const tenantId = authResult.user!.tenantId;
        const userRoles = authResult.roles!;
        
        // Build query based on user access level
        let query;
        
        if (userRoles.includes('Administrator')) {
          // Administrators can see all users
          query = {
            query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId ORDER BY c.createdAt DESC',
            parameters: [{ name: '@tenantId', value: tenantId }]
          };
        } else if (userRoles.includes('Manager')) {
          // Managers can see active users (not other managers/admins)
          query = {
            query: `SELECT * FROM c WHERE c.partitionKey = @tenantId 
                   AND c.isActive = true 
                   AND NOT ARRAY_CONTAINS(c.roles, "Administrator")
                   ORDER BY c.createdAt DESC`,
            parameters: [{ name: '@tenantId', value: tenantId }]
          };
        } else {
          return {
            status: 403,
            body: JSON.stringify({
              error: 'Insufficient permissions',
              message: 'Only Managers and Administrators can view users'
            })
          };
        }
        
        const { resources: users } = await container.items.query(query).fetchAll();
        
        // Filter sensitive data based on role
        const filteredUsers = users.map(user => {
          const baseUser = {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            userPrincipalName: user.userPrincipalName,
            roles: user.roles,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt
          };
          
          if (userRoles.includes('Administrator')) {
            return {
              ...baseUser,
              // Full access for administrators
              lastModifiedBy: user.lastModifiedBy,
              permissions: user.permissions,
              metadata: user.metadata
            };
          } else {
            // Limited access for managers
            return baseUser;
          }
        });
        
        ctx.log(`RBAC Users: Returning ${filteredUsers.length} users for ${authResult.user!.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: filteredUsers,
            count: filteredUsers.length,
            userAccess: {
              roles: authResult.roles,
              canManageRoles: userRoles.includes('Administrator'),
              canActivateUsers: authResult.permissions!.includes('USERS_UPDATE')
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected users query error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve users'
          })
        };
      }
    }
  )
});

// Protected PUT /api/users-protected/{userId}/roles - Update user roles (Admin only)
app.http('updateUserRolesProtected', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'users-protected/{userId}/roles',
  handler: createProtectedFunction(
    { requiredPermissions: ['USERS_UPDATE', 'USERS_CREATE'] }, // Admin-level permissions
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        // Only administrators can update roles
        if (!authResult.roles!.includes('Administrator')) {
          return {
            status: 403,
            body: JSON.stringify({
              error: 'Insufficient permissions',
              message: 'Only administrators can update user roles'
            })
          };
        }
        
        const userId = req.params.get('userId');
        if (!userId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'User ID is required' })
          };
        }
        
        const body = await req.json();
        const parsed = UserRoleUpdateSchema.safeParse({
          ...body,
          userId
        });
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid user role data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const { roles, isActive } = parsed.data;
        const admin = authResult.user!;
        const now = new Date().toISOString();
        
        // Get existing user
        const container = getContainer('users');
        const { resource: existingUser } = await container.item(userId).read();
        
        if (!existingUser) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        
        // Check tenant access
        if (existingUser.partitionKey !== admin.tenantId) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Access denied to this user' })
          };
        }
        
        // Prevent self-role modification for safety
        if (userId === admin.objectId) {
          return {
            status: 403,
            body: JSON.stringify({
              error: 'Cannot modify your own roles',
              message: 'For security reasons, administrators cannot modify their own roles'
            })
          };
        }
        
        // Calculate new permissions from roles
        const newPermissions: string[] = [];
        const rolePermissions = {
          'Administrator': ['USERS_CREATE', 'USERS_READ', 'USERS_UPDATE', 'USERS_DELETE', 'DOCUMENTS_ADMIN', 'STORAGE_CONFIG'],
          'Manager': ['USERS_READ', 'USERS_UPDATE', 'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE'],
          'Employee': ['DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE'],
          'EndUser': ['DOCUMENTS_READ'],
          'Viewer': ['DOCUMENTS_READ']
        };
        
        roles.forEach(role => {
          const permissions = rolePermissions[role as keyof typeof rolePermissions] || [];
          permissions.forEach(permission => {
            if (!newPermissions.includes(permission)) {
              newPermissions.push(permission);
            }
          });
        });
        
        // Update user roles
        const patchOps = [
          { op: 'replace', path: '/roles', value: roles },
          { op: 'replace', path: '/permissions', value: newPermissions },
          { op: 'replace', path: '/updatedAt', value: now },
          { op: 'replace', path: '/lastModifiedBy', value: admin.email }
        ];
        
        if (isActive !== undefined) {
          patchOps.push({ op: 'replace', path: '/isActive', value: isActive });
        }
        
        await container.item(userId).patch(patchOps);
        
        // Get updated user
        const { resource: updatedUser } = await container.item(userId).read();
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-user-${userId}-roles-updated-${Date.now()}`,
          partitionKey: admin.tenantId,
          type: 'user-roles-updated',
          targetUserId: userId,
          targetUserName: updatedUser.displayName,
          targetUserEmail: updatedUser.email,
          userId: admin.objectId,
          userName: admin.displayName,
          userEmail: admin.email,
          timestamp: now,
          metadata: {
            previousRoles: existingUser.roles,
            newRoles: roles,
            previousActive: existingUser.isActive,
            newActive: isActive
          }
        });
        
        ctx.log(`RBAC Users: Updated roles for user ${userId} by ${admin.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              id: updatedUser.id,
              displayName: updatedUser.displayName,
              email: updatedUser.email,
              roles: updatedUser.roles,
              permissions: updatedUser.permissions,
              isActive: updatedUser.isActive,
              updatedAt: updatedUser.updatedAt
            },
            message: 'User roles updated successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected user roles update error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to update user roles'
          })
        };
      }
    }
  )
});

// Protected POST /api/users-protected/bulk - Bulk user operations (Admin only)
app.http('bulkUserOperationsProtected', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users-protected/bulk',
  handler: createProtectedFunction(
    { requiredPermissions: ['USERS_UPDATE', 'USERS_DELETE'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        // Only administrators can perform bulk operations
        if (!authResult.roles!.includes('Administrator')) {
          return {
            status: 403,
            body: JSON.stringify({
              error: 'Insufficient permissions',
              message: 'Only administrators can perform bulk user operations'
            })
          };
        }
        
        const body = await req.json();
        const parsed = BulkUserUpdateSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid bulk operation data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const { userIds, roles, isActive, operation } = parsed.data;
        const admin = authResult.user!;
        const now = new Date().toISOString();
        const results = [];
        
        const container = getContainer('users');
        
        // Process each user
        for (const userId of userIds) {
          try {
            // Skip self to prevent lockout
            if (userId === admin.objectId) {
              results.push({
                userId,
                success: false,
                error: 'Cannot modify your own account in bulk operations'
              });
              continue;
            }
            
            const { resource: user } = await container.item(userId).read();
            
            if (!user) {
              results.push({
                userId,
                success: false,
                error: 'User not found'
              });
              continue;
            }
            
            // Check tenant access
            if (user.partitionKey !== admin.tenantId) {
              results.push({
                userId,
                success: false,
                error: 'Access denied to this user'
              });
              continue;
            }
            
            const patchOps = [];
            
            switch (operation) {
              case 'activate':
                patchOps.push({ op: 'replace', path: '/isActive', value: true });
                break;
              case 'deactivate':
                patchOps.push({ op: 'replace', path: '/isActive', value: false });
                break;
              case 'update-roles':
                if (roles && roles.length > 0) {
                  patchOps.push({ op: 'replace', path: '/roles', value: roles });
                }
                break;
              case 'remove-roles':
                if (roles && roles.length > 0) {
                  const currentRoles = user.roles || [];
                  const newRoles = currentRoles.filter(role => !roles.includes(role));
                  patchOps.push({ op: 'replace', path: '/roles', value: newRoles.length > 0 ? newRoles : ['Viewer'] });
                }
                break;
            }
            
            if (isActive !== undefined) {
              patchOps.push({ op: 'replace', path: '/isActive', value: isActive });
            }
            
            // Always update metadata
            patchOps.push(
              { op: 'replace', path: '/updatedAt', value: now },
              { op: 'replace', path: '/lastModifiedBy', value: admin.email }
            );
            
            if (patchOps.length > 2) { // More than just metadata updates
              await container.item(userId).patch(patchOps);
            }
            
            results.push({
              userId,
              success: true,
              userName: user.displayName,
              operation,
              appliedChanges: patchOps.length - 2 // Exclude metadata updates
            });
            
          } catch (error: any) {
            results.push({
              userId,
              success: false,
              error: `Processing error: ${error.message}`
            });
          }
        }
        
        // Log bulk activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-bulk-user-${operation}-${Date.now()}`,
          partitionKey: admin.tenantId,
          type: 'bulk-user-operation',
          operation,
          targetUserIds: userIds,
          userId: admin.objectId,
          userName: admin.displayName,
          userEmail: admin.email,
          timestamp: now,
          metadata: {
            totalUsers: userIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            roles: roles,
            isActive: isActive
          },
          results
        });
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        ctx.log(`RBAC Users: Bulk ${operation} completed by ${admin.displayName}: ${successCount} successful, ${failCount} failed`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            operation,
            results,
            summary: {
              total: userIds.length,
              successful: successCount,
              failed: failCount
            },
            message: `Bulk ${operation} operation completed: ${successCount} successful, ${failCount} failed`
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected bulk user operations error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to perform bulk user operations'
          })
        };
      }
    }
  )
});

// Protected GET /api/users-protected/{userId} - Get specific user details
app.http('getUserProtected', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users-protected/{userId}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_MANAGE,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const userId = req.params.get('userId');
        if (!userId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'User ID is required' })
          };
        }
        
        const requestingUser = authResult.user!;
        const userRoles = authResult.roles!;
        
        const container = getContainer('users');
        const { resource: user } = await container.item(userId).read();
        
        if (!user) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        
        // Check tenant access
        if (user.partitionKey !== requestingUser.tenantId) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Access denied to this user' })
          };
        }
        
        // Self access is always allowed (limited data)
        if (userId === requestingUser.objectId) {
          return {
            status: 200,
            body: JSON.stringify({
              success: true,
              data: {
                id: user.id,
                displayName: user.displayName,
                email: user.email,
                roles: user.roles,
                isActive: user.isActive,
                lastLoginAt: user.lastLoginAt,
                isSelf: true
              }
            })
          };
        }
        
        // Role-based data filtering
        let filteredUser;
        
        if (userRoles.includes('Administrator')) {
          // Full access for administrators
          filteredUser = user;
        } else if (userRoles.includes('Manager')) {
          // Limited access for managers
          filteredUser = {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            userPrincipalName: user.userPrincipalName,
            roles: user.roles,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt
          };
        } else {
          return {
            status: 403,
            body: JSON.stringify({
              error: 'Insufficient permissions',
              message: 'Only managers and administrators can view other user details'
            })
          };
        }
        
        ctx.log(`RBAC Users: Retrieved user ${userId} for ${requestingUser.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: filteredUser
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected user get error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve user'
          })
        };
      }
    }
  )
});

// Protected GET /api/users-protected/roles/available - Get available roles
app.http('getAvailableRolesProtected', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users-protected/roles/available',
  handler: createProtectedFunction(
    RBAC_CONFIGS.USERS_MANAGE,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const userRoles = authResult.roles!;
        
        const allRoles = [
          {
            name: 'Administrator',
            description: 'Full system access - can manage all users, documents, and settings',
            permissions: ['USERS_CREATE', 'USERS_READ', 'USERS_UPDATE', 'USERS_DELETE', 'DOCUMENTS_ADMIN', 'STORAGE_CONFIG'],
            restrictedTo: ['Administrator']
          },
          {
            name: 'Manager',
            description: 'Management access - can manage documents and view user information',
            permissions: ['USERS_READ', 'USERS_UPDATE', 'DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE'],
            restrictedTo: ['Administrator']
          },
          {
            name: 'Employee',
            description: 'Standard employee access - can create and manage own documents',
            permissions: ['DOCUMENTS_CREATE', 'DOCUMENTS_READ', 'DOCUMENTS_UPDATE'],
            restrictedTo: ['Administrator', 'Manager']
          },
          {
            name: 'EndUser',
            description: 'External user access - read-only access to shared documents',
            permissions: ['DOCUMENTS_READ'],
            restrictedTo: ['Administrator', 'Manager']
          },
          {
            name: 'Viewer',
            description: 'Read-only access to documents',
            permissions: ['DOCUMENTS_READ'],
            restrictedTo: ['Administrator', 'Manager']
          }
        ];
        
        // Filter roles based on user permissions
        const availableRoles = allRoles.filter(role => 
          role.restrictedTo.some(requiredRole => userRoles.includes(requiredRole))
        );
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: availableRoles,
            userAccess: {
              roles: userRoles,
              canAssignAdminRole: userRoles.includes('Administrator')
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Get available roles error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve available roles'
          })
        };
      }
    }
  )
});
