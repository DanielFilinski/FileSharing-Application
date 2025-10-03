/**
 * Manual Signature API Endpoint
 * Handles file upload for manually signed documents
 * ⚠️ CRITICAL: Only documents with status "Awaiting Signing" can be signed
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { CosmosClient } from '@azure/cosmos';
import { DocumentStatusValidator } from '../shared/signature/documentStatusValidator';
import { SignaturePermissionChecker } from '../shared/signature/signaturePermissionChecker';
import * as crypto from 'crypto';

// Initialize services
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT!,
  key: process.env.COSMOS_DB_KEY!
});

const database = cosmosClient.database(process.env.COSMOS_DB_NAME!);
const documentsContainer = database.container('documents');
const signatureHistoryContainer = database.container('document-signature-history');
const signatureSettingsContainer = database.container('organization-signature-settings');
const rateLimitsContainer = database.container('signature-rate-limits');

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

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
      const { userId, organizationId, email } = getUserFromRequest(request);

      context.log(`Manual signature upload request for document ${documentId} by user ${userId}`);

      // 1. Rate limiting check
      const rateLimitCheck = await checkRateLimit(userId, 'manual_upload');
      if (!rateLimitCheck.allowed) {
        return {
          status: 429,
          jsonBody: {
            error: 'Too many upload attempts. Please try again later.',
            resetTime: rateLimitCheck.resetTime,
            remainingAttempts: rateLimitCheck.remainingAttempts
          }
        };
      }

      // 2. Get document from database
      const { resource: document } = await documentsContainer.item(documentId, documentId).read();
      if (!document) {
        return {
          status: 404,
          jsonBody: { error: 'Document not found' }
        };
      }

      // 3. ⚠️ CRITICAL CHECK: Document status validation
      if (!DocumentStatusValidator.canDocumentBeSigned(document.status)) {
        return {
          status: 400,
          jsonBody: {
            error: DocumentStatusValidator.getStatusErrorMessage(document.status),
            currentStatus: document.status,
            requiredStatus: 'Awaiting Signing',
            statusInfo: DocumentStatusValidator.getStatusInfo(document.status)
          }
        };
      }

      // 4. Get organization signature settings
      const { resource: settings } = await signatureSettingsContainer
        .item(organizationId, organizationId)
        .read();
      
      if (!settings) {
        return {
          status: 400,
          jsonBody: { error: 'Signature settings not configured for organization' }
        };
      }

      // 5. Permission check
      const permissionCheck = await SignaturePermissionChecker.checkPermissions({
        userId,
        document: {
          id: document.id,
          status: document.status,
          signatureRequired: document.signature_required || false,
          awaitingSignatureSince: document.awaiting_signature_since,
          organizationId: document.organization_id
        },
        signatureType: 'manual',
        settings: {
          manualSignature: {
            enabled: settings.manual_enabled,
            authorizedSigners: JSON.parse(settings.manual_authorized_signers || '[]'),
            requireAuthorization: settings.manual_require_authorization,
            notifyDocumentOwner: settings.manual_notify_owner,
            allowDirectOverwrite: settings.manual_allow_direct_overwrite,
            retainPreviousVersions: settings.manual_retain_versions,
            validationPeriodDays: settings.manual_validation_period_days,
            maxFileSizeMB: settings.manual_max_file_size_mb,
            allowedFormats: settings.manual_allowed_formats.split(',')
          },
          eSignature: {
            enabled: settings.esign_enabled,
            authorizedSigners: JSON.parse(settings.esign_authorized_signers || '[]'),
            requireTwoFactor: settings.esign_require_two_factor,
            allowBiometric: settings.esign_allow_biometric,
            defaultExpirationDays: settings.esign_default_expiration_days,
            autoReminderDays: settings.esign_auto_reminder_days,
            requireAllSigners: settings.esign_require_all_signers
          },
          requireStatusAwaitingSigning: settings.require_status_awaiting_signing,
          allowedDocumentTypes: JSON.parse(settings.allowed_document_types || '[]')
        } as any
      });

      if (!permissionCheck.canSign) {
        return {
          status: 403,
          jsonBody: {
            error: 'Not authorized to sign this document',
            reasons: permissionCheck.reasons,
            permissionSummary: SignaturePermissionChecker.generatePermissionSummary(permissionCheck)
          }
        };
      }

      // 6. Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return {
          status: 400,
          jsonBody: { error: 'No file uploaded' }
        };
      }

      // 7. Validate uploaded file
      const fileValidation = validateUploadedFile(file, settings);
      if (!fileValidation.valid) {
        return {
          status: 400,
          jsonBody: { error: fileValidation.error }
        };
      }

      // 8. Process file upload
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileHash = calculateSHA256(fileBuffer);
      
      // Upload to Azure Blob Storage
      const blobUrl = await uploadToBlobStorage({
        buffer: fileBuffer,
        fileName: file.name,
        documentId,
        userId,
        organizationId
      });

      // 9. Create new document version (if version control is enabled)
      let newVersionId = generateId('version');
      let versionNumber = 1;
      
      if (settings.manual_retain_versions) {
        // Get current version number
        const { resources: existingVersions } = await database.container('document-versions').items
          .query({
            query: 'SELECT TOP 1 * FROM c WHERE c.document_id = @documentId ORDER BY c.version_number DESC',
            parameters: [{ name: '@documentId', value: documentId }]
          })
          .fetchAll();
        
        if (existingVersions.length > 0) {
          versionNumber = existingVersions[0].version_number + 1;
        }

        // Create new version record
        await database.container('document-versions').items.create({
          id: newVersionId,
          document_id: documentId,
          version_number: versionNumber,
          file_url: blobUrl,
          file_name: file.name,
          file_size: file.size,
          file_hash: fileHash,
          uploaded_by: userId,
          change_description: 'Manually signed version',
          is_signed: true,
          created_at: new Date().toISOString()
        });
      }

      // 10. Create signature history record
      const signatureRecordId = generateId('sig-history');
      const signatureRecord = {
        id: signatureRecordId,
        document_id: documentId,
        signer_user_id: userId,
        signature_type: 'manual',
        signature_method: 'upload',
        new_version_id: newVersionId,
        version_number: versionNumber,
        signature_timestamp: new Date().toISOString(),
        signer_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        signer_user_agent: request.headers.get('user-agent'),
        document_name: document.name,
        document_size_bytes: file.size,
        document_hash: fileHash,
        status: 'success',
        is_valid: true,
        validation_expires_at: new Date(
          Date.now() + settings.manual_validation_period_days * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date().toISOString()
      };

      await signatureHistoryContainer.items.create(signatureRecord);

      // 11. Update document status
      const newDocumentStatus = settings.manual_allow_direct_overwrite ? 'signed' : 'pending_validation';
      
      await documentsContainer.item(documentId, documentId).patch([
        { op: 'replace', path: '/status', value: newDocumentStatus },
        { op: 'replace', path: '/signed_at', value: new Date().toISOString() },
        { op: 'replace', path: '/signed_by', value: userId },
        { op: 'replace', path: '/current_version_id', value: newVersionId }
      ]);

      // 12. Send notifications (if enabled)
      if (settings.manual_notify_owner && document.owner_id !== userId) {
        await sendNotification({
          type: 'manual_signature_uploaded',
          documentId,
          documentName: document.name,
          signerUserId: userId,
          signerEmail: email,
          ownerUserId: document.owner_id,
          organizationId,
          signatureRecordId
        });
      }

      // 13. Update rate limit counter
      await updateRateLimit(userId, 'manual_upload');

      // 14. Log success
      context.log(`Manual signature uploaded successfully for document ${documentId}`);

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: 'Document signed successfully',
          signatureRecord: {
            id: signatureRecord.id,
            documentId,
            signatureType: 'manual',
            status: 'success',
            signedAt: signatureRecord.signature_timestamp,
            versionNumber
          },
          document: {
            id: documentId,
            status: newDocumentStatus,
            signedAt: signatureRecord.signature_timestamp,
            signedBy: userId
          }
        }
      };

    } catch (error: any) {
      context.error('Error uploading manual signature:', error);
      return {
        status: 500,
        jsonBody: {
          error: error.message || 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      };
    }
  }
});

// Helper Functions

function getUserFromRequest(request: HttpRequest): { userId: string; organizationId: string; email?: string } {
  // TODO: Extract from JWT token or session
  const userId = request.headers.get('x-user-id') || 'test-user-id';
  const organizationId = request.headers.get('x-organization-id') || 'test-org-id';
  const email = request.headers.get('x-user-email') || 'test@example.com';
  
  return { userId, organizationId, email };
}

function validateUploadedFile(file: File, settings: any): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = settings.manual_max_file_size_mb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${settings.manual_max_file_size_mb}MB). Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check file format
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedFormats = settings.manual_allowed_formats.split(',').map((f: string) => f.trim());
  
  if (!allowedFormats.includes(extension)) {
    return {
      valid: false,
      error: `File format not allowed. Allowed formats: ${allowedFormats.join(', ')}`
    };
  }

  // Check MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'text/plain'
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Please ensure the file is a valid document.`
    };
  }

  return { valid: true };
}

function calculateSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadToBlobStorage(params: {
  buffer: Buffer;
  fileName: string;
  documentId: string;
  userId: string;
  organizationId: string;
}): Promise<string> {
  const containerName = `signatures-${params.organizationId}`;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Create container if it doesn't exist
  await containerClient.createIfNotExists({
    access: 'private'
  });

  // Generate unique blob name
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const blobName = `${params.documentId}/${timestamp}_${randomId}_${params.fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file with metadata
  await blockBlobClient.upload(params.buffer, params.buffer.length, {
    blobHTTPHeaders: {
      blobContentType: getMimeType(params.fileName)
    },
    metadata: {
      documentId: params.documentId,
      uploadedBy: params.userId,
      uploadedAt: new Date().toISOString(),
      originalFileName: params.fileName,
      signatureType: 'manual'
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

async function checkRateLimit(userId: string, actionType: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
}> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour window
  const limit = 10; // 10 attempts per hour

  // Get current attempts in window
  const { resources: attempts } = await rateLimitsContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.user_id = @userId AND c.action_type = @actionType AND c.window_start >= @windowStart',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@actionType', value: actionType },
        { name: '@windowStart', value: windowStart.toISOString() }
      ]
    })
    .fetchAll();

  const currentAttempts = attempts.reduce((sum, attempt) => sum + attempt.attempt_count, 0);
  const allowed = currentAttempts < limit;
  const remainingAttempts = Math.max(0, limit - currentAttempts);
  const resetTime = new Date(Date.now() + 60 * 60 * 1000);

  return { allowed, remainingAttempts, resetTime };
}

async function updateRateLimit(userId: string, actionType: string): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - (now.getTime() % (60 * 60 * 1000))); // Start of current hour
  
  const rateLimitId = `${userId}_${actionType}_${windowStart.getTime()}`;
  
  try {
    // Try to update existing record
    const { resource: existing } = await rateLimitsContainer.item(rateLimitId, rateLimitId).read();
    
    if (existing) {
      await rateLimitsContainer.item(rateLimitId, rateLimitId).patch([
        { op: 'replace', path: '/attempt_count', value: existing.attempt_count + 1 },
        { op: 'replace', path: '/last_attempt', value: now.toISOString() }
      ]);
    } else {
      throw new Error('Not found');
    }
  } catch {
    // Create new record
    await rateLimitsContainer.items.create({
      id: rateLimitId,
      user_id: userId,
      action_type: actionType,
      attempt_count: 1,
      window_start: windowStart.toISOString(),
      last_attempt: now.toISOString()
    });
  }
}

async function sendNotification(params: {
  type: string;
  documentId: string;
  documentName: string;
  signerUserId: string;
  signerEmail: string;
  ownerUserId: string;
  organizationId: string;
  signatureRecordId: string;
}): Promise<void> {
  // TODO: Implement notification service integration
  console.log('Sending notification:', params);
  
  // This would typically:
  // 1. Get owner's notification preferences
  // 2. Send email notification
  // 3. Create in-app notification
  // 4. Log notification event
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export default app;

