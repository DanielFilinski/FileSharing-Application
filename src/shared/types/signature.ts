/**
 * Digital Signatures System Types
 * Типы для системы электронной подписи документов
 */

export type SignatureMethod = 'docusign' | 'adobe-sign' | 'e-signature' | 'digital-certificate' | 'internal' | 'drawn' | 'manual';

export type SignatureStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled' | 'expired';

export type SignerStatus = 'pending' | 'sent' | 'delivered' | 'signed' | 'declined' | 'auto-responded';

// NEW TYPES FOR SIGNATURE IMPLEMENTATION

export type DocumentStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'Awaiting Signing' // ⚠️ CRITICAL STATUS - Only documents with this status can be signed
  | 'signed'
  | 'completed'
  | 'rejected'
  | 'archived'
  | 'in_signature_process'
  | 'signature_declined'
  | 'signature_expired'
  | 'pending_validation';

export type SignatureType = 'manual' | 'adobe-sign';

export type SignatureMethodDetail = 
  | 'upload'           // Manual file upload
  | 'esign'            // Adobe Sign e-signature
  | 'biometric'        // Biometric authentication
  | 'two-factor';      // 2FA authentication

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
  
  // Authentication methods for signing
  authenticationMethods: AuthenticationMethod[];
  
  // Session settings
  sessionTimeout?: number;
  ipRestrictions?: string[];
  
  // Security settings
  signatureValidityDays?: number;
  requireLegalAgreement?: boolean;
  enableAuditTrail?: boolean;
  requireIdentityVerification?: boolean;
  
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

// Manual Signature Settings
export interface ManualSignatureSettings {
  enabled: boolean;
  authorizedSigners: string[];            // User IDs
  requireAuthorization: boolean;
  notifyDocumentOwner: boolean;
  allowDirectOverwrite: boolean;
  retainPreviousVersions: boolean;
  validationPeriodDays: number;
  maxFileSizeMB: number;
  allowedFormats: string[];               // ['.pdf', '.docx', ...]
}

// E-Signature Settings (Adobe Sign)
export interface ESignatureSettings {
  enabled: boolean;
  authorizedSigners: string[];            // User IDs
  requireTwoFactor: boolean;
  allowBiometric: boolean;
  defaultExpirationDays: number;
  autoReminderDays: number;
  requireAllSigners: boolean;
}

// Adobe Sign Credentials
export interface AdobeSignCredentials {
  id: string;
  userId: string;
  organizationId: string;
  
  // Encrypted fields (will be encrypted in DB)
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  
  // Token metadata
  tokenExpiresAt?: string;
  tokenScope?: string;
  
  // Configuration
  environment: 'production' | 'stage';
  apiAccessPoint?: string;
  webAccessPoint?: string;
  
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Document Signature History
export interface DocumentSignatureRecord {
  id: string;
  documentId: string;
  signerUserId: string;
  
  // Signature details
  signatureType: SignatureType;
  signatureMethod: SignatureMethodDetail;
  
  // Version tracking
  previousVersionId?: string;
  newVersionId: string;
  versionNumber: number;
  
  // Adobe Sign specific
  adobeAgreementId?: string;
  adobeParticipantId?: string;
  adobeSigningUrl?: string;
  adobeEnvelopeStatus?: string;
  
  // Metadata
  signatureTimestamp: string;
  signerIpAddress?: string;
  signerUserAgent?: string;
  
  // Document snapshot
  documentName: string;
  documentSizeBytes: number;
  documentHash: string;
  
  // Status
  status: 'success' | 'pending' | 'failed' | 'cancelled';
  statusMessage?: string;
  
  // Validation
  isValid: boolean;
  validationExpiresAt?: string;
  validatedBy?: string;
  validatedAt?: string;
  
  createdAt: string;
}

// Adobe Sign OAuth Response
export interface AdobeSignOAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  api_access_point: string;
  web_access_point: string;
}

// Adobe Sign Agreement Request
export interface AdobeSignAgreementRequest {
  fileInfos: Array<{
    transientDocumentId: string;
  }>;
  name: string;
  participantSetsInfo: Array<{
    memberInfos: Array<{
      email: string;
      name?: string;
    }>;
    order: number;
    role: 'SIGNER' | 'APPROVER' | 'ACCEPTOR' | 'FORM_FILLER';
  }>;
  signatureType: 'ESIGN' | 'WRITTEN';
  state: 'IN_PROCESS' | 'AUTHORING';
  emailOption?: {
    sendOptions: {
      completionEmails: string;
      inFlightEmails: string;
      initEmails: string;
    };
  };
  externalId?: {
    id: string;
  };
  callbackInfo?: {
    urlInfo: {
      url: string;
    };
  };
  message?: string;
  reminderFrequency?: 'DAILY_UNTIL_SIGNED' | 'WEEKLY_UNTIL_SIGNED' | 'EVERY_OTHER_DAY_UNTIL_SIGNED';
  daysUntilSigningDeadline?: number;
}

// Adobe Sign Agreement Response
export interface AdobeSignAgreementResponse {
  id: string;
  name: string;
  status: string;
  esignEnabled: boolean;
  createdDate: string;
  expirationTime?: string;
}

// Signature Permission Check Result
export interface SignaturePermissionCheck {
  canSign: boolean;
  reasons: string[];
  signatureType: SignatureType;
  isAuthorizedSigner: boolean;
  documentStatusValid: boolean;
  hasValidCredentials?: boolean; // For Adobe Sign
}

// Updated Organization Settings to include new signature settings
export interface OrganizationSignatureSettingsExtended extends OrganizationSignatureSettings {
  manualSignature: ManualSignatureSettings;
  eSignature: ESignatureSettings;
  
  // Global settings
  requireStatusAwaitingSigning: boolean;  // ⚠️ CRITICAL
  allowedDocumentTypes: string[];
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
