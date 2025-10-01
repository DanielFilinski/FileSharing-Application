/**
 * Escalation Manager
 * Main service for managing escalations and incidents
 */

import {
  Escalation,
  EscalationType,
  EscalationPriority,
  EscalationStatus,
  EscalationCategory,
  CreateEscalationRequest,
  UpdateEscalationRequest,
  EscalationComment,
  EscalationHistoryEntry,
  EscalationAction,
  EscalationConfig,
  DEFAULT_ESCALATION_CONFIG,
  EscalationError,
  EscalationErrorType,
  NotificationChannel,
} from './types';

export class EscalationManager {
  private config: EscalationConfig;
  private escalations: Map<string, Escalation> = new Map();
  private comments: Map<string, EscalationComment[]> = new Map();
  private history: Map<string, EscalationHistoryEntry[]> = new Map();

  constructor(config?: Partial<EscalationConfig>) {
    this.config = { ...DEFAULT_ESCALATION_CONFIG, ...config };
  }

  // ==========================================
  // CREATE ESCALATION
  // ==========================================

  /**
   * Create new escalation
   */
  async createEscalation(
    request: CreateEscalationRequest,
    createdBy: string,
    createdByName: string,
    organizationId: string,
    tenantId: string
  ): Promise<Escalation> {
    const now = new Date();
    const id = this.generateEscalationId();

    const escalation: Escalation = {
      id,
      type: request.type,
      category: request.category || this.getCategoryForType(request.type),
      priority: request.priority || this.getDefaultPriority(request.type),
      status: 'open',
      
      title: request.title,
      description: request.description,
      details: request.details,
      
      affectedUserId: request.affectedUserId,
      affectedDocumentId: request.affectedDocumentId,
      affectedResourceId: request.affectedResourceId,
      
      createdAt: now,
      createdBy,
      createdByName,
      updatedAt: now,
      
      tags: request.tags || [],
      
      organizationId,
      tenantId,
    };

    // Calculate SLA
    this.calculateSLA(escalation);

    // Store escalation
    this.escalations.set(id, escalation);

    // Add history entry
    this.addHistoryEntry(id, 'created', createdBy, createdByName);

    // Trigger notifications
    await this.sendNotifications(escalation, 'created');

    console.log(`Escalation created: ${id} - ${request.title}`);
    
    return escalation;
  }

  // ==========================================
  // UPDATE ESCALATION
  // ==========================================

  /**
   * Update escalation
   */
  async updateEscalation(
    escalationId: string,
    updates: UpdateEscalationRequest,
    updatedBy: string,
    updatedByName: string
  ): Promise<Escalation> {
    const escalation = this.escalations.get(escalationId);

    if (!escalation) {
      throw new EscalationError(
        EscalationErrorType.ESCALATION_NOT_FOUND,
        `Escalation ${escalationId} not found`
      );
    }

    const oldStatus = escalation.status;
    const oldPriority = escalation.priority;

    // Update fields
    if (updates.status) {
      this.validateStatusTransition(escalation.status, updates.status);
      escalation.status = updates.status;
      
      if (updates.status === 'resolved') {
        escalation.resolvedBy = updatedBy;
        escalation.resolvedByName = updatedByName;
        escalation.resolutionTime = new Date();
        escalation.resolutionNotes = updates.resolutionNotes;
      }
      
      if (updates.status === 'closed') {
        escalation.closedAt = new Date();
      }
      
      if (updates.status === 'acknowledged') {
        escalation.acknowledgedAt = new Date();
      }
    }

    if (updates.priority) {
      escalation.priority = updates.priority;
      this.calculateSLA(escalation); // Recalculate SLA
    }

    if (updates.assignedTo) {
      escalation.assignedTo = updates.assignedTo;
    }

    if (updates.tags) {
      escalation.tags = updates.tags;
    }

    escalation.updatedAt = new Date();

    // Add history entries
    if (updates.status && updates.status !== oldStatus) {
      this.addHistoryEntry(
        escalationId,
        'status_changed',
        updatedBy,
        updatedByName,
        oldStatus,
        updates.status
      );
    }

    if (updates.priority && updates.priority !== oldPriority) {
      this.addHistoryEntry(
        escalationId,
        'priority_changed',
        updatedBy,
        updatedByName,
        oldPriority,
        updates.priority
      );
    }

    if (updates.assignedTo) {
      this.addHistoryEntry(
        escalationId,
        escalation.assignedTo ? 'reassigned' : 'assigned',
        updatedBy,
        updatedByName
      );
    }

    // Send notifications
    if (updates.status && updates.status !== oldStatus) {
      await this.sendNotifications(escalation, 'status_changed');
    }

    return escalation;
  }

  // ==========================================
  // COMMENTS
  // ==========================================

  /**
   * Add comment to escalation
   */
  async addComment(
    escalationId: string,
    content: string,
    authorId: string,
    authorName: string,
    isInternal: boolean = false
  ): Promise<EscalationComment> {
    const escalation = this.escalations.get(escalationId);

    if (!escalation) {
      throw new EscalationError(
        EscalationErrorType.ESCALATION_NOT_FOUND,
        `Escalation ${escalationId} not found`
      );
    }

    const comment: EscalationComment = {
      id: this.generateCommentId(),
      escalationId,
      content,
      authorId,
      authorName,
      createdAt: new Date(),
      isInternal,
    };

    // Store comment
    const comments = this.comments.get(escalationId) || [];
    comments.push(comment);
    this.comments.set(escalationId, comments);

    // Add history entry
    this.addHistoryEntry(escalationId, 'commented', authorId, authorName);

    // Update escalation
    escalation.updatedAt = new Date();

    console.log(`Comment added to escalation ${escalationId}`);

    return comment;
  }

  /**
   * Get comments for escalation
   */
  getComments(escalationId: string): EscalationComment[] {
    return this.comments.get(escalationId) || [];
  }

  // ==========================================
  // RETRIEVAL
  // ==========================================

  /**
   * Get escalation by ID
   */
  getEscalation(escalationId: string): Escalation | null {
    return this.escalations.get(escalationId) || null;
  }

  /**
   * Get all escalations
   */
  getAllEscalations(filters?: {
    status?: EscalationStatus;
    priority?: EscalationPriority;
    type?: EscalationType;
    assignedTo?: string;
    createdBy?: string;
  }): Escalation[] {
    let escalations = Array.from(this.escalations.values());

    if (filters) {
      if (filters.status) {
        escalations = escalations.filter((e) => e.status === filters.status);
      }
      if (filters.priority) {
        escalations = escalations.filter((e) => e.priority === filters.priority);
      }
      if (filters.type) {
        escalations = escalations.filter((e) => e.type === filters.type);
      }
      if (filters.assignedTo) {
        escalations = escalations.filter((e) => e.assignedTo === filters.assignedTo);
      }
      if (filters.createdBy) {
        escalations = escalations.filter((e) => e.createdBy === filters.createdBy);
      }
    }

    // Sort by priority and created date
    return escalations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Get history for escalation
   */
  getHistory(escalationId: string): EscalationHistoryEntry[] {
    return this.history.get(escalationId) || [];
  }

  // ==========================================
  // AUTO-ESCALATION
  // ==========================================

  /**
   * Check and perform auto-escalation for overdue escalations
   */
  async checkAutoEscalation(): Promise<Escalation[]> {
    if (!this.config.autoEscalateEnabled) {
      return [];
    }

    const escalated: Escalation[] = [];
    const now = new Date();

    for (const escalation of this.escalations.values()) {
      if (escalation.status === 'open' || escalation.status === 'in_progress') {
        const elapsedMinutes = (now.getTime() - escalation.createdAt.getTime()) / 60000;
        const threshold = this.config.autoEscalateAfterMinutes[escalation.priority];

        if (elapsedMinutes > threshold) {
          // Auto-escalate
          await this.updateEscalation(
            escalation.id,
            { status: 'escalated' },
            'system',
            'Auto-escalation'
          );
          
          escalation.escalatedAt = now;
          escalated.push(escalation);
          
          console.log(`Auto-escalated: ${escalation.id} - ${escalation.title}`);
        }
      }
    }

    return escalated;
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Calculate SLA for escalation
   */
  private calculateSLA(escalation: Escalation): void {
    const resolutionTime = this.config.defaultResolutionTimeMinutes[escalation.priority];
    escalation.resolutionTimeTarget = resolutionTime;
    
    const dueDate = new Date(escalation.createdAt);
    dueDate.setMinutes(dueDate.getMinutes() + resolutionTime);
    escalation.dueDate = dueDate;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: EscalationStatus,
    newStatus: EscalationStatus
  ): void {
    const validTransitions: Record<EscalationStatus, EscalationStatus[]> = {
      open: ['acknowledged', 'in_progress', 'escalated', 'closed'],
      acknowledged: ['in_progress', 'escalated', 'closed'],
      in_progress: ['resolved', 'escalated', 'open'],
      resolved: ['closed', 'open'],
      closed: ['open'],
      escalated: ['in_progress', 'resolved'],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new EscalationError(
        EscalationErrorType.INVALID_STATUS_TRANSITION,
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Get default priority for escalation type
   */
  private getDefaultPriority(type: EscalationType): EscalationPriority {
    const priorityMap: Record<EscalationType, EscalationPriority> = {
      storage_overflow: 'critical',
      storage_quota_warning: 'high',
      document_validation_failed: 'medium',
      document_approval_overdue: 'high',
      document_signing_failed: 'high',
      sharepoint_sync_failed: 'high',
      system_error: 'critical',
      security_breach: 'critical',
      user_access_issue: 'high',
      workflow_blocked: 'high',
      deadline_missed: 'medium',
      api_integration_failed: 'high',
      custom: 'medium',
    };

    return priorityMap[type];
  }

  /**
   * Get category for escalation type
   */
  private getCategoryForType(type: EscalationType): EscalationCategory {
    if (type.includes('storage') || type.includes('system') || type.includes('api')) {
      return 'technical';
    }
    if (type.includes('security')) {
      return 'security';
    }
    if (type.includes('deadline') || type.includes('approval')) {
      return 'business';
    }
    return 'technical';
  }

  /**
   * Add history entry
   */
  private addHistoryEntry(
    escalationId: string,
    action: EscalationAction,
    performedBy: string,
    performedByName: string,
    oldValue?: any,
    newValue?: any
  ): void {
    const entry: EscalationHistoryEntry = {
      id: this.generateHistoryId(),
      escalationId,
      action,
      performedBy,
      performedByName,
      timestamp: new Date(),
      oldValue,
      newValue,
    };

    const entries = this.history.get(escalationId) || [];
    entries.push(entry);
    this.history.set(escalationId, entries);
  }

  /**
   * Send notifications
   */
  private async sendNotifications(
    escalation: Escalation,
    event: 'created' | 'status_changed'
  ): Promise<void> {
    // In production, integrate with notification service
    console.log(`Sending notifications for escalation ${escalation.id} (${event})`);
    
    // Placeholder for notification logic
    // await notificationService.send({...})
  }

  /**
   * Generate escalation ID
   */
  private generateEscalationId(): string {
    return `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Generate comment ID
   */
  private generateCommentId(): string {
    return `CMT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate history ID
   */
  private generateHistoryId(): string {
    return `HIS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
  } {
    const escalations = Array.from(this.escalations.values());
    const now = new Date();

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let overdue = 0;

    for (const esc of escalations) {
      byStatus[esc.status] = (byStatus[esc.status] || 0) + 1;
      byPriority[esc.priority] = (byPriority[esc.priority] || 0) + 1;
      
      if (esc.dueDate && now > esc.dueDate && esc.status !== 'resolved' && esc.status !== 'closed') {
        overdue++;
      }
    }

    return {
      total: escalations.length,
      byStatus,
      byPriority,
      overdue,
    };
  }
}

// Export singleton instance
export const escalationManager = new EscalationManager();

