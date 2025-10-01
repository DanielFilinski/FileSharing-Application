/**
 * SharePoint Integration Module
 * Exports all SharePoint services and types
 */

// Services
export { SharePointService, sharePointService } from './sharepointService';
export { SyncEngine, syncEngine } from './syncEngine';

// Types
export type {
  SharePointConnection,
  SharePointCredentials,
  ConnectionStatus,
  SyncItem,
  SyncOperation,
  SyncDirection,
  SyncStatus,
  SyncPriority,
  SyncEngineConfig,
  ConflictResolution,
  ConflictType,
  ConflictResolutionStrategy,
  MergeStrategy,
  FileVersion,
  SyncMetrics,
  SyncStatistics,
  SharePointWebhook,
  WebhookNotification,
  ChangeType,
  OfflineCache,
  SyncQueue,
  QueueStatus,
  RetryPolicy,
  SyncRequest,
  SyncResponse,
  ConflictResolutionRequest,
  BatchSyncRequest,
  BatchSyncResponse,
  TrendData,
  LogLevel,
} from './types';

export {
  SharePointError,
  SharePointErrorType,
  DEFAULT_SYNC_CONFIG,
} from './types';
