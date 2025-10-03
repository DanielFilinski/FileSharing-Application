# 📋 SIGNATURE SYSTEM - ЧАСТЬ 2: ADOBE SIGN API & FINALIZATION

Продолжение детального плана реализации системы подписей (Фазы 4-6).

---

## **ФАЗА 4: ADOBE SIGN API INTEGRATION (5-6 дней)**

### День 13-14: Adobe Sign Provider - Core API

```typescript
// api/src/shared/signature/providers/adobeSignProvider.ts

import axios, { AxiosInstance } from 'axios';
import { AdobeSignAgreementRequest, AdobeSignAgreementResponse } from '@/shared/types/signature';
import { AdobeSignOAuthService } from './adobeSignOAuthService';

export class AdobeSignProvider {
  private oauthService: AdobeSignOAuthService;
  private apiClient: AxiosInstance | null = null;
  private apiAccessPoint: string = '';

  constructor() {
    this.oauthService = new AdobeSignOAuthService();
  }

  /**
   * Initialize provider with user credentials
   */
  async initialize(userId: string, organizationId: string): Promise<void> {
    const tokenData = await this.oauthService.getValidAccessToken(userId, organizationId);
    
    if (!tokenData) {
      throw new Error('Adobe Sign credentials not configured or expired');
    }

    this.apiAccessPoint = tokenData.apiAccessPoint;
    
    // Create axios instance with authentication
    this.apiClient = axios.create({
      baseURL: `${this.apiAccessPoint}/api/rest/v6`,
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Upload transient document (temporary document for agreement creation)
   */
  async uploadTransientDocument(params: {
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
  }): Promise<string> {
    if (!this.apiClient) {
      throw new Error('Provider not initialized');
    }

    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('File', params.fileBuffer, {
        filename: params.fileName,
        contentType: params.mimeType
      });

      const response = await this.apiClient.post('/transientDocuments', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': this.apiClient.defaults.headers['Authorization']
        }
      });

      return response.data.transientDocumentId;
    } catch (error: any) {
      console.error('Failed to upload transient document:', error.response?.data);
      throw new Error(
        error.response?.data?.message || 'Failed to upload document to Adobe Sign'
      );
    }
  }

  /**
   * Create agreement (send for signature)
   */
  async createAgreement(params: {
    transientDocumentId: string;
    agreementName: string;
    signers: Array<{
      email: string;
      name: string;
      order: number;
    }>;
    message?: string;
    expirationDays?: number;
    reminderFrequency?: 'DAILY_UNTIL_SIGNED' | 'WEEKLY_UNTIL_SIGNED' | 'EVERY_OTHER_DAY_UNTIL_SIGNED';
    callbackUrl?: string;
    externalId?: string;
  }): Promise<AdobeSignAgreementResponse> {
    if (!this.apiClient) {
      throw new Error('Provider not initialized');
    }

    try {
      const agreementRequest: AdobeSignAgreementRequest = {
        fileInfos: [{
          transientDocumentId: params.transientDocumentId
        }],
        name: params.agreementName,
        participantSetsInfo: params.signers.map(signer => ({
          memberInfos: [{
            email: signer.email,
            name: signer.name
          }],
          order: signer.order,
          role: 'SIGNER'
        })),
        signatureType: 'ESIGN',
        state: 'IN_PROCESS',
        emailOption: {
          sendOptions: {
            completionEmails: 'ALL',
            inFlightEmails: 'ALL',
            initEmails: 'ALL'
          }
        }
      };

      // Add optional parameters
      if (params.message) {
        agreementRequest.message = params.message;
      }

      if (params.externalId) {
        agreementRequest.externalId = { id: params.externalId };
      }

      if (params.callbackUrl) {
        agreementRequest.callbackInfo = {
          urlInfo: { url: params.callbackUrl }
        };
      }

      if (params.reminderFrequency) {
        agreementRequest.reminderFrequency = params.reminderFrequency;
      }

      if (params.expirationDays) {
        agreementRequest.daysUntilSigningDeadline = params.expirationDays;
      }

      const response = await this.apiClient.post('/agreements', agreementRequest);

      return {
        id: response.data.id,
        name: response.data.name,
        status: response.data.status,
        esignEnabled: response.data.esignEnabled,
        createdDate: response.data.createdDate,
        expirationTime: response.data.expirationTime
      };
    } catch (error: any) {
      console.error('Failed to create agreement:', error.response?.data);
      throw new Error(
        error.response?.data?.message || 'Failed to create signature agreement'
      );
    }
  }

  /**
   * Get agreement details
   */
  async getAgreement(agreementId: string): Promise<any> {
    if (!this.apiClient) {
      throw new Error('Provider not initialized');
    }

    try {
      const response = await this.apiClient.get(`/agreements/${agreementId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get agreement:', error.response?.data);
      throw new Error('Failed to get agreement details');
    }
  }

  /**
   * Get signing URLs for participants
   */
  async getSigningUrls(agreementId: string): Promise<Array<{
    email: string;
    esignUrl: string;
  }>> {
    if (!this.apiClient) {
      throw new Error('Provider not initialized');
    }

    try {
      const response = await this.apiClient.get(`/agreements/${agreementId}/signingUrls`);
      return response.data.signingUrlSetInfos.map((info: any) => ({
        email: info.signingUrls[0].email,
        esignUrl: info.signingUrls[0].esignUrl
      }));
    } catch (error: any) {
      console.error('Failed to get signing URLs:', error.response?.data);
      throw new Error('Failed to get signing URLs');
    }
  }

  /**
   * Download signed document
   */
  async downloadDocument(agreementId: string): Promise<Buffer> {
    if (!this.apiClient) {
      throw new Error('Provider not initialized');
    }

    try {
      const response = await this.apiClient.get(
        `/agreements/${agreementId}/combinedDocument`,
        { responseType: 'arraybuffer' }
      );
      
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Failed to download document:', error.response?.data);
      throw new Error('Failed to download signed document');
    }
  }

  /**
   * Cancel agreement
   */
  async cancelAgreement(agreementId: string, reason?: string): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Provider not initialized');
    }

    try {
      await this.apiClient.put(`/agreements/${agreementId}/state`, {
        state: 'CANCELLED',
        agreementCancellationInfo: {
          comment: reason || 'Cancelled by user'
        }
      });
    } catch (error: any) {
      console.error('Failed to cancel agreement:', error.response?.data);
      throw new Error('Failed to cancel agreement');
    }
  }

  /**
   * Get agreement audit trail
   */
  async getAuditTrail(agreementId: string): Promise<Buffer> {
    if (!this.apiClient) {
      throw new Error('Provider not initialized');
    }

    try {
      const response = await this.apiClient.get(
        `/agreements/${agreementId}/auditTrail`,
        { responseType: 'arraybuffer' }
      );
      
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Failed to get audit trail:', error.response?.data);
      throw new Error('Failed to get audit trail');
    }
  }

  /**
   * Map Adobe Sign status to internal status
   */
  mapStatus(adobeStatus: string): 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled' | 'expired' {
    const statusMap: Record<string, any> = {
      'WAITING_FOR_MY_SIGNATURE': 'pending',
      'WAITING_FOR_OTHERS': 'in-progress',
      'OUT_FOR_SIGNATURE': 'in-progress',
      'SIGNED': 'completed',
      'APPROVED': 'completed',
      'DELIVERED': 'completed',
      'RECALLED': 'cancelled',
      'EXPIRED': 'expired',
      'REJECTED': 'failed',
      'CANCELLED': 'cancelled'
    };

    return statusMap[adobeStatus] || 'pending';
  }
}
```

### День 15-16: Backend - Adobe Sign E-Signature Endpoint

```typescript
// api/src/functions/adobeSignSignature.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { DocumentService } from '../shared/documents/documentService';
import { SignatureService } from '../shared/signature/signatureService';
import { AdobeSignProvider } from '../shared/signature/providers/adobeSignProvider';
import { DocumentStatusValidator } from '../shared/signature/documentStatusValidator';
import { SignaturePermissionChecker } from '../shared/signature/signaturePermissionChecker';
import { RateLimiter } from '../shared/middleware/rateLimiter';

const documentService = new DocumentService();
const signatureService = new SignatureService();
const rateLimiter = new RateLimiter();

/**
 * Create Adobe Sign e-signature request
 * POST /api/documents/{documentId}/adobe-sign-signature
 */
app.http('createAdobeSignSignature', {
  methods: ['POST'],
  route: 'documents/{documentId}/adobe-sign-signature',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const documentId = request.params.documentId!;
      const { userId, organizationId, email } = SignatureService.getUserFromRequest(request);

      // Rate limiting
      const isAllowed = await rateLimiter.checkLimit(userId, 'adobe_sign', 5, 60);
      if (!isAllowed) {
        return {
          status: 429,
          jsonBody: { error: 'Too many signature requests. Please try again later.' }
        };
      }

      // Parse request body
      const body = await request.json() as {
        signers: Array<{ email: string; name: string; order: number }>;
        message?: string;
        expirationDays?: number;
      };

      if (!body.signers || body.signers.length === 0) {
        return {
          status: 400,
          jsonBody: { error: 'At least one signer is required' }
        };
      }

      // 1. Get document
      const document = await documentService.getDocument(documentId);
      if (!document) {
        return { status: 404, jsonBody: { error: 'Document not found' } };
      }

      // 2. ⚠️ CRITICAL CHECK: Document status
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

      // 3. Get organization settings
      const settings = await signatureService.getOrganizationSettings(organizationId);
      if (!settings) {
        return { status: 400, jsonBody: { error: 'Signature settings not configured' } };
      }

      // 4. Permission check
      const permissionCheck = await SignaturePermissionChecker.checkPermissions({
        userId,
        document,
        signatureType: 'adobe-sign',
        settings,
        hasAdobeCredentials: true // Will be validated in next step
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

      // 5. Initialize Adobe Sign provider
      const adobeProvider = new AdobeSignProvider();
      await adobeProvider.initialize(userId, organizationId);

      // 6. Download document file
      const documentFile = await documentService.downloadDocument(documentId);
      if (!documentFile) {
        return { status: 404, jsonBody: { error: 'Document file not found' } };
      }

      // 7. Upload to Adobe Sign as transient document
      const transientDocId = await adobeProvider.uploadTransientDocument({
        fileBuffer: documentFile.buffer,
        fileName: document.name,
        mimeType: documentFile.mimeType || 'application/pdf'
      });

      // 8. Create agreement
      const callbackUrl = `${process.env.API_BASE_URL}/api/webhooks/adobe-sign`;
      const externalId = `doc_${documentId}_${Date.now()}`;

      const agreement = await adobeProvider.createAgreement({
        transientDocumentId: transientDocId,
        agreementName: document.name,
        signers: body.signers,
        message: body.message,
        expirationDays: body.expirationDays || settings.eSignature.defaultExpirationDays,
        reminderFrequency: 'DAILY_UNTIL_SIGNED',
        callbackUrl,
        externalId
      });

      // 9. Get signing URLs
      const signingUrls = await adobeProvider.getSigningUrls(agreement.id);

      // 10. Create signature record in database
      const previousVersion = await documentService.getLatestVersion(documentId);
      
      const signatureRecord = await signatureService.createSignatureRecord({
        documentId,
        signerUserId: userId,
        signatureType: 'adobe-sign',
        signatureMethod: 'esign',
        previousVersionId: previousVersion?.id,
        newVersionId: previousVersion?.id, // Will be updated when completed
        versionNumber: (previousVersion?.versionNumber || 0) + 1,
        adobeAgreementId: agreement.id,
        adobeSigningUrl: signingUrls[0]?.esignUrl,
        adobeEnvelopeStatus: agreement.status,
        documentName: document.name,
        documentSizeBytes: documentFile.size,
        documentHash: documentFile.hash,
        signerIpAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        signerUserAgent: request.headers.get('user-agent'),
        status: 'pending'
      });

      // 11. Update document status
      await documentService.updateDocument(documentId, {
        status: 'in_signature_process',
        adobeAgreementId: agreement.id
      });

      // 12. Send notifications to signers
      for (const signer of body.signers) {
        await sendSignatureNotification({
          type: 'signature_request',
          documentId,
          documentName: document.name,
          signerEmail: signer.email,
          signerName: signer.name,
          signingUrl: signingUrls.find(url => url.email === signer.email)?.esignUrl,
          organizationId
        });
      }

      // 13. Log event
      await signatureService.logSignatureEvent(
        signatureRecord.id,
        'sent',
        userId,
        {
          method: 'adobe-sign',
          agreementId: agreement.id,
          signersCount: body.signers.length
        }
      );

      return {
        status: 200,
        jsonBody: {
          success: true,
          signatureRecord,
          agreement: {
            id: agreement.id,
            status: agreement.status,
            createdDate: agreement.createdDate,
            expirationTime: agreement.expirationTime
          },
          signingUrls,
          message: 'Signature request created successfully'
        }
      };

    } catch (error: any) {
      context.error('Error creating Adobe Sign signature:', error);
      return {
        status: 500,
        jsonBody: {
          error: error.message || 'Internal server error',
          details: error.toString()
        }
      };
    }
  }
});

async function sendSignatureNotification(params: any): Promise<void> {
  // TODO: Implement notification service
  console.log('Sending signature notification:', params);
}
```

### День 17-18: Adobe Sign Webhook Handler

```typescript
// api/src/functions/adobeSignWebhook.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { SignatureService } from '../shared/signature/signatureService';
import { DocumentService } from '../shared/documents/documentService';
import { AdobeSignProvider } from '../shared/signature/providers/adobeSignProvider';
import * as crypto from 'crypto';

const signatureService = new SignatureService();
const documentService = new DocumentService();

/**
 * Adobe Sign Webhook Handler
 * POST /api/webhooks/adobe-sign
 */
app.http('adobeSignWebhook', {
  methods: ['POST'],
  route: 'webhooks/adobe-sign',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const webhookData = await request.json() as {
        webhookId: string;
        webhookName: string;
        webhookNotificationId: string;
        webhookUrlInfo: any;
        webhookScope: string;
        webhookNotificationApplicableUsers: any[];
        event: string;
        subEvent: string;
        eventDate: string;
        eventResourceType: string;
        eventResourceParentType: string;
        eventResourceParentId: string;
        participantUserId: string;
        participantUserEmail: string;
        actingUserId: string;
        actingUserEmail: string;
        actingUserIpAddress: string;
        initiatingUserId: string;
        initiatingUserEmail: string;
        agreement: {
          id: string;
          name: string;
          signatureType: string;
          status: string;
          [key: string]: any;
        };
      };

      context.log('Adobe Sign webhook received:', {
        event: webhookData.event,
        subEvent: webhookData.subEvent,
        agreementId: webhookData.agreement?.id
      });

      // Verify webhook signature (important for security)
      const isValid = await verifyWebhookSignature(request, webhookData);
      if (!isValid) {
        context.warn('Invalid webhook signature');
        return {
          status: 401,
          jsonBody: { error: 'Invalid webhook signature' }
        };
      }

      const agreementId = webhookData.agreement?.id;
      if (!agreementId) {
        return { status: 400, jsonBody: { error: 'Missing agreement ID' } };
      }

      // Find signature record by Adobe agreement ID
      const signatureRecord = await signatureService.findByAdobeAgreementId(agreementId);
      
      if (!signatureRecord) {
        context.warn(`Signature record not found for agreement: ${agreementId}`);
        return { status: 404, jsonBody: { error: 'Signature record not found' } };
      }

      // Handle different webhook events
      const eventType = `${webhookData.event}_${webhookData.subEvent}`.toUpperCase();

      switch (eventType) {
        case 'AGREEMENT_WORKFLOW_COMPLETED_':
          await handleAgreementCompleted(signatureRecord, webhookData, context);
          break;

        case 'AGREEMENT_CREATED_':
          await handleAgreementCreated(signatureRecord, webhookData, context);
          break;

        case 'AGREEMENT_ACTION_COMPLETED_ESIGNED':
          await handleParticipantSigned(signatureRecord, webhookData, context);
          break;

        case 'AGREEMENT_ACTION_DECLINED':
          await handleParticipantDeclined(signatureRecord, webhookData, context);
          break;

        case 'AGREEMENT_ACTION_DELEGATED':
          await handleParticipantDelegated(signatureRecord, webhookData, context);
          break;

        case 'AGREEMENT_EXPIRED_':
          await handleAgreementExpired(signatureRecord, webhookData, context);
          break;

        case 'AGREEMENT_RECALLED_':
          await handleAgreementRecalled(signatureRecord, webhookData, context);
          break;

        default:
          context.log(`Unhandled event type: ${eventType}`);
      }

      // Log webhook event
      await signatureService.logSignatureEvent(
        signatureRecord.id,
        webhookData.event.toLowerCase().replace('agreement_', '') as any,
        webhookData.actingUserId,
        webhookData,
        webhookData.participantUserEmail,
        webhookData.actingUserIpAddress
      );

      return {
        status: 200,
        jsonBody: { received: true }
      };

    } catch (error: any) {
      context.error('Error processing Adobe Sign webhook:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' }
      };
    }
  }
});

async function handleAgreementCompleted(
  signatureRecord: any,
  webhookData: any,
  context: InvocationContext
): Promise<void> {
  context.log('Agreement completed:', signatureRecord.id);

  try {
    // Initialize Adobe Sign provider to download signed document
    const adobeProvider = new AdobeSignProvider();
    // Note: Need to get user credentials to initialize provider
    // This is a challenge - webhook doesn't have user context
    // Solution: Store credentials with organization ID and use service account
    
    // For now, we'll mark as completed and require manual download
    // Or implement a background job that downloads signed documents periodically

    // Update signature record
    await signatureService.updateSignatureRecord(signatureRecord.id, {
      status: 'success',
      adobeEnvelopeStatus: webhookData.agreement.status,
      completedAt: new Date().toISOString()
    });

    // Update document status
    await documentService.updateDocument(signatureRecord.documentId, {
      status: 'signed',
      signedAt: new Date().toISOString()
    });

    // Send completion notifications
    await sendCompletionNotification({
      documentId: signatureRecord.documentId,
      signatureRecordId: signatureRecord.id
    });

  } catch (error) {
    context.error('Failed to handle agreement completion:', error);
    throw error;
  }
}

async function handleAgreementCreated(
  signatureRecord: any,
  webhookData: any,
  context: InvocationContext
): Promise<void> {
  context.log('Agreement created:', signatureRecord.id);
  
  await signatureService.updateSignatureRecord(signatureRecord.id, {
    adobeEnvelopeStatus: 'CREATED',
    status: 'in-progress'
  });
}

async function handleParticipantSigned(
  signatureRecord: any,
  webhookData: any,
  context: InvocationContext
): Promise<void> {
  context.log('Participant signed:', webhookData.participantUserEmail);
  
  // Log individual signer completion
  await signatureService.logSignerEvent({
    signatureRequestId: signatureRecord.id,
    signerEmail: webhookData.participantUserEmail,
    event: 'signed',
    timestamp: webhookData.eventDate,
    ipAddress: webhookData.actingUserIpAddress
  });
}

async function handleParticipantDeclined(
  signatureRecord: any,
  webhookData: any,
  context: InvocationContext
): Promise<void> {
  context.log('Participant declined:', webhookData.participantUserEmail);
  
  await signatureService.updateSignatureRecord(signatureRecord.id, {
    status: 'failed',
    statusMessage: `Declined by ${webhookData.participantUserEmail}`,
    adobeEnvelopeStatus: 'DECLINED'
  });

  await documentService.updateDocument(signatureRecord.documentId, {
    status: 'signature_declined'
  });
}

async function handleParticipantDelegated(
  signatureRecord: any,
  webhookData: any,
  context: InvocationContext
): Promise<void> {
  context.log('Participant delegated:', webhookData.participantUserEmail);
  
  // Log delegation event
  await signatureService.logSignerEvent({
    signatureRequestId: signatureRecord.id,
    signerEmail: webhookData.participantUserEmail,
    event: 'delegated',
    timestamp: webhookData.eventDate,
    details: webhookData
  });
}

async function handleAgreementExpired(
  signatureRecord: any,
  webhookData: any,
  context: InvocationContext
): Promise<void> {
  context.log('Agreement expired:', signatureRecord.id);
  
  await signatureService.updateSignatureRecord(signatureRecord.id, {
    status: 'failed',
    statusMessage: 'Signature request expired',
    adobeEnvelopeStatus: 'EXPIRED'
  });

  await documentService.updateDocument(signatureRecord.documentId, {
    status: 'signature_expired'
  });
}

async function handleAgreementRecalled(
  signatureRecord: any,
  webhookData: any,
  context: InvocationContext
): Promise<void> {
  context.log('Agreement recalled:', signatureRecord.id);
  
  await signatureService.updateSignatureRecord(signatureRecord.id, {
    status: 'cancelled',
    statusMessage: 'Signature request recalled',
    adobeEnvelopeStatus: 'RECALLED'
  });

  await documentService.updateDocument(signatureRecord.documentId, {
    status: 'draft' // Reset to draft
  });
}

async function verifyWebhookSignature(
  request: HttpRequest,
  payload: any
): Promise<boolean> {
  // Adobe Sign webhook signature verification
  // Uses HMAC-SHA256 with client secret
  
  const signature = request.headers.get('x-adobesign-clientid');
  const webhookId = payload.webhookId;
  
  // TODO: Implement proper signature verification
  // Need to retrieve client secret for the webhook
  // Calculate HMAC and compare with received signature
  
  // For now, basic validation
  return !!signature && !!webhookId;
}

async function sendCompletionNotification(params: any): Promise<void> {
  // TODO: Implement notification service
  console.log('Sending completion notification:', params);
}
```

---

## **ФАЗА 5: SIGNATURE SETTINGS UI (3-4 дня)**

### День 19-20: Signature Settings Admin Panel

```typescript
// src/pages/settings/signatures/SignatureSettingsPage.tsx

import React, { useState, useEffect } from 'react';
import {
  Button,
  Text,
  Title3,
  Switch,
  MessageBar,
  MessageBarBody,
  Spinner,
  Tab,
  TabList,
  TabValue,
  Card,
  Field,
  Input,
  Textarea,
  Badge
} from '@fluentui/react-components';
import {
  Save20Regular,
  SignatureRegular,
  DocumentArrowUpRegular,
  ShieldCheckmarkRegular,
  PeopleRegular
} from '@fluentui/react-icons';

import { signatureApi } from '@/shared/api/signatureApi';
import { OrganizationSignatureSettings } from '@/shared/types/signature';
import { notificationService } from '@/shared/lib/notifications';
import { ScreenContainer, ContentContainer } from '@/app/styles/layouts';
import { AdobeSignOAuthSetup } from '@/features/signatures/components/AdobeSignOAuthSetup';
import { AuthorizedSignersList } from '@/features/signatures/components/AuthorizedSignersList';

export const SignatureSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<OrganizationSignatureSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('manual');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await signatureApi.getOrganizationSignatureSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load signature settings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      await signatureApi.updateOrganizationSignatureSettings(settings);
      
      notificationService.success(
        'Settings Saved',
        'Signature settings have been updated successfully'
      );
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      notificationService.error('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<OrganizationSignatureSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <div className="flex items-center justify-center h-64">
          <Spinner label="Loading signature settings..." />
        </div>
      </ScreenContainer>
    );
  }

  if (!settings) {
    return (
      <ScreenContainer>
        <MessageBar intent="error">
          <MessageBarBody>Failed to load signature settings</MessageBarBody>
        </MessageBar>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SignatureRegular className="text-2xl text-purple-600" />
          <Title3>Signature Settings</Title3>
        </div>
        <Text size={400} className="text-gray-600">
          Configure manual signature and e-signature (Adobe Sign) settings for your organization
        </Text>
      </div>

      {error && (
        <MessageBar intent="error" className="mb-4">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <ContentContainer>
        {/* Tab Navigation */}
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value)}
        >
          <Tab id="manual" value="manual" icon={<DocumentArrowUpRegular />}>
            Manual Signature
          </Tab>
          <Tab id="esign" value="esign" icon={<ShieldCheckmarkRegular />}>
            E-Signature (Adobe Sign)
          </Tab>
        </TabList>

        <div className="mt-6">
          {/* Manual Signature Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              {/* Enable/Disable */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Text weight="semibold" size={500}>Manual Signature</Text>
                    <Text size={300} className="text-gray-600 block mt-1">
                      Allow users to upload manually signed documents
                    </Text>
                  </div>
                  <Switch
                    checked={settings.manualSignature.enabled}
                    onChange={(_, data) => updateSettings({
                      manualSignature: {
                        ...settings.manualSignature,
                        enabled: data.checked
                      }
                    })}
                  />
                </div>

                {settings.manualSignature.enabled && (
                  <div className="space-y-4 mt-4 pt-4 border-t">
                    {/* Authorized Signers */}
                    <Field label="Authorized Signers">
                      <AuthorizedSignersList
                        signers={settings.manualSignature.authorizedSigners}
                        onChange={(signers) => updateSettings({
                          manualSignature: {
                            ...settings.manualSignature,
                            authorizedSigners: signers
                          }
                        })}
                      />
                      <Text size={200} className="text-gray-600 mt-1">
                        Only these users can upload manually signed documents
                      </Text>
                    </Field>

                    {/* Settings Toggles */}
                    <Field>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Text weight="semibold">Require Authorization</Text>
                            <Text size={200} className="text-gray-600">
                              Uploaded documents must be approved before becoming active
                            </Text>
                          </div>
                          <Switch
                            checked={settings.manualSignature.requireAuthorization}
                            onChange={(_, data) => updateSettings({
                              manualSignature: {
                                ...settings.manualSignature,
                                requireAuthorization: data.checked
                              }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Text weight="semibold">Notify Document Owner</Text>
                            <Text size={200} className="text-gray-600">
                              Send notification when signed document is uploaded
                            </Text>
                          </div>
                          <Switch
                            checked={settings.manualSignature.notifyDocumentOwner}
                            onChange={(_, data) => updateSettings({
                              manualSignature: {
                                ...settings.manualSignature,
                                notifyDocumentOwner: data.checked
                              }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Text weight="semibold">Allow Direct Overwrite</Text>
                            <Text size={200} className="text-gray-600">
                              Replace document immediately without validation period
                            </Text>
                          </div>
                          <Switch
                            checked={settings.manualSignature.allowDirectOverwrite}
                            onChange={(_, data) => updateSettings({
                              manualSignature: {
                                ...settings.manualSignature,
                                allowDirectOverwrite: data.checked
                              }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Text weight="semibold">Retain Previous Versions</Text>
                            <Text size={200} className="text-gray-600">
                              Keep previous versions in document history
                            </Text>
                          </div>
                          <Switch
                            checked={settings.manualSignature.retainPreviousVersions}
                            onChange={(_, data) => updateSettings({
                              manualSignature: {
                                ...settings.manualSignature,
                                retainPreviousVersions: data.checked
                              }
                            })}
                          />
                        </div>
                      </div>
                    </Field>

                    {/* Validation Period */}
                    <Field label="Validation Period (days)">
                      <Input
                        type="number"
                        value={settings.manualSignature.validationPeriodDays.toString()}
                        onChange={(_, data) => updateSettings({
                          manualSignature: {
                            ...settings.manualSignature,
                            validationPeriodDays: parseInt(data.value) || 30
                          }
                        })}
                        min={1}
                        max={365}
                      />
                      <Text size={200} className="text-gray-600 mt-1">
                        How long the signed document remains valid
                      </Text>
                    </Field>

                    {/* File Upload Limits */}
                    <Field label="Maximum File Size (MB)">
                      <Input
                        type="number"
                        value={settings.manualSignature.maxFileSizeMB.toString()}
                        onChange={(_, data) => updateSettings({
                          manualSignature: {
                            ...settings.manualSignature,
                            maxFileSizeMB: parseInt(data.value) || 50
                          }
                        })}
                        min={1}
                        max={100}
                      />
                    </Field>

                    <Field label="Allowed File Formats">
                      <Input
                        value={settings.manualSignature.allowedFormats.join(', ')}
                        onChange={(_, data) => updateSettings({
                          manualSignature: {
                            ...settings.manualSignature,
                            allowedFormats: data.value.split(',').map(f => f.trim())
                          }
                        })}
                        placeholder=".pdf, .docx, .xlsx, .txt"
                      />
                      <Text size={200} className="text-gray-600 mt-1">
                        Comma-separated list of allowed file extensions
                      </Text>
                    </Field>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* E-Signature Tab */}
          {activeTab === 'esign' && (
            <div className="space-y-6">
              {/* Adobe Sign Connection */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Text weight="semibold" size={500}>Adobe Sign Integration</Text>
                    <Text size={300} className="text-gray-600 block mt-1">
                      Connect Adobe Sign for electronic signatures
                    </Text>
                  </div>
                  <AdobeSignOAuthSetup onSuccess={loadSettings} />
                </div>
              </Card>

              {/* E-Signature Settings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Text weight="semibold" size={500}>E-Signature Settings</Text>
                    <Text size={300} className="text-gray-600 block mt-1">
                      Configure electronic signature behavior
                    </Text>
                  </div>
                  <Switch
                    checked={settings.eSignature.enabled}
                    onChange={(_, data) => updateSettings({
                      eSignature: {
                        ...settings.eSignature,
                        enabled: data.checked
                      }
                    })}
                  />
                </div>

                {settings.eSignature.enabled && (
                  <div className="space-y-4 mt-4 pt-4 border-t">
                    {/* Authorized Signers */}
                    <Field label="Authorized Signers">
                      <AuthorizedSignersList
                        signers={settings.eSignature.authorizedSigners}
                        onChange={(signers) => updateSettings({
                          eSignature: {
                            ...settings.eSignature,
                            authorizedSigners: signers
                          }
                        })}
                      />
                      <Text size={200} className="text-gray-600 mt-1">
                        Only these users can initiate e-signature requests
                      </Text>
                    </Field>

                    {/* Authentication Settings */}
                    <Field>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Text weight="semibold">Require Two-Factor Authentication</Text>
                            <Text size={200} className="text-gray-600">
                              Signers must complete 2FA before signing
                            </Text>
                          </div>
                          <Switch
                            checked={settings.eSignature.requireTwoFactor}
                            onChange={(_, data) => updateSettings({
                              eSignature: {
                                ...settings.eSignature,
                                requireTwoFactor: data.checked
                              }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Text weight="semibold">Allow Biometric Authentication</Text>
                            <Text size={200} className="text-gray-600">
                              Enable fingerprint/face recognition for signing
                            </Text>
                          </div>
                          <Switch
                            checked={settings.eSignature.allowBiometric}
                            onChange={(_, data) => updateSettings({
                              eSignature: {
                                ...settings.eSignature,
                                allowBiometric: data.checked
                              }
                            })}
                          />
                        </div>
                      </div>
                    </Field>

                    {/* Workflow Settings */}
                    <Field label="Default Expiration (days)">
                      <Input
                        type="number"
                        value={settings.eSignature.defaultExpirationDays.toString()}
                        onChange={(_, data) => updateSettings({
                          eSignature: {
                            ...settings.eSignature,
                            defaultExpirationDays: parseInt(data.value) || 30
                          }
                        })}
                        min={1}
                        max={365}
                      />
                      <Text size={200} className="text-gray-600 mt-1">
                        Signature requests expire after this many days
                      </Text>
                    </Field>

                    <Field label="Auto Reminder Interval (days)">
                      <Input
                        type="number"
                        value={settings.eSignature.autoReminderDays.toString()}
                        onChange={(_, data) => updateSettings({
                          eSignature: {
                            ...settings.eSignature,
                            autoReminderDays: parseInt(data.value) || 3
                          }
                        })}
                        min={1}
                        max={30}
                      />
                      <Text size={200} className="text-gray-600 mt-1">
                        Send reminders every N days until signed
                      </Text>
                    </Field>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </ContentContainer>

      {/* Save Button */}
      <div className="flex justify-end gap-3 mt-8 px-6">
        <Button
          appearance="primary"
          icon={<Save20Regular />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </ScreenContainer>
  );
};

export default SignatureSettingsPage;
```

### День 21: Authorized Signers Management Component

```typescript
// src/features/signatures/components/AuthorizedSignersList.tsx

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Text,
  Card,
  Avatar,
  Badge,
  Spinner
} from '@fluentui/react-components';
import {
  PersonAddRegular,
  DismissRegular,
  SearchRegular
} from '@fluentui/react-icons';

import { userManagementApi } from '@/shared/api/userManagementApi';
import { User } from '@/shared/types/user';

interface AuthorizedSignersListProps {
  signers: string[]; // Array of user IDs
  onChange: (signers: string[]) => void;
}

export const AuthorizedSignersList: React.FC<AuthorizedSignersListProps> = ({
  signers,
  onChange
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadUsers();
    loadAllUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [signers]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const loadedUsers = await Promise.all(
        signers.map(id => userManagementApi.getUser(id))
      );
      setUsers(loadedUsers.filter(Boolean) as User[]);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { users } = await userManagementApi.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load all users:', error);
    }
  };

  const handleAddSigner = (userId: string) => {
    if (!signers.includes(userId)) {
      onChange([...signers, userId]);
    }
  };

  const handleRemoveSigner = (userId: string) => {
    onChange(signers.filter(id => id !== userId));
  };

  const filteredAllUsers = allUsers.filter(user =>
    !signers.includes(user.id) &&
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3">
        <Spinner size="tiny" />
        <Text size={300}>Loading signers...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Current Signers */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <Text size={300} className="text-gray-500 italic">
            No authorized signers configured
          </Text>
        ) : (
          users.map(user => (
            <Card key={user.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={user.name}
                    image={{ src: user.avatar }}
                  />
                  <div>
                    <Text weight="semibold">{user.name}</Text>
                    <Text size={200} className="text-gray-600 block">
                      {user.email}
                    </Text>
                  </div>
                  <Badge appearance="outline" color="brand">
                    {user.role}
                  </Badge>
                </div>
                <Button
                  appearance="subtle"
                  icon={<DismissRegular />}
                  onClick={() => handleRemoveSigner(user.id)}
                  size="small"
                />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Signer Button */}
      <Button
        appearance="secondary"
        icon={<PersonAddRegular />}
        onClick={() => setShowAddDialog(!showAddDialog)}
        size="small"
      >
        Add Authorized Signer
      </Button>

      {/* Add Signer Dialog */}
      {showAddDialog && (
        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <Text weight="semibold" className="block mb-3">
            Select users to add as authorized signers
          </Text>
          
          {/* Search */}
          <Input
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            placeholder="Search users..."
            contentBefore={<SearchRegular />}
            className="mb-3"
          />

          {/* Available Users */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredAllUsers.length === 0 ? (
              <Text size={300} className="text-gray-500 italic">
                No users found
              </Text>
            ) : (
              filteredAllUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer"
                  onClick={() => {
                    handleAddSigner(user.id);
                    setSearchQuery('');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={user.name}
                      image={{ src: user.avatar }}
                      size={24}
                    />
                    <div>
                      <Text size={300}>{user.name}</Text>
                      <Text size={200} className="text-gray-600 block">
                        {user.email}
                      </Text>
                    </div>
                  </div>
                  <Button
                    appearance="subtle"
                    icon={<PersonAddRegular />}
                    size="small"
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AuthorizedSignersList;
```

---

## **ФАЗА 6: TESTING & DOCUMENTATION (3-4 дня)**

### День 22-23: Unit & Integration Tests

```typescript
// api/src/tests/signature/documentStatusValidator.test.ts

import { describe, it, expect } from '@jest/globals';
import { DocumentStatusValidator } from '../../shared/signature/documentStatusValidator';

describe('DocumentStatusValidator', () => {
  describe('canDocumentBeSigned', () => {
    it('should return true for "Awaiting Signing" status', () => {
      const result = DocumentStatusValidator.canDocumentBeSigned('Awaiting Signing');
      expect(result).toBe(true);
    });

    it('should return false for other statuses', () => {
      const statuses = ['draft', 'in_review', 'approved', 'signed', 'completed'];
      
      statuses.forEach(status => {
        const result = DocumentStatusValidator.canDocumentBeSigned(status as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('validateSignatureEligibility', () => {
    it('should return eligible for valid document', () => {
      const document = {
        id: '123',
        status: 'Awaiting Signing' as any,
        signatureRequired: true
      };

      const result = DocumentStatusValidator.validateSignatureEligibility(document);
      
      expect(result.eligible).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return not eligible if signature not required', () => {
      const document = {
        id: '123',
        status: 'Awaiting Signing' as any,
        signatureRequired: false
      };

      const result = DocumentStatusValidator.validateSignatureEligibility(document);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('does not require signature');
    });

    it('should return not eligible for wrong status', () => {
      const document = {
        id: '123',
        status: 'draft' as any,
        signatureRequired: true
      };

      const result = DocumentStatusValidator.validateSignatureEligibility(document);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Awaiting Signing');
    });
  });
});
```

```typescript
// api/src/tests/signature/adobeSignProvider.test.ts

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AdobeSignProvider } from '../../shared/signature/providers/adobeSignProvider';
import { AdobeSignOAuthService } from '../../shared/signature/providers/adobeSignOAuthService';
import axios from 'axios';

jest.mock('axios');
jest.mock('../../shared/signature/providers/adobeSignOAuthService');

describe('AdobeSignProvider', () => {
  let provider: AdobeSignProvider;
  let mockOAuthService: jest.Mocked<AdobeSignOAuthService>;

  beforeEach(() => {
    provider = new AdobeSignProvider();
    mockOAuthService = new AdobeSignOAuthService() as jest.Mocked<AdobeSignOAuthService>;
  });

  describe('uploadTransientDocument', () => {
    it('should upload document and return transient ID', async () => {
      const mockTransientId = 'CBJCHBCAABAxxxxxx';
      
      mockOAuthService.getValidAccessToken.mockResolvedValue({
        accessToken: 'mock_token',
        apiAccessPoint: 'https://api.na1.adobesign.com'
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: { transientDocumentId: mockTransientId }
      });

      await provider.initialize('user123', 'org456');

      const result = await provider.uploadTransientDocument({
        fileBuffer: Buffer.from('test file content'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      });

      expect(result).toBe(mockTransientId);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/transientDocuments'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('createAgreement', () => {
    it('should create agreement and return agreement ID', async () => {
      const mockAgreementId = 'CBJCHBCAABAAxxxxxx';
      
      mockOAuthService.getValidAccessToken.mockResolvedValue({
        accessToken: 'mock_token',
        apiAccessPoint: 'https://api.na1.adobesign.com'
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          id: mockAgreementId,
          name: 'Test Agreement',
          status: 'OUT_FOR_SIGNATURE',
          esignEnabled: true,
          createdDate: new Date().toISOString()
        }
      });

      await provider.initialize('user123', 'org456');

      const result = await provider.createAgreement({
        transientDocumentId: 'CBJCHBCAABAxxxxxx',
        agreementName: 'Test Agreement',
        signers: [
          { email: 'signer@example.com', name: 'John Doe', order: 1 }
        ]
      });

      expect(result.id).toBe(mockAgreementId);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/agreements'),
        expect.objectContaining({
          name: 'Test Agreement',
          signatureType: 'ESIGN'
        }),
        expect.any(Object)
      );
    });
  });
});
```

### День 24: End-to-End Testing

```typescript
// api/src/tests/e2e/signatureFlow.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

describe('Signature Flow E2E', () => {
  const API_URL = process.env.TEST_API_URL || 'http://localhost:7071/api';
  let authToken: string;
  let documentId: string;
  let signatureRecordId: string;

  beforeAll(async () => {
    // Authenticate and get token
    // This would use your actual authentication flow
    authToken = 'test_token';
  });

  describe('Manual Signature Flow', () => {
    it('should complete full manual signature workflow', async () => {
      // 1. Create test document
      const createDocResponse = await axios.post(
        `${API_URL}/documents`,
        {
          name: 'Test Contract.pdf',
          status: 'Awaiting Signing',
          signatureRequired: true
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      documentId = createDocResponse.data.id;
      expect(createDocResponse.status).toBe(201);
      expect(createDocResponse.data.status).toBe('Awaiting Signing');

      // 2. Upload manually signed document
      const formData = new FormData();
      const testFile = fs.readFileSync(
        path.join(__dirname, '../fixtures/signed_document.pdf')
      );
      formData.append('file', testFile, 'signed_document.pdf');

      const uploadResponse = await axios.post(
        `${API_URL}/documents/${documentId}/manual-signature`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.data.success).toBe(true);
      signatureRecordId = uploadResponse.data.signatureRecord.id;

      // 3. Verify document status updated
      const getDocResponse = await axios.get(
        `${API_URL}/documents/${documentId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(getDocResponse.data.status).toBe('signed');
      expect(getDocResponse.data.signedBy).toBeDefined();

      // 4. Verify signature record created
      const getSignatureResponse = await axios.get(
        `${API_URL}/signature-records/${signatureRecordId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(getSignatureResponse.data.signatureType).toBe('manual');
      expect(getSignatureResponse.data.status).toBe('success');
    });

    it('should reject document with wrong status', async () => {
      // Create document with wrong status
      const createDocResponse = await axios.post(
        `${API_URL}/documents`,
        {
          name: 'Draft Contract.pdf',
          status: 'draft', // Wrong status
          signatureRequired: true
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      const draftDocId = createDocResponse.data.id;

      // Try to upload signature
      const formData = new FormData();
      formData.append('file', Buffer.from('test'), 'test.pdf');

      try {
        await axios.post(
          `${API_URL}/documents/${draftDocId}/manual-signature`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Awaiting Signing');
      }
    });
  });

  describe('Adobe Sign E-Signature Flow', () => {
    it('should create Adobe Sign signature request', async () => {
      // 1. Setup Adobe Sign credentials (mock)
      // This would normally be done through OAuth flow
      
      // 2. Create document
      const createDocResponse = await axios.post(
        `${API_URL}/documents`,
        {
          name: 'Contract for E-Sign.pdf',
          status: 'Awaiting Signing',
          signatureRequired: true
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      documentId = createDocResponse.data.id;

      // 3. Create Adobe Sign signature request
      const signatureResponse = await axios.post(
        `${API_URL}/documents/${documentId}/adobe-sign-signature`,
        {
          signers: [
            {
              email: 'signer@example.com',
              name: 'John Doe',
              order: 1
            }
          ],
          message: 'Please sign this document',
          expirationDays: 7
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(signatureResponse.status).toBe(200);
      expect(signatureResponse.data.agreement).toBeDefined();
      expect(signatureResponse.data.signingUrls).toHaveLength(1);
    });
  });
});
```

### День 25: Documentation

```markdown
<!-- docs/SIGNATURE_USER_GUIDE.md -->

# Signature System User Guide

## Overview

The FileSharing Application supports two methods of document signing:
1. **Manual Signature** - Upload pre-signed documents
2. **E-Signature (Adobe Sign)** - Electronic signing workflow

---

## Prerequisites

### For Manual Signature
- User must be in "Authorized Signers - Manual" list
- Document status must be "Awaiting Signing"

### For E-Signature
- User must be in "Authorized Signers - E-Signature" list
- Adobe Sign OAuth credentials must be configured
- Document status must be "Awaiting Signing"

---

## Manual Signature Workflow

### Step 1: Open Document
Navigate to document with status "Awaiting Signing"

### Step 2: Click "Manual Signature"
The button will only be visible if:
- Document status is "Awaiting Signing"
- You are an authorized signer

### Step 3: Upload Signed Document
- Drag and drop or click to browse
- Supported formats: PDF, DOCX, XLSX, TXT
- Maximum file size: 50MB

### Step 4: Verification
System will:
- Create new document version
- Mark document as signed
- Notify document owner (if enabled)
- Retain previous version in history

---

## E-Signature Workflow (Adobe Sign)

### First Time Setup

#### Step 1: Get Adobe Sign Credentials
1. Go to [Adobe Sign Developer Console](https://secure.na1.adobesign.com/public/docs/restapi/v6)
2. Create application or use existing
3. Copy Application ID (Client ID)
4. Generate and copy Client Secret

#### Step 2: Connect Adobe Sign
1. Go to Settings → Signatures
2. Click "Connect Adobe Sign"
3. Enter Application ID and Client Secret
4. Choose Environment (Production or Stage)
5. Click "Connect"
6. Authorize in popup window

### Sending Document for Signature

#### Step 1: Open Document
Navigate to document with status "Awaiting Signing"

#### Step 2: Click "E-Signature"
Enter signature request details:
- **Signers**: Add email addresses and names
- **Message**: Optional message to signers
- **Expiration**: Days until request expires

#### Step 3: Send
System will:
- Upload document to Adobe Sign
- Create signature agreement
- Send emails to signers with signing links
- Track signature status

#### Step 4: Signers Complete Signature
Each signer:
1. Receives email notification
2. Clicks signing link
3. Reviews document
4. Completes electronic signature
5. System auto-updates status

#### Step 5: Download Signed Document
After all signers complete:
- Document status changes to "Signed"
- New version created with signed document
- Audit trail available for download

---

## Troubleshooting

### "Document status must be Awaiting Signing"
**Problem**: Trying to sign document with wrong status  
**Solution**: Ask document owner to update status to "Awaiting Signing"

### "Not authorized to sign this document"
**Problem**: User not in authorized signers list  
**Solution**: Contact administrator to add you to authorized signers

### "Adobe Sign credentials not configured"
**Problem**: Adobe Sign not connected  
**Solution**: Go to Settings → Signatures → Connect Adobe Sign

### "File size exceeds limit"
**Problem**: Uploaded file too large  
**Solution**: Compress or split document (max 50MB)

### "Token expired"
**Problem**: Adobe Sign access token expired  
**Solution**: System auto-refreshes. If persists, reconnect Adobe Sign

---

## Administrator Guide

### Configuring Manual Signature

1. Go to **Settings → Signatures → Manual Signature**
2. Enable manual signature
3. Add **Authorized Signers**
4. Configure settings:
   - **Require Authorization**: Approval before document becomes active
   - **Notify Owner**: Email notification on upload
   - **Allow Direct Overwrite**: Immediate replacement
   - **Retain Versions**: Keep previous versions
   - **Validation Period**: Days document remains valid
   - **File Size Limit**: Maximum upload size
   - **Allowed Formats**: Permitted file types

### Configuring E-Signature

1. Go to **Settings → Signatures → E-Signature**
2. Click **Connect Adobe Sign**
3. Complete OAuth flow
4. Add **Authorized Signers**
5. Configure settings:
   - **Require 2FA**: Two-factor authentication
   - **Allow Biometric**: Fingerprint/face recognition
   - **Expiration Days**: Default expiration period
   - **Reminder Interval**: Days between reminders

---

## Security & Compliance

### Data Encryption
- Adobe Sign credentials encrypted with AES-256
- Stored securely in Azure Key Vault
- Access tokens auto-refreshed

### Audit Trail
- All signature activities logged
- IP addresses and timestamps recorded
- Downloadable audit reports

### Access Control
- Role-based permissions
- Authorized signers lists
- Document status validation

---

## API Reference

For developers integrating with the signature system, see [API Documentation](./SIGNATURE_API.md)
```

---

## 🎯 КРИТЕРИИ ГОТОВНОСТИ (Checklist)

```markdown
## Manual Signature
- [ ] ✅ Status validation ("Awaiting Signing")
- [ ] ✅ Authorized signers check
- [ ] ✅ File upload with validation
- [ ] ✅ Version management
- [ ] ✅ Settings UI (admin panel)
- [ ] ✅ Notifications
- [ ] ✅ Audit trail

## E-Signature (Adobe Sign)
- [ ] ✅ OAuth 2.0 flow
- [ ] ✅ Credentials encryption (AES-256)
- [ ] ✅ Token auto-refresh
- [ ] ✅ Document upload to Adobe Sign
- [ ] ✅ Agreement creation
- [ ] ✅ Signing URL generation
- [ ] ✅ Webhook handler
- [ ] ✅ Status synchronization
- [ ] ✅ Settings UI
- [ ] ✅ Authorized signers management

## Shared Features
- [ ] ✅ Document status validation
- [ ] ✅ Permission checking
- [ ] ✅ Rate limiting
- [ ] ✅ Error handling
- [ ] ✅ Notifications
- [ ] ✅ Audit logging

## Testing
- [ ] ✅ Unit tests
- [ ] ✅ Integration tests
- [ ] ✅ E2E tests
- [ ] ✅ Security testing

## Documentation
- [ ] ✅ User guide
- [ ] ✅ Admin guide
- [ ] ✅ API documentation
- [ ] ✅ Troubleshooting guide
```

---

## 📈 ИТОГО

**Общее время реализации: 25-33 дня**

### Распределение времени:
- Фаза 1 (База данных): 3-4 дня
- Фаза 2 (Manual Signature): 4-5 дней
- Фаза 3 (Adobe OAuth): 3-4 дня
- Фаза 4 (Adobe Sign API): 5-6 дней
- Фаза 5 (Settings UI): 3-4 дня
- Фаза 6 (Testing): 3-4 дня
- Фаза 7 (Documentation): 1-2 дня
- Буфер: 3-4 дня

### Ключевые технологии:
- **Backend**: Azure Functions, TypeScript, Cosmos DB, Azure Blob Storage
- **Frontend**: React, FluentUI, TypeScript
- **Integration**: Adobe Sign REST API v6, OAuth 2.0
- **Security**: AES-256 encryption, Azure Key Vault
- **Testing**: Jest, E2E tests

---

**🎉 ГОТОВО К РЕАЛИЗАЦИИ!**

<<<<<<< HEAD

=======
>>>>>>> docs
