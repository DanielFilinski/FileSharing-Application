/**
 * Digital Signatures Azure Function
 * API endpoints for electronic document signing
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { SignatureService } from '../shared/signature/signatureService';
import { 
  SignatureRequest, 
  Signer, 
  SignatureStatus,
  OrganizationSignatureSettings 
} from '../../../src/shared/types/signature';

const signatureService = new SignatureService();

/**
 * Create signature request
 * POST /api/documents/{documentId}/sign
 */
app.http('createSignatureRequest', {
  methods: ['POST'],
  route: 'documents/{documentId}/sign',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Creating signature request for document:', request.params.documentId);
      
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      const documentId = request.params.documentId;
      
      if (!documentId) {
        return {
          status: 400,
          jsonBody: { error: 'Document ID is required' }
        };
      }

      // Parse request body
      const requestBody = await request.json() as {
        signers: Omit<Signer, 'id' | 'status' | 'signedAt'>[];
        settings?: Partial<SignatureRequest['settings']>;
        subject?: string;
        message?: string;
      };

      if (!requestBody.signers || requestBody.signers.length === 0) {
        return {
          status: 400,
          jsonBody: { error: 'At least one signer is required' }
        };
      }

      // Validate signers
      for (const signer of requestBody.signers) {
        if (!signer.email || !signer.name) {
          return {
            status: 400,
            jsonBody: { error: 'Signer email and name are required' }
          };
        }
      }

      // Create signature request
      const signatureRequest = await signatureService.createSignatureRequest(
        documentId,
        userId,
        organizationId,
        requestBody.signers,
        requestBody.settings
      );

      // TODO: Send to signature provider (DocuSign/Adobe Sign)
      // This will be implemented in the next phase

      context.log('Signature request created:', signatureRequest.id);

      return {
        status: 201,
        jsonBody: signatureRequest
      };

    } catch (error: any) {
      context.error('Error creating signature request:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Get signature requests for user
 * GET /api/signature-requests
 */
app.http('getUserSignatureRequests', {
  methods: ['GET'],
  route: 'signature-requests',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      // Parse query parameters
      const url = new URL(request.url);
      const status = url.searchParams.get('status')?.split(',') as SignatureStatus[] | undefined;
      const role = url.searchParams.get('role') as 'requester' | 'signer' | undefined;
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
      const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined;

      const result = await signatureService.getUserSignatureRequests(userId, organizationId, {
        status,
        role,
        limit,
        offset
      });

      return {
        status: 200,
        jsonBody: result
      };

    } catch (error: any) {
      context.error('Error getting user signature requests:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Get specific signature request
 * GET /api/signature-requests/{requestId}
 */
app.http('getSignatureRequest', {
  methods: ['GET'],
  route: 'signature-requests/{requestId}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const requestId = request.params.requestId;
      
      if (!requestId) {
        return {
          status: 400,
          jsonBody: { error: 'Request ID is required' }
        };
      }

      const signatureRequest = await signatureService.getSignatureRequest(requestId);
      
      if (!signatureRequest) {
        return {
          status: 404,
          jsonBody: { error: 'Signature request not found' }
        };
      }

      // TODO: Check permissions - user should have access to this request

      return {
        status: 200,
        jsonBody: signatureRequest
      };

    } catch (error: any) {
      context.error('Error getting signature request:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Update signature request status
 * PUT /api/signature-requests/{requestId}
 */
app.http('updateSignatureRequest', {
  methods: ['PUT'],
  route: 'signature-requests/{requestId}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const requestId = request.params.requestId;
      const { userId } = SignatureService.getUserFromRequest(request);
      
      if (!requestId) {
        return {
          status: 400,
          jsonBody: { error: 'Request ID is required' }
        };
      }

      const requestBody = await request.json() as {
        status: SignatureStatus;
        providerEnvelopeId?: string;
        providerUrl?: string;
      };

      if (!requestBody.status) {
        return {
          status: 400,
          jsonBody: { error: 'Status is required' }
        };
      }

      const updatedRequest = await signatureService.updateSignatureRequestStatus(
        requestId,
        requestBody.status,
        userId,
        {
          providerEnvelopeId: requestBody.providerEnvelopeId,
          providerUrl: requestBody.providerUrl
        }
      );

      return {
        status: 200,
        jsonBody: updatedRequest
      };

    } catch (error: any) {
      context.error('Error updating signature request:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Cancel signature request
 * DELETE /api/signature-requests/{requestId}
 */
app.http('cancelSignatureRequest', {
  methods: ['DELETE'],
  route: 'signature-requests/{requestId}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const requestId = request.params.requestId;
      const { userId } = SignatureService.getUserFromRequest(request);
      
      if (!requestId) {
        return {
          status: 400,
          jsonBody: { error: 'Request ID is required' }
        };
      }

      const updatedRequest = await signatureService.updateSignatureRequestStatus(
        requestId,
        'cancelled',
        userId
      );

      // TODO: Cancel with signature provider

      return {
        status: 200,
        jsonBody: updatedRequest
      };

    } catch (error: any) {
      context.error('Error cancelling signature request:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Update signer status (webhook endpoint)
 * POST /api/signature-requests/{requestId}/signers/{signerEmail}/status
 */
app.http('updateSignerStatus', {
  methods: ['POST'],
  route: 'signature-requests/{requestId}/signers/{signerEmail}/status',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const requestId = request.params.requestId;
      const signerEmail = decodeURIComponent(request.params.signerEmail!);
      
      if (!requestId || !signerEmail) {
        return {
          status: 400,
          jsonBody: { error: 'Request ID and signer email are required' }
        };
      }

      const requestBody = await request.json() as {
        status: Signer['status'];
        signatureInfo?: Signer['signatureInfo'];
        declineReason?: string;
      };

      if (!requestBody.status) {
        return {
          status: 400,
          jsonBody: { error: 'Status is required' }
        };
      }

      const updatedRequest = await signatureService.updateSignerStatus(
        requestId,
        signerEmail,
        requestBody.status,
        requestBody.signatureInfo,
        requestBody.declineReason
      );

      return {
        status: 200,
        jsonBody: updatedRequest
      };

    } catch (error: any) {
      context.error('Error updating signer status:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Get organization signature settings
 * GET /api/signature-settings
 */
app.http('getSignatureSettings', {
  methods: ['GET'],
  route: 'signature-settings',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const { organizationId } = SignatureService.getUserFromRequest(request);
      
      const settings = await signatureService.getOrganizationSettings(organizationId);
      
      if (!settings) {
        // Return default settings if none exist
        const defaultSettings: OrganizationSignatureSettings = {
          organizationId,
          enabledMethods: ['docusign'],
          defaultMethod: 'docusign',
          providerSettings: {},
          appearanceSettings: {
            displaySignerName: true,
            displaySignDate: true,
            displayCompanyName: true
          },
          securitySettings: {
            requireAuthentication: true,
            allowedAuthMethods: ['email'],
            sessionTimeoutMinutes: 30,
            requireSecureConnection: true
          },
          workflowSettings: {
            autoSendReminders: true,
            defaultReminderDays: 3,
            defaultExpirationDays: 30,
            allowDelegation: false,
            requireCompleteOrder: true
          },
          auditSettings: {
            logAllEvents: true,
            retentionDays: 2555, // 7 years
            includeDocumentHashes: true,
            requireDigitalCertificate: false
          },
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        };

        return {
          status: 200,
          jsonBody: defaultSettings
        };
      }

      return {
        status: 200,
        jsonBody: settings
      };

    } catch (error: any) {
      context.error('Error getting signature settings:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Update organization signature settings
 * PUT /api/signature-settings
 */
app.http('updateSignatureSettings', {
  methods: ['PUT'],
  route: 'signature-settings',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      const requestBody = await request.json() as Partial<OrganizationSignatureSettings>;
      
      // TODO: Check if user has permission to update settings
      
      const settings: OrganizationSignatureSettings = {
        ...requestBody,
        organizationId,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      } as OrganizationSignatureSettings;

      await signatureService.saveOrganizationSettings(settings);

      return {
        status: 200,
        jsonBody: settings
      };

    } catch (error: any) {
      context.error('Error updating signature settings:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Get signature templates
 * GET /api/signature-templates
 */
app.http('getSignatureTemplates', {
  methods: ['GET'],
  route: 'signature-templates',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const { organizationId } = SignatureService.getUserFromRequest(request);
      
      const templates = await signatureService.getOrganizationTemplates(organizationId);

      return {
        status: 200,
        jsonBody: templates
      };

    } catch (error: any) {
      context.error('Error getting signature templates:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Create signature template
 * POST /api/signature-templates
 */
app.http('createSignatureTemplate', {
  methods: ['POST'],
  route: 'signature-templates',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      const requestBody = await request.json() as {
        name: string;
        signatureMethod: any;
        defaultSettings: any;
        defaultSigners: any[];
      };

      if (!requestBody.name) {
        return {
          status: 400,
          jsonBody: { error: 'Template name is required' }
        };
      }

      const template = await signatureService.createSignatureTemplate({
        name: requestBody.name,
        organizationId,
        signatureMethod: requestBody.signatureMethod,
        defaultSettings: requestBody.defaultSettings,
        defaultSigners: requestBody.defaultSigners,
        createdBy: userId,
        updatedBy: userId
      });

      return {
        status: 201,
        jsonBody: template
      };

    } catch (error: any) {
      context.error('Error creating signature template:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Get signature statistics
 * GET /api/signature-statistics
 */
app.http('getSignatureStatistics', {
  methods: ['GET'],
  route: 'signature-statistics',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const { organizationId } = SignatureService.getUserFromRequest(request);
      
      const url = new URL(request.url);
      const startDate = url.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = url.searchParams.get('endDate') || new Date().toISOString();

      const statistics = await signatureService.getSignatureStatistics(organizationId, startDate, endDate);

      return {
        status: 200,
        jsonBody: statistics
      };

    } catch (error: any) {
      context.error('Error getting signature statistics:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * DocuSign webhook endpoint
 * POST /api/signature-webhooks/docusign
 */
app.http('docusignWebhook', {
  methods: ['POST'],
  route: 'signature-webhooks/docusign',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Received DocuSign webhook');
      
      // TODO: Implement DocuSign webhook processing
      // This will be implemented when we integrate with DocuSign API
      
      const requestBody = await request.json();
      context.log('DocuSign webhook payload:', requestBody);

      return {
        status: 200,
        jsonBody: { status: 'received' }
      };

    } catch (error: any) {
      context.error('Error processing DocuSign webhook:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Adobe Sign webhook endpoint
 * POST /api/signature-webhooks/adobe
 */
app.http('adobeSignWebhook', {
  methods: ['POST'],
  route: 'signature-webhooks/adobe',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Received Adobe Sign webhook');
      
      // TODO: Implement Adobe Sign webhook processing
      // This will be implemented when we integrate with Adobe Sign API
      
      const requestBody = await request.json();
      context.log('Adobe Sign webhook payload:', requestBody);

      return {
        status: 200,
        jsonBody: { status: 'received' }
      };

    } catch (error: any) {
      context.error('Error processing Adobe Sign webhook:', error);
      return SignatureService.handleError(error);
    }
  }
});

export default app;
