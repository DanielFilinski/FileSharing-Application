/**
 * Audit Trail System Types
 * Типы для системы журналирования и аудита действий пользователей
 */

// Категории событий аудита
export type AuditCategory = 
  | 'authentication'
  | 'authorization' 
  | 'document'
  | 'signature'
  | 'chat'
  | 'user_management'
  | 'system'
  | 'search'
  | 'export'
  | 'settings';

// Типы ресурсов
export type AuditResourceType = 
  | 'document'
  | 'user'
  | 'chat'
  | 'signature_request'
  | 'organization'
  | 'session'
  | 'report'
  | 'settings';

// Уровни серьезности
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

// Статусы сессий
export type AuditSessionStatus = 'active' | 'completed' | 'terminated' | 'expired';

// Основное событие аудита
export interface AuditEvent {
  // Основная идентификация
  id: string;
  eventId: string;
  correlationId?: string; // Для связи связанных событий
  
  // Партиционирование (organizationId/год-месяц)
  partitionKey: string;
  
  // Временные метки
  timestamp: string; // ISO timestamp от клиента
  serverTimestamp: string; // ISO timestamp от сервера
  
  // Пользователь и контекст
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  organizationId: string;
  
  // Событие
  category: AuditCategory;
  action: string; // e.g., 'document.download', 'user.login'
  description: string; // Human-readable description
  
  // Объект события
  resourceType: AuditResourceType;
  resourceId: string;
  resourceName?: string;
  
  // Технические детали
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Дополнительная информация
  metadata: Record<string, any>;
  
  // Результат операции
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  // Изменения (для update операций)
  changes?: AuditChange[];
  
  // Безопасность и классификация
  severity: AuditSeverity;
  sensitive: boolean; // Содержит ли чувствительные данные
  
  // Дополнительные поля для поиска и индексирования
  searchTags?: string[]; // Теги для улучшения поиска
  
  // TTL для автоматического удаления (в секундах)
  ttl?: number;
}

// Изменение для отслеживания модификаций
export interface AuditChange {
  field: string;
  fieldDisplayName?: string;
  oldValue: any;
  newValue: any;
  dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

// Сессия пользователя
export interface AuditSession {
  id: string;
  sessionId: string;
  partitionKey: string; // organizationId
  
  // Пользователь
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  
  // Временные данные
  startTime: string;
  endTime?: string;
  duration?: number; // в секундах
  lastActivity?: string;
  
  // Технические детали
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    os?: string;
    isMobile?: boolean;
  };
  
  // Статистика активности
  eventsCount: number;
  documentsAccessed?: number;
  signaturesCreated?: number;
  
  // Статус и флаги
  status: AuditSessionStatus;
  forcedLogout?: boolean;
  
  // Метаданные
  metadata?: Record<string, any>;
}

// Отчет аудита
export interface AuditReport {
  id: string;
  name: string;
  description?: string;
  
  // Организация и создатель
  organizationId: string;
  createdBy: string;
  createdByName: string;
  
  // Параметры отчета
  parameters: AuditReportParameters;
  
  // Временные рамки
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
  // Статус и результаты
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  
  // Результаты
  eventsCount?: number;
  fileSize?: number;
  filePath?: string;
  downloadUrl?: string;
  
  // Временные метки
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  
  // Метаданные
  metadata?: Record<string, any>;
}

// Параметры отчета аудита
export interface AuditReportParameters {
  // Фильтры по событиям
  categories?: AuditCategory[];
  actions?: string[];
  severities?: AuditSeverity[];
  userIds?: string[];
  resourceTypes?: AuditResourceType[];
  resourceIds?: string[];
  
  // Фильтры по результатам
  onlySuccessful?: boolean;
  onlyFailed?: boolean;
  
  // Фильтры по содержимому
  searchText?: string;
  includeSensitive?: boolean;
  
  // Формат экспорта
  format: 'json' | 'csv' | 'pdf' | 'excel';
  
  // Дополнительные опции
  includeMetadata?: boolean;
  includeChanges?: boolean;
  groupBy?: 'user' | 'date' | 'category' | 'resource';
  
  // Ограничения
  maxEvents?: number;
}

// Запрос для поиска событий аудита
export interface AuditEventsQuery {
  // Пагинация
  limit?: number;
  offset?: number;
  continuationToken?: string;
  
  // Временные рамки
  startDate?: string;
  endDate?: string;
  
  // Фильтры
  organizationId?: string;
  userIds?: string[];
  categories?: AuditCategory[];
  actions?: string[];
  resourceTypes?: AuditResourceType[];
  resourceIds?: string[];
  severities?: AuditSeverity[];
  sessionIds?: string[];
  
  // Поиск
  searchText?: string;
  searchInMetadata?: boolean;
  
  // Флаги
  onlySuccessful?: boolean;
  onlyFailed?: boolean;
  includeSensitive?: boolean;
  
  // Сортировка
  sortBy?: 'timestamp' | 'severity' | 'user' | 'category';
  sortOrder?: 'asc' | 'desc';
  
  // Группировка
  groupBy?: 'user' | 'date' | 'category' | 'resource';
}

// Ответ на запрос событий аудита
export interface AuditEventsResponse {
  events: AuditEvent[];
  total: number;
  hasMore: boolean;
  continuationToken?: string;
  
  // Агрегированная информация
  summary?: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    uniqueUsers: number;
    categoriesCount: Record<AuditCategory, number>;
  };
}

// Настройки аудита для организации
export interface AuditSettings {
  organizationId: string;
  
  // Общие настройки
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'verbose';
  
  // Настройки сохранения
  retentionDays: number;
  archiveAfterDays?: number;
  
  // Категории событий для логирования
  enabledCategories: AuditCategory[];
  
  // Настройки по категориям
  categorySettings: Record<AuditCategory, {
    enabled: boolean;
    logMetadata: boolean;
    logChanges: boolean;
    severity: AuditSeverity;
    retentionDays?: number;
  }>;
  
  // Real-time уведомления
  realTimeNotifications: {
    enabled: boolean;
    criticalEventsOnly: boolean;
    notificationChannels: ('email' | 'sms' | 'webhook')[];
    webhookUrl?: string;
  };
  
  // Экспорт и отчеты
  exportSettings: {
    allowUserExports: boolean;
    maxExportDays: number;
    autoReportsEnabled: boolean;
    autoReportSchedule?: string; // cron expression
    autoReportRecipients?: string[];
  };
  
  // Безопасность
  securitySettings: {
    encryptSensitiveData: boolean;
    allowSensitiveDataExport: boolean;
    requireApprovalForExports: boolean;
    auditLogAccess: 'admin_only' | 'managers' | 'all_users';
  };
  
  // Интеграции
  integrations: {
    siem?: {
      enabled: boolean;
      endpoint?: string;
      apiKey?: string;
    };
    analytics?: {
      enabled: boolean;
      provider?: 'powerbi' | 'tableau' | 'custom';
    };
  };
  
  // Метаданные
  updatedAt: string;
  updatedBy: string;
}

// Статистика аудита
export interface AuditStatistics {
  organizationId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  
  // Общая статистика
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  
  // Статистика по категориям
  byCategory: Record<AuditCategory, {
    count: number;
    successRate: number;
    uniqueUsers: number;
  }>;
  
  // Статистика по дням
  byDay: Array<{
    date: string;
    eventsCount: number;
    uniqueUsers: number;
    topActions: Array<{
      action: string;
      count: number;
    }>;
  }>;
  
  // Топ пользователей
  topUsers: Array<{
    userId: string;
    userName: string;
    eventsCount: number;
    lastActivity: string;
    riskScore?: number;
  }>;
  
  // Топ действий
  topActions: Array<{
    action: string;
    category: AuditCategory;
    count: number;
    successRate: number;
  }>;
  
  // Аномалии и предупреждения
  anomalies?: Array<{
    type: 'unusual_activity' | 'failed_attempts' | 'suspicious_access';
    description: string;
    severity: AuditSeverity;
    userId?: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  
  // Тренды
  trends?: {
    activityTrend: 'increasing' | 'decreasing' | 'stable';
    securityTrend: 'improving' | 'declining' | 'stable';
    complianceScore?: number; // 0-100
  };
}

// Контекст для создания событий аудита
export interface AuditContext {
  // Автоматически заполняется middleware
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Дополнительный контекст
  correlationId?: string;
  requestId?: string;
  source?: string; // 'api', 'web', 'mobile', etc.
}

// Конфигурация для автоматического аудита
export interface AuditConfiguration {
  // Глобальные настройки
  enabled: boolean;
  defaultSeverity: AuditSeverity;
  
  // Настройки по типам операций
  operationSettings: Record<string, {
    enabled: boolean;
    category: AuditCategory;
    severity: AuditSeverity;
    logMetadata: boolean;
    logRequestBody: boolean;
    logResponseBody: boolean;
    sensitive: boolean;
  }>;
  
  // Настройки исключений
  excludePatterns: string[]; // regex patterns для исключения URL
  excludeUsers: string[]; // Системные пользователи для исключения
  
  // Настройки производительности
  async: boolean; // Асинхронное логирование
  batchSize: number;
  flushInterval: number; // в миллисекундах
}

// Утилитарные типы
export type AuditEventInput = Omit<AuditEvent, 'id' | 'eventId' | 'partitionKey' | 'serverTimestamp'>;

export type AuditSessionInput = Omit<AuditSession, 'id' | 'partitionKey' | 'eventsCount' | 'status'>;

// Перечисления для стандартных действий
export const AuditActions = {
  // Authentication
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  LOGIN_FAILED: 'user.login_failed',
  PASSWORD_CHANGED: 'user.password_changed',
  SESSION_EXPIRED: 'user.session_expired',
  
  // Document operations
  DOCUMENT_CREATED: 'document.created',
  DOCUMENT_VIEWED: 'document.viewed',
  DOCUMENT_DOWNLOADED: 'document.downloaded',
  DOCUMENT_EDITED: 'document.edited',
  DOCUMENT_DELETED: 'document.deleted',
  DOCUMENT_SHARED: 'document.shared',
  DOCUMENT_MOVED: 'document.moved',
  DOCUMENT_COPIED: 'document.copied',
  DOCUMENT_RENAMED: 'document.renamed',
  DOCUMENT_VERSION_CREATED: 'document.version_created',
  DOCUMENT_VERSION_RESTORED: 'document.version_restored',
  
  // Signature operations
  SIGNATURE_REQUEST_CREATED: 'signature.request_created',
  SIGNATURE_REQUEST_SENT: 'signature.request_sent',
  DOCUMENT_SIGNED: 'signature.document_signed',
  SIGNATURE_DECLINED: 'signature.declined',
  SIGNATURE_EXPIRED: 'signature.expired',
  
  // User management
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role_changed',
  
  // System operations
  SETTINGS_CHANGED: 'system.settings_changed',
  REPORT_GENERATED: 'system.report_generated',
  REPORT_DOWNLOADED: 'system.report_downloaded',
  BACKUP_CREATED: 'system.backup_created',
  
  // Search and access
  SEARCH_PERFORMED: 'search.performed',
  EXPORT_CREATED: 'export.created',
  BULK_OPERATION: 'system.bulk_operation'
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];
