/**
 * SharePoint Integration Types
 * Type definitions for SharePoint bidirectional sync
 */

// ==========================================
// SHAREPOINT CONNECTION
// ==========================================

export interface SharePointConnection {
  siteId: string;
  siteUrl: string;
  driveId: string;
  libraryId: string;
  tenantId: string;
  organizationId: string;
  isConnected: boolean;
  lastSyncTime?: Date;
  connectionStatus: ConnectionStatus;
  credentials?: SharePointCredentials;
}

export interface SharePointCredentials {
  clientId: string;
  tenantId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'expired';

// ==========================================
// SYNC OPERATIONS
// ==========================================

export type SyncOperation = 
  | 'upload'
  | 'download'
  | 'update'
  | 'delete'
  | 'rename'
  | 'move'
  | 'copy';

export type SyncDirection = 
  | 'local_to_sharepoint'
  | 'sharepoint_to_local'
  | 'bidirectional';

export type SyncStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'conflict'
  | 'cancelled';

export interface SyncItem {
  id: string;
  localPath: string;
  sharePointPath: string;
  operation: SyncOperation;
  direction: SyncDirection;
  status: SyncStatus;
  priority: SyncPriority;
  
  // File metadata
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: Date;
  checksum: string;
  
  // SharePoint metadata
  sharePointId?: string;
  sharePointETag?: string;
  sharePointWebUrl?: string;
  
  // Sync metadata
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  errorCode?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Dependencies
  dependsOn?: string[];
  blockingItems?: string[];
  
  // Conflict resolution
  conflictResolution?: ConflictResolution;
  mergeStrategy?: MergeStrategy;
  
  // Tenant info
  organizationId: string;
  tenantId: string;
}

export type SyncPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

// ==========================================
// CONFLICT RESOLUTION
// ==========================================

export interface ConflictResolution {
  id: string;
  syncItemId: string;
  conflictType: ConflictType;
  conflictReason: string;
  
  // Conflict details
  localVersion: FileVersion;
  sharePointVersion: FileVersion;
  
  // Resolution
  resolution: ConflictResolutionStrategy;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  
  // Result
  finalVersion: FileVersion;
  mergedContent?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

export type ConflictType = 
  | 'file_modified_both'
  | 'file_deleted_local'
  | 'file_deleted_sharepoint'
  | 'file_renamed_both'
  | 'file_moved_both'
  | 'permission_conflict'
  | 'metadata_conflict'
  | 'version_conflict';

export type ConflictResolutionStrategy = 
  | 'use_local'
  | 'use_sharepoint'
  | 'merge_content'
  | 'manual_resolution'
  | 'keep_both'
  | 'skip_sync';

export interface FileVersion {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
  checksum: string;
  version: string;
  author: string;
  metadata: Record<string, any>;
}

export type MergeStrategy = 
  | 'local_wins'
  | 'sharepoint_wins'
  | 'newest_wins'
  | 'manual_merge'
  | 'auto_merge'
  | 'skip_merge';

// ==========================================
// SYNC ENGINE
// ==========================================

export interface SyncEngineConfig {
  // Sync settings
  maxConcurrentSyncs: number;
  syncInterval: number; // milliseconds
  retryDelay: number; // milliseconds
  maxRetries: number;
  
  // Conflict resolution
  defaultConflictStrategy: ConflictResolutionStrategy;
  autoResolveConflicts: boolean;
  requireUserApproval: boolean;
  
  // File filters
  includeFileTypes: string[];
  excludeFileTypes: string[];
  maxFileSize: number; // bytes
  includeHiddenFiles: boolean;
  
  // Sync behavior
  syncOnStartup: boolean;
  syncOnChange: boolean;
  syncDeletedFiles: boolean;
  preservePermissions: boolean;
  
  // Performance
  chunkSize: number; // bytes
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  
  // Monitoring
  enableMetrics: boolean;
  logLevel: LogLevel;
  enableWebhooks: boolean;
  
  // Offline support
  offlineModeEnabled: boolean;
  cacheSize: number; // bytes
  syncQueueSize: number;
}

export type LogLevel = 
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'verbose';

// ==========================================
// SYNC METRICS
// ==========================================

export interface SyncMetrics {
  totalItems: number;
  pendingItems: number;
  inProgressItems: number;
  completedItems: number;
  failedItems: number;
  conflictedItems: number;
  
  // Performance metrics
  averageSyncTime: number; // milliseconds
  totalSyncTime: number; // milliseconds
  syncThroughput: number; // bytes per second
  
  // Error metrics
  totalErrors: number;
  errorRate: number; // percentage
  retryRate: number; // percentage
  
  // Conflict metrics
  totalConflicts: number;
  resolvedConflicts: number;
  unresolvedConflicts: number;
  
  // Time-based metrics
  lastSyncTime?: Date;
  nextSyncTime?: Date;
  uptime: number; // milliseconds
  
  // Period
  period: {
    start: Date;
    end: Date;
  };
}

export interface SyncStatistics {
  current: SyncMetrics;
  daily: SyncMetrics;
  weekly: SyncMetrics;
  monthly: SyncMetrics;
  
  trends: {
    syncVolume: TrendData[];
    errorRate: TrendData[];
    conflictRate: TrendData[];
    performance: TrendData[];
  };
}

export interface TrendData {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

// ==========================================
// WEBHOOKS & REAL-TIME
// ==========================================

export interface SharePointWebhook {
  id: string;
  subscriptionId: string;
  resource: string;
  notificationUrl: string;
  expirationDateTime: Date;
  clientState?: string;
  
  // Webhook metadata
  tenantId: string;
  organizationId: string;
  isActive: boolean;
  lastNotification?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookNotification {
  id: string;
  webhookId: string;
  resource: string;
  changeType: ChangeType;
  resourceData: any;
  
  // Notification metadata
  tenantId: string;
  organizationId: string;
  processed: boolean;
  processedAt?: Date;
  
  receivedAt: Date;
}

export type ChangeType = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'moved'
  | 'renamed'
  | 'restored';

// ==========================================
// OFFLINE SUPPORT
// ==========================================

export interface OfflineCache {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  checksum: string;
  lastModified: Date;
  
  // Cache metadata
  cachedAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  
  // Sync queue
  pendingSync: boolean;
  syncOperation?: SyncOperation;
  syncPriority: SyncPriority;
  
  // Storage
  storageLocation: string; // 'memory' | 'indexeddb' | 'filesystem'
  compressed: boolean;
  encrypted: boolean;
}

export interface SyncQueue {
  id: string;
  items: SyncItem[];
  status: QueueStatus;
  priority: SyncPriority;
  
  // Queue metadata
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Processing
  currentItem?: string;
  processedItems: number;
  totalItems: number;
  
  // Configuration
  maxConcurrentItems: number;
  retryPolicy: RetryPolicy;
  
  // Tenant info
  organizationId: string;
  tenantId: string;
}

export type QueueStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  maxRetryDelay: number; // milliseconds
}

// ==========================================
// API REQUESTS & RESPONSES
// ==========================================

export interface SyncRequest {
  direction?: SyncDirection;
  operation?: SyncOperation;
  filePath?: string;
  sharePointPath?: string;
  priority?: SyncPriority;
  force?: boolean;
  conflictResolution?: ConflictResolutionStrategy;
}

export interface SyncResponse {
  success: boolean;
  syncItemId?: string;
  status?: SyncStatus;
  error?: string;
  details?: any;
}

export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: ConflictResolutionStrategy;
  notes?: string;
  resolvedBy: string;
}

export interface BatchSyncRequest {
  items: SyncRequest[];
  batchId: string;
  priority?: SyncPriority;
  conflictResolution?: ConflictResolutionStrategy;
}

export interface BatchSyncResponse {
  success: boolean;
  batchId: string;
  results: SyncResponse[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    conflicted: number;
  };
}

// ==========================================
// ERROR TYPES
// ==========================================

export enum SharePointErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class SharePointError extends Error {
  constructor(
    public type: SharePointErrorType,
    message: string,
    public details?: Record<string, any>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'SharePointError';
  }
}

// ==========================================
// CONFIGURATION
// ==========================================

export const DEFAULT_SYNC_CONFIG: SyncEngineConfig = {
  maxConcurrentSyncs: 5,
  syncInterval: 30000, // 30 seconds
  retryDelay: 5000, // 5 seconds
  maxRetries: 3,
  
  defaultConflictStrategy: 'newest_wins',
  autoResolveConflicts: true,
  requireUserApproval: false,
  
  includeFileTypes: ['*'],
  excludeFileTypes: ['.tmp', '.temp', '~$*'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  includeHiddenFiles: false,
  
  syncOnStartup: true,
  syncOnChange: true,
  syncDeletedFiles: true,
  preservePermissions: true,
  
  chunkSize: 4 * 1024 * 1024, // 4MB
  compressionEnabled: true,
  encryptionEnabled: false,
  
  enableMetrics: true,
  logLevel: 'info',
  enableWebhooks: true,
  
  offlineModeEnabled: true,
  cacheSize: 500 * 1024 * 1024, // 500MB
  syncQueueSize: 1000,
};
