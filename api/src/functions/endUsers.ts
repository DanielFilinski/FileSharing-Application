import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';
import config from '../config';

// End User interface
interface EndUser {
  id: string;
  partitionKey: string; // organizationId for multi-tenant isolation
  type: 'end-user';
  
  // Basic Information
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  
  // Organization Context
  organizationId: string;
  serviceProviderId: string; // связь с сотрудником фирмы
  
  // Business Information  
  firmName?: string;
  firmAddress?: string;
  businessType?: string;
  
  // Access Control
  isActive: boolean;
  accessLevel: 'read' | 'write' | 'admin';
  permissions: {
    dmsAccess: boolean;
    portalAccess: boolean;
    documentsAccess: string[]; // document IDs
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastActivityAt?: string;
  
  // Integration
  azureAdUserId?: string;
  teamsUserId?: string;
}

// Validation schemas
const EndUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  firmName: z.string().optional(),
  firmAddress: z.string().optional(),
  businessType: z.string().optional(),
  accessLevel: z.enum(['read', 'write', 'admin']).default('read')
});

const EndUserUpdateSchema = EndUserSchema.partial();

// GET /api/end-users - получить всех End Users для организации
app.http('getEndUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'end-users',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    // Authentication
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await oboCredential.getUserInfo();
      const organizationId = userInfo.tenantId || 'default';
      
      ctx.log(`Getting end users for organization: ${organizationId}`);

      // Query CosmosDB
      const container = getContainer('end-users');
      const query = {
        query: `SELECT * FROM c WHERE c.partitionKey = @organizationId AND c.isActive = true ORDER BY c.displayName ASC`,
        parameters: [
          { name: '@organizationId', value: organizationId }
        ]
      };

      const { resources: endUsers } = await container.items.query(query).fetchAll();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          endUsers,
          count: endUsers.length,
          organizationId
        })
      };

    } catch (error: any) {
      ctx.error('Error getting end users:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});

// POST /api/end-users - создать нового End User
app.http('createEndUser', {
  methods: ['POST'],
  authLevel: 'anonymous', 
  route: 'end-users',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await oboCredential.getUserInfo();
      const organizationId = userInfo.tenantId || 'default';

      // Validate request body
      const body = await req.json();
      const parsed = EndUserSchema.safeParse(body);
      
      if (!parsed.success) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Validation failed',
            details: parsed.error.flatten()
          })
        };
      }

      // Create End User object
      const endUserId = `enduser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const endUser: EndUser = {
        id: endUserId,
        partitionKey: organizationId,
        type: 'end-user',
        
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        displayName: `${parsed.data.firstName} ${parsed.data.lastName}`,
        email: parsed.data.email,
        phone: parsed.data.phone,
        
        organizationId,
        serviceProviderId: userInfo.oid,
        
        firmName: parsed.data.firmName,
        firmAddress: parsed.data.firmAddress,
        businessType: parsed.data.businessType,
        
        isActive: true,
        accessLevel: parsed.data.accessLevel,
        permissions: {
          dmsAccess: false,
          portalAccess: true,
          documentsAccess: []
        },
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userInfo.oid
      };

      // Save to CosmosDB
      const container = getContainer('end-users');
      const { resource } = await container.items.create(endUser);

      ctx.log(`End user created: ${endUser.displayName} (${endUserId})`);

      return {
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'End user created successfully',
          endUser: resource
        })
      };

    } catch (error: any) {
      ctx.error('Error creating end user:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});

// GET /api/end-users/{id} - получить конкретного End User
app.http('getEndUserById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'end-users/{id}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await oboCredential.getUserInfo();
      const organizationId = userInfo.tenantId || 'default';
      const endUserId = req.params.get('id');

      if (!endUserId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End user ID is required' })
        };
      }

      // Query CosmosDB
      const container = getContainer('end-users');
      const { resource: endUser } = await container.item(endUserId, organizationId).read();

      if (!endUser) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End user not found' })
        };
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(endUser)
      };

    } catch (error: any) {
      ctx.error('Error getting end user:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});

// PUT /api/end-users/{id} - обновить End User
app.http('updateEndUser', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'end-users/{id}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!accessToken) {
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No access token provided' })
      };
    }

    try {
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      const userInfo = await oboCredential.getUserInfo();
      const organizationId = userInfo.tenantId || 'default';
      const endUserId = req.params.get('id');

      if (!endUserId) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End user ID is required' })
        };
      }

      // Get existing end user
      const container = getContainer('end-users');
      const { resource: existingEndUser } = await container.item(endUserId, organizationId).read();

      if (!existingEndUser) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End user not found' })
        };
      }

      // Validate request body
      const body = await req.json();
      const parsed = EndUserUpdateSchema.safeParse(body);
      
      if (!parsed.success) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Validation failed',
            details: parsed.error.flatten()
          })
        };
      }

      // Update end user
      const updatedEndUser: EndUser = {
        ...existingEndUser,
        ...parsed.data,
        displayName: parsed.data.firstName && parsed.data.lastName 
          ? `${parsed.data.firstName} ${parsed.data.lastName}`
          : existingEndUser.displayName,
        updatedAt: new Date().toISOString(),
        id: existingEndUser.id, // Ensure ID doesn't change
        partitionKey: existingEndUser.partitionKey // Ensure partition key doesn't change
      };

      const { resource } = await container.item(endUserId, organizationId).replace(updatedEndUser);

      ctx.log(`End user updated: ${updatedEndUser.displayName} (${endUserId})`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'End user updated successfully',
          endUser: resource
        })
      };

    } catch (error: any) {
      ctx.error('Error updating end user:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});
