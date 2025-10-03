/**
 * Document Status Validator
 * ⚠️ CRITICAL COMPONENT: Ensures only "Awaiting Signing" documents can be signed
 */

import { DocumentStatus } from '@/shared/types/signature';

export class DocumentStatusValidator {
  // ⚠️ CRITICAL: Only this status allows signing
  private static readonly SIGNABLE_STATUS: DocumentStatus = 'Awaiting Signing';

  /**
   * ⚠️ CRITICAL VALIDATION
   * Checks if document can be signed based on status
   */
  static canDocumentBeSigned(documentStatus: DocumentStatus): boolean {
    return documentStatus === this.SIGNABLE_STATUS;
  }

  /**
   * Comprehensive signature eligibility check
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
    // Check if signature is required
    if (!document.signatureRequired) {
      return {
        eligible: false,
        reason: 'Document does not require signature'
      };
    }

    // ⚠️ CRITICAL CHECK: Status must be "Awaiting Signing"
    if (!this.canDocumentBeSigned(document.status)) {
      return {
        eligible: false,
        reason: `Document status must be "${this.SIGNABLE_STATUS}", current status: "${document.status}"`
      };
    }

    // Check if signature request has expired (optional timeout)
    if (document.awaitingSignatureSince) {
      const daysSince = this.getDaysSince(document.awaitingSignatureSince);
      if (daysSince > 90) { // 90 days maximum
        return {
          eligible: false,
          reason: 'Signature request has expired (>90 days since awaiting signature)'
        };
      }
    }

    return { eligible: true };
  }

  /**
   * Get user-friendly error message for invalid status
   */
  static getStatusErrorMessage(currentStatus: DocumentStatus): string {
    return `Cannot sign document with status "${currentStatus}". Document must have status "Awaiting Signing".`;
  }

  /**
   * Get detailed status information
   */
  static getStatusInfo(status: DocumentStatus): {
    canSign: boolean;
    description: string;
    nextActions: string[];
  } {
    const statusInfo: Record<DocumentStatus, any> = {
      'draft': {
        canSign: false,
        description: 'Document is in draft state',
        nextActions: ['Complete document', 'Submit for review']
      },
      'in_review': {
        canSign: false,
        description: 'Document is under review',
        nextActions: ['Wait for review completion', 'Contact reviewer']
      },
      'approved': {
        canSign: false,
        description: 'Document is approved but not ready for signing',
        nextActions: ['Change status to "Awaiting Signing"']
      },
      'Awaiting Signing': {
        canSign: true,
        description: 'Document is ready for signature',
        nextActions: ['Sign document', 'Send for signature']
      },
      'signed': {
        canSign: false,
        description: 'Document has been signed',
        nextActions: ['View signed document', 'Download final version']
      },
      'completed': {
        canSign: false,
        description: 'Document workflow is complete',
        nextActions: ['Archive document', 'Start new workflow']
      },
      'rejected': {
        canSign: false,
        description: 'Document has been rejected',
        nextActions: ['Review rejection reasons', 'Revise document']
      },
      'archived': {
        canSign: false,
        description: 'Document is archived',
        nextActions: ['Restore from archive if needed']
      },
      'in_signature_process': {
        canSign: false,
        description: 'Document is currently being signed',
        nextActions: ['Wait for signature completion', 'Check signature status']
      },
      'signature_declined': {
        canSign: false,
        description: 'Signature was declined',
        nextActions: ['Review decline reason', 'Restart signature process']
      },
      'signature_expired': {
        canSign: false,
        description: 'Signature request has expired',
        nextActions: ['Create new signature request']
      },
      'pending_validation': {
        canSign: false,
        description: 'Signed document pending validation',
        nextActions: ['Wait for validation', 'Contact administrator']
      }
    };

    return statusInfo[status] || {
      canSign: false,
      description: 'Unknown status',
      nextActions: ['Contact system administrator']
    };
  }

  /**
   * Check if status transition is valid
   */
  static isValidStatusTransition(
    fromStatus: DocumentStatus,
    toStatus: DocumentStatus
  ): boolean {
    const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
      'draft': ['in_review', 'approved', 'Awaiting Signing'],
      'in_review': ['approved', 'rejected', 'draft'],
      'approved': ['Awaiting Signing', 'in_review'],
      'Awaiting Signing': ['in_signature_process', 'signed', 'draft'],
      'in_signature_process': ['signed', 'signature_declined', 'signature_expired'],
      'signed': ['completed', 'pending_validation'],
      'signature_declined': ['Awaiting Signing', 'draft'],
      'signature_expired': ['Awaiting Signing', 'draft'],
      'pending_validation': ['signed', 'rejected'],
      'completed': ['archived'],
      'rejected': ['draft', 'in_review'],
      'archived': ['draft'] // Can restore from archive
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Get all statuses that can transition to "Awaiting Signing"
   */
  static getStatusesCanTransitionToSigning(): DocumentStatus[] {
    return ['draft', 'approved', 'signature_declined', 'signature_expired'];
  }

  /**
   * Calculate days since a date string
   */
  private static getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate multiple documents for batch operations
   */
  static validateBatchSignatureEligibility(
    documents: Array<{
      id: string;
      status: DocumentStatus;
      signatureRequired: boolean;
      name: string;
    }>
  ): {
    eligible: Array<{ id: string; name: string }>;
    ineligible: Array<{ id: string; name: string; reason: string }>;
  } {
    const eligible: Array<{ id: string; name: string }> = [];
    const ineligible: Array<{ id: string; name: string; reason: string }> = [];

    documents.forEach(doc => {
      const validation = this.validateSignatureEligibility(doc);
      
      if (validation.eligible) {
        eligible.push({ id: doc.id, name: doc.name });
      } else {
        ineligible.push({
          id: doc.id,
          name: doc.name,
          reason: validation.reason || 'Unknown error'
        });
      }
    });

    return { eligible, ineligible };
  }
}

