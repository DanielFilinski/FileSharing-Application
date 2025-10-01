/**
 * SharePoint Sync API
 * Azure Functions for SharePoint bidirectional synchronization
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const SyncRequestSchema = z.object({
  localPath: z.string().min(1),
  sharePointPath: z.string().min(1),
  operation: z.enum(['upload', 'download', 'update', 'delete', 'rename', 'move', 'copy']),
  direction: z.enum(['local_to_sharepoint', 'sharepoint_to_local', 'bidirectional']),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  force: z.boolean().optional(),
  conflictResolution: z.enum(['use_local', 'use_sharepoint', 'merge_content', 'manual_resolution', 'keep_both', 'skip_sync']).optional(),
});

const BatchSyncRequestSchema = z.object({
  items: z.array(SyncRequestSchema),
  batchId: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  conflictResolution: z.enum(['use_local', 'use_sharepoint', 'merge_content', 'manual_resolution', 'keep_both', 'skip_sync']).optional(),
});

const ConflictResolutionRequestSchema = z.object({
  conflictId: z.string(),
  resolution: z.enum(['use_local', 'use_sharepoint', 'merge_content', 'manual_resolution', 'keep_both', 'skip_sync']),
  notes: z.string().optional(),
  resolvedBy: z.string(),
});

// ==========================================
// TYPES
// ==========================================

interface SyncItemDocument {
  id: string;
  localPath: string;
  sharePointPath: string;
  operation: string;
  direction: string;
  status: string;
  priority: string;
  
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: string;
  checksum: string;
  
  sharePointId?: string;
  sharePointETag?: string;
  sharePointWebUrl?: string;
  
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  errorCode?: string;
  
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  
  organizationId: string;
  tenantId: string;
  partitionKey: string;
}

interface ConflictResolutionDocument {
  id: string;
  syncItemId: string;
  conflictType: string;
  conflictReason: string;
  
  localVersion: any;
  sharePointVersion: any;
  
  resolution: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  
  finalVersion?: any;
  mergedContent?: any;
  
  createdAt: string;
  updatedAt: string;
  partitionKey: string;
}

// ==========================================
// START SYNC
// ==========================================

app.http('startSync', {
  methods: ['POST'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'sharepoint/sync/start',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      ctx.log('Starting SharePoint sync...');

      const tenantId = req.query.get('tenantId') || 'default';
      const organizationId = req.query.get('organizationId') || 'default';
      const userId = req.query.get('userId') || 'system';

      const container = getContainer('sync-items');

      // Check if there are any pending sync items
      const { resources: pendingItems } = await container.items.query<SyncItemDocument>({
        query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId AND c.status = @status',
        parameters: [
          { name: '@tenantId', value: tenantId },
          { name: '@status', value: 'pending' },
        ],
      }).fetchAll();

      if (pendingItems.length === 0) {
        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'No pending sync items',
            syncItemCount: 0,
          }),
        };
      }

      // Start sync process (in production, this would trigger the actual sync engine)
      ctx.log(`Starting sync for ${pendingItems.length} pending items`);

      // Update status to in_progress for items being processed
      const itemsToProcess = pendingItems.slice(0, 5); // Process up to 5 items concurrently
      
      for (const item of itemsToProcess) {
        item.status = 'in_progress';
        item.startedAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        
        await container.items.upsert(item);
      }

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Sync started successfully',
          syncItemCount: pendingItems.length,
          processingCount: itemsToProcess.length,
        }),
      };

    } catch (error: any) {
      ctx.error('Error starting sync:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to start sync',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// ADD SYNC ITEM
// ==========================================

app.http('addSyncItem', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/sync/item',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();
      const validationResult = SyncRequestSchema.safeParse(body);

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

      const request = validationResult.data;
      const tenantId = req.query.get('tenantId') || 'default';
      const organizationId = req.query.get('organizationId') || 'default';
      const userId = req.query.get('userId') || 'system';

      ctx.log(`Adding sync item: ${request.operation} ${request.direction}`);

      const container = getContainer('sync-items');
      const now = new Date().toISOString();
      const syncItemId = `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const syncItem: SyncItemDocument = {
        id: syncItemId,
        localPath: request.localPath,
        sharePointPath: request.sharePointPath,
        operation: request.operation,
        direction: request.direction,
        status: 'pending',
        priority: request.priority || 'normal',
        
        fileName: request.localPath.split('/').pop() || request.sharePointPath.split('/').pop() || '',
        fileSize: 0,
        fileType: '',
        lastModified: now,
        checksum: '',
        
        retryCount: 0,
        maxRetries: 3,
        
        createdAt: now,
        updatedAt: now,
        
        organizationId,
        tenantId,
        partitionKey: tenantId,
      };

      await container.items.create(syncItem);

      ctx.log(`Sync item created: ${syncItemId}`);

      return {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          syncItemId: syncItem.id,
          status: syncItem.status,
          message: 'Sync item added successfully',
        }),
      };

    } catch (error: any) {
      ctx.error('Error adding sync item:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to add sync item',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// BATCH SYNC
// ==========================================

app.http('batchSync', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/sync/batch',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();
      const validationResult = BatchSyncRequestSchema.safeParse(body);

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

      const request = validationResult.data;
      const tenantId = req.query.get('tenantId') || 'default';
      const organizationId = req.query.get('organizationId') || 'default';

      ctx.log(`Processing batch sync: ${request.batchId} with ${request.items.length} items`);

      const container = getContainer('sync-items');
      const now = new Date().toISOString();
      const results = [];
      let successful = 0;
      let failed = 0;

      for (const itemRequest of request.items) {
        try {
          const syncItemId = `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

          const syncItem: SyncItemDocument = {
            id: syncItemId,
            localPath: itemRequest.localPath,
            sharePointPath: itemRequest.sharePointPath,
            operation: itemRequest.operation,
            direction: itemRequest.direction,
            status: 'pending',
            priority: itemRequest.priority || request.priority || 'normal',
            
            fileName: itemRequest.localPath.split('/').pop() || itemRequest.sharePointPath.split('/').pop() || '',
            fileSize: 0,
            fileType: '',
            lastModified: now,
            checksum: '',
            
            retryCount: 0,
            maxRetries: 3,
            
            createdAt: now,
            updatedAt: now,
            
            organizationId,
            tenantId,
            partitionKey: tenantId,
          };

          await container.items.create(syncItem);
          
          results.push({
            success: true,
            syncItemId: syncItem.id,
            status: syncItem.status,
          });
          successful++;

        } catch (error: any) {
          results.push({
            success: false,
            error: error.message,
            item: itemRequest,
          });
          failed++;
        }
      }

      ctx.log(`Batch sync completed: ${successful} successful, ${failed} failed`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          batchId: request.batchId,
          results,
          summary: {
            total: request.items.length,
            successful,
            failed,
            conflicted: 0,
          },
        }),
      };

    } catch (error: any) {
      ctx.error('Error processing batch sync:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to process batch sync',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET SYNC STATUS
// ==========================================

app.http('getSyncStatus', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sync/status',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const tenantId = req.query.get('tenantId') || 'default';
      const limit = parseInt(req.query.get('limit') || '50');
      const offset = parseInt(req.query.get('offset') || '0');

      ctx.log(`Fetching sync status for tenant ${tenantId}`);

      const container = getContainer('sync-items');

      // Get sync items with pagination
      const { resources: syncItems } = await container.items.query<SyncItemDocument>({
        query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit',
        parameters: [
          { name: '@tenantId', value: tenantId },
          { name: '@offset', value: offset },
          { name: '@limit', value: limit },
        ],
      }).fetchAll();

      // Get all sync items for statistics
      const { resources: allItems } = await container.items.query<SyncItemDocument>({
        query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId',
        parameters: [{ name: '@tenantId', value: tenantId }],
      }).fetchAll();

      // Calculate statistics
      const stats = {
        total: allItems.length,
        pending: allItems.filter(i => i.status === 'pending').length,
        inProgress: allItems.filter(i => i.status === 'in_progress').length,
        completed: allItems.filter(i => i.status === 'completed').length,
        failed: allItems.filter(i => i.status === 'failed').length,
        conflict: allItems.filter(i => i.status === 'conflict').length,
      };

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncItems,
          statistics: stats,
          pagination: {
            limit,
            offset,
            total: allItems.length,
          },
        }),
      };

    } catch (error: any) {
      ctx.error('Error fetching sync status:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch sync status',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET SYNC ITEM
// ==========================================

app.http('getSyncItem', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sync/item/{id}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const syncItemId = req.params.id;
      const tenantId = req.query.get('tenantId') || 'default';

      if (!syncItemId) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Sync item ID is required' }),
        };
      }

      ctx.log(`Fetching sync item ${syncItemId}`);

      const container = getContainer('sync-items');
      const { resource: syncItem } = await container.item(syncItemId, tenantId).read<SyncItemDocument>();

      if (!syncItem) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Sync item not found' }),
        };
      }

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncItem }),
      };

    } catch (error: any) {
      ctx.error('Error fetching sync item:', error);

      if (error.code === 404) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Sync item not found' }),
        };
      }

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch sync item',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// RESOLVE CONFLICT
// ==========================================

app.http('resolveConflict', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/sync/conflict/resolve',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();
      const validationResult = ConflictResolutionRequestSchema.safeParse(body);

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

      const request = validationResult.data;
      const tenantId = req.query.get('tenantId') || 'default';

      ctx.log(`Resolving conflict ${request.conflictId}`);

      const container = getContainer('conflict-resolutions');
      const now = new Date().toISOString();

      const conflictResolution: ConflictResolutionDocument = {
        id: request.conflictId,
        syncItemId: '', // TODO: Get from conflict
        conflictType: 'file_modified_both',
        conflictReason: 'Conflict detected during sync',
        
        localVersion: {}, // TODO: Get actual versions
        sharePointVersion: {},
        
        resolution: request.resolution,
        resolvedBy: request.resolvedBy,
        resolvedAt: now,
        resolutionNotes: request.notes,
        
        createdAt: now,
        updatedAt: now,
        partitionKey: tenantId,
      };

      await container.items.upsert(conflictResolution);

      // Update corresponding sync item
      const syncContainer = getContainer('sync-items');
      const { resource: syncItem } = await syncContainer.item(request.conflictId, tenantId).read<SyncItemDocument>();
      
      if (syncItem) {
        syncItem.status = 'pending';
        syncItem.updatedAt = now;
        await syncContainer.items.upsert(syncItem);
      }

      ctx.log(`Conflict resolved: ${request.conflictId}`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          conflictId: request.conflictId,
          resolution: request.resolution,
          message: 'Conflict resolved successfully',
        }),
      };

    } catch (error: any) {
      ctx.error('Error resolving conflict:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to resolve conflict',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// CLEAR COMPLETED SYNC ITEMS
// ==========================================

app.http('clearCompletedSyncItems', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'sharepoint/sync/clear-completed',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const tenantId = req.query.get('tenantId') || 'default';
      const olderThan = req.query.get('olderThan'); // ISO date string

      ctx.log(`Clearing completed sync items for tenant ${tenantId}`);

      const container = getContainer('sync-items');

      // Build query for completed items
      let query = 'SELECT * FROM c WHERE c.partitionKey = @tenantId AND (c.status = @completed OR c.status = @failed)';
      const parameters: any[] = [
        { name: '@tenantId', value: tenantId },
        { name: '@completed', value: 'completed' },
        { name: '@failed', value: 'failed' },
      ];

      if (olderThan) {
        query += ' AND c.completedAt < @olderThan';
        parameters.push({ name: '@olderThan', value: olderThan });
      }

      const { resources: completedItems } = await container.items.query<SyncItemDocument>({
        query,
        parameters,
      }).fetchAll();

      // Delete completed items
      let deletedCount = 0;
      for (const item of completedItems) {
        try {
          await container.item(item.id, tenantId).delete();
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete sync item ${item.id}:`, error);
        }
      }

      ctx.log(`Cleared ${deletedCount} completed sync items`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          deletedCount,
          message: `Cleared ${deletedCount} completed sync items`,
        }),
      };

    } catch (error: any) {
      ctx.error('Error clearing completed sync items:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to clear completed sync items',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// SYNC METRICS
// ==========================================

app.http('getSyncMetrics', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sync/metrics',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const tenantId = req.query.get('tenantId') || 'default';
      const period = req.query.get('period') || 'day'; // day, week, month

      ctx.log(`Fetching sync metrics for tenant ${tenantId}, period: ${period}`);

      const container = getContainer('sync-items');

      // Get sync items for the specified period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }

      const { resources: syncItems } = await container.items.query<SyncItemDocument>({
        query: 'SELECT * FROM c WHERE c.partitionKey = @tenantId AND c.createdAt >= @startDate AND c.createdAt <= @endDate',
        parameters: [
          { name: '@tenantId', value: tenantId },
          { name: '@startDate', value: startDate.toISOString() },
          { name: '@endDate', value: endDate.toISOString() },
        ],
      }).fetchAll();

      // Calculate metrics
      const metrics = {
        totalItems: syncItems.length,
        pendingItems: syncItems.filter(i => i.status === 'pending').length,
        inProgressItems: syncItems.filter(i => i.status === 'in_progress').length,
        completedItems: syncItems.filter(i => i.status === 'completed').length,
        failedItems: syncItems.filter(i => i.status === 'failed').length,
        conflictedItems: syncItems.filter(i => i.status === 'conflict').length,
        
        averageSyncTime: 0, // TODO: Calculate based on start/end times
        totalSyncTime: 0,
        syncThroughput: 0,
        
        totalErrors: syncItems.filter(i => i.status === 'failed').length,
        errorRate: 0,
        retryRate: 0,
        
        totalConflicts: syncItems.filter(i => i.status === 'conflict').length,
        resolvedConflicts: 0, // TODO: Get from conflict resolutions
        unresolvedConflicts: syncItems.filter(i => i.status === 'conflict').length,
        
        lastSyncTime: syncItems.length > 0 ? syncItems[0].createdAt : null,
        nextSyncTime: null, // TODO: Calculate based on schedule
        
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };

      // Calculate rates
      if (metrics.totalItems > 0) {
        metrics.errorRate = (metrics.totalErrors / metrics.totalItems) * 100;
        metrics.retryRate = (syncItems.reduce((sum, item) => sum + item.retryCount, 0) / metrics.totalItems) * 100;
      }

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          period,
        }),
      };

    } catch (error: any) {
      ctx.error('Error fetching sync metrics:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch sync metrics',
          details: error.message,
        }),
      };
    }
  },
});
