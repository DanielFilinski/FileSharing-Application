# 📋 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ SIGNATURE SYSTEM

Проведя анализ задания и сопоставив его с официальной документацией Adobe Sign, составлен консистентный план интеграции обоих методов подписания в существующую архитектуру проекта.

---

## 🎯 АРХИТЕКТУРНЫЙ АНАЛИЗ

### Текущая база проекта (✅ уже есть):
```typescript
// ✅ Типы определены
SignatureMethod: 'adobe-sign' | 'e-signature' | 'manual' | ...
SignatureService (Cosmos DB)
SignatureWidget, SignatureSettings (UI)
OrganizationSignatureSettings
```

### Что нужно добавить (⚠️):
```typescript
// ⚠️ Новые сущности
Document status validation: "Awaiting Signing"
Authorized Signatories management
Adobe Sign OAuth flow
Manual signature upload flow
Version management на подписанных документах
```

---

## 📊 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ (25-33 дня)

### **ФАЗА 1: ПОДГОТОВКА И БАЗА ДАННЫХ (3-4 дня)**

#### День 1-2: Миграция базы данных

```sql
-- migrations/003_signature_implementation.sql

-- 1. Таблица для Adobe Sign credentials (SQL Server)
CREATE TABLE user_adobe_sign_credentials (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  user_id BIGINT NOT NULL,
  organization_id BIGINT NOT NULL,
  
  -- Encrypted credentials
  client_id NVARCHAR(500) NOT NULL, -- Encrypted with AES-256
  client_secret NVARCHAR(MAX) NOT NULL, -- Encrypted
  access_token NVARCHAR(MAX), -- Encrypted
  refresh_token NVARCHAR(MAX), -- Encrypted
  
  -- Token metadata
  token_expires_at DATETIME2,
  token_scope NVARCHAR(500),
  
  -- Configuration
  environment NVARCHAR(50) DEFAULT 'production', -- 'production' or 'stage'
  api_access_point NVARCHAR(255), -- From OAuth response
  web_access_point NVARCHAR(255),
  
  -- Status
  is_active BIT DEFAULT 1,
  last_used_at DATETIME2,
  
  -- Audit
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_AdobeCredentials_User FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT FK_AdobeCredentials_Organization FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT UQ_AdobeCredentials_User UNIQUE (user_id, organization_id)
);

CREATE INDEX IX_AdobeCredentials_User ON user_adobe_sign_credentials(user_id);
CREATE INDEX IX_AdobeCredentials_Active ON user_adobe_sign_credentials(is_active, user_id);

-- 2. Таблица для настроек подписей организации
CREATE TABLE organization_signature_settings (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  organization_id BIGINT NOT NULL UNIQUE,
  
  -- Manual Signature Settings
  manual_enabled BIT DEFAULT 1,
  manual_authorized_signers NVARCHAR(MAX), -- JSON: [user_id, ...]
  manual_require_authorization BIT DEFAULT 1,
  manual_notify_owner BIT DEFAULT 1,
  manual_allow_direct_overwrite BIT DEFAULT 0,
  manual_retain_versions BIT DEFAULT 1,
  manual_validation_period_days INT DEFAULT 30,
  manual_max_file_size_mb INT DEFAULT 50,
  manual_allowed_formats NVARCHAR(255) DEFAULT '.pdf,.docx,.xlsx,.txt',
  
  -- E-Signature Settings (Adobe Sign)
  esign_enabled BIT DEFAULT 1,
  esign_authorized_signers NVARCHAR(MAX), -- JSON: [user_id, ...]
  esign_require_two_factor BIT DEFAULT 0,
  esign_allow_biometric BIT DEFAULT 1,
  esign_default_expiration_days INT DEFAULT 30,
  esign_auto_reminder_days INT DEFAULT 3,
  esign_require_all_signers BIT DEFAULT 1,
  
  -- Shared Settings
  require_status_awaiting_signing BIT DEFAULT 1, -- ⚠️ КРИТИЧЕСКОЕ
  allowed_document_types NVARCHAR(MAX), -- JSON: ['contract', 'agreement', ...]
  
  -- Audit
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_by BIGINT,
  
  CONSTRAINT FK_OrgSigSettings_Organization FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE
);

-- 3. Таблица истории подписей
CREATE TABLE document_signature_history (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  document_id BIGINT NOT NULL,
  signer_user_id BIGINT NOT NULL,
  
  -- Signature details
  signature_type NVARCHAR(20) NOT NULL, -- 'manual' or 'adobe-sign'
  signature_method NVARCHAR(50), -- 'upload', 'esign', 'biometric'
  
  -- Version tracking
  previous_version_id BIGINT,
  new_version_id BIGINT NOT NULL,
  version_number INT NOT NULL,
  
  -- Adobe Sign specific
  adobe_agreement_id NVARCHAR(255),
  adobe_participant_id NVARCHAR(255),
  adobe_signing_url NVARCHAR(MAX),
  adobe_envelope_status NVARCHAR(50),
  
  -- Metadata
  signature_timestamp DATETIME2 DEFAULT GETUTCDATE(),
  signer_ip_address NVARCHAR(50),
  signer_user_agent NVARCHAR(500),
  signer_location_lat DECIMAL(10, 8),
  signer_location_lon DECIMAL(11, 8),
  
  -- Document info at signing time
  document_name NVARCHAR(500),
  document_size_bytes BIGINT,
  document_hash NVARCHAR(255), -- SHA-256
  
  -- Status
  status NVARCHAR(20) DEFAULT 'success', -- 'success', 'pending', 'failed', 'cancelled'
  status_message NVARCHAR(MAX),
  
  -- Validation
  is_valid BIT DEFAULT 1,
  validation_expires_at DATETIME2,
  validated_by BIGINT,
  validated_at DATETIME2,
  
  -- Audit
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_SigHistory_Document FOREIGN KEY (document_id) 
    REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT FK_SigHistory_Signer FOREIGN KEY (signer_user_id) 
    REFERENCES users(id),
  CONSTRAINT FK_SigHistory_PrevVersion FOREIGN KEY (previous_version_id) 
    REFERENCES document_versions(id),
  CONSTRAINT FK_SigHistory_NewVersion FOREIGN KEY (new_version_id) 
    REFERENCES document_versions(id)
);

CREATE INDEX IX_SigHistory_Document ON document_signature_history(document_id, signature_timestamp DESC);
CREATE INDEX IX_SigHistory_Signer ON document_signature_history(signer_user_id, signature_timestamp DESC);
CREATE INDEX IX_SigHistory_AdobeAgreement ON document_signature_history(adobe_agreement_id) WHERE adobe_agreement_id IS NOT NULL;
CREATE INDEX IX_SigHistory_Status ON document_signature_history(status, signature_timestamp DESC);

-- 4. Добавить поля в таблицу documents (если еще не существует)
ALTER TABLE documents ADD status NVARCHAR(50) DEFAULT 'draft';
ALTER TABLE documents ADD awaiting_signature_since DATETIME2;
ALTER TABLE documents ADD signature_required BIT DEFAULT 0;

-- 5. Таблица для rate limiting
CREATE TABLE signature_rate_limits (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  user_id BIGINT NOT NULL,
  action_type NVARCHAR(50) NOT NULL, -- 'manual_upload', 'adobe_sign', 'oauth'
  attempt_count INT DEFAULT 1,
  window_start DATETIME2 DEFAULT GETUTCDATE(),
  last_attempt DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_RateLimit_User FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IX_RateLimit_UserAction ON signature_rate_limits(user_id, action_type, window_start);
```

#### День 3: TypeScript типы и интерфейсы

```typescript
// src/shared/types/signature.ts - ДОПОЛНЕНИЯ

export type DocumentStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'Awaiting Signing' // ⚠️ КРИТИЧЕСКИЙ статус
  | 'signed'
  | 'completed'
  | 'rejected'
  | 'archived';

export type SignatureType = 'manual' | 'adobe-sign';

export type SignatureMethodDetail = 
  | 'upload'           // Manual file upload
  | 'esign'            // Adobe Sign e-signature
  | 'biometric'        // Biometric authentication
  | 'two-factor';      // 2FA authentication

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

// Combined Organization Settings
export interface OrganizationSignatureSettings {
  id: string;
  organizationId: string;
  
  manualSignature: ManualSignatureSettings;
  eSignature: ESignatureSettings;
  
  // Global settings
  requireStatusAwaitingSigning: boolean;  // ⚠️ КРИТИЧЕСКОЕ
  allowedDocumentTypes: string[];
  
  updatedAt: string;
  updatedBy: string;
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
```

#### День 4: Утилиты валидации и проверки

```typescript
// src/features/signatures/utils/documentStatusValidator.ts

import { DocumentStatus } from '@/shared/types/signature';

export class DocumentStatusValidator {
  private static readonly SIGNABLE_STATUS: DocumentStatus = 'Awaiting Signing';

  /**
   * ⚠️ КРИТИЧЕСКАЯ ПРОВЕРКА
   * Проверяет, может ли документ быть подписан
   */
  static canDocumentBeSigned(documentStatus: DocumentStatus): boolean {
    return documentStatus === this.SIGNABLE_STATUS;
  }

  /**
   * Проверяет статус и возвращает детальный результат
   */
  static validateSignatureEligibility(document: {
    id: string;
    status: DocumentStatus;
    signatureRequired: boolean;
    awaitingSignatureSince?: string;
  }): {
    eligible: boolean;
    reason?: string;
  } {
    if (!document.signatureRequired) {
      return {
        eligible: false,
        reason: 'Document does not require signature'
      };
    }

    if (!this.canDocumentBeSigned(document.status)) {
      return {
        eligible: false,
        reason: `Document status must be "${this.SIGNABLE_STATUS}", current status: "${document.status}"`
      };
    }

    // Проверка timeout (опционально)
    if (document.awaitingSignatureSince) {
      const daysSince = this.getDaysSince(document.awaitingSignatureSince);
      if (daysSince > 90) { // Например, 90 дней максимум
        return {
          eligible: false,
          reason: 'Signature request has expired (>90 days)'
        };
      }
    }

    return { eligible: true };
  }

  private static getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Получить читаемое сообщение об ошибке
   */
  static getStatusErrorMessage(currentStatus: DocumentStatus): string {
    return `Cannot sign document with status "${currentStatus}". Document must have status "Awaiting Signing".`;
  }
}
```

```typescript
// src/features/signatures/utils/signaturePermissionChecker.ts

import { SignatureType, SignaturePermissionCheck } from '@/shared/types/signature';
import { OrganizationSignatureSettings } from '@/shared/types/signature';
import { DocumentStatusValidator } from './documentStatusValidator';

export class SignaturePermissionChecker {
  /**
   * Комплексная проверка разрешений на подпись
   */
  static async checkPermissions(params: {
    userId: string;
    document: {
      id: string;
      status: string;
      signatureRequired: boolean;
      awaitingSignatureSince?: string;
    };
    signatureType: SignatureType;
    settings: OrganizationSignatureSettings;
    hasAdobeCredentials?: boolean;
  }): Promise<SignaturePermissionCheck> {
    const reasons: string[] = [];
    let canSign = true;

    // 1. ⚠️ КРИТИЧЕСКАЯ ПРОВЕРКА: Статус документа
    const statusCheck = DocumentStatusValidator.validateSignatureEligibility(params.document);
    const documentStatusValid = statusCheck.eligible;
    
    if (!documentStatusValid) {
      canSign = false;
      reasons.push(statusCheck.reason || 'Invalid document status');
    }

    // 2. Проверка авторизованных подписантов
    let isAuthorizedSigner = false;
    
    if (params.signatureType === 'manual') {
      isAuthorizedSigner = params.settings.manualSignature.authorizedSigners.includes(params.userId);
      if (!params.settings.manualSignature.enabled) {
        canSign = false;
        reasons.push('Manual signature is disabled for this organization');
      }
    } else if (params.signatureType === 'adobe-sign') {
      isAuthorizedSigner = params.settings.eSignature.authorizedSigners.includes(params.userId);
      if (!params.settings.eSignature.enabled) {
        canSign = false;
        reasons.push('E-Signature is disabled for this organization');
      }
    }

    if (!isAuthorizedSigner) {
      canSign = false;
      reasons.push(`User is not in authorized signers list for ${params.signatureType}`);
    }

    // 3. Проверка Adobe Sign credentials (только для e-signature)
    let hasValidCredentials = true;
    if (params.signatureType === 'adobe-sign') {
      if (params.hasAdobeCredentials === false) {
        canSign = false;
        hasValidCredentials = false;
        reasons.push('Adobe Sign credentials not configured');
      }
    }

    return {
      canSign,
      reasons,
      signatureType: params.signatureType,
      isAuthorizedSigner,
      documentStatusValid,
      hasValidCredentials
    };
  }

  /**
   * Быстрая проверка: может ли пользователь использовать метод подписи
   */
  static canUseSignatureMethod(
    userId: string,
    signatureType: SignatureType,
    settings: OrganizationSignatureSettings
  ): boolean {
    if (signatureType === 'manual') {
      return (
        settings.manualSignature.enabled &&
        settings.manualSignature.authorizedSigners.includes(userId)
      );
    }

    if (signatureType === 'adobe-sign') {
      return (
        settings.eSignature.enabled &&
        settings.eSignature.authorizedSigners.includes(userId)
      );
    }

    return false;
  }
}
```

---

### **ФАЗА 2: MANUAL SIGNATURE (4-5 дней)**

#### День 5-6: Backend - Manual Signature API

```typescript
// api/src/functions/manualSignature.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { DocumentService } from '../shared/documents/documentService';
import { SignatureService } from '../shared/signature/signatureService';
import { DocumentStatusValidator } from '../shared/signature/documentStatusValidator';
import { SignaturePermissionChecker } from '../shared/signature/signaturePermissionChecker';
import { RateLimiter } from '../shared/middleware/rateLimiter';

const documentService = new DocumentService();
const signatureService = new SignatureService();
const rateLimiter = new RateLimiter();

/**
 * Upload manually signed document
 * POST /api/documents/{documentId}/manual-signature
 */
app.http('uploadManualSignature', {
  methods: ['POST'],
  route: 'documents/{documentId}/manual-signature',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const documentId = request.params.documentId!;
      const { userId, organizationId, email } = SignatureService.getUserFromRequest(request);

      // Rate limiting: 10 requests per minute
      const isAllowed = await rateLimiter.checkLimit(userId, 'manual_upload', 10, 60);
      if (!isAllowed) {
        return {
          status: 429,
          jsonBody: { error: 'Too many upload attempts. Please try again later.' }
        };
      }

      // 1. Получить документ
      const document = await documentService.getDocument(documentId);
      if (!document) {
        return { status: 404, jsonBody: { error: 'Document not found' } };
      }

      // 2. ⚠️ КРИТИЧЕСКАЯ ПРОВЕРКА: Статус документа
      if (!DocumentStatusValidator.canDocumentBeSigned(document.status)) {
        return {
          status: 400,
          jsonBody: {
            error: DocumentStatusValidator.getStatusErrorMessage(document.status),
            currentStatus: document.status,
            requiredStatus: 'Awaiting Signing'
          }
        };
      }

      // 3. Получить настройки организации
      const settings = await signatureService.getOrganizationSettings(organizationId);
      if (!settings) {
        return { status: 400, jsonBody: { error: 'Signature settings not configured' } };
      }

      // 4. Проверка разрешений
      const permissionCheck = await SignaturePermissionChecker.checkPermissions({
        userId,
        document,
        signatureType: 'manual',
        settings
      });

      if (!permissionCheck.canSign) {
        return {
          status: 403,
          jsonBody: {
            error: 'Not authorized to sign this document',
            reasons: permissionCheck.reasons
          }
        };
      }

      // 5. Парсинг multipart/form-data
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return { status: 400, jsonBody: { error: 'No file uploaded' } };
      }

      // 6. Валидация файла
      const validation = validateUploadedFile(file, settings.manualSignature);
      if (!validation.valid) {
        return { status: 400, jsonBody: { error: validation.error } };
      }

      // 7. Require authorization check (если включено)
      if (settings.manualSignature.requireAuthorization) {
        // TODO: Create approval request
        // For MVP, can skip or implement simple notification
        context.log('Authorization required - implement approval flow');
      }

      // 8. Загрузка файла в Azure Blob Storage
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileHash = await calculateSHA256(fileBuffer);
      
      const blobUrl = await uploadToBlobStorage({
        buffer: fileBuffer,
        fileName: file.name,
        documentId,
        userId,
        organizationId
      });

      // 9. Создать новую версию документа
      const previousVersion = await documentService.getLatestVersion(documentId);
      
      const newVersion = await documentService.createVersion({
        documentId,
        versionNumber: (previousVersion?.versionNumber || 0) + 1,
        fileUrl: blobUrl,
        fileName: file.name,
        fileSize: file.size,
        fileHash,
        uploadedBy: userId,
        changeDescription: 'Manually signed version',
        isSigned: true
      });

      // 10. Записать в историю подписей
      const signatureRecord = await signatureService.createSignatureRecord({
        documentId,
        signerUserId: userId,
        signatureType: 'manual',
        signatureMethod: 'upload',
        previousVersionId: previousVersion?.id,
        newVersionId: newVersion.id,
        versionNumber: newVersion.versionNumber,
        documentName: document.name,
        documentSizeBytes: file.size,
        documentHash: fileHash,
        signerIpAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        signerUserAgent: request.headers.get('user-agent'),
        status: 'success',
        validationExpiresAt: settings.manualSignature.validationPeriodDays
          ? new Date(Date.now() + settings.manualSignature.validationPeriodDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      });

      // 11. Обновить статус документа
      const allowOverwrite = settings.manualSignature.allowDirectOverwrite;
      await documentService.updateDocument(documentId, {
        status: allowOverwrite ? 'signed' : 'pending_validation',
        currentVersionId: newVersion.id,
        signedAt: new Date().toISOString(),
        signedBy: userId
      });

      // 12. Отправить уведомления
      if (settings.manualSignature.notifyDocumentOwner) {
        await sendNotification({
          type: 'manual_signature_uploaded',
          documentId,
          documentName: document.name,
          signerUserId: userId,
          ownerUserId: document.ownerId,
          organizationId
        });
      }

      // 13. Логирование в audit trail
      await signatureService.logSignatureEvent(
        signatureRecord.id,
        'signed',
        userId,
        {
          method: 'manual_upload',
          fileName: file.name,
          fileSize: file.size,
          documentStatus: document.status
        }
      );

      return {
        status: 200,
        jsonBody: {
          success: true,
          signatureRecord,
          newVersion,
          document: await documentService.getDocument(documentId)
        }
      };

    } catch (error: any) {
      context.error('Error uploading manual signature:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Internal server error' }
      };
    }
  }
});

// Helper functions

function validateUploadedFile(file: File, settings: any): { valid: boolean; error?: string } {
  // Проверка размера
  const maxSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${settings.maxFileSizeMB}MB)`
    };
  }

  // Проверка формата
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedFormats = settings.allowedFormats;
  
  if (!allowedFormats.includes(extension)) {
    return {
      valid: false,
      error: `File format not allowed. Allowed formats: ${allowedFormats.join(', ')}`
    };
  }

  // Проверка MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type'
    };
  }

  return { valid: true };
}

async function calculateSHA256(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadToBlobStorage(params: {
  buffer: Buffer;
  fileName: string;
  documentId: string;
  userId: string;
  organizationId: string;
}): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );

  const containerName = `signatures-${params.organizationId}`;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Создать контейнер если не существует
  await containerClient.createIfNotExists({
    access: 'private'
  });

  // Генерировать уникальное имя файла
  const timestamp = Date.now();
  const blobName = `${params.documentId}/${timestamp}_${params.fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Загрузить файл
  await blockBlobClient.upload(params.buffer, params.buffer.length, {
    blobHTTPHeaders: {
      blobContentType: getMimeType(params.fileName)
    },
    metadata: {
      documentId: params.documentId,
      uploadedBy: params.userId,
      uploadedAt: new Date().toISOString()
    }
  });

  return blockBlobClient.url;
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

async function sendNotification(params: any): Promise<void> {
  // TODO: Implement notification service
  console.log('Sending notification:', params);
}
```

#### День 7-8: Frontend - Manual Signature UI

```typescript
// src/features/signatures/components/ManualSignatureUpload.tsx

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  ProgressBar,
  Card
} from '@fluentui/react-components';
import {
  DocumentArrowUpRegular,
  ArrowUploadRegular,
  DismissRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  DocumentRegular
} from '@fluentui/react-icons';

import { signatureApi } from '@/shared/api/signatureApi';
import { notificationService } from '@/shared/lib/notifications';
import { DocumentSignatureRecord } from '@/shared/types/signature';

interface ManualSignatureUploadProps {
  documentId: string;
  documentName: string;
  onSuccess?: (signature: DocumentSignatureRecord) => void;
  onCancel?: () => void;
}

export const ManualSignatureUpload: React.FC<ManualSignatureUploadProps> = ({
  documentId,
  documentName,
  onSuccess,
  onCancel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валидация на клиенте
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }

    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.txt'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      setError(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      // Trigger file validation
      const fakeEvent = {
        target: { files: [file] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Создать FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Загрузить с progress tracking
      const result = await signatureApi.uploadManualSignature(
        documentId,
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        }
      );

      setUploadComplete(true);
      
      notificationService.success(
        'Manual signature uploaded',
        `Document "${documentName}" has been signed successfully`
      );

      // Задержка для показа success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.signatureRecord);
        }
        handleClose();
      }, 2000);

    } catch (err: any) {
      console.error('Failed to upload manual signature:', err);
      setError(err.message || 'Failed to upload signed document');
      
      notificationService.error(
        'Upload failed',
        err.message || 'Please try again'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    setUploadComplete(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  const renderFileInfo = () => {
    if (!selectedFile) return null;

    return (
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <DocumentRegular className="text-2xl text-blue-600" />
          <div className="flex-1">
            <Text weight="semibold" className="block">
              {selectedFile.name}
            </Text>
            <Text size={200} className="text-gray-600">
              {formatFileSize(selectedFile.size)}
            </Text>
          </div>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
            size="small"
          />
        </div>
      </Card>
    );
  };

  const renderDropZone = () => {
    if (selectedFile) return null;

    return (
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <ArrowUploadRegular className="text-4xl text-gray-400 mx-auto mb-3" />
        <Text weight="semibold" className="block mb-2">
          Drop signed document here
        </Text>
        <Text size={300} className="text-gray-600 block mb-3">
          or click to browse
        </Text>
        <Text size={200} className="text-gray-500">
          Supported formats: PDF, DOCX, XLSX, TXT (Max 50MB)
        </Text>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  };

  const renderUploadProgress = () => {
    if (!isUploading && !uploadComplete) return null;

    return (
      <div className="space-y-3">
        {isUploading && (
          <>
            <ProgressBar value={uploadProgress / 100} />
            <div className="flex items-center justify-between">
              <Text size={300}>Uploading... {uploadProgress}%</Text>
              <Spinner size="tiny" />
            </div>
          </>
        )}
        
        {uploadComplete && (
          <MessageBar intent="success">
            <MessageBarBody>
              <div className="flex items-center gap-2">
                <CheckmarkCircleRegular />
                <Text weight="semibold">Document signed successfully!</Text>
              </div>
            </MessageBarBody>
          </MessageBar>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="primary"
          icon={<DocumentArrowUpRegular />}
        >
          Manual Signature
        </Button>
      </DialogTrigger>
      
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogTitle>Upload Manually Signed Document</DialogTitle>
        
        <DialogBody>
          <DialogContent className="space-y-4">
            <MessageBar intent="info">
              <MessageBarBody>
                <MessageBarTitle>Document: {documentName}</MessageBarTitle>
                Upload the signed version of this document. The system will create a new version and mark it as signed.
              </MessageBarBody>
            </MessageBar>

            {error && (
              <MessageBar intent="error">
                <MessageBarBody>
                  <div className="flex items-center gap-2">
                    <ErrorCircleRegular />
                    {error}
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            {renderDropZone()}
            {renderFileInfo()}
            {renderUploadProgress()}

            <MessageBar intent="warning">
              <MessageBarBody>
                <Text size={300}>
                  <strong>Important:</strong> Make sure the document is properly signed before uploading. 
                  All pages should be included and signatures should be clearly visible.
                </Text>
              </MessageBarBody>
            </MessageBar>
          </DialogContent>
        </DialogBody>

        <DialogActions>
          <Button
            appearance="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<ArrowUploadRegular />}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadComplete}
          >
            {isUploading ? 'Uploading...' : 'Upload & Sign'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default ManualSignatureUpload;
```

---

## 📄 ПРОДОЛЖЕНИЕ В СЛЕДУЮЩЕЙ ЧАСТИ

Файл успешно создан. Продолжение с детальным планом Adobe Sign интеграции следует...


## 🎯 АРХИТЕКТУРНЫЙ АНАЛИЗ

### Текущая база проекта (✅ уже есть):
```typescript
// ✅ Типы определены
SignatureMethod: 'adobe-sign' | 'e-signature' | 'manual' | ...
SignatureService (Cosmos DB)
SignatureWidget, SignatureSettings (UI)
OrganizationSignatureSettings
```

### Что нужно добавить (⚠️):
```typescript
// ⚠️ Новые сущности
Document status validation: "Awaiting Signing"
Authorized Signatories management
Adobe Sign OAuth flow
Manual signature upload flow
Version management на подписанных документах
```

---

## 📊 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ (25-33 дня)

### **ФАЗА 1: ПОДГОТОВКА И БАЗА ДАННЫХ (3-4 дня)**

#### День 1-2: Миграция базы данных

```sql
-- migrations/003_signature_implementation.sql

-- 1. Таблица для Adobe Sign credentials (SQL Server)
CREATE TABLE user_adobe_sign_credentials (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  user_id BIGINT NOT NULL,
  organization_id BIGINT NOT NULL,
  
  -- Encrypted credentials
  client_id NVARCHAR(500) NOT NULL, -- Encrypted with AES-256
  client_secret NVARCHAR(MAX) NOT NULL, -- Encrypted
  access_token NVARCHAR(MAX), -- Encrypted
  refresh_token NVARCHAR(MAX), -- Encrypted
  
  -- Token metadata
  token_expires_at DATETIME2,
  token_scope NVARCHAR(500),
  
  -- Configuration
  environment NVARCHAR(50) DEFAULT 'production', -- 'production' or 'stage'
  api_access_point NVARCHAR(255), -- From OAuth response
  web_access_point NVARCHAR(255),
  
  -- Status
  is_active BIT DEFAULT 1,
  last_used_at DATETIME2,
  
  -- Audit
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_AdobeCredentials_User FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT FK_AdobeCredentials_Organization FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT UQ_AdobeCredentials_User UNIQUE (user_id, organization_id)
);

CREATE INDEX IX_AdobeCredentials_User ON user_adobe_sign_credentials(user_id);
CREATE INDEX IX_AdobeCredentials_Active ON user_adobe_sign_credentials(is_active, user_id);

-- 2. Таблица для настроек подписей организации
CREATE TABLE organization_signature_settings (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  organization_id BIGINT NOT NULL UNIQUE,
  
  -- Manual Signature Settings
  manual_enabled BIT DEFAULT 1,
  manual_authorized_signers NVARCHAR(MAX), -- JSON: [user_id, ...]
  manual_require_authorization BIT DEFAULT 1,
  manual_notify_owner BIT DEFAULT 1,
  manual_allow_direct_overwrite BIT DEFAULT 0,
  manual_retain_versions BIT DEFAULT 1,
  manual_validation_period_days INT DEFAULT 30,
  manual_max_file_size_mb INT DEFAULT 50,
  manual_allowed_formats NVARCHAR(255) DEFAULT '.pdf,.docx,.xlsx,.txt',
  
  -- E-Signature Settings (Adobe Sign)
  esign_enabled BIT DEFAULT 1,
  esign_authorized_signers NVARCHAR(MAX), -- JSON: [user_id, ...]
  esign_require_two_factor BIT DEFAULT 0,
  esign_allow_biometric BIT DEFAULT 1,
  esign_default_expiration_days INT DEFAULT 30,
  esign_auto_reminder_days INT DEFAULT 3,
  esign_require_all_signers BIT DEFAULT 1,
  
  -- Shared Settings
  require_status_awaiting_signing BIT DEFAULT 1, -- ⚠️ КРИТИЧЕСКОЕ
  allowed_document_types NVARCHAR(MAX), -- JSON: ['contract', 'agreement', ...]
  
  -- Audit
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_by BIGINT,
  
  CONSTRAINT FK_OrgSigSettings_Organization FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE
);

-- 3. Таблица истории подписей
CREATE TABLE document_signature_history (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  document_id BIGINT NOT NULL,
  signer_user_id BIGINT NOT NULL,
  
  -- Signature details
  signature_type NVARCHAR(20) NOT NULL, -- 'manual' or 'adobe-sign'
  signature_method NVARCHAR(50), -- 'upload', 'esign', 'biometric'
  
  -- Version tracking
  previous_version_id BIGINT,
  new_version_id BIGINT NOT NULL,
  version_number INT NOT NULL,
  
  -- Adobe Sign specific
  adobe_agreement_id NVARCHAR(255),
  adobe_participant_id NVARCHAR(255),
  adobe_signing_url NVARCHAR(MAX),
  adobe_envelope_status NVARCHAR(50),
  
  -- Metadata
  signature_timestamp DATETIME2 DEFAULT GETUTCDATE(),
  signer_ip_address NVARCHAR(50),
  signer_user_agent NVARCHAR(500),
  signer_location_lat DECIMAL(10, 8),
  signer_location_lon DECIMAL(11, 8),
  
  -- Document info at signing time
  document_name NVARCHAR(500),
  document_size_bytes BIGINT,
  document_hash NVARCHAR(255), -- SHA-256
  
  -- Status
  status NVARCHAR(20) DEFAULT 'success', -- 'success', 'pending', 'failed', 'cancelled'
  status_message NVARCHAR(MAX),
  
  -- Validation
  is_valid BIT DEFAULT 1,
  validation_expires_at DATETIME2,
  validated_by BIGINT,
  validated_at DATETIME2,
  
  -- Audit
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_SigHistory_Document FOREIGN KEY (document_id) 
    REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT FK_SigHistory_Signer FOREIGN KEY (signer_user_id) 
    REFERENCES users(id),
  CONSTRAINT FK_SigHistory_PrevVersion FOREIGN KEY (previous_version_id) 
    REFERENCES document_versions(id),
  CONSTRAINT FK_SigHistory_NewVersion FOREIGN KEY (new_version_id) 
    REFERENCES document_versions(id)
);

CREATE INDEX IX_SigHistory_Document ON document_signature_history(document_id, signature_timestamp DESC);
CREATE INDEX IX_SigHistory_Signer ON document_signature_history(signer_user_id, signature_timestamp DESC);
CREATE INDEX IX_SigHistory_AdobeAgreement ON document_signature_history(adobe_agreement_id) WHERE adobe_agreement_id IS NOT NULL;
CREATE INDEX IX_SigHistory_Status ON document_signature_history(status, signature_timestamp DESC);

-- 4. Добавить поля в таблицу documents (если еще не существует)
ALTER TABLE documents ADD status NVARCHAR(50) DEFAULT 'draft';
ALTER TABLE documents ADD awaiting_signature_since DATETIME2;
ALTER TABLE documents ADD signature_required BIT DEFAULT 0;

-- 5. Таблица для rate limiting
CREATE TABLE signature_rate_limits (
  id BIGINT PRIMARY KEY IDENTITY(1,1),
  user_id BIGINT NOT NULL,
  action_type NVARCHAR(50) NOT NULL, -- 'manual_upload', 'adobe_sign', 'oauth'
  attempt_count INT DEFAULT 1,
  window_start DATETIME2 DEFAULT GETUTCDATE(),
  last_attempt DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_RateLimit_User FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IX_RateLimit_UserAction ON signature_rate_limits(user_id, action_type, window_start);
```

#### День 3: TypeScript типы и интерфейсы

```typescript
// src/shared/types/signature.ts - ДОПОЛНЕНИЯ

export type DocumentStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'Awaiting Signing' // ⚠️ КРИТИЧЕСКИЙ статус
  | 'signed'
  | 'completed'
  | 'rejected'
  | 'archived';

export type SignatureType = 'manual' | 'adobe-sign';

export type SignatureMethodDetail = 
  | 'upload'           // Manual file upload
  | 'esign'            // Adobe Sign e-signature
  | 'biometric'        // Biometric authentication
  | 'two-factor';      // 2FA authentication

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

// Combined Organization Settings
export interface OrganizationSignatureSettings {
  id: string;
  organizationId: string;
  
  manualSignature: ManualSignatureSettings;
  eSignature: ESignatureSettings;
  
  // Global settings
  requireStatusAwaitingSigning: boolean;  // ⚠️ КРИТИЧЕСКОЕ
  allowedDocumentTypes: string[];
  
  updatedAt: string;
  updatedBy: string;
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
```

#### День 4: Утилиты валидации и проверки

```typescript
// src/features/signatures/utils/documentStatusValidator.ts

import { DocumentStatus } from '@/shared/types/signature';

export class DocumentStatusValidator {
  private static readonly SIGNABLE_STATUS: DocumentStatus = 'Awaiting Signing';

  /**
   * ⚠️ КРИТИЧЕСКАЯ ПРОВЕРКА
   * Проверяет, может ли документ быть подписан
   */
  static canDocumentBeSigned(documentStatus: DocumentStatus): boolean {
    return documentStatus === this.SIGNABLE_STATUS;
  }

  /**
   * Проверяет статус и возвращает детальный результат
   */
  static validateSignatureEligibility(document: {
    id: string;
    status: DocumentStatus;
    signatureRequired: boolean;
    awaitingSignatureSince?: string;
  }): {
    eligible: boolean;
    reason?: string;
  } {
    if (!document.signatureRequired) {
      return {
        eligible: false,
        reason: 'Document does not require signature'
      };
    }

    if (!this.canDocumentBeSigned(document.status)) {
      return {
        eligible: false,
        reason: `Document status must be "${this.SIGNABLE_STATUS}", current status: "${document.status}"`
      };
    }

    // Проверка timeout (опционально)
    if (document.awaitingSignatureSince) {
      const daysSince = this.getDaysSince(document.awaitingSignatureSince);
      if (daysSince > 90) { // Например, 90 дней максимум
        return {
          eligible: false,
          reason: 'Signature request has expired (>90 days)'
        };
      }
    }

    return { eligible: true };
  }

  private static getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Получить читаемое сообщение об ошибке
   */
  static getStatusErrorMessage(currentStatus: DocumentStatus): string {
    return `Cannot sign document with status "${currentStatus}". Document must have status "Awaiting Signing".`;
  }
}
```

```typescript
// src/features/signatures/utils/signaturePermissionChecker.ts

import { SignatureType, SignaturePermissionCheck } from '@/shared/types/signature';
import { OrganizationSignatureSettings } from '@/shared/types/signature';
import { DocumentStatusValidator } from './documentStatusValidator';

export class SignaturePermissionChecker {
  /**
   * Комплексная проверка разрешений на подпись
   */
  static async checkPermissions(params: {
    userId: string;
    document: {
      id: string;
      status: string;
      signatureRequired: boolean;
      awaitingSignatureSince?: string;
    };
    signatureType: SignatureType;
    settings: OrganizationSignatureSettings;
    hasAdobeCredentials?: boolean;
  }): Promise<SignaturePermissionCheck> {
    const reasons: string[] = [];
    let canSign = true;

    // 1. ⚠️ КРИТИЧЕСКАЯ ПРОВЕРКА: Статус документа
    const statusCheck = DocumentStatusValidator.validateSignatureEligibility(params.document);
    const documentStatusValid = statusCheck.eligible;
    
    if (!documentStatusValid) {
      canSign = false;
      reasons.push(statusCheck.reason || 'Invalid document status');
    }

    // 2. Проверка авторизованных подписантов
    let isAuthorizedSigner = false;
    
    if (params.signatureType === 'manual') {
      isAuthorizedSigner = params.settings.manualSignature.authorizedSigners.includes(params.userId);
      if (!params.settings.manualSignature.enabled) {
        canSign = false;
        reasons.push('Manual signature is disabled for this organization');
      }
    } else if (params.signatureType === 'adobe-sign') {
      isAuthorizedSigner = params.settings.eSignature.authorizedSigners.includes(params.userId);
      if (!params.settings.eSignature.enabled) {
        canSign = false;
        reasons.push('E-Signature is disabled for this organization');
      }
    }

    if (!isAuthorizedSigner) {
      canSign = false;
      reasons.push(`User is not in authorized signers list for ${params.signatureType}`);
    }

    // 3. Проверка Adobe Sign credentials (только для e-signature)
    let hasValidCredentials = true;
    if (params.signatureType === 'adobe-sign') {
      if (params.hasAdobeCredentials === false) {
        canSign = false;
        hasValidCredentials = false;
        reasons.push('Adobe Sign credentials not configured');
      }
    }

    return {
      canSign,
      reasons,
      signatureType: params.signatureType,
      isAuthorizedSigner,
      documentStatusValid,
      hasValidCredentials
    };
  }

  /**
   * Быстрая проверка: может ли пользователь использовать метод подписи
   */
  static canUseSignatureMethod(
    userId: string,
    signatureType: SignatureType,
    settings: OrganizationSignatureSettings
  ): boolean {
    if (signatureType === 'manual') {
      return (
        settings.manualSignature.enabled &&
        settings.manualSignature.authorizedSigners.includes(userId)
      );
    }

    if (signatureType === 'adobe-sign') {
      return (
        settings.eSignature.enabled &&
        settings.eSignature.authorizedSigners.includes(userId)
      );
    }

    return false;
  }
}
```

---

### **ФАЗА 2: MANUAL SIGNATURE (4-5 дней)**

#### День 5-6: Backend - Manual Signature API

```typescript
// api/src/functions/manualSignature.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { DocumentService } from '../shared/documents/documentService';
import { SignatureService } from '../shared/signature/signatureService';
import { DocumentStatusValidator } from '../shared/signature/documentStatusValidator';
import { SignaturePermissionChecker } from '../shared/signature/signaturePermissionChecker';
import { RateLimiter } from '../shared/middleware/rateLimiter';

const documentService = new DocumentService();
const signatureService = new SignatureService();
const rateLimiter = new RateLimiter();

/**
 * Upload manually signed document
 * POST /api/documents/{documentId}/manual-signature
 */
app.http('uploadManualSignature', {
  methods: ['POST'],
  route: 'documents/{documentId}/manual-signature',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const documentId = request.params.documentId!;
      const { userId, organizationId, email } = SignatureService.getUserFromRequest(request);

      // Rate limiting: 10 requests per minute
      const isAllowed = await rateLimiter.checkLimit(userId, 'manual_upload', 10, 60);
      if (!isAllowed) {
        return {
          status: 429,
          jsonBody: { error: 'Too many upload attempts. Please try again later.' }
        };
      }

      // 1. Получить документ
      const document = await documentService.getDocument(documentId);
      if (!document) {
        return { status: 404, jsonBody: { error: 'Document not found' } };
      }

      // 2. ⚠️ КРИТИЧЕСКАЯ ПРОВЕРКА: Статус документа
      if (!DocumentStatusValidator.canDocumentBeSigned(document.status)) {
        return {
          status: 400,
          jsonBody: {
            error: DocumentStatusValidator.getStatusErrorMessage(document.status),
            currentStatus: document.status,
            requiredStatus: 'Awaiting Signing'
          }
        };
      }

      // 3. Получить настройки организации
      const settings = await signatureService.getOrganizationSettings(organizationId);
      if (!settings) {
        return { status: 400, jsonBody: { error: 'Signature settings not configured' } };
      }

      // 4. Проверка разрешений
      const permissionCheck = await SignaturePermissionChecker.checkPermissions({
        userId,
        document,
        signatureType: 'manual',
        settings
      });

      if (!permissionCheck.canSign) {
        return {
          status: 403,
          jsonBody: {
            error: 'Not authorized to sign this document',
            reasons: permissionCheck.reasons
          }
        };
      }

      // 5. Парсинг multipart/form-data
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return { status: 400, jsonBody: { error: 'No file uploaded' } };
      }

      // 6. Валидация файла
      const validation = validateUploadedFile(file, settings.manualSignature);
      if (!validation.valid) {
        return { status: 400, jsonBody: { error: validation.error } };
      }

      // 7. Require authorization check (если включено)
      if (settings.manualSignature.requireAuthorization) {
        // TODO: Create approval request
        // For MVP, can skip or implement simple notification
        context.log('Authorization required - implement approval flow');
      }

      // 8. Загрузка файла в Azure Blob Storage
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileHash = await calculateSHA256(fileBuffer);
      
      const blobUrl = await uploadToBlobStorage({
        buffer: fileBuffer,
        fileName: file.name,
        documentId,
        userId,
        organizationId
      });

      // 9. Создать новую версию документа
      const previousVersion = await documentService.getLatestVersion(documentId);
      
      const newVersion = await documentService.createVersion({
        documentId,
        versionNumber: (previousVersion?.versionNumber || 0) + 1,
        fileUrl: blobUrl,
        fileName: file.name,
        fileSize: file.size,
        fileHash,
        uploadedBy: userId,
        changeDescription: 'Manually signed version',
        isSigned: true
      });

      // 10. Записать в историю подписей
      const signatureRecord = await signatureService.createSignatureRecord({
        documentId,
        signerUserId: userId,
        signatureType: 'manual',
        signatureMethod: 'upload',
        previousVersionId: previousVersion?.id,
        newVersionId: newVersion.id,
        versionNumber: newVersion.versionNumber,
        documentName: document.name,
        documentSizeBytes: file.size,
        documentHash: fileHash,
        signerIpAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        signerUserAgent: request.headers.get('user-agent'),
        status: 'success',
        validationExpiresAt: settings.manualSignature.validationPeriodDays
          ? new Date(Date.now() + settings.manualSignature.validationPeriodDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      });

      // 11. Обновить статус документа
      const allowOverwrite = settings.manualSignature.allowDirectOverwrite;
      await documentService.updateDocument(documentId, {
        status: allowOverwrite ? 'signed' : 'pending_validation',
        currentVersionId: newVersion.id,
        signedAt: new Date().toISOString(),
        signedBy: userId
      });

      // 12. Отправить уведомления
      if (settings.manualSignature.notifyDocumentOwner) {
        await sendNotification({
          type: 'manual_signature_uploaded',
          documentId,
          documentName: document.name,
          signerUserId: userId,
          ownerUserId: document.ownerId,
          organizationId
        });
      }

      // 13. Логирование в audit trail
      await signatureService.logSignatureEvent(
        signatureRecord.id,
        'signed',
        userId,
        {
          method: 'manual_upload',
          fileName: file.name,
          fileSize: file.size,
          documentStatus: document.status
        }
      );

      return {
        status: 200,
        jsonBody: {
          success: true,
          signatureRecord,
          newVersion,
          document: await documentService.getDocument(documentId)
        }
      };

    } catch (error: any) {
      context.error('Error uploading manual signature:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Internal server error' }
      };
    }
  }
});

// Helper functions

function validateUploadedFile(file: File, settings: any): { valid: boolean; error?: string } {
  // Проверка размера
  const maxSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${settings.maxFileSizeMB}MB)`
    };
  }

  // Проверка формата
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedFormats = settings.allowedFormats;
  
  if (!allowedFormats.includes(extension)) {
    return {
      valid: false,
      error: `File format not allowed. Allowed formats: ${allowedFormats.join(', ')}`
    };
  }

  // Проверка MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type'
    };
  }

  return { valid: true };
}

async function calculateSHA256(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadToBlobStorage(params: {
  buffer: Buffer;
  fileName: string;
  documentId: string;
  userId: string;
  organizationId: string;
}): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );

  const containerName = `signatures-${params.organizationId}`;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Создать контейнер если не существует
  await containerClient.createIfNotExists({
    access: 'private'
  });

  // Генерировать уникальное имя файла
  const timestamp = Date.now();
  const blobName = `${params.documentId}/${timestamp}_${params.fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Загрузить файл
  await blockBlobClient.upload(params.buffer, params.buffer.length, {
    blobHTTPHeaders: {
      blobContentType: getMimeType(params.fileName)
    },
    metadata: {
      documentId: params.documentId,
      uploadedBy: params.userId,
      uploadedAt: new Date().toISOString()
    }
  });

  return blockBlobClient.url;
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

async function sendNotification(params: any): Promise<void> {
  // TODO: Implement notification service
  console.log('Sending notification:', params);
}
```

#### День 7-8: Frontend - Manual Signature UI

```typescript
// src/features/signatures/components/ManualSignatureUpload.tsx

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  ProgressBar,
  Card
} from '@fluentui/react-components';
import {
  DocumentArrowUpRegular,
  ArrowUploadRegular,
  DismissRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  DocumentRegular
} from '@fluentui/react-icons';

import { signatureApi } from '@/shared/api/signatureApi';
import { notificationService } from '@/shared/lib/notifications';
import { DocumentSignatureRecord } from '@/shared/types/signature';

interface ManualSignatureUploadProps {
  documentId: string;
  documentName: string;
  onSuccess?: (signature: DocumentSignatureRecord) => void;
  onCancel?: () => void;
}

export const ManualSignatureUpload: React.FC<ManualSignatureUploadProps> = ({
  documentId,
  documentName,
  onSuccess,
  onCancel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валидация на клиенте
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }

    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.txt'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      setError(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      // Trigger file validation
      const fakeEvent = {
        target: { files: [file] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Создать FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Загрузить с progress tracking
      const result = await signatureApi.uploadManualSignature(
        documentId,
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        }
      );

      setUploadComplete(true);
      
      notificationService.success(
        'Manual signature uploaded',
        `Document "${documentName}" has been signed successfully`
      );

      // Задержка для показа success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.signatureRecord);
        }
        handleClose();
      }, 2000);

    } catch (err: any) {
      console.error('Failed to upload manual signature:', err);
      setError(err.message || 'Failed to upload signed document');
      
      notificationService.error(
        'Upload failed',
        err.message || 'Please try again'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    setUploadComplete(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  const renderFileInfo = () => {
    if (!selectedFile) return null;

    return (
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <DocumentRegular className="text-2xl text-blue-600" />
          <div className="flex-1">
            <Text weight="semibold" className="block">
              {selectedFile.name}
            </Text>
            <Text size={200} className="text-gray-600">
              {formatFileSize(selectedFile.size)}
            </Text>
          </div>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
            size="small"
          />
        </div>
      </Card>
    );
  };

  const renderDropZone = () => {
    if (selectedFile) return null;

    return (
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <ArrowUploadRegular className="text-4xl text-gray-400 mx-auto mb-3" />
        <Text weight="semibold" className="block mb-2">
          Drop signed document here
        </Text>
        <Text size={300} className="text-gray-600 block mb-3">
          or click to browse
        </Text>
        <Text size={200} className="text-gray-500">
          Supported formats: PDF, DOCX, XLSX, TXT (Max 50MB)
        </Text>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  };

  const renderUploadProgress = () => {
    if (!isUploading && !uploadComplete) return null;

    return (
      <div className="space-y-3">
        {isUploading && (
          <>
            <ProgressBar value={uploadProgress / 100} />
            <div className="flex items-center justify-between">
              <Text size={300}>Uploading... {uploadProgress}%</Text>
              <Spinner size="tiny" />
            </div>
          </>
        )}
        
        {uploadComplete && (
          <MessageBar intent="success">
            <MessageBarBody>
              <div className="flex items-center gap-2">
                <CheckmarkCircleRegular />
                <Text weight="semibold">Document signed successfully!</Text>
              </div>
            </MessageBarBody>
          </MessageBar>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="primary"
          icon={<DocumentArrowUpRegular />}
        >
          Manual Signature
        </Button>
      </DialogTrigger>
      
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogTitle>Upload Manually Signed Document</DialogTitle>
        
        <DialogBody>
          <DialogContent className="space-y-4">
            <MessageBar intent="info">
              <MessageBarBody>
                <MessageBarTitle>Document: {documentName}</MessageBarTitle>
                Upload the signed version of this document. The system will create a new version and mark it as signed.
              </MessageBarBody>
            </MessageBar>

            {error && (
              <MessageBar intent="error">
                <MessageBarBody>
                  <div className="flex items-center gap-2">
                    <ErrorCircleRegular />
                    {error}
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            {renderDropZone()}
            {renderFileInfo()}
            {renderUploadProgress()}

            <MessageBar intent="warning">
              <MessageBarBody>
                <Text size={300}>
                  <strong>Important:</strong> Make sure the document is properly signed before uploading. 
                  All pages should be included and signatures should be clearly visible.
                </Text>
              </MessageBarBody>
            </MessageBar>
          </DialogContent>
        </DialogBody>

        <DialogActions>
          <Button
            appearance="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<ArrowUploadRegular />}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadComplete}
          >
            {isUploading ? 'Uploading...' : 'Upload & Sign'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default ManualSignatureUpload;
```

---

## 📄 ПРОДОЛЖЕНИЕ В СЛЕДУЮЩЕЙ ЧАСТИ

Файл успешно создан. Продолжение с детальным планом Adobe Sign интеграции следует...


