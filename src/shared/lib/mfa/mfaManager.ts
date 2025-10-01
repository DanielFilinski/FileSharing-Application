/**
 * MFA Manager
 * High-level service for managing Multi-Factor Authentication
 */

import { totpService } from './totpService';
import { otpService } from './otpService';
import {
  UserMFASettings,
  MFAMethod,
  MFAStatus,
  MFAVerificationRequest,
  MFAVerificationResult,
  TOTPSetupData,
  SMSSetupData,
  EmailSetupData,
  BackupCodesResult,
  MFAError,
  MFAErrorType,
  MFAConfig,
  DEFAULT_MFA_CONFIG,
} from './types';

export class MFAManager {
  private config: MFAConfig;
  private userSettings: Map<string, UserMFASettings> = new Map();

  constructor(config?: Partial<MFAConfig>) {
    this.config = { ...DEFAULT_MFA_CONFIG, ...config };
  }

  // ==========================================
  // USER MFA SETTINGS
  // ==========================================

  /**
   * Get user's MFA settings
   */
  async getUserSettings(userId: string): Promise<UserMFASettings | null> {
    // In production, fetch from database
    return this.userSettings.get(userId) || null;
  }

  /**
   * Initialize MFA for user
   */
  async initializeMFA(userId: string): Promise<UserMFASettings> {
    const now = new Date();

    const settings: UserMFASettings = {
      userId,
      status: 'disabled',
      enabledMethods: [],
      
      totpEnabled: false,
      totpVerified: false,
      
      smsEnabled: false,
      phoneVerified: false,
      
      emailEnabled: false,
      emailVerified: false,
      
      authenticatorEnabled: false,
      
      failedAttempts: 0,
      
      createdAt: now,
      updatedAt: now,
    };

    this.userSettings.set(userId, settings);
    return settings;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    userId: string,
    updates: Partial<UserMFASettings>
  ): Promise<UserMFASettings> {
    let settings = await this.getUserSettings(userId);

    if (!settings) {
      settings = await this.initializeMFA(userId);
    }

    Object.assign(settings, updates, { updatedAt: new Date() });
    this.userSettings.set(userId, settings);

    return settings;
  }

  // ==========================================
  // TOTP SETUP
  // ==========================================

  /**
   * Setup TOTP for user
   */
  async setupTOTP(
    userId: string,
    userEmail: string
  ): Promise<TOTPSetupData> {
    try {
      const setupData = await totpService.setupTOTP(
        userId,
        userEmail,
        this.config.totpIssuer
      );

      // Store encrypted secret in user settings
      await this.updateUserSettings(userId, {
        totpSecret: setupData.secret, // In production, encrypt this
        totpVerified: false,
        status: 'pending_setup',
      });

      return setupData;
    } catch (error) {
      throw new MFAError(
        MFAErrorType.SETUP_INCOMPLETE,
        'Failed to setup TOTP',
        { error }
      );
    }
  }

  /**
   * Verify TOTP setup
   */
  async verifyTOTPSetup(userId: string, code: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.totpSecret) {
      throw new MFAError(
        MFAErrorType.SETUP_INCOMPLETE,
        'TOTP not set up'
      );
    }

    const isValid = await totpService.verifyTOTP(settings.totpSecret, code);

    if (isValid) {
      await this.updateUserSettings(userId, {
        totpEnabled: true,
        totpVerified: true,
        status: 'active',
        enabledMethods: [...(settings.enabledMethods || []), 'totp'],
        primaryMethod: 'totp',
      });
    }

    return isValid;
  }

  // ==========================================
  // SMS SETUP
  // ==========================================

  /**
   * Setup SMS MFA
   */
  async setupSMS(
    userId: string,
    phoneNumber: string
  ): Promise<SMSSetupData> {
    try {
      // Generate OTP
      const { code, record } = await otpService.createOTP(userId, 'sms');

      // In production, send SMS via Azure Communication Services or Twilio
      console.log(`SMS OTP for ${phoneNumber}: ${code}`);

      const setupData: SMSSetupData = {
        phoneNumber,
        verificationCode: code,
        expiresAt: record.expiresAt,
      };

      // Store phone number (encrypted in production)
      await this.updateUserSettings(userId, {
        phoneNumber, // In production, encrypt this
        phoneVerified: false,
        status: 'pending_setup',
      });

      return setupData;
    } catch (error) {
      throw new MFAError(
        MFAErrorType.SEND_FAILED,
        'Failed to send SMS',
        { error }
      );
    }
  }

  /**
   * Verify SMS setup
   */
  async verifySMSSetup(userId: string, code: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.phoneNumber) {
      throw new MFAError(
        MFAErrorType.SETUP_INCOMPLETE,
        'SMS not set up'
      );
    }

    const result = await otpService.verifyOTP(userId, code, 'sms');

    if (result.verified) {
      await this.updateUserSettings(userId, {
        smsEnabled: true,
        phoneVerified: true,
        status: 'active',
        enabledMethods: [...(settings.enabledMethods || []), 'sms'],
        primaryMethod: settings.primaryMethod || 'sms',
      });
    }

    return result.verified;
  }

  // ==========================================
  // EMAIL SETUP
  // ==========================================

  /**
   * Setup Email MFA
   */
  async setupEmail(
    userId: string,
    email: string
  ): Promise<EmailSetupData> {
    try {
      // Generate OTP
      const { code, record } = await otpService.createOTP(userId, 'email');

      // In production, send email via Azure Communication Services or SendGrid
      console.log(`Email OTP for ${email}: ${code}`);

      const setupData: EmailSetupData = {
        email,
        verificationCode: code,
        expiresAt: record.expiresAt,
      };

      // Store email
      await this.updateUserSettings(userId, {
        email,
        emailVerified: false,
        status: 'pending_setup',
      });

      return setupData;
    } catch (error) {
      throw new MFAError(
        MFAErrorType.SEND_FAILED,
        'Failed to send email',
        { error }
      );
    }
  }

  /**
   * Verify Email setup
   */
  async verifyEmailSetup(userId: string, code: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.email) {
      throw new MFAError(
        MFAErrorType.SETUP_INCOMPLETE,
        'Email not set up'
      );
    }

    const result = await otpService.verifyOTP(userId, code, 'email');

    if (result.verified) {
      await this.updateUserSettings(userId, {
        emailEnabled: true,
        emailVerified: true,
        status: 'active',
        enabledMethods: [...(settings.enabledMethods || []), 'email'],
        primaryMethod: settings.primaryMethod || 'email',
      });
    }

    return result.verified;
  }

  // ==========================================
  // MFA VERIFICATION
  // ==========================================

  /**
   * Verify MFA code
   */
  async verifyMFA(request: MFAVerificationRequest): Promise<MFAVerificationResult> {
    const settings = await this.getUserSettings(request.userId);

    if (!settings) {
      return {
        success: false,
        verified: false,
        error: 'MFA not configured',
      };
    }

    // Check if account is locked
    if (settings.lockedUntil && new Date() < settings.lockedUntil) {
      return {
        success: false,
        verified: false,
        error: 'Account locked',
        lockedUntil: settings.lockedUntil,
      };
    }

    // Verify based on method
    let verified = false;

    try {
      switch (request.method) {
        case 'totp':
          if (!settings.totpEnabled || !settings.totpSecret) {
            throw new MFAError(MFAErrorType.METHOD_NOT_ENABLED, 'TOTP not enabled');
          }
          verified = await totpService.verifyTOTP(settings.totpSecret, request.code);
          break;

        case 'sms':
          if (!settings.smsEnabled) {
            throw new MFAError(MFAErrorType.METHOD_NOT_ENABLED, 'SMS not enabled');
          }
          const smsResult = await otpService.verifyOTP(request.userId, request.code, 'sms');
          verified = smsResult.verified;
          break;

        case 'email':
          if (!settings.emailEnabled) {
            throw new MFAError(MFAErrorType.METHOD_NOT_ENABLED, 'Email not enabled');
          }
          const emailResult = await otpService.verifyOTP(request.userId, request.code, 'email');
          verified = emailResult.verified;
          break;

        case 'backup_code':
          verified = await this.verifyBackupCode(request.userId, request.code);
          break;

        default:
          throw new MFAError(MFAErrorType.METHOD_NOT_ENABLED, 'Invalid method');
      }

      if (verified) {
        // Reset failed attempts
        await this.updateUserSettings(request.userId, {
          failedAttempts: 0,
          lastVerified: new Date(),
        });

        // Generate session token
        const sessionToken = this.generateSessionToken(request.userId);

        return {
          success: true,
          verified: true,
          sessionToken,
        };
      } else {
        // Increment failed attempts
        const newFailedAttempts = settings.failedAttempts + 1;
        const attemptsRemaining = this.config.maxAttempts - newFailedAttempts;

        // Lock account if too many attempts
        let lockedUntil: Date | undefined;
        if (newFailedAttempts >= this.config.maxAttempts) {
          lockedUntil = new Date(Date.now() + this.config.lockoutDuration * 1000);
          await this.updateUserSettings(request.userId, {
            failedAttempts: newFailedAttempts,
            lockedUntil,
            status: 'locked',
          });
        } else {
          await this.updateUserSettings(request.userId, {
            failedAttempts: newFailedAttempts,
          });
        }

        return {
          success: false,
          verified: false,
          error: 'Invalid code',
          attemptsRemaining,
          lockedUntil,
        };
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        verified: false,
        error: error instanceof MFAError ? error.message : 'Verification failed',
      };
    }
  }

  // ==========================================
  // BACKUP CODES
  // ==========================================

  /**
   * Generate backup codes
   */
  async generateBackupCodes(userId: string): Promise<BackupCodesResult> {
    const codes = totpService['generateBackupCodes']();
    
    // Hash codes for storage
    const hashedCodes = await Promise.all(
      codes.map(async (code) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(code);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      })
    );

    // Store hashed codes
    await this.updateUserSettings(userId, {
      totpBackupCodes: hashedCodes,
    });

    return {
      codes,
      createdAt: new Date(),
      userId,
    };
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.totpBackupCodes) {
      return false;
    }

    // Hash provided code
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashedCode = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Check if code exists and hasn't been used
    const codeIndex = settings.totpBackupCodes.indexOf(hashedCode);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used code
    const updatedCodes = [...settings.totpBackupCodes];
    updatedCodes.splice(codeIndex, 1);

    await this.updateUserSettings(userId, {
      totpBackupCodes: updatedCodes,
    });

    return true;
  }

  // ==========================================
  // METHOD MANAGEMENT
  // ==========================================

  /**
   * Disable MFA method
   */
  async disableMethod(userId: string, method: MFAMethod): Promise<boolean> {
    const settings = await this.getUserSettings(userId);

    if (!settings) {
      return false;
    }

    const updates: Partial<UserMFASettings> = {
      enabledMethods: settings.enabledMethods.filter((m) => m !== method),
    };

    switch (method) {
      case 'totp':
        updates.totpEnabled = false;
        updates.totpSecret = undefined;
        updates.totpVerified = false;
        break;
      case 'sms':
        updates.smsEnabled = false;
        updates.phoneNumber = undefined;
        updates.phoneVerified = false;
        break;
      case 'email':
        updates.emailEnabled = false;
        updates.email = undefined;
        updates.emailVerified = false;
        break;
    }

    // Update status if no methods enabled
    if (updates.enabledMethods?.length === 0) {
      updates.status = 'disabled';
    }

    await this.updateUserSettings(userId, updates);
    return true;
  }

  /**
   * Set primary method
   */
  async setPrimaryMethod(userId: string, method: MFAMethod): Promise<boolean> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.enabledMethods.includes(method)) {
      return false;
    }

    await this.updateUserSettings(userId, {
      primaryMethod: method,
    });

    return true;
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Generate session token
   */
  private generateSessionToken(userId: string): string {
    const timestamp = Date.now();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `mfa_${userId}_${timestamp}_${randomHex}`;
  }

  /**
   * Check if MFA is required for user
   */
  async isMFARequired(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    return settings?.status === 'active' || false;
  }

  /**
   * Check if MFA is enabled for user
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    return settings?.enabledMethods.length > 0 || false;
  }
}

// Export singleton instance
export const mfaManager = new MFAManager();

