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

      // Send to signature provider if configured
      await initiateExternalSignature(signatureRequest, context);

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
app.http('getSignatureRequests', {
  methods: ['GET'],
  route: 'signature-requests',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Getting signature requests for user');
      
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const documentId = url.searchParams.get('documentId');
      const createdByMe = url.searchParams.get('createdByMe') === 'true';
      const assignedToMe = url.searchParams.get('assignedToMe') === 'true';
      
      const signatureRequests = await signatureService.getSignatureRequests({
        organizationId,
        userId: assignedToMe ? userId : undefined,
        createdBy: createdByMe ? userId : undefined,
        status: status as any,
        documentId
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: signatureRequests,
          count: signatureRequests.length
        }
      };

    } catch (error: any) {
      context.error('Error getting signature requests:', error);
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
      context.log('Getting signature request:', requestId);
      
      if (!requestId) {
        return {
          status: 400,
          jsonBody: { error: 'Request ID is required' }
        };
      }

      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      const signatureRequest = await signatureService.getSignatureRequest(requestId);
      
      if (!signatureRequest) {
        return {
          status: 404,
          jsonBody: { error: 'Signature request not found' }
        };
      }

      // Check access permissions
      const hasAccess = 
        signatureRequest.createdBy === userId ||
        signatureRequest.signers.some(s => s.email === request.headers.get('user-email')) ||
        signatureRequest.organizationId === organizationId;

      if (!hasAccess) {
        return {
          status: 403,
          jsonBody: { error: 'Access denied to this signature request' }
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: signatureRequest
        }
      };

    } catch (error: any) {
      context.error('Error getting signature request:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Update signer status (sign, decline, etc.)
 * POST /api/signature-requests/{requestId}/signers/{signerEmail}/action
 */
app.http('updateSignerStatus', {
  methods: ['POST'],
  route: 'signature-requests/{requestId}/signers/{signerEmail}/action',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const requestId = request.params.requestId;
      const signerEmail = request.params.signerEmail;
      
      context.log('Updating signer status:', { requestId, signerEmail });
      
      if (!requestId || !signerEmail) {
        return {
          status: 400,
          jsonBody: { error: 'Request ID and signer email are required' }
        };
      }

      const requestBody = await request.json() as {
        action: 'signed' | 'declined';
        signatureInfo?: any;
        declineReason?: string;
        signatureData?: string;
        ipAddress?: string;
      };

      // Validate action
      if (!['signed', 'declined'].includes(requestBody.action)) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid action. Must be "signed" or "declined"' }
        };
      }

      // Update signer status
      const updatedRequest = await signatureService.updateSignerStatus(
        requestId,
        decodeURIComponent(signerEmail),
        requestBody.action,
        requestBody.signatureInfo,
        requestBody.declineReason
      );

      // If all signers have signed, mark document as signed
      if (updatedRequest.status === 'completed') {
        await signatureService.completeDocumentSigning(updatedRequest.documentId);
      }

      context.log('Signer status updated successfully');

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: updatedRequest,
          message: `Signature ${requestBody.action} successfully`
        }
      };

    } catch (error: any) {
      context.error('Error updating signer status:', error);
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
      context.log('Cancelling signature request:', requestId);
      
      if (!requestId) {
        return {
          status: 400,
          jsonBody: { error: 'Request ID is required' }
        };
      }

      const { userId } = SignatureService.getUserFromRequest(request);
      
      const signatureRequest = await signatureService.getSignatureRequest(requestId);
      
      if (!signatureRequest) {
        return {
          status: 404,
          jsonBody: { error: 'Signature request not found' }
        };
      }

      // Check if user can cancel (only creator or admin)
      if (signatureRequest.createdBy !== userId) {
        return {
          status: 403,
          jsonBody: { error: 'Only the creator can cancel this signature request' }
        };
      }

      // Update status to cancelled
      const updatedRequest = await signatureService.updateSignatureRequestStatus(
        requestId,
        'cancelled',
        userId,
        {
          cancelledAt: new Date().toISOString(),
          cancelledBy: userId
        }
      );

      context.log('Signature request cancelled successfully');

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: updatedRequest,
          message: 'Signature request cancelled successfully'
        }
      };

    } catch (error: any) {
      context.error('Error cancelling signature request:', error);
      return SignatureService.handleError(error);
    }
  }
});

/**
 * Get signature statistics
 * GET /api/signature-requests/statistics
 */
app.http('getSignatureStatistics', {
  methods: ['GET'],
  route: 'signature-requests/statistics',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Getting signature statistics');
      
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      const statistics = await signatureService.getSignatureStatistics(organizationId, userId);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: statistics
        }
      };

    } catch (error: any) {
      context.error('Error getting signature statistics:', error);
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
      context.log('Getting signature settings');
      
      const { organizationId } = SignatureService.getUserFromRequest(request);
      
      const settings = await signatureService.getOrganizationSettings(organizationId);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: settings
        }
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
      context.log('Updating signature settings');
      
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      const settingsUpdate = await request.json() as Partial<OrganizationSignatureSettings>;
      
      // Validate required fields
      if (settingsUpdate.enabledMethods && settingsUpdate.enabledMethods.length === 0) {
        return {
          status: 400,
          jsonBody: { error: 'At least one signature method must be enabled' }
        };
      }

      const updatedSettings = await signatureService.updateOrganizationSettings(
        organizationId,
        settingsUpdate,
        userId
      );

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: updatedSettings,
          message: 'Signature settings updated successfully'
        }
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
      context.log('Getting signature templates');
      
      const { organizationId } = SignatureService.getUserFromRequest(request);
      
      const templates = await signatureService.getSignatureTemplates(organizationId);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: templates,
          count: templates.length
        }
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
      context.log('Creating signature template');
      
      const { userId, organizationId } = SignatureService.getUserFromRequest(request);
      
      const templateData = await request.json() as {
        name: string;
        signatureMethod: any;
        defaultSettings: any;
        defaultSigners?: any[];
      };

      // Validate required fields
      if (!templateData.name || !templateData.signatureMethod) {
        return {
          status: 400,
          jsonBody: { error: 'Template name and signature method are required' }
        };
      }

      const template = await signatureService.createSignatureTemplate(
        organizationId,
        templateData,
        userId
      );

      return {
        status: 201,
        jsonBody: {
          success: true,
          data: template,
          message: 'Signature template created successfully'
        }
      };

    } catch (error: any) {
      context.error('Error creating signature template:', error);
      return SignatureService.handleError(error);
    }
  }
});

// Helper method to initiate external signature
async function initiateExternalSignature(signatureRequest: any, context: InvocationContext) {
  try {
    // This would integrate with DocuSign, Adobe Sign, or other providers
    // For now, we'll just log the attempt
    context.log('Initiating external signature for request:', signatureRequest.id);
    
    // In a full implementation, this would:
    // 1. Get organization signature settings
    // 2. Create envelope/request in external provider
    // 3. Send signing URLs to signers
    // 4. Set up webhooks for status updates
    
    return true;
  } catch (error) {
    context.error('Failed to initiate external signature:', error);
    return false;
  }
}
