/**
 * Audit Trail Azure Functions
 * API endpoints для системы журналирования и аудита
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AuditTrailService } from '../shared/audit/auditTrailService';
import { 
  AuditEventsQuery,
  AuditReportParameters,
  AuditSettings,
  AuditEventInput
} from '../../../src/shared/types/audit';

const auditService = new AuditTrailService();

/**
 * Get audit events with filtering and pagination
 * GET /api/audit/events
 */
app.http('getAuditEvents', {
  methods: ['GET'],
  route: 'audit/events',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Getting audit events');
      
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId) {
        return {
          status: 400,
          jsonBody: { error: 'Organization ID is required' }
        };
      }

      // Parse query parameters
      const url = new URL(request.url);
      const query: AuditEventsQuery = {
        organizationId: auditContext.organizationId,
        startDate: url.searchParams.get('startDate') || undefined,
        endDate: url.searchParams.get('endDate') || undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
        categories: url.searchParams.get('categories')?.split(',') as any,
        actions: url.searchParams.get('actions')?.split(','),
        userIds: url.searchParams.get('userIds')?.split(','),
        resourceTypes: url.searchParams.get('resourceTypes')?.split(',') as any,
        severities: url.searchParams.get('severities')?.split(',') as any,
        searchText: url.searchParams.get('searchText') || undefined,
        onlySuccessful: url.searchParams.get('onlySuccessful') === 'true',
        onlyFailed: url.searchParams.get('onlyFailed') === 'true',
        includeSensitive: url.searchParams.get('includeSensitive') === 'true',
        sortBy: url.searchParams.get('sortBy') as any || 'timestamp',
        sortOrder: url.searchParams.get('sortOrder') as any || 'desc'
      };

      const result = await auditService.queryEvents(query);

      return {
        status: 200,
        jsonBody: result
      };

    } catch (error: any) {
      context.error('Error getting audit events:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to get audit events' }
      };
    }
  }
});

/**
 * Get specific audit event by ID
 * GET /api/audit/events/{eventId}
 */
app.http('getAuditEvent', {
  methods: ['GET'],
  route: 'audit/events/{eventId}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const eventId = request.params.eventId;
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!eventId) {
        return {
          status: 400,
          jsonBody: { error: 'Event ID is required' }
        };
      }

      // TODO: Implement get single event by ID
      // For now, return not implemented
      return {
        status: 501,
        jsonBody: { error: 'Get single event not implemented yet' }
      };

    } catch (error: any) {
      context.error('Error getting audit event:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to get audit event' }
      };
    }
  }
});

/**
 * Manual audit event logging (for testing or special cases)
 * POST /api/audit/events
 */
app.http('createAuditEvent', {
  methods: ['POST'],
  route: 'audit/events',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      const requestBody = await request.json() as AuditEventInput;

      if (!requestBody.category || !requestBody.action || !requestBody.description) {
        return {
          status: 400,
          jsonBody: { error: 'Category, action, and description are required' }
        };
      }

      const auditEvent = await auditService.logEvent(requestBody, auditContext);

      return {
        status: 201,
        jsonBody: auditEvent
      };

    } catch (error: any) {
      context.error('Error creating audit event:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to create audit event' }
      };
    }
  }
});

/**
 * Advanced search with POST body
 * POST /api/audit/events/search
 */
app.http('searchAuditEvents', {
  methods: ['POST'],
  route: 'audit/events/search',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      const query = await request.json() as AuditEventsQuery;

      // Ensure organization ID is set
      query.organizationId = auditContext.organizationId || query.organizationId;

      if (!query.organizationId) {
        return {
          status: 400,
          jsonBody: { error: 'Organization ID is required' }
        };
      }

      const result = await auditService.queryEvents(query);

      return {
        status: 200,
        jsonBody: result
      };

    } catch (error: any) {
      context.error('Error searching audit events:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to search audit events' }
      };
    }
  }
});

/**
 * Get user sessions
 * GET /api/audit/sessions
 */
app.http('getAuditSessions', {
  methods: ['GET'],
  route: 'audit/sessions',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId) {
        return {
          status: 400,
          jsonBody: { error: 'Organization ID is required' }
        };
      }

      // TODO: Implement get sessions functionality
      return {
        status: 501,
        jsonBody: { error: 'Get sessions not implemented yet' }
      };

    } catch (error: any) {
      context.error('Error getting audit sessions:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to get audit sessions' }
      };
    }
  }
});

/**
 * Create audit report
 * POST /api/audit/reports
 */
app.http('createAuditReport', {
  methods: ['POST'],
  route: 'audit/reports',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId || !auditContext.userId || !auditContext.userName) {
        return {
          status: 400,
          jsonBody: { error: 'User and organization information required' }
        };
      }

      const requestBody = await request.json() as {
        name: string;
        description?: string;
        parameters: AuditReportParameters;
      };

      if (!requestBody.name || !requestBody.parameters) {
        return {
          status: 400,
          jsonBody: { error: 'Report name and parameters are required' }
        };
      }

      const report = await auditService.createReport(
        auditContext.organizationId,
        auditContext.userId,
        auditContext.userName,
        requestBody.parameters,
        requestBody.name,
        requestBody.description
      );

      return {
        status: 201,
        jsonBody: report
      };

    } catch (error: any) {
      context.error('Error creating audit report:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to create audit report' }
      };
    }
  }
});

/**
 * Get audit reports
 * GET /api/audit/reports
 */
app.http('getAuditReports', {
  methods: ['GET'],
  route: 'audit/reports',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId) {
        return {
          status: 400,
          jsonBody: { error: 'Organization ID is required' }
        };
      }

      // TODO: Implement get reports functionality
      return {
        status: 501,
        jsonBody: { error: 'Get reports not implemented yet' }
      };

    } catch (error: any) {
      context.error('Error getting audit reports:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to get audit reports' }
      };
    }
  }
});

/**
 * Download audit report
 * GET /api/audit/reports/{reportId}/download
 */
app.http('downloadAuditReport', {
  methods: ['GET'],
  route: 'audit/reports/{reportId}/download',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const reportId = request.params.reportId;
      
      if (!reportId) {
        return {
          status: 400,
          jsonBody: { error: 'Report ID is required' }
        };
      }

      // TODO: Implement report download functionality
      return {
        status: 501,
        jsonBody: { error: 'Report download not implemented yet' }
      };

    } catch (error: any) {
      context.error('Error downloading audit report:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to download audit report' }
      };
    }
  }
});

/**
 * Get audit statistics and analytics
 * GET /api/audit/analytics/summary
 */
app.http('getAuditSummary', {
  methods: ['GET'],
  route: 'audit/analytics/summary',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId) {
        return {
          status: 400,
          jsonBody: { error: 'Organization ID is required' }
        };
      }

      const url = new URL(request.url);
      const startDate = url.searchParams.get('startDate') || 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = url.searchParams.get('endDate') || 
        new Date().toISOString();

      const statistics = await auditService.getStatistics(
        auditContext.organizationId,
        startDate,
        endDate
      );

      return {
        status: 200,
        jsonBody: statistics
      };

    } catch (error: any) {
      context.error('Error getting audit summary:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to get audit summary' }
      };
    }
  }
});

/**
 * Get audit settings
 * GET /api/audit/settings
 */
app.http('getAuditSettings', {
  methods: ['GET'],
  route: 'audit/settings',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId) {
        return {
          status: 400,
          jsonBody: { error: 'Organization ID is required' }
        };
      }

      const settings = await auditService.getAuditSettings(auditContext.organizationId);
      
      if (!settings) {
        // Return default settings
        const defaultSettings: AuditSettings = {
          organizationId: auditContext.organizationId,
          enabled: true,
          logLevel: 'standard',
          retentionDays: 365,
          enabledCategories: ['document', 'authentication', 'signature', 'user_management'],
          categorySettings: {
            authentication: { enabled: true, logMetadata: true, logChanges: false, severity: 'medium' },
            authorization: { enabled: true, logMetadata: false, logChanges: false, severity: 'low' },
            document: { enabled: true, logMetadata: true, logChanges: true, severity: 'low' },
            signature: { enabled: true, logMetadata: true, logChanges: true, severity: 'medium' },
            chat: { enabled: true, logMetadata: false, logChanges: false, severity: 'low' },
            user_management: { enabled: true, logMetadata: true, logChanges: true, severity: 'high' },
            system: { enabled: true, logMetadata: true, logChanges: true, severity: 'high' },
            search: { enabled: false, logMetadata: false, logChanges: false, severity: 'low' },
            export: { enabled: true, logMetadata: true, logChanges: false, severity: 'medium' },
            settings: { enabled: true, logMetadata: true, logChanges: true, severity: 'high' }
          },
          realTimeNotifications: {
            enabled: true,
            criticalEventsOnly: true,
            notificationChannels: ['email']
          },
          exportSettings: {
            allowUserExports: true,
            maxExportDays: 90,
            autoReportsEnabled: false
          },
          securitySettings: {
            encryptSensitiveData: true,
            allowSensitiveDataExport: false,
            requireApprovalForExports: true,
            auditLogAccess: 'admin_only'
          },
          integrations: {},
          updatedAt: new Date().toISOString(),
          updatedBy: auditContext.userId || 'system'
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
      context.error('Error getting audit settings:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to get audit settings' }
      };
    }
  }
});

/**
 * Update audit settings
 * PUT /api/audit/settings
 */
app.http('updateAuditSettings', {
  methods: ['PUT'],
  route: 'audit/settings',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId || !auditContext.userId) {
        return {
          status: 400,
          jsonBody: { error: 'User and organization information required' }
        };
      }

      const requestBody = await request.json() as Partial<AuditSettings>;

      // TODO: Check if user has permission to update audit settings

      const settings: AuditSettings = {
        ...requestBody,
        organizationId: auditContext.organizationId,
        updatedAt: new Date().toISOString(),
        updatedBy: auditContext.userId
      } as AuditSettings;

      await auditService.saveAuditSettings(settings);

      // Log the settings change
      await auditService.logEvent({
        category: 'settings',
        action: 'audit.settings_changed',
        description: 'Audit settings were updated',
        resourceType: 'settings',
        resourceId: 'audit-settings',
        resourceName: 'Audit Settings',
        metadata: {
          changedFields: Object.keys(requestBody)
        },
        success: true,
        severity: 'high',
        sensitive: false
      }, auditContext);

      return {
        status: 200,
        jsonBody: settings
      };

    } catch (error: any) {
      context.error('Error updating audit settings:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to update audit settings' }
      };
    }
  }
});

/**
 * Purge old audit records (admin only)
 * POST /api/audit/purge
 */
app.http('purgeAuditRecords', {
  methods: ['POST'],
  route: 'audit/purge',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      if (!auditContext.organizationId || !auditContext.userId) {
        return {
          status: 400,
          jsonBody: { error: 'User and organization information required' }
        };
      }

      // TODO: Check if user has admin permissions
      // TODO: Implement purge functionality

      return {
        status: 501,
        jsonBody: { error: 'Purge functionality not implemented yet' }
      };

    } catch (error: any) {
      context.error('Error purging audit records:', error);
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to purge audit records' }
      };
    }
  }
});

export default app;
