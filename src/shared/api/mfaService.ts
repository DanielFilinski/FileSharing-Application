/**
 * MFA API Service
 * Frontend service for Multi-Factor Authentication
 */

import { 
  TOTPSetupData, 
  SMSSetupData, 
  EmailSetupData, 
  MFAVerificationResult,
  UserMFASettings,
  BackupCodesResult,
  MFAMethod 
} from '../lib/mfa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ==========================================
// REQUEST/RESPONSE TYPES
// ==========================================

interface SetupTOTPRequest {
  userId: string;
  userEmail: string;
}

interface SetupTOTPResponse extends TOTPSetupData {}

interface VerifySetupRequest {
  userId: string;
  code: string;
}

interface VerifySetupResponse {
  success: boolean;
  verified: boolean;
  error?: string;
}

interface VerifyMFARequest {
  userId: string;
  method: MFAMethod;
  code: string;
  sessionId?: string;
}

interface VerifyMFAResponse extends MFAVerificationResult {}

interface MFASettingsResponse extends Partial<UserMFASettings> {}

// ==========================================
// MFA SERVICE
// ==========================================

export class MFAService {
  /**
   * Setup TOTP for user
   */
  static async setupTOTP(userId: string, userEmail: string): Promise<TOTPSetupData> {
    try {
      const request: SetupTOTPRequest = { userId, userEmail };

      const response = await fetch(`${API_BASE_URL}/mfa/totp/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup TOTP');
      }

      const data: SetupTOTPResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error setting up TOTP:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP setup
   */
  static async verifyTOTPSetup(userId: string, code: string): Promise<boolean> {
    try {
      const request: VerifySetupRequest = { userId, code };

      const response = await fetch(`${API_BASE_URL}/mfa/totp/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify TOTP setup');
      }

      const data: VerifySetupResponse = await response.json();
      return data.verified;
    } catch (error) {
      console.error('Error verifying TOTP setup:', error);
      throw error;
    }
  }

  /**
   * Setup SMS MFA
   */
  static async setupSMS(userId: string, phoneNumber: string): Promise<SMSSetupData> {
    try {
      const request = { userId, phoneNumber };

      const response = await fetch(`${API_BASE_URL}/mfa/sms/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup SMS');
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting up SMS:', error);
      throw error;
    }
  }

  /**
   * Setup Email MFA
   */
  static async setupEmail(userId: string, email: string): Promise<EmailSetupData> {
    try {
      const request = { userId, email };

      const response = await fetch(`${API_BASE_URL}/mfa/email/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup Email');
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting up Email:', error);
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  static async verifyMFA(
    userId: string,
    method: MFAMethod,
    code: string,
    sessionId?: string
  ): Promise<MFAVerificationResult> {
    try {
      const request: VerifyMFARequest = { userId, method, code, sessionId };

      const response = await fetch(`${API_BASE_URL}/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify MFA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying MFA:', error);
      throw error;
    }
  }

  /**
   * Get user's MFA settings
   */
  static async getMFASettings(userId: string): Promise<Partial<UserMFASettings> | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/mfa/settings/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch MFA settings');
      }

      const data: MFASettingsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching MFA settings:', error);
      throw error;
    }
  }

  /**
   * Generate backup codes
   */
  static async generateBackupCodes(userId: string): Promise<BackupCodesResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/mfa/backup-codes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate backup codes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating backup codes:', error);
      throw error;
    }
  }

  /**
   * Disable MFA method
   */
  static async disableMethod(userId: string, method: MFAMethod): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/mfa/method/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, method }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable method');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error disabling method:', error);
      throw error;
    }
  }

  /**
   * Set primary MFA method
   */
  static async setPrimaryMethod(userId: string, method: MFAMethod): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/mfa/method/primary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, method }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set primary method');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error setting primary method:', error);
      throw error;
    }
  }
}

// Export as singleton
export const mfaService = MFAService;

