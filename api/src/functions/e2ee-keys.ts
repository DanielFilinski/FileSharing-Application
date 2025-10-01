/**
 * E2EE Keys API
 * Azure Functions for managing End-to-End Encryption public keys
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const PublicKeySchema = z.object({
  userId: z.string(),
  publicKeyJWK: z.record(z.any()),
  keyId: z.string(),
  createdAt: z.string(),
});

const StorePublicKeyRequestSchema = z.object({
  userId: z.string(),
  publicKeyJWK: z.record(z.any()),
});

const ShareSessionKeyRequestSchema = z.object({
  chatId: z.string(),
  recipientUserId: z.string(),
  encryptedSessionKey: z.string(),
  keyId: z.string(),
});

// ==========================================
// TYPES
// ==========================================

interface PublicKeyDocument {
  id: string; // userId
  userId: string;
  publicKeyJWK: JsonWebKey;
  keyId: string;
  createdAt: string;
  updatedAt: string;
  partitionKey: string; // tenantId or organizationId
}

interface SharedSessionKey {
  id: string;
  chatId: string;
  recipientUserId: string;
  encryptedSessionKey: string;
  keyId: string;
  sharedBy: string;
  sharedAt: string;
  partitionKey: string;
}

// ==========================================
// STORE PUBLIC KEY
// ==========================================

app.http('storePublicKey', {
  methods: ['POST'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'e2ee/keys/public',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      ctx.log('Storing public key...');

      // Parse request body
      const body = await req.json();
      const validationResult = StorePublicKeyRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const { userId, publicKeyJWK } = validationResult.data;

      // Get container
      const container = getContainer('e2ee-keys');
      const tenantId = req.query.get('tenantId') || 'default'; // In production, get from auth context
      const keyId = `key_${userId}_${Date.now()}`;
      const now = new Date().toISOString();

      // Create document
      const keyDocument: PublicKeyDocument = {
        id: userId,
        userId,
        publicKeyJWK,
        keyId,
        createdAt: now,
        updatedAt: now,
        partitionKey: tenantId,
      };

      // Store in Cosmos DB (upsert)
      const { resource } = await container.items.upsert(keyDocument);

      ctx.log(`Public key stored for user ${userId}`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          userId,
          keyId,
          createdAt: now,
        }),
      };
    } catch (error: any) {
      ctx.error('Error storing public key:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to store public key',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET PUBLIC KEY
// ==========================================

app.http('getPublicKey', {
  methods: ['GET'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'e2ee/keys/public/{userId}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User ID is required' }),
        };
      }

      ctx.log(`Fetching public key for user ${userId}`);

      // Get container
      const container = getContainer('e2ee-keys');
      const tenantId = req.query.get('tenantId') || 'default';

      // Query for public key
      const { resource: keyDocument } = await container.item(userId, tenantId).read<PublicKeyDocument>();

      if (!keyDocument) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Public key not found' }),
        };
      }

      ctx.log(`Public key found for user ${userId}`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: keyDocument.userId,
          publicKeyJWK: keyDocument.publicKeyJWK,
          keyId: keyDocument.keyId,
          createdAt: keyDocument.createdAt,
        }),
      };
    } catch (error: any) {
      ctx.error('Error fetching public key:', error);

      if (error.code === 404) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Public key not found' }),
        };
      }

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch public key',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET MULTIPLE PUBLIC KEYS
// ==========================================

app.http('getPublicKeysBatch', {
  methods: ['POST'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'e2ee/keys/public/batch',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      ctx.log('Fetching public keys batch...');

      const body = await req.json();
      const userIds = body.userIds as string[];

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User IDs array is required' }),
        };
      }

      // Get container
      const container = getContainer('e2ee-keys');
      const tenantId = req.query.get('tenantId') || 'default';

      // Query for multiple keys
      const query = {
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@userIds, c.userId) AND c.partitionKey = @tenantId',
        parameters: [
          { name: '@userIds', value: userIds },
          { name: '@tenantId', value: tenantId },
        ],
      };

      const { resources: keyDocuments } = await container.items.query<PublicKeyDocument>(query).fetchAll();

      const keys = keyDocuments.map((doc) => ({
        userId: doc.userId,
        publicKeyJWK: doc.publicKeyJWK,
        keyId: doc.keyId,
        createdAt: doc.createdAt,
      }));

      ctx.log(`Found ${keys.length} public keys`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      };
    } catch (error: any) {
      ctx.error('Error fetching public keys batch:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch public keys',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// SHARE SESSION KEY
// ==========================================

app.http('shareSessionKey', {
  methods: ['POST'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'e2ee/keys/session/share',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      ctx.log('Sharing session key...');

      // Parse request body
      const body = await req.json();
      const validationResult = ShareSessionKeyRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const { chatId, recipientUserId, encryptedSessionKey, keyId } = validationResult.data;

      // Get container
      const container = getContainer('e2ee-shared-keys');
      const tenantId = req.query.get('tenantId') || 'default';
      const currentUserId = req.query.get('userId') || 'unknown'; // In production, get from auth
      const now = new Date().toISOString();

      // Create shared key document
      const sharedKey: SharedSessionKey = {
        id: `${chatId}_${recipientUserId}_${Date.now()}`,
        chatId,
        recipientUserId,
        encryptedSessionKey,
        keyId,
        sharedBy: currentUserId,
        sharedAt: now,
        partitionKey: tenantId,
      };

      // Store in Cosmos DB
      await container.items.create(sharedKey);

      ctx.log(`Session key shared with user ${recipientUserId} for chat ${chatId}`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          chatId,
          recipientUserId,
          sharedAt: now,
        }),
      };
    } catch (error: any) {
      ctx.error('Error sharing session key:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to share session key',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET SHARED SESSION KEYS
// ==========================================

app.http('getSharedSessionKeys', {
  methods: ['GET'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'e2ee/keys/session/shared',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const userId = req.query.get('userId');

      if (!userId) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User ID is required' }),
        };
      }

      ctx.log(`Fetching shared session keys for user ${userId}`);

      // Get container
      const container = getContainer('e2ee-shared-keys');
      const tenantId = req.query.get('tenantId') || 'default';

      // Query for shared keys
      const query = {
        query: 'SELECT * FROM c WHERE c.recipientUserId = @userId AND c.partitionKey = @tenantId ORDER BY c.sharedAt DESC',
        parameters: [
          { name: '@userId', value: userId },
          { name: '@tenantId', value: tenantId },
        ],
      };

      const { resources: sharedKeys } = await container.items.query<SharedSessionKey>(query).fetchAll();

      ctx.log(`Found ${sharedKeys.length} shared session keys`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedKeys }),
      };
    } catch (error: any) {
      ctx.error('Error fetching shared session keys:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch shared session keys',
          details: error.message,
        }),
      };
    }
  },
});

