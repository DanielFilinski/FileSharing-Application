/**
 * Escalation System Types
 * Type definitions for escalation and incident management
 */

// ==========================================
// ESCALATION TYPES
// ==========================================

export type EscalationType = 
  | 'storage_overflow'      // Нехватка места в хранилище
  | 'storage_quota_warning' // Предупреждение о приближении к лимиту
  | 'document_validation_failed' // Ошибка валидации документа
  | 'document_approval_overdue'  // Просроченное утверждение
  | 'document_signing_failed'    // Ошибка подписания
  | 'sharepoint_sync_failed'     // Ошибка синхронизации SharePoint
  | 'system_error'               // Системная ошибка
  | 'security_breach'            // Нарушение безопасности
  | 'user_access_issue'          // Проблема доступа пользователя
  | 'workflow_blocked'           // Заблокированный workflow
  | 'deadline_missed'            // Пропущенный дедлайн
  | 'api_integration_failed'     // Ошибка API интеграции
  | 'custom';                    // Пользовательская эскалация

export type EscalationPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type EscalationStatus = 
  | 'open'           // Только создана
  | 'acknowledged'   // Подтверждена
  | 'in_progress'    // В работе
  | 'resolved'       // Решена
  | 'closed'         // Закрыта
  | 'escalated';     // Передана выше

export type EscalationCategory =
  | 'technical'      // Технические проблемы
  | 'business'       // Бизнес проблемы
  | 'security'       // Безопасность
  | 'compliance'     // Соответствие требованиям
  | 'performance';   // Производительность

// ==========================================
// ESCALATION INTERFACES
// ==========================================

export interface Escalation {
  id: string;
  type: EscalationType;
  category: EscalationCategory;
  priority: EscalationPriority;
  status: EscalationStatus;
  
  // Core information
  title: string;
  description: string;
  details?: Record<string, any>;
  
  // Context
  affectedUserId?: string;
  affectedUserName?: string;
  affectedDocumentId?: string;
  affectedDocumentName?: string;
  affectedResourceId?: string;
  affectedResourceType?: string;
  
  // Error details
  errorMessage?: string;
  errorStack?: string;
  errorCode?: string;
  
  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  assignedToTeam?: string;
  
  // Resolution
  resolvedBy?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  resolutionTime?: Date;
  
  // Timeline
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  updatedAt: Date;
  acknowledgedAt?: Date;
  escalatedAt?: Date;
  closedAt?: Date;
  
  // Metadata
  tags?: string[];
  relatedEscalations?: string[];
  attachments?: EscalationAttachment[];
  
  // SLA
  dueDate?: Date;
  slaViolated?: boolean;
  responseTime?: number; // in minutes
  resolutionTimeTarget?: number; // in minutes
  
  // Notifications
  notificationsSent?: NotificationRecord[];
  
  // Tenant
  organizationId: string;
  tenantId: string;
}

export interface EscalationAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface NotificationRecord {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  sentAt: Date;
  delivered: boolean;
  error?: string;
}

export type NotificationChannel = 
  | 'email'
  | 'teams'
  | 'sms'
  | 'in_app'
  | 'webhook';

// ==========================================
// ESCALATION RULES
// ==========================================

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Trigger conditions
  triggerType: EscalationType;
  triggerConditions?: Record<string, any>;
  
  // Auto-assignment
  autoAssignTo?: string;
  autoAssignToTeam?: string;
  
  // Priority rules
  defaultPriority: EscalationPriority;
  priorityRules?: PriorityRule[];
  
  // SLA
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  
  // Notifications
  notifyChannels: NotificationChannel[];
  notifyRecipients: string[];
  notifyOnStatusChange?: boolean;
  
  // Auto-escalation
  autoEscalateAfterMinutes?: number;
  escalateTo?: string;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  organizationId: string;
}

export interface PriorityRule {
  condition: string; // e.g., "storageUsed > 95"
  priority: EscalationPriority;
}

// ==========================================
// ESCALATION ACTIONS
// ==========================================

export interface CreateEscalationRequest {
  type: EscalationType;
  title: string;
  description: string;
  priority?: EscalationPriority;
  category?: EscalationCategory;
  details?: Record<string, any>;
  affectedUserId?: string;
  affectedDocumentId?: string;
  affectedResourceId?: string;
  tags?: string[];
}

export interface UpdateEscalationRequest {
  status?: EscalationStatus;
  priority?: EscalationPriority;
  assignedTo?: string;
  resolutionNotes?: string;
  tags?: string[];
}

export interface EscalationComment {
  id: string;
  escalationId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isInternal: boolean;
  attachments?: EscalationAttachment[];
}

// ==========================================
// ESCALATION METRICS
// ==========================================

export interface EscalationMetrics {
  total: number;
  byStatus: Record<EscalationStatus, number>;
  byPriority: Record<EscalationPriority, number>;
  byType: Record<EscalationType, number>;
  byCategory: Record<EscalationCategory, number>;
  
  averageResponseTime: number; // in minutes
  averageResolutionTime: number; // in minutes
  
  slaCompliance: number; // percentage
  slaViolations: number;
  
  openEscalations: number;
  overdueEscalations: number;
  
  period: {
    start: Date;
    end: Date;
  };
}

export interface EscalationStatistics {
  today: EscalationMetrics;
  week: EscalationMetrics;
  month: EscalationMetrics;
  
  trends: {
    escalationsCount: TrendData[];
    resolutionTime: TrendData[];
    slaCompliance: TrendData[];
  };
}

export interface TrendData {
  date: string;
  value: number;
}

// ==========================================
// NOTIFICATION TEMPLATES
// ==========================================

export interface NotificationTemplate {
  id: string;
  name: string;
  escalationType: EscalationType;
  channel: NotificationChannel;
  
  subject: string;
  body: string;
  
  // Template variables
  variables: string[];
  
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// ESCALATION HISTORY
// ==========================================

export interface EscalationHistoryEntry {
  id: string;
  escalationId: string;
  action: EscalationAction;
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  
  oldValue?: any;
  newValue?: any;
  notes?: string;
}

export type EscalationAction = 
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'reassigned'
  | 'commented'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'escalated'
  | 'acknowledged';

// ==========================================
// ERROR TYPES
// ==========================================

export enum EscalationErrorType {
  ESCALATION_NOT_FOUND = 'ESCALATION_NOT_FOUND',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RULE_NOT_FOUND = 'RULE_NOT_FOUND',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  INVALID_ASSIGNMENT = 'INVALID_ASSIGNMENT',
}

export class EscalationError extends Error {
  constructor(
    public type: EscalationErrorType,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'EscalationError';
  }
}

// ==========================================
// CONFIGURATION
// ==========================================

export interface EscalationConfig {
  // SLA defaults
  defaultResponseTimeMinutes: number;
  defaultResolutionTimeMinutes: Record<EscalationPriority, number>;
  
  // Auto-escalation
  autoEscalateEnabled: boolean;
  autoEscalateAfterMinutes: Record<EscalationPriority, number>;
  
  // Notifications
  enableEmailNotifications: boolean;
  enableTeamsNotifications: boolean;
  enableSMSNotifications: boolean;
  enableInAppNotifications: boolean;
  
  // Assignment
  defaultAssignmentTeam?: string;
  requireAssignment: boolean;
  
  // Workflow
  allowReopen: boolean;
  requireResolutionNotes: boolean;
  
  // Storage escalation
  storageWarningThreshold: number; // percentage
  storageCriticalThreshold: number; // percentage
}

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  defaultResponseTimeMinutes: 30,
  defaultResolutionTimeMinutes: {
    low: 48 * 60,        // 48 hours
    medium: 24 * 60,     // 24 hours
    high: 4 * 60,        // 4 hours
    critical: 60,        // 1 hour
  },
  autoEscalateEnabled: true,
  autoEscalateAfterMinutes: {
    low: 72 * 60,        // 3 days
    medium: 48 * 60,     // 2 days
    high: 8 * 60,        // 8 hours
    critical: 2 * 60,    // 2 hours
  },
  enableEmailNotifications: true,
  enableTeamsNotifications: true,
  enableSMSNotifications: false,
  enableInAppNotifications: true,
  requireAssignment: false,
  allowReopen: true,
  requireResolutionNotes: true,
  storageWarningThreshold: 80,
  storageCriticalThreshold: 95,
};

