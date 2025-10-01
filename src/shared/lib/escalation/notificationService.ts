/**
 * Notification Service
 * Handles sending notifications through various channels
 */

import {
  Escalation,
  NotificationChannel,
  NotificationRecord,
} from './types';

export interface NotificationPayload {
  recipient: string; // email, phone number, or user ID
  subject?: string;
  message: string;
  channel: NotificationChannel;
  escalation?: Escalation;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  recipient: string;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

export class NotificationService {
  private sentNotifications: Map<string, NotificationRecord[]> = new Map();

  // ==========================================
  // SEND NOTIFICATIONS
  // ==========================================

  /**
   * Send notification through specified channel
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    console.log(`Sending ${payload.channel} notification to ${payload.recipient}`);

    try {
      switch (payload.channel) {
        case 'email':
          return await this.sendEmail(payload);
        case 'teams':
          return await this.sendTeams(payload);
        case 'sms':
          return await this.sendSMS(payload);
        case 'in_app':
          return await this.sendInApp(payload);
        case 'webhook':
          return await this.sendWebhook(payload);
        default:
          throw new Error(`Unsupported channel: ${payload.channel}`);
      }
    } catch (error) {
      console.error(`Failed to send ${payload.channel} notification:`, error);
      return {
        success: false,
        channel: payload.channel,
        recipient: payload.recipient,
        error: error instanceof Error ? error.message : 'Send failed',
        sentAt: new Date(),
      };
    }
  }

  /**
   * Send notifications through multiple channels
   */
  async sendMultiple(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map((payload) => this.send(payload)));
  }

  /**
   * Send escalation notification
   */
  async sendEscalationNotification(
    escalation: Escalation,
    recipients: string[],
    channels: NotificationChannel[],
    template?: 'created' | 'updated' | 'resolved'
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const recipient of recipients) {
      for (const channel of channels) {
        const payload = this.buildEscalationPayload(
          escalation,
          recipient,
          channel,
          template
        );
        
        const result = await this.send(payload);
        results.push(result);
        
        // Store notification record
        this.recordNotification(escalation.id, result);
      }
    }

    return results;
  }

  // ==========================================
  // CHANNEL-SPECIFIC IMPLEMENTATIONS
  // ==========================================

  /**
   * Send email notification
   */
  private async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    // In production, integrate with Azure Communication Services or SendGrid
    
    console.log('Sending email:', {
      to: payload.recipient,
      subject: payload.subject,
      body: payload.message,
    });

    // Simulate email sending
    await this.delay(100);

    return {
      success: true,
      channel: 'email',
      recipient: payload.recipient,
      messageId: `email-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  /**
   * Send Microsoft Teams notification
   */
  private async sendTeams(payload: NotificationPayload): Promise<NotificationResult> {
    // In production, integrate with Microsoft Teams API or Bot Framework
    
    console.log('Sending Teams message:', {
      to: payload.recipient,
      message: payload.message,
    });

    // Simulate Teams notification
    await this.delay(100);

    return {
      success: true,
      channel: 'teams',
      recipient: payload.recipient,
      messageId: `teams-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(payload: NotificationPayload): Promise<NotificationResult> {
    // In production, integrate with Twilio or Azure Communication Services
    
    console.log('Sending SMS:', {
      to: payload.recipient,
      message: payload.message,
    });

    // Simulate SMS sending
    await this.delay(100);

    return {
      success: true,
      channel: 'sms',
      recipient: payload.recipient,
      messageId: `sms-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(payload: NotificationPayload): Promise<NotificationResult> {
    // Store notification for in-app display
    console.log('Creating in-app notification:', {
      userId: payload.recipient,
      message: payload.message,
    });

    // In production, store in database or notification queue
    return {
      success: true,
      channel: 'in_app',
      recipient: payload.recipient,
      messageId: `inapp-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(payload: NotificationPayload): Promise<NotificationResult> {
    // In production, send HTTP POST to webhook URL
    
    console.log('Sending webhook:', {
      url: payload.recipient,
      data: payload.metadata,
    });

    // Simulate webhook call
    await this.delay(100);

    return {
      success: true,
      channel: 'webhook',
      recipient: payload.recipient,
      messageId: `webhook-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  // ==========================================
  // PAYLOAD BUILDERS
  // ==========================================

  /**
   * Build notification payload for escalation
   */
  private buildEscalationPayload(
    escalation: Escalation,
    recipient: string,
    channel: NotificationChannel,
    template?: 'created' | 'updated' | 'resolved'
  ): NotificationPayload {
    const { subject, message } = this.formatEscalationMessage(escalation, template);

    return {
      recipient,
      subject,
      message,
      channel,
      escalation,
      metadata: {
        escalationId: escalation.id,
        priority: escalation.priority,
        type: escalation.type,
      },
    };
  }

  /**
   * Format escalation message
   */
  private formatEscalationMessage(
    escalation: Escalation,
    template?: 'created' | 'updated' | 'resolved'
  ): { subject: string; message: string } {
    let subject: string;
    let message: string;

    switch (template) {
      case 'created':
        subject = `[${escalation.priority.toUpperCase()}] New Escalation: ${escalation.title}`;
        message = `
A new escalation has been created:

ID: ${escalation.id}
Type: ${escalation.type}
Priority: ${escalation.priority}
Title: ${escalation.title}

Description:
${escalation.description}

${escalation.dueDate ? `Due Date: ${escalation.dueDate.toLocaleString()}` : ''}

Please review and take appropriate action.
        `.trim();
        break;

      case 'resolved':
        subject = `[RESOLVED] Escalation: ${escalation.title}`;
        message = `
The escalation has been resolved:

ID: ${escalation.id}
Title: ${escalation.title}
Resolved by: ${escalation.resolvedByName || 'System'}
Resolution time: ${escalation.resolutionTime?.toLocaleString()}

${escalation.resolutionNotes ? `Notes:\n${escalation.resolutionNotes}` : ''}
        `.trim();
        break;

      case 'updated':
      default:
        subject = `[UPDATE] Escalation: ${escalation.title}`;
        message = `
An escalation has been updated:

ID: ${escalation.id}
Title: ${escalation.title}
Status: ${escalation.status}
Priority: ${escalation.priority}

Please check the latest updates.
        `.trim();
        break;
    }

    return { subject, message };
  }

  // ==========================================
  // NOTIFICATION HISTORY
  // ==========================================

  /**
   * Record notification
   */
  private recordNotification(escalationId: string, result: NotificationResult): void {
    const record: NotificationRecord = {
      id: `notif-${Date.now()}`,
      channel: result.channel,
      recipient: result.recipient,
      sentAt: result.sentAt,
      delivered: result.success,
      error: result.error,
    };

    const records = this.sentNotifications.get(escalationId) || [];
    records.push(record);
    this.sentNotifications.set(escalationId, records);
  }

  /**
   * Get notification history for escalation
   */
  getNotificationHistory(escalationId: string): NotificationRecord[] {
    return this.sentNotifications.get(escalationId) || [];
  }

  /**
   * Get all notification history
   */
  getAllNotificationHistory(): Map<string, NotificationRecord[]> {
    return this.sentNotifications;
  }

  // ==========================================
  // TEMPLATES
  // ==========================================

  /**
   * Format storage overflow notification
   */
  formatStorageOverflowNotification(details: {
    userId: string;
    userName: string;
    usedStorage: number;
    totalStorage: number;
    percentage: number;
  }): string {
    return `
⚠️ Storage Quota Exceeded

User: ${details.userName} (${details.userId})
Used: ${this.formatBytes(details.usedStorage)} / ${this.formatBytes(details.totalStorage)}
Usage: ${details.percentage}%

Action Required: Please free up space or contact IT to increase storage quota.
    `.trim();
  }

  /**
   * Format deadline missed notification
   */
  formatDeadlineMissedNotification(details: {
    documentName: string;
    documentId: string;
    deadline: Date;
    assignedTo: string;
  }): string {
    return `
⏰ Deadline Missed

Document: ${details.documentName}
Document ID: ${details.documentId}
Original Deadline: ${details.deadline.toLocaleString()}
Assigned to: ${details.assignedTo}

This task is now overdue. Please complete it as soon as possible.
    `.trim();
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

