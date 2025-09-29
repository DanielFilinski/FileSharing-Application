import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../shared/db/cosmos';
import { createProtectedFunction, RBAC_CONFIGS } from '../shared/middleware/rbacMiddleware';
import { z } from 'zod';
import config from '../config';

// End User validation schema
const EndUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  firmName: z.string().optional(),
  firmAddress: z.string().optional(),
  businessType: z.string().optional(),
  accessLevel: z.enum(['read', 'write', 'admin']).default('read'),
  isActive: z.boolean().default(true)
});

const EndUserUpdateSchema = EndUserSchema.partial();

// Protected GET /api/end-users-protected - Get end users with RBAC
app.http('getEndUsersProtected', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'end-users-protected',
  handler: createProtectedFunction(
    RBAC_CONFIGS.ENDUSERS_MANAGE,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const container = getContainer('end-users');
        const tenantId = authResult.user!.tenantId;
        
        // Role-based filtering
        const userRoles = authResult.roles!;
        let query;
        
        if (userRoles.includes('Administrator')) {
          // Administrators can see all end users in tenant
          query = {
            query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId ORDER BY c.createdAt DESC',
            parameters: [{ name: '@tenantId', value: tenantId }]
          };
        } else if (userRoles.includes('Manager')) {
          // Managers can see active end users they manage
          query = {
            query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId AND c.isActive = true ORDER BY c.createdAt DESC',
            parameters: [{ name: '@tenantId', value: tenantId }]
          };
        } else {
          // Other roles have limited access
          return {
            status: 403,
            body: JSON.stringify({
              error: 'Insufficient permissions',
              message: 'Only Managers and Administrators can view end users'
            })
          };
        }
        
        const { resources: endUsers } = await container.items.query(query).fetchAll();
        
        // Filter sensitive data based on role
        const filteredEndUsers = endUsers.map(user => {
          if (userRoles.includes('Administrator')) {
            return user; // Full access
          } else {
            // Hide sensitive fields for managers
            return {
              ...user,
              // Remove sensitive internal fields
              azureAdUserId: undefined,
              teamsUserId: undefined
            };
          }
        });
        
        ctx.log(`RBAC EndUsers: Returning ${filteredEndUsers.length} end users for ${authResult.user!.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: filteredEndUsers,
            count: filteredEndUsers.length,
            userAccess: {
              roles: authResult.roles,
              canCreate: authResult.permissions!.includes('ENDUSERS_CREATE'),
              canUpdate: authResult.permissions!.includes('ENDUSERS_UPDATE'),
              canDelete: authResult.permissions!.includes('ENDUSERS_DELETE')
            }
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected end users query error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve end users'
          })
        };
      }
    }
  )
});

// Protected POST /api/end-users-protected - Create end user with RBAC
app.http('createEndUserProtected', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'end-users-protected',
  handler: createProtectedFunction(
    { requiredPermissions: ['ENDUSERS_CREATE'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const body = await req.json();
        const parsed = EndUserSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid end user data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const endUserData = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Check if end user already exists
        const container = getContainer('end-users');
        const existingQuery = {
          query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId AND c.email = @email',
          parameters: [
            { name: '@tenantId', value: user.tenantId },
            { name: '@email', value: endUserData.email }
          ]
        };
        
        const { resources: existing } = await container.items.query(existingQuery).fetchAll();
        if (existing.length > 0) {
          return {
            status: 409,
            body: JSON.stringify({
              error: 'End user already exists',
              message: `End user with email ${endUserData.email} already exists`
            })
          };
        }
        
        // Create end user
        const endUser = {
          id: `enduser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partitionKey: user.tenantId,
          ...endUserData,
          createdAt: now,
          updatedAt: now,
          createdBy: user.email,
          lastModifiedBy: user.email
        };
        
        const { resource: createdEndUser } = await container.items.create(endUser);
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-enduser-${endUser.id}-created`,
          partitionKey: user.tenantId,
          type: 'enduser-created',
          endUserId: endUser.id,
          endUserName: `${endUser.firstName} ${endUser.lastName}`,
          endUserEmail: endUser.email,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            firmName: endUser.firmName,
            businessType: endUser.businessType,
            accessLevel: endUser.accessLevel
          }
        });
        
        // Trigger SharePoint site creation if enabled
        try {
          // This could trigger SharePoint provisioning workflow
          ctx.log(`RBAC EndUsers: Triggering SharePoint site creation for ${endUser.email}`);
          // Implementation would go here
        } catch (spError) {
          ctx.log(`RBAC EndUsers: SharePoint site creation failed (non-critical):`, spError);
        }
        
        ctx.log(`RBAC EndUsers: Created end user ${endUser.id} by ${user.displayName}`);
        
        return {
          status: 201,
          body: JSON.stringify({
            success: true,
            data: createdEndUser,
            message: 'End user created successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected end user creation error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to create end user'
          })
        };
      }
    }
  )
});

// Protected PUT /api/end-users-protected/{id} - Update end user with RBAC
app.http('updateEndUserProtected', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'end-users-protected/{endUserId}',
  handler: createProtectedFunction(
    { requiredPermissions: ['ENDUSERS_UPDATE'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const endUserId = req.params.get('endUserId');
        if (!endUserId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'End User ID is required' })
          };
        }
        
        const body = await req.json();
        const parsed = EndUserUpdateSchema.safeParse(body);
        
        if (!parsed.success) {
          return {
            status: 400,
            body: JSON.stringify({
              error: 'Invalid end user data',
              details: parsed.error.flatten()
            })
          };
        }
        
        const updates = parsed.data;
        const user = authResult.user!;
        const now = new Date().toISOString();
        
        // Get existing end user
        const container = getContainer('end-users');
        const { resource: existingEndUser } = await container.item(endUserId).read();
        
        if (!existingEndUser) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'End user not found' })
          };
        }
        
        // Check tenant access
        if (existingEndUser.partitionKey !== user.tenantId) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Access denied to this end user' })
          };
        }
        
        // Build patch operations
        const patchOps = [];
        
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined) {
            patchOps.push({ 
              op: 'replace', 
              path: `/${key}`, 
              value: updates[key] 
            });
          }
        });
        
        // Always update modification metadata
        patchOps.push(
          { op: 'replace', path: '/updatedAt', value: now },
          { op: 'replace', path: '/lastModifiedBy', value: user.email }
        );
        
        await container.item(endUserId).patch(patchOps);
        
        // Get updated end user
        const { resource: updatedEndUser } = await container.item(endUserId).read();
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-enduser-${endUserId}-updated-${Date.now()}`,
          partitionKey: user.tenantId,
          type: 'enduser-updated',
          endUserId,
          endUserName: `${updatedEndUser.firstName} ${updatedEndUser.lastName}`,
          endUserEmail: updatedEndUser.email,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            changes: Object.keys(updates),
            previousStatus: existingEndUser.isActive,
            newStatus: updatedEndUser.isActive
          }
        });
        
        ctx.log(`RBAC EndUsers: Updated end user ${endUserId} by ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: updatedEndUser,
            message: 'End user updated successfully'
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected end user update error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to update end user'
          })
        };
      }
    }
  )
});

// Protected DELETE /api/end-users-protected/{id} - Delete/deactivate end user
app.http('deleteEndUserProtected', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'end-users-protected/{endUserId}',
  handler: createProtectedFunction(
    { requiredPermissions: ['ENDUSERS_DELETE'] },
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const endUserId = req.params.get('endUserId');
        if (!endUserId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'End User ID is required' })
          };
        }
        
        const user = authResult.user!;
        const now = new Date().toISOString();
        const hardDelete = req.query.get('hard') === 'true';
        
        // Get existing end user
        const container = getContainer('end-users');
        const { resource: existingEndUser } = await container.item(endUserId).read();
        
        if (!existingEndUser) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'End user not found' })
          };
        }
        
        // Check tenant access
        if (existingEndUser.partitionKey !== user.tenantId) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Access denied to this end user' })
          };
        }
        
        // Only administrators can perform hard delete
        if (hardDelete && !authResult.roles!.includes('Administrator')) {
          return {
            status: 403,
            body: JSON.stringify({ 
              error: 'Only administrators can permanently delete end users' 
            })
          };
        }
        
        if (hardDelete) {
          // Permanent deletion (admin only)
          await container.item(endUserId).delete();
        } else {
          // Soft delete - deactivate
          const patchOps = [
            { op: 'replace', path: '/isActive', value: false },
            { op: 'add', path: '/deactivatedAt', value: now },
            { op: 'add', path: '/deactivatedBy', value: user.email },
            { op: 'replace', path: '/updatedAt', value: now },
            { op: 'replace', path: '/lastModifiedBy', value: user.email }
          ];
          
          await container.item(endUserId).patch(patchOps);
        }
        
        // Log activity
        const activitiesContainer = getContainer('activities');
        await activitiesContainer.items.create({
          id: `activity-enduser-${endUserId}-${hardDelete ? 'deleted' : 'deactivated'}-${Date.now()}`,
          partitionKey: user.tenantId,
          type: `enduser-${hardDelete ? 'deleted' : 'deactivated'}`,
          endUserId,
          endUserName: `${existingEndUser.firstName} ${existingEndUser.lastName}`,
          endUserEmail: existingEndUser.email,
          userId: user.objectId,
          userName: user.displayName,
          userEmail: user.email,
          timestamp: now,
          metadata: {
            deletionType: hardDelete ? 'permanent' : 'soft',
            previousStatus: existingEndUser.isActive
          }
        });
        
        ctx.log(`RBAC EndUsers: ${hardDelete ? 'Deleted' : 'Deactivated'} end user ${endUserId} by ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            message: `End user ${hardDelete ? 'deleted permanently' : 'deactivated'} successfully`
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected end user deletion error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to delete end user'
          })
        };
      }
    }
  )
});

// Protected GET /api/end-users-protected/{id} - Get specific end user
app.http('getEndUserProtected', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'end-users-protected/{endUserId}',
  handler: createProtectedFunction(
    RBAC_CONFIGS.ENDUSERS_MANAGE,
    async (req: HttpRequest, ctx: InvocationContext, authResult) => {
      try {
        const endUserId = req.params.get('endUserId');
        if (!endUserId) {
          return {
            status: 400,
            body: JSON.stringify({ error: 'End User ID is required' })
          };
        }
        
        const user = authResult.user!;
        const container = getContainer('end-users');
        const { resource: endUser } = await container.item(endUserId).read();
        
        if (!endUser) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'End user not found' })
          };
        }
        
        // Check tenant access
        if (endUser.partitionKey !== user.tenantId) {
          return {
            status: 403,
            body: JSON.stringify({ error: 'Access denied to this end user' })
          };
        }
        
        // Filter sensitive data based on role
        const filteredEndUser = authResult.roles!.includes('Administrator') 
          ? endUser 
          : {
              ...endUser,
              azureAdUserId: undefined,
              teamsUserId: undefined
            };
        
        ctx.log(`RBAC EndUsers: Retrieved end user ${endUserId} for ${user.displayName}`);
        
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            data: filteredEndUser
          })
        };
        
      } catch (error: any) {
        ctx.error('Protected end user get error:', error);
        return {
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to retrieve end user'
          })
        };
      }
    }
  )
});
