import { getContainer } from '../db/cosmos';
import { InvocationContext } from '@azure/functions';

export interface VersioningOptions {
  changeType: 'created' | 'updated' | 'status_changed' | 'renamed' | 'moved' | 'approved' | 'rejected';
  changeDescription: string;
  workflowId?: string;
  reason?: string;
  auditInfo?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface User {
  objectId?: string;
  id?: string;
  email: string;
  displayName?: string;
  roles?: string[];
}

export class DocumentVersioningService {
  
  /**
   * Create a new version automatically when a document is modified
   */
  static async createVersionFromDocument(
    documentId: string,
    user: User,
    options: VersioningOptions,
    ctx?: InvocationContext
  ): Promise<any> {
    try {
      const now = new Date().toISOString();

      // 1. Get current document
      const documentsContainer = getContainer('documents');
      const { resource: document } = await documentsContainer.item(documentId).read();
      
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // 2. Get next version number
      const versionsContainer = getContainer('document-versions');
      const versionQuery = {
        query: 'SELECT TOP 1 c.versionNumber FROM c WHERE c.partitionKey = @documentId ORDER BY c.versionNumber DESC',
        parameters: [{ name: '@documentId', value: documentId }]
      };
      
      const { resources: versionResults } = await versionsContainer.items.query(versionQuery).fetchAll();
      const latestVersionNumber = versionResults.length > 0 ? versionResults[0].versionNumber : 0;
      const newVersionNumber = latestVersionNumber + 1;

      // 3. Create new version record
      const newVersion = {
        id: `version-${documentId}-${newVersionNumber}`,
        partitionKey: documentId,
        documentId,
        versionNumber: newVersionNumber,
        documentSnapshot: {
          name: document.name,
          fileName: document.fileName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          blobUrl: document.blobUrl,
          status: document.status,
          category: document.category || '',
          tags: document.tags || [],
          metadata: document.metadata
        },
        versionMetadata: {
          createdBy: user.displayName || user.email,
          createdByEmail: user.email,
          createdAt: now,
          changeType: options.changeType,
          changeDescription: options.changeDescription,
          previousVersion: latestVersionNumber > 0 ? latestVersionNumber : undefined,
          validationStatus: document.status === 'pending validation' ? 'pending' : 
                           document.status === 'approved' ? 'validated' : undefined,
          approvalStatus: document.status === 'pending' ? 'pending' :
                         document.status === 'approved' ? 'approved' : 
                         document.status === 'rejected' ? 'rejected' : undefined
        },
        auditInfo: options.auditInfo || {}
      };

      // 4. Store version
      const { resource: createdVersion } = await versionsContainer.items.create(newVersion);

      // 5. Update main document version number
      await documentsContainer.item(documentId).patch([
        { op: 'replace', path: '/metadata/version', value: newVersionNumber },
        { op: 'replace', path: '/metadata/modifiedAt', value: now },
        { op: 'replace', path: '/metadata/modifiedBy', value: user.email }
      ]);

      // 6. Create detailed history event
      await this.createHistoryEvent(
        documentId,
        this.mapChangeTypeToEventType(options.changeType),
        {
          action: options.changeDescription,
          reason: options.reason,
          workflowStepId: options.workflowId
        },
        user,
        now,
        createdVersion.id,
        ctx
      );

      ctx?.log(`Document version ${newVersionNumber} created for document ${documentId} by ${user.displayName || user.email}`);

      return createdVersion;

    } catch (error: any) {
      ctx?.error('DocumentVersioningService.createVersionFromDocument error:', error);
      throw error;
    }
  }

  /**
   * Create a history event for audit trail
   */
  static async createHistoryEvent(
    documentId: string,
    eventType: string,
    eventDetails: any,
    user: User,
    timestamp: string,
    versionId?: string,
    ctx?: InvocationContext
  ): Promise<void> {
    try {
      const historyContainer = getContainer('document-history-events');
      
      const historyEvent = {
        id: `event-${documentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        partitionKey: documentId,
        documentId,
        versionId,
        eventType,
        eventDetails,
        userInfo: {
          userId: user.objectId || user.id || 'unknown',
          userEmail: user.email,
          userName: user.displayName || user.email,
          userRoles: user.roles || []
        },
        timestamp,
        auditInfo: {
          ipAddress: 'server-side',
          userAgent: 'api-server',
          sessionId: `session-${Date.now()}`
        }
      };

      await historyContainer.items.create(historyEvent);
      ctx?.log(`History event created: ${historyEvent.id} for document ${documentId}`);

    } catch (error) {
      ctx?.error('Failed to create history event:', error);
      // Don't throw - history event creation shouldn't break main operation
    }
  }

  /**
   * Log document access events (view, download, etc.)
   */
  static async logDocumentAccess(
    documentId: string,
    eventType: 'view' | 'download' | 'share',
    user: User,
    additionalInfo?: any,
    ctx?: InvocationContext
  ): Promise<void> {
    await this.createHistoryEvent(
      documentId,
      eventType,
      {
        action: `Document ${eventType}`,
        ...additionalInfo
      },
      user,
      new Date().toISOString(),
      undefined,
      ctx
    );
  }

  /**
   * Map change types to event types for audit trail
   */
  private static mapChangeTypeToEventType(changeType: string): string {
    const mapping: Record<string, string> = {
      'created': 'upload',
      'updated': 'edit',
      'status_changed': 'edit',
      'renamed': 'rename',
      'moved': 'move',
      'approved': 'approve',
      'rejected': 'approve'
    };
    return mapping[changeType] || 'edit';
  }

  /**
   * Get document version history with access control
   */
  static async getDocumentHistory(
    documentId: string,
    user: User,
    userRoles: string[],
    ctx?: InvocationContext
  ): Promise<any> {
    try {
      // 1. Check document access
      const documentsContainer = getContainer('documents');
      const { resource: document } = await documentsContainer.item(documentId).read();
      
      if (!document) {
        throw new Error('Document not found');
      }

      // 2. Check permissions per PROGECT.md - Document Validators and Approvers should have access
      const hasAccess = 
        document.permissions?.owners?.includes(user.email) ||
        document.permissions?.viewers?.includes(user.email) ||
        document.permissions?.editors?.includes(user.email) ||
        document.permissions?.approvers?.includes(user.email) ||
        userRoles.includes('Administrator') ||
        userRoles.includes('Manager') ||
        userRoles.includes('Document Validator') ||
        userRoles.includes('Document Approver');

      if (!hasAccess) {
        throw new Error('Insufficient permissions to view document history');
      }

      // 3. Get version history
      const versionsContainer = getContainer('document-versions');
      const versionsQuery = {
        query: 'SELECT * FROM c WHERE c.partitionKey = @documentId ORDER BY c.versionNumber DESC',
        parameters: [{ name: '@documentId', value: documentId }]
      };
      
      const { resources: versions } = await versionsContainer.items.query(versionsQuery).fetchAll();

      // 4. Get detailed history events
      const historyContainer = getContainer('document-history-events');
      const historyQuery = {
        query: 'SELECT * FROM c WHERE c.partitionKey = @documentId ORDER BY c.timestamp DESC',
        parameters: [{ name: '@documentId', value: documentId }]
      };
      
      const { resources: historyEvents } = await historyContainer.items.query(historyQuery).fetchAll();

      // 5. Log access
      await this.logDocumentAccess(documentId, 'view', user, { section: 'history' }, ctx);

      return {
        documentId,
        documentName: document.name,
        currentVersion: document.metadata?.version || 1,
        versions,
        historyEvents,
        totalVersions: versions.length,
        accessedBy: user.email,
        accessedAt: new Date().toISOString()
      };

    } catch (error) {
      ctx?.error('DocumentVersioningService.getDocumentHistory error:', error);
      throw error;
    }
  }

  /**
   * Compare two document versions
   */
  static async compareVersions(
    documentId: string,
    version1: number,
    version2: number,
    user: User,
    userRoles: string[],
    ctx?: InvocationContext
  ): Promise<any> {
    try {
      // Check access first
      await this.getDocumentHistory(documentId, user, userRoles, ctx);

      const versionsContainer = getContainer('document-versions');
      
      // Get both versions
      const version1Id = `version-${documentId}-${version1}`;
      const version2Id = `version-${documentId}-${version2}`;
      
      const [{ resource: v1 }, { resource: v2 }] = await Promise.all([
        versionsContainer.item(version1Id, documentId).read(),
        versionsContainer.item(version2Id, documentId).read()
      ]);

      if (!v1 || !v2) {
        throw new Error('One or both versions not found');
      }

      // Compare document snapshots
      const differences = this.compareDocumentSnapshots(v1.documentSnapshot, v2.documentSnapshot);

      // Log comparison access
      await this.logDocumentAccess(
        documentId, 
        'view', 
        user, 
        { action: `Compared versions ${version1} and ${version2}` },
        ctx
      );

      return {
        documentId,
        version1: v1,
        version2: v2,
        differences,
        comparedBy: user.email,
        comparedAt: new Date().toISOString()
      };

    } catch (error) {
      ctx?.error('DocumentVersioningService.compareVersions error:', error);
      throw error;
    }
  }

  /**
   * Compare two document snapshots and find differences
   */
  private static compareDocumentSnapshots(snapshot1: any, snapshot2: any): any {
    const differences: any = {};

    const fieldsToCompare = ['name', 'fileName', 'fileSize', 'status', 'category', 'tags'];

    for (const field of fieldsToCompare) {
      if (JSON.stringify(snapshot1[field]) !== JSON.stringify(snapshot2[field])) {
        differences[field] = {
          old: snapshot1[field],
          new: snapshot2[field]
        };
      }
    }

    return differences;
  }
}
