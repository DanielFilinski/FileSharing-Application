/**
 * Signature Permission Checker
 * Validates user permissions for signing documents
 */

import { SignatureType, SignaturePermissionCheck, OrganizationSignatureSettingsExtended } from '@/shared/types/signature';
import { DocumentStatusValidator } from './documentStatusValidator';

export class SignaturePermissionChecker {
  /**
   * Comprehensive permission check for document signing
   */
  static async checkPermissions(params: {
    userId: string;
    document: {
      id: string;
      status: string;
      signatureRequired: boolean;
      awaitingSignatureSince?: string;
      organizationId: string;
    };
    signatureType: SignatureType;
    settings: OrganizationSignatureSettingsExtended;
    hasAdobeCredentials?: boolean;
  }): Promise<SignaturePermissionCheck> {
    const reasons: string[] = [];
    let canSign = true;

    // 1. ⚠️ CRITICAL CHECK: Document status validation
    const statusCheck = DocumentStatusValidator.validateSignatureEligibility(params.document);
    const documentStatusValid = statusCheck.eligible;
    
    if (!documentStatusValid) {
      canSign = false;
      reasons.push(statusCheck.reason || 'Invalid document status');
    }

    // 2. Check if signature type is enabled for organization
    let isEnabled = false;
    let isAuthorizedSigner = false;
    
    if (params.signatureType === 'manual') {
      isEnabled = params.settings.manualSignature.enabled;
      isAuthorizedSigner = params.settings.manualSignature.authorizedSigners.includes(params.userId);
      
      if (!isEnabled) {
        canSign = false;
        reasons.push('Manual signature is disabled for this organization');
      }
    } else if (params.signatureType === 'adobe-sign') {
      isEnabled = params.settings.eSignature.enabled;
      isAuthorizedSigner = params.settings.eSignature.authorizedSigners.includes(params.userId);
      
      if (!isEnabled) {
        canSign = false;
        reasons.push('E-Signature is disabled for this organization');
      }
    }

    // 3. Check if user is in authorized signers list
    if (!isAuthorizedSigner) {
      canSign = false;
      reasons.push(`User is not in authorized signers list for ${params.signatureType}`);
    }

    // 4. Adobe Sign specific checks
    let hasValidCredentials = true;
    if (params.signatureType === 'adobe-sign') {
      if (params.hasAdobeCredentials === false) {
        canSign = false;
        hasValidCredentials = false;
        reasons.push('Adobe Sign credentials not configured or expired');
      }
    }

    // 5. Check global signature settings
    if (params.settings.requireStatusAwaitingSigning && params.document.status !== 'Awaiting Signing') {
      canSign = false;
      reasons.push('Organization requires documents to have "Awaiting Signing" status before signing');
    }

    // 6. Check allowed document types (if configured)
    if (params.settings.allowedDocumentTypes && params.settings.allowedDocumentTypes.length > 0) {
      // This would require document type information - placeholder for now
      // const documentType = getDocumentType(params.document);
      // if (!params.settings.allowedDocumentTypes.includes(documentType)) {
      //   canSign = false;
      //   reasons.push(`Document type not allowed for signing`);
      // }
    }

    return {
      canSign,
      reasons,
      signatureType: params.signatureType,
      isAuthorizedSigner,
      documentStatusValid,
      hasValidCredentials
    };
  }

  /**
   * Quick check: Can user use specific signature method?
   */
  static canUseSignatureMethod(
    userId: string,
    signatureType: SignatureType,
    settings: OrganizationSignatureSettingsExtended
  ): boolean {
    if (signatureType === 'manual') {
      return (
        settings.manualSignature.enabled &&
        settings.manualSignature.authorizedSigners.includes(userId)
      );
    }

    if (signatureType === 'adobe-sign') {
      return (
        settings.eSignature.enabled &&
        settings.eSignature.authorizedSigners.includes(userId)
      );
    }

    return false;
  }

  /**
   * Get available signature methods for user
   */
  static getAvailableSignatureMethods(
    userId: string,
    settings: OrganizationSignatureSettingsExtended,
    hasAdobeCredentials: boolean = false
  ): Array<{
    type: SignatureType;
    enabled: boolean;
    authorized: boolean;
    available: boolean;
    reason?: string;
  }> {
    return [
      {
        type: 'manual',
        enabled: settings.manualSignature.enabled,
        authorized: settings.manualSignature.authorizedSigners.includes(userId),
        available: settings.manualSignature.enabled && 
                  settings.manualSignature.authorizedSigners.includes(userId),
        reason: !settings.manualSignature.enabled 
          ? 'Manual signature disabled' 
          : !settings.manualSignature.authorizedSigners.includes(userId)
          ? 'Not authorized for manual signature'
          : undefined
      },
      {
        type: 'adobe-sign',
        enabled: settings.eSignature.enabled,
        authorized: settings.eSignature.authorizedSigners.includes(userId),
        available: settings.eSignature.enabled && 
                  settings.eSignature.authorizedSigners.includes(userId) &&
                  hasAdobeCredentials,
        reason: !settings.eSignature.enabled 
          ? 'E-signature disabled'
          : !settings.eSignature.authorizedSigners.includes(userId)
          ? 'Not authorized for e-signature'
          : !hasAdobeCredentials
          ? 'Adobe Sign credentials not configured'
          : undefined
      }
    ];
  }

  /**
   * Validate signature settings
   */
  static validateSignatureSettings(
    settings: OrganizationSignatureSettingsExtended
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if at least one signature method is enabled
    if (!settings.manualSignature.enabled && !settings.eSignature.enabled) {
      errors.push('At least one signature method must be enabled');
    }

    // Validate manual signature settings
    if (settings.manualSignature.enabled) {
      if (settings.manualSignature.authorizedSigners.length === 0) {
        warnings.push('No authorized signers configured for manual signature');
      }
      
      if (settings.manualSignature.validationPeriodDays < 1 || settings.manualSignature.validationPeriodDays > 365) {
        errors.push('Manual signature validation period must be between 1 and 365 days');
      }
      
      if (settings.manualSignature.maxFileSizeMB < 1 || settings.manualSignature.maxFileSizeMB > 100) {
        errors.push('Manual signature file size limit must be between 1 and 100 MB');
      }
      
      if (settings.manualSignature.allowedFormats.length === 0) {
        errors.push('At least one file format must be allowed for manual signature');
      }
    }

    // Validate e-signature settings
    if (settings.eSignature.enabled) {
      if (settings.eSignature.authorizedSigners.length === 0) {
        warnings.push('No authorized signers configured for e-signature');
      }
      
      if (settings.eSignature.defaultExpirationDays < 1 || settings.eSignature.defaultExpirationDays > 365) {
        errors.push('E-signature expiration period must be between 1 and 365 days');
      }
      
      if (settings.eSignature.autoReminderDays < 1 || settings.eSignature.autoReminderDays > 30) {
        errors.push('E-signature reminder interval must be between 1 and 30 days');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check rate limiting for signature operations
   */
  static checkRateLimit(
    userId: string,
    signatureType: SignatureType,
    recentAttempts: number,
    windowMinutes: number = 60
  ): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime: Date;
  } {
    const limits: Record<SignatureType, number> = {
      'manual': 10,      // 10 manual uploads per hour
      'adobe-sign': 5    // 5 Adobe Sign requests per hour
    };

    const limit = limits[signatureType] || 5;
    const allowed = recentAttempts < limit;
    const remainingAttempts = Math.max(0, limit - recentAttempts);
    const resetTime = new Date(Date.now() + windowMinutes * 60 * 1000);

    return {
      allowed,
      remainingAttempts,
      resetTime
    };
  }

  /**
   * Generate permission summary for UI display
   */
  static generatePermissionSummary(
    check: SignaturePermissionCheck
  ): {
    status: 'allowed' | 'denied' | 'warning';
    title: string;
    message: string;
    actions: string[];
  } {
    if (check.canSign) {
      return {
        status: 'allowed',
        title: 'Ready to Sign',
        message: `You can sign this document using ${check.signatureType}`,
        actions: ['Sign Document']
      };
    }

    const primaryReason = check.reasons[0] || 'Unknown error';
    let actions: string[] = [];

    if (!check.documentStatusValid) {
      actions.push('Change document status to "Awaiting Signing"');
    }

    if (!check.isAuthorizedSigner) {
      actions.push('Contact administrator to add you as authorized signer');
    }

    if (check.signatureType === 'adobe-sign' && !check.hasValidCredentials) {
      actions.push('Configure Adobe Sign credentials');
    }

    return {
      status: 'denied',
      title: 'Cannot Sign Document',
      message: primaryReason,
      actions
    };
  }
}

