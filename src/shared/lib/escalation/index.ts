/**
 * Escalation Module
 * Exports all escalation services and types
 */

// Services
export { EscalationManager, escalationManager } from './escalationManager';
export { NotificationService, notificationService } from './notificationService';

// Types
export type {
  Escalation,
  EscalationType,
  EscalationPriority,
  EscalationStatus,
  EscalationCategory,
  CreateEscalationRequest,
  UpdateEscalationRequest,
  EscalationComment,
  EscalationRule,
  EscalationMetrics,
  EscalationStatistics,
  EscalationHistoryEntry,
  EscalationAction,
  NotificationChannel,
  NotificationRecord,
  NotificationTemplate,
  EscalationConfig,
  EscalationAttachment,
  TrendData,
  PriorityRule,
} from './types';

export type {
  NotificationPayload,
  NotificationResult,
} from './notificationService';

export {
  EscalationError,
  EscalationErrorType,
  DEFAULT_ESCALATION_CONFIG,
} from './types';

