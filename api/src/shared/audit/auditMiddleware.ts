/**
 * Audit Middleware для автоматического логирования HTTP запросов
 */

import { HttpRequest, InvocationContext } from '@azure/functions';
import { AuditTrailService } from './auditTrailService';
import { AuditActions } from '../../../src/shared/types/audit';

export class AuditMiddleware {
  private auditService: AuditTrailService;

  constructor() {
    this.auditService = new AuditTrailService();
  }

  /**
   * Автоматическое логирование API вызовов
   */
  async logApiCall(
    request: HttpRequest,
    context: InvocationContext,
    functionName: string,
    success: boolean,
    error?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);
      
      // Skip logging for health checks and internal endpoints
      if (this.shouldSkipLogging(request.url)) {
        return;
      }

      const method = request.method;
      const url = new URL(request.url);
      const path = url.pathname;
      
      const action = this.determineAction(method, path);
      const category = this.determineCategory(path);
      const resourceInfo = this.extractResourceInfo(path);
      const severity = error ? 'high' : 'low';

      await this.auditService.logEvent({
        category,
        action,
        description: `${method} ${path} - ${success ? 'Success' : 'Error'}`,
        resourceType: resourceInfo.type,
        resourceId: resourceInfo.id || path,
        resourceName: resourceInfo.name,
        metadata: {
          httpMethod: method,
          path,
          functionName,
          userAgent: request.headers.get('user-agent'),
          ...metadata,
          ...(error && { error: error.message })
        },
        success,
        severity: severity as any,
        sensitive: this.isSensitiveEndpoint(path),
        ...(error && {
          errorCode: error.code || 'HTTP_ERROR',
          errorMessage: error.message
        })
      }, auditContext);

    } catch (logError) {
      context.error('Failed to log audit event:', logError);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Логирование операций с документами
   */
  async logDocumentOperation(
    request: HttpRequest,
    action: string,
    documentId: string,
    documentName?: string,
    success: boolean = true,
    error?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);

      await this.auditService.logEvent({
        category: 'document',
        action,
        description: `Document operation: ${action}${documentName ? ` on ${documentName}` : ''}`,
        resourceType: 'document',
        resourceId: documentId,
        resourceName: documentName,
        metadata: {
          documentId,
          documentName,
          ...metadata
        },
        success,
        severity: error ? 'medium' : 'low',
        sensitive: false,
        ...(error && {
          errorCode: error.code || 'DOCUMENT_ERROR',
          errorMessage: error.message
        })
      }, auditContext);

    } catch (logError) {
      console.error('Failed to log document audit event:', logError);
    }
  }

  /**
   * Логирование операций с подписями
   */
  async logSignatureOperation(
    request: HttpRequest,
    action: string,
    documentId: string,
    signatureRequestId?: string,
    success: boolean = true,
    error?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);

      await this.auditService.logEvent({
        category: 'signature',
        action,
        description: `Signature operation: ${action}`,
        resourceType: 'signature_request',
        resourceId: signatureRequestId || documentId,
        metadata: {
          documentId,
          signatureRequestId,
          ...metadata
        },
        success,
        severity: 'medium',
        sensitive: false,
        ...(error && {
          errorCode: error.code || 'SIGNATURE_ERROR',
          errorMessage: error.message
        })
      }, auditContext);

    } catch (logError) {
      console.error('Failed to log signature audit event:', logError);
    }
  }

  /**
   * Логирование операций с пользователями
   */
  async logUserOperation(
    request: HttpRequest,
    action: string,
    targetUserId: string,
    targetUserName?: string,
    success: boolean = true,
    error?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);

      await this.auditService.logEvent({
        category: 'user_management',
        action,
        description: `User management operation: ${action}${targetUserName ? ` for ${targetUserName}` : ''}`,
        resourceType: 'user',
        resourceId: targetUserId,
        resourceName: targetUserName,
        metadata: {
          targetUserId,
          targetUserName,
          ...metadata
        },
        success,
        severity: 'high',
        sensitive: true,
        ...(error && {
          errorCode: error.code || 'USER_ERROR',
          errorMessage: error.message
        })
      }, auditContext);

    } catch (logError) {
      console.error('Failed to log user audit event:', logError);
    }
  }

  /**
   * Логирование аутентификации
   */
  async logAuthentication(
    request: HttpRequest,
    action: string,
    success: boolean,
    sessionId?: string,
    error?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);

      await this.auditService.logEvent({
        category: 'authentication',
        action,
        description: `Authentication: ${action}`,
        resourceType: 'session',
        resourceId: sessionId || auditContext.sessionId || 'unknown',
        metadata: {
          sessionId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          ...metadata
        },
        success,
        severity: success ? 'low' : 'high',
        sensitive: false,
        ...(error && {
          errorCode: error.code || 'AUTH_ERROR',
          errorMessage: error.message
        })
      }, auditContext);

    } catch (logError) {
      console.error('Failed to log authentication audit event:', logError);
    }
  }

  /**
   * Логирование системных операций
   */
  async logSystemOperation(
    request: HttpRequest,
    action: string,
    description: string,
    success: boolean = true,
    error?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditContext = AuditTrailService.getContextFromRequest(request);

      await this.auditService.logEvent({
        category: 'system',
        action,
        description,
        resourceType: 'system',
        resourceId: 'system',
        metadata: {
          ...metadata
        },
        success,
        severity: error ? 'high' : 'medium',
        sensitive: false,
        ...(error && {
          errorCode: error.code || 'SYSTEM_ERROR',
          errorMessage: error.message
        })
      }, auditContext);

    } catch (logError) {
      console.error('Failed to log system audit event:', logError);
    }
  }

  /**
   * Определяет, нужно ли пропустить логирование для данного URL
   */
  private shouldSkipLogging(url: string): boolean {
    const skipPatterns = [
      '/health',
      '/metrics',
      '/ping',
      '/api/audit', // Избегаем циклического логирования
    ];

    return skipPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Определение действия на основе HTTP метода и пути
   */
  private determineAction(method: string, path: string): string {
    // Document operations
    if (path.includes('/documents')) {
      if (method === 'GET' && path.includes('/download')) {
        return AuditActions.DOCUMENT_DOWNLOADED;
      }
      if (method === 'GET') {
        return AuditActions.DOCUMENT_VIEWED;
      }
      if (method === 'POST') {
        return AuditActions.DOCUMENT_CREATED;
      }
      if (method === 'PUT' || method === 'PATCH') {
        return AuditActions.DOCUMENT_EDITED;
      }
      if (method === 'DELETE') {
        return AuditActions.DOCUMENT_DELETED;
      }
    }

    // Signature operations
    if (path.includes('/signature')) {
      if (method === 'POST' && path.includes('/sign')) {
        return AuditActions.DOCUMENT_SIGNED;
      }
      if (method === 'POST') {
        return AuditActions.SIGNATURE_REQUEST_CREATED;
      }
    }

    // User operations
    if (path.includes('/users')) {
      if (method === 'POST') {
        return AuditActions.USER_CREATED;
      }
      if (method === 'PUT' || method === 'PATCH') {
        return AuditActions.USER_UPDATED;
      }
      if (method === 'DELETE') {
        return AuditActions.USER_DELETED;
      }
    }

    // Default action
    return `${method.toLowerCase()}.${path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
  }

  /**
   * Определение категории на основе пути
   */
  private determineCategory(path: string): any {
    if (path.includes('/documents')) return 'document';
    if (path.includes('/signature')) return 'signature';
    if (path.includes('/users') || path.includes('/user-management')) return 'user_management';
    if (path.includes('/auth') || path.includes('/login')) return 'authentication';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/search')) return 'search';
    if (path.includes('/export') || path.includes('/reports')) return 'export';
    return 'system';
  }

  /**
   * Извлечение информации о ресурсе из пути
   */
  private extractResourceInfo(path: string): { type: string; id?: string; name?: string } {
    // Extract resource ID from path like /api/documents/{id}
    const segments = path.split('/').filter(Boolean);
    
    if (segments.includes('documents')) {
      const index = segments.indexOf('documents');
      const id = segments[index + 1];
      return {
        type: 'document',
        id: id && !['versions', 'search', 'export'].includes(id) ? id : undefined
      };
    }

    if (segments.includes('users')) {
      const index = segments.indexOf('users');
      const id = segments[index + 1];
      return {
        type: 'user',
        id: id && !['search', 'export'].includes(id) ? id : undefined
      };
    }

    if (segments.includes('signature')) {
      const index = segments.indexOf('signature');
      const id = segments[index + 1];
      return {
        type: 'signature_request',
        id: id && !['settings', 'templates'].includes(id) ? id : undefined
      };
    }

    return {
      type: 'system',
      id: path
    };
  }

  /**
   * Определение, является ли endpoint чувствительным
   */
  private isSensitiveEndpoint(path: string): boolean {
    const sensitivePatterns = [
      '/users',
      '/auth',
      '/password',
      '/token',
      '/credentials',
      '/settings'
    ];

    return sensitivePatterns.some(pattern => path.includes(pattern));
  }
}

// Экспорт singleton instance
export const auditMiddleware = new AuditMiddleware();
