/**
 * Digital Signatures System Types
 * Типы для системы электронной подписи документов
 */

export type SignatureMethod = 'docusign' | 'adobe-sign' | 'internal' | 'drawn';

export type SignatureStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled' | 'expired';

export type SignerStatus = 'pending' | 'sent' | 'delivered' | 'signed' | 'declined' | 'auto-responded';

export type SignerRole = 'signer' | 'approver' | 'reviewer' | 'cc' | 'witness';

export type SigningOrder = 'sequential' | 'parallel';

export type AuthenticationMethod = 'email' | 'sms' | 'password' | 'phone-auth' | 'id-check';

// Основной интерфейс запроса на подпись
export interface SignatureRequest {
  id: string;
  documentId: string;
  organizationId: string;
  requesterId: string;
  requestedByUserId: string;
  
  // Статус и метаданные
  status: SignatureStatus;
  signatureMethod: SignatureMethod;
  
  // Интеграция с внешними провайдерами
  providerEnvelopeId?: string;
  providerStatus?: string;
  providerUrl?: string;
  
  // Подписанты
  signers: Signer[];
  
  // Настройки подписания
  settings: SignatureRequestSettings;
  
  // Временные метки
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  expiresAt?: string;
  
  // Метаданные
  subject?: string;
  message?: string;
  documentName: string;
  documentVersion?: string;
}

// Подписант
export interface Signer {
  id: string;
  userId?: string; // Для внутренних пользователей
  email: string;
  name: string;
  role: SignerRole;
  order: number; // Порядок подписания для sequential mode
  
  // Статус подписанта
  status: SignerStatus;
  signedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  
  // Настройки аутентификации
  authenticationMethods: AuthenticationMethod[];
  
  // Метаданные подписи
  signatureInfo?: SignatureInfo;
  
  // Доступ к документу
  accessCode?: string;
  phoneNumber?: string;
  
  // Уведомления
  emailNotifications: boolean;
  reminderEnabled: boolean;
}

// Информация о подписи
export interface SignatureInfo {
  signatureId: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  coordinates?: SignatureCoordinates;
  signatureImage?: string; // Base64 image для drawn signatures
  certificateInfo?: CertificateInfo;
}

// Координаты подписи на документе
export interface SignatureCoordinates {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Информация о сертификате
export interface CertificateInfo {
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  keyLength?: number;
  algorithm?: string;
}

// Настройки запроса на подпись
export interface SignatureRequestSettings {
  // Порядок подписания
  signingOrder: SigningOrder;
  
  // Уведомления
  emailNotifications: boolean;
  reminderSettings: {
    enabled: boolean;
    intervalDays: number;
    maxReminders: number;
  };
  
  // Сроки
  expirationDays: number;
  
  // Безопасность
  requireAllSignersToSign: boolean;
  allowDecline: boolean;
  allowComments: boolean;
  
  // Внешний вид
  brandingSettings?: BrandingSettings;
  
  // Дополнительные настройки
  downloadable: boolean;
  printable: boolean;
  
  // Callback URLs
  callbackUrl?: string;
  redirectUrl?: string;
}

// Настройки брендинга
export interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  emailSubject?: string;
  emailMessage?: string;
  companyName?: string;
}

// Шаблон подписи
export interface SignatureTemplate {
  id: string;
  name: string;
  organizationId: string;
  
  // Настройки шаблона
  signatureMethod: SignatureMethod;
  defaultSettings: SignatureRequestSettings;
  
  // Подписанты по умолчанию
  defaultSigners: Omit<Signer, 'id' | 'status' | 'signedAt'>[];
  
  // Метаданные
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  
  // Статистика использования
  usageCount: number;
  lastUsed?: string;
}

// Настройки подписи организации
export interface OrganizationSignatureSettings {
  organizationId: string;
  
  // Доступные методы подписи
  enabledMethods: SignatureMethod[];
  defaultMethod: SignatureMethod;
  
  // Настройки провайдеров
  providerSettings: {
    docusign?: DocuSignSettings;
    adobeSign?: AdobeSignSettings;
  };
  
  // Настройки внешнего вида
  appearanceSettings: {
    displaySignerName: boolean;
    displaySignDate: boolean;
    displayCompanyName: boolean;
    displayCustomText?: string;
    signatureFont?: string;
    signatureColor?: string;
  };
  
  // Настройки безопасности
  securitySettings: {
    requireAuthentication: boolean;
    allowedAuthMethods: AuthenticationMethod[];
    sessionTimeoutMinutes: number;
    ipRestrictions?: string[];
    requireSecureConnection: boolean;
  };
  
  // Настройки workflow
  workflowSettings: {
    autoSendReminders: boolean;
    defaultReminderDays: number;
    defaultExpirationDays: number;
    allowDelegation: boolean;
    requireCompleteOrder: boolean;
  };
  
  // Audit settings
  auditSettings: {
    logAllEvents: boolean;
    retentionDays: number;
    includeDocumentHashes: boolean;
    requireDigitalCertificate: boolean;
  };
  
  // Метаданные
  updatedAt: string;
  updatedBy: string;
}

// Настройки DocuSign
export interface DocuSignSettings {
  accountId: string;
  integrationKey: string;
  userId: string;
  environment: 'demo' | 'production';
  callbackUrl?: string;
  brandId?: string;
}

// Настройки Adobe Sign
export interface AdobeSignSettings {
  applicationId: string;
  environment: 'staging' | 'production';
  callbackUrl?: string;
  webhookId?: string;
}

// События для audit trail
export interface SignatureEvent {
  id: string;
  signatureRequestId: string;
  eventType: 'created' | 'sent' | 'delivered' | 'signed' | 'declined' | 'completed' | 'cancelled' | 'expired';
  userId?: string;
  signerEmail?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

// Статистика подписей
export interface SignatureStatistics {
  organizationId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  
  // Основные метрики
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  expiredRequests: number;
  
  // По методам подписи
  byMethod: Record<SignatureMethod, number>;
  
  // Время выполнения
  averageCompletionTime: number; // в часах
  completionRates: {
    within24Hours: number;
    within7Days: number;
    within30Days: number;
  };
  
  // Наиболее активные пользователи
  topRequesters: Array<{
    userId: string;
    userName: string;
    requestCount: number;
  }>;
  
  topSigners: Array<{
    email: string;
    name: string;
    signCount: number;
  }>;
}

// Bulk signature operation
export interface BulkSignatureRequest {
  id: string;
  organizationId: string;
  requesterId: string;
  
  // Документы для подписания
  documents: Array<{
    documentId: string;
    documentName: string;
  }>;
  
  // Общие настройки для всех документов
  commonSigners: Omit<Signer, 'id' | 'status' | 'signedAt'>[];
  settings: SignatureRequestSettings;
  
  // Статус bulk операции
  status: 'preparing' | 'sending' | 'in-progress' | 'completed' | 'failed';
  
  // Прогресс
  progress: {
    totalDocuments: number;
    processedDocuments: number;
    successfulRequests: number;
    failedRequests: number;
  };
  
  // Индивидуальные запросы
  individualRequests: SignatureRequest[];
  
  // Временные метки
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// Webhook payload от внешних провайдеров
export interface SignatureWebhookPayload {
  signatureRequestId: string;
  providerEventType: string;
  providerStatus: string;
  providerEnvelopeId: string;
  
  // Данные от провайдера
  providerData: Record<string, any>;
  
  // Извлеченные данные
  extractedData: {
    status?: SignatureStatus;
    signerUpdates?: Array<{
      signerEmail: string;
      status: SignerStatus;
      signedAt?: string;
      declineReason?: string;
    }>;
    completedAt?: string;
  };
  
  receivedAt: string;
}
