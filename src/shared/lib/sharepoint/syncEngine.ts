/**
 * Sync Engine
 * Bidirectional synchronization between local storage and SharePoint
 */

import {
  SyncItem,
  SyncOperation,
  SyncDirection,
  SyncStatus,
  SyncPriority,
  SyncEngineConfig,
  DEFAULT_SYNC_CONFIG,
  ConflictResolution,
  ConflictType,
  ConflictResolutionStrategy,
  MergeStrategy,
  SyncMetrics,
  SharePointError,
  SharePointErrorType,
} from './types';
import { sharePointService } from './sharepointService';

export class SyncEngine {
  private config: SyncEngineConfig;
  private syncQueue: Map<string, SyncItem> = new Map();
  private activeSyncs: Map<string, SyncItem> = new Map();
  private metrics: SyncMetrics;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config?: Partial<SyncEngineConfig>) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    
    // Start sync engine if auto-start is enabled
    if (this.config.syncOnStartup) {
      this.start();
    }
  }

  // ==========================================
  // SYNC ENGINE CONTROL
  // ==========================================

  /**
   * Start sync engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Sync engine is already running');
      return;
    }

    console.log('Starting sync engine...');
    
    try {
      // Connect to SharePoint if not connected
      if (!sharePointService.isConnected()) {
        console.log('SharePoint not connected, sync engine will start when connected');
        this.isRunning = true;
        return;
      }

      this.isRunning = true;
      
      // Start periodic sync
      if (this.config.syncInterval > 0) {
        this.syncInterval = setInterval(() => {
          this.performSync().catch(console.error);
        }, this.config.syncInterval);
      }

      // Perform initial sync
      await this.performSync();
      
      console.log('Sync engine started successfully');
      this.emit('started');

    } catch (error) {
      console.error('Failed to start sync engine:', error);
      this.isRunning = false;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop sync engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Sync engine is not running');
      return;
    }

    console.log('Stopping sync engine...');
    
    this.isRunning = false;
    
    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Wait for active syncs to complete
    await this.waitForActiveSyncs();
    
    console.log('Sync engine stopped');
    this.emit('stopped');
  }

  /**
   * Pause sync engine
   */
  pause(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    console.log('Sync engine paused');
    this.emit('paused');
  }

  /**
   * Resume sync engine
   */
  resume(): void {
    if (this.isRunning && this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => {
        this.performSync().catch(console.error);
      }, this.config.syncInterval);
    }
    
    console.log('Sync engine resumed');
    this.emit('resumed');
  }

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  /**
   * Add item to sync queue
   */
  addToSyncQueue(
    localPath: string,
    sharePointPath: string,
    operation: SyncOperation,
    direction: SyncDirection,
    priority: SyncPriority = 'normal'
  ): string {
    const syncItem: SyncItem = {
      id: this.generateSyncId(),
      localPath,
      sharePointPath,
      operation,
      direction,
      status: 'pending',
      priority,
      
      // File metadata (will be populated during sync)
      fileName: localPath.split('/').pop() || sharePointPath.split('/').pop() || '',
      fileSize: 0,
      fileType: '',
      lastModified: new Date(),
      checksum: '',
      
      // Sync metadata
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Tenant info
      organizationId: 'default',
      tenantId: 'default',
    };

    this.syncQueue.set(syncItem.id, syncItem);
    
    console.log(`Added to sync queue: ${syncItem.id} - ${operation} ${direction}`);
    this.emit('itemAdded', syncItem);
    
    // Trigger sync if engine is running
    if (this.isRunning) {
      this.performSync().catch(console.error);
    }

    return syncItem.id;
  }

  /**
   * Perform synchronization
   */
  async performSync(): Promise<void> {
    if (!this.isRunning) {
      console.log('Sync engine is not running');
      return;
    }

    if (!sharePointService.isConnected()) {
      console.log('SharePoint not connected, skipping sync');
      return;
    }

    console.log('Starting sync operation...');
    
    try {
      // Get pending items sorted by priority
      const pendingItems = this.getPendingItems();
      
      if (pendingItems.length === 0) {
        console.log('No pending sync items');
        return;
      }

      console.log(`Processing ${pendingItems.length} pending sync items`);

      // Process items concurrently (up to maxConcurrentSyncs)
      const batches = this.createBatches(pendingItems, this.config.maxConcurrentSyncs);
      
      for (const batch of batches) {
        await Promise.all(
          batch.map(item => this.processSyncItem(item))
        );
      }

      // Update metrics
      this.updateMetrics();
      
      console.log('Sync operation completed');
      this.emit('syncCompleted', this.metrics);

    } catch (error) {
      console.error('Sync operation failed:', error);
      this.emit('syncError', error);
      throw error;
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncItem): Promise<void> {
    if (this.activeSyncs.has(item.id)) {
      console.log(`Sync item ${item.id} is already being processed`);
      return;
    }

    this.activeSyncs.set(item.id, item);
    item.status = 'in_progress';
    item.startedAt = new Date();

    try {
      console.log(`Processing sync item: ${item.id} - ${item.operation} ${item.direction}`);

      switch (item.operation) {
        case 'upload':
          await this.processUpload(item);
          break;
        case 'download':
          await this.processDownload(item);
          break;
        case 'update':
          await this.processUpdate(item);
          break;
        case 'delete':
          await this.processDelete(item);
          break;
        case 'rename':
          await this.processRename(item);
          break;
        case 'move':
          await this.processMove(item);
          break;
        case 'copy':
          await this.processCopy(item);
          break;
        default:
          throw new Error(`Unknown sync operation: ${item.operation}`);
      }

      // Mark as completed
      item.status = 'completed';
      item.completedAt = new Date();
      
      console.log(`Sync item completed: ${item.id}`);
      this.emit('itemCompleted', item);

    } catch (error) {
      console.error(`Sync item failed: ${item.id}`, error);
      
      item.status = 'failed';
      item.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      item.errorCode = error instanceof SharePointError ? error.type : 'UNKNOWN_ERROR';
      
      // Retry logic
      if (item.retryCount < item.maxRetries && this.isRetryableError(error)) {
        item.retryCount++;
        item.status = 'pending';
        item.updatedAt = new Date();
        
        console.log(`Retrying sync item: ${item.id} (attempt ${item.retryCount})`);
        
        // Add delay before retry
        setTimeout(() => {
          this.processSyncItem(item).catch(console.error);
        }, this.config.retryDelay * Math.pow(this.config.retryDelay, item.retryCount));
        
      } else {
        this.emit('itemFailed', item, error);
      }

    } finally {
      this.activeSyncs.delete(item.id);
      item.updatedAt = new Date();
    }
  }

  // ==========================================
  // SYNC OPERATION IMPLEMENTATIONS
  // ==========================================

  /**
   * Process upload operation
   */
  private async processUpload(item: SyncItem): Promise<void> {
    // Read local file
    const fileContent = await this.readLocalFile(item.localPath);
    
    // Upload to SharePoint
    const result = await sharePointService.uploadFile(
      item.localPath,
      item.sharePointPath,
      fileContent
    );
    
    // Update item metadata
    item.sharePointId = result.id;
    item.sharePointETag = result.eTag;
    item.sharePointWebUrl = result.webUrl;
  }

  /**
   * Process download operation
   */
  private async processDownload(item: SyncItem): Promise<void> {
    // Download from SharePoint
    const result = await sharePointService.downloadFile(item.sharePointPath);
    
    // Write to local file
    await this.writeLocalFile(item.localPath, result.content);
    
    // Update item metadata
    item.fileSize = result.metadata.size;
    item.lastModified = result.metadata.lastModified;
    item.checksum = result.metadata.checksum;
  }

  /**
   * Process update operation
   */
  private async processUpdate(item: SyncItem): Promise<void> {
    // Check for conflicts
    const conflict = await this.checkForConflict(item);
    
    if (conflict) {
      await this.handleConflict(item, conflict);
      return;
    }

    // Read local file
    const fileContent = await this.readLocalFile(item.localPath);
    
    // Update in SharePoint
    const result = await sharePointService.updateFile(
      item.sharePointPath,
      fileContent
    );
    
    // Update item metadata
    item.sharePointETag = result.eTag;
  }

  /**
   * Process delete operation
   */
  private async processDelete(item: SyncItem): Promise<void> {
    if (item.direction === 'local_to_sharepoint') {
      // Delete from SharePoint
      await sharePointService.deleteFile(item.sharePointPath);
    } else {
      // Delete local file
      await this.deleteLocalFile(item.localPath);
    }
  }

  /**
   * Process rename operation
   */
  private async processRename(item: SyncItem): Promise<void> {
    // Implementation depends on specific requirements
    console.log(`Rename operation not yet implemented: ${item.id}`);
  }

  /**
   * Process move operation
   */
  private async processMove(item: SyncItem): Promise<void> {
    // Implementation depends on specific requirements
    console.log(`Move operation not yet implemented: ${item.id}`);
  }

  /**
   * Process copy operation
   */
  private async processCopy(item: SyncItem): Promise<void> {
    // Implementation depends on specific requirements
    console.log(`Copy operation not yet implemented: ${item.id}`);
  }

  // ==========================================
  // CONFLICT RESOLUTION
  // ==========================================

  /**
   * Check for sync conflicts
   */
  private async checkForConflict(item: SyncItem): Promise<ConflictResolution | null> {
    try {
      // Get local file info
      const localInfo = await this.getLocalFileInfo(item.localPath);
      
      // Get SharePoint file info
      const sharePointInfo = await sharePointService.downloadFile(item.sharePointPath);
      
      // Compare timestamps and checksums
      const localNewer = localInfo.lastModified > sharePointInfo.metadata.lastModified;
      const sharePointNewer = sharePointInfo.metadata.lastModified > localInfo.lastModified;
      const differentContent = localInfo.checksum !== sharePointInfo.metadata.checksum;
      
      if (differentContent && localNewer && sharePointNewer) {
        // Both files have been modified
        return {
          id: this.generateConflictId(),
          syncItemId: item.id,
          conflictType: 'file_modified_both',
          conflictReason: 'Both local and SharePoint versions have been modified',
          localVersion: localInfo,
          sharePointVersion: sharePointInfo.metadata,
          resolution: 'manual_resolution',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      return null;

    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return null;
    }
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(item: SyncItem, conflict: ConflictResolution): Promise<void> {
    console.log(`Handling conflict: ${conflict.id} for sync item: ${item.id}`);
    
    item.status = 'conflict';
    item.conflictResolution = conflict;
    
    if (this.config.autoResolveConflicts) {
      await this.autoResolveConflict(item, conflict);
    } else {
      this.emit('conflictDetected', item, conflict);
    }
  }

  /**
   * Auto-resolve conflict
   */
  private async autoResolveConflict(item: SyncItem, conflict: ConflictResolution): Promise<void> {
    const strategy = this.config.defaultConflictStrategy;
    
    console.log(`Auto-resolving conflict using strategy: ${strategy}`);
    
    switch (strategy) {
      case 'newest_wins':
        const localNewer = conflict.localVersion.lastModified > conflict.sharePointVersion.lastModified;
        conflict.resolution = localNewer ? 'use_local' : 'use_sharepoint';
        break;
        
      case 'local_wins':
        conflict.resolution = 'use_local';
        break;
        
      case 'sharepoint_wins':
        conflict.resolution = 'use_sharepoint';
        break;
        
      default:
        conflict.resolution = 'manual_resolution';
        this.emit('conflictDetected', item, conflict);
        return;
    }
    
    await this.applyConflictResolution(item, conflict);
  }

  /**
   * Apply conflict resolution
   */
  private async applyConflictResolution(item: SyncItem, conflict: ConflictResolution): Promise<void> {
    try {
      switch (conflict.resolution) {
        case 'use_local':
          await this.processUpload(item);
          break;
          
        case 'use_sharepoint':
          await this.processDownload(item);
          break;
          
        case 'merge_content':
          await this.mergeFileContent(item, conflict);
          break;
          
        case 'keep_both':
          await this.keepBothVersions(item, conflict);
          break;
          
        case 'skip_sync':
          item.status = 'cancelled';
          break;
          
        default:
          throw new Error(`Unknown conflict resolution strategy: ${conflict.resolution}`);
      }
      
      conflict.resolvedAt = new Date();
      item.status = 'completed';
      
      console.log(`Conflict resolved: ${conflict.id}`);
      this.emit('conflictResolved', item, conflict);

    } catch (error) {
      console.error(`Failed to resolve conflict: ${conflict.id}`, error);
      this.emit('conflictResolutionFailed', item, conflict, error);
    }
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Get pending sync items
   */
  private getPendingItems(): SyncItem[] {
    const items = Array.from(this.syncQueue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        // Sort by priority first, then by creation time
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return items.slice(0, this.config.maxConcurrentSyncs);
  }

  /**
   * Create batches for concurrent processing
   */
  private createBatches(items: SyncItem[], batchSize: number): SyncItem[][] {
    const batches: SyncItem[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof SharePointError) {
      return error.retryable;
    }
    
    // Network errors are generally retryable
    return error instanceof TypeError && error.message.includes('fetch');
  }

  /**
   * Wait for active syncs to complete
   */
  private async waitForActiveSyncs(): Promise<void> {
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.activeSyncs.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.activeSyncs.size > 0) {
      console.warn(`Timeout waiting for ${this.activeSyncs.size} active syncs to complete`);
    }
  }

  /**
   * Read local file
   */
  private async readLocalFile(path: string): Promise<ArrayBuffer> {
    // In production, implement actual file reading
    // This could be from IndexedDB, File System API, or server
    throw new Error('Local file reading not implemented');
  }

  /**
   * Write local file
   */
  private async writeLocalFile(path: string, content: ArrayBuffer): Promise<void> {
    // In production, implement actual file writing
    throw new Error('Local file writing not implemented');
  }

  /**
   * Delete local file
   */
  private async deleteLocalFile(path: string): Promise<void> {
    // In production, implement actual file deletion
    throw new Error('Local file deletion not implemented');
  }

  /**
   * Get local file info
   */
  private async getLocalFileInfo(path: string): Promise<any> {
    // In production, implement actual file info retrieval
    throw new Error('Local file info not implemented');
  }

  /**
   * Merge file content
   */
  private async mergeFileContent(item: SyncItem, conflict: ConflictResolution): Promise<void> {
    // In production, implement file content merging
    console.log('File content merging not implemented');
  }

  /**
   * Keep both versions
   */
  private async keepBothVersions(item: SyncItem, conflict: ConflictResolution): Promise<void> {
    // In production, implement keeping both versions
    console.log('Keeping both versions not implemented');
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): SyncMetrics {
    return {
      totalItems: 0,
      pendingItems: 0,
      inProgressItems: 0,
      completedItems: 0,
      failedItems: 0,
      conflictedItems: 0,
      averageSyncTime: 0,
      totalSyncTime: 0,
      syncThroughput: 0,
      totalErrors: 0,
      errorRate: 0,
      retryRate: 0,
      totalConflicts: 0,
      resolvedConflicts: 0,
      unresolvedConflicts: 0,
      uptime: 0,
      period: {
        start: new Date(),
        end: new Date(),
      },
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const items = Array.from(this.syncQueue.values());
    
    this.metrics.totalItems = items.length;
    this.metrics.pendingItems = items.filter(i => i.status === 'pending').length;
    this.metrics.inProgressItems = items.filter(i => i.status === 'in_progress').length;
    this.metrics.completedItems = items.filter(i => i.status === 'completed').length;
    this.metrics.failedItems = items.filter(i => i.status === 'failed').length;
    this.metrics.conflictedItems = items.filter(i => i.status === 'conflict').length;
    
    // Calculate other metrics...
    this.metrics.period.end = new Date();
  }

  /**
   * Generate sync ID
   */
  private generateSyncId(): string {
    return `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate conflict ID
   */
  private generateConflictId(): string {
    return `CONFLICT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==========================================
  // EVENT SYSTEM
  // ==========================================

  /**
   * Add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  /**
   * Get sync status
   */
  getStatus(): { isRunning: boolean; metrics: SyncMetrics } {
    return {
      isRunning: this.isRunning,
      metrics: { ...this.metrics },
    };
  }

  /**
   * Get sync queue
   */
  getSyncQueue(): SyncItem[] {
    return Array.from(this.syncQueue.values());
  }

  /**
   * Get active syncs
   */
  getActiveSyncs(): SyncItem[] {
    return Array.from(this.activeSyncs.values());
  }

  /**
   * Clear completed items
   */
  clearCompletedItems(): void {
    const completedIds = Array.from(this.syncQueue.entries())
      .filter(([_, item]) => item.status === 'completed' || item.status === 'failed')
      .map(([id, _]) => id);

    completedIds.forEach(id => this.syncQueue.delete(id));
    
    console.log(`Cleared ${completedIds.length} completed sync items`);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SyncEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Sync engine configuration updated');
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine();
