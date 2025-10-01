/**
 * OTP Service
 * One-Time Password generation and verification for SMS and Email
 */

import {
  MFAConfig,
  DEFAULT_MFA_CONFIG,
  OTPRecord,
  MFAError,
  MFAErrorType,
} from './types';

export class OTPService {
  private config: MFAConfig;
  private activeOTPs: Map<string, OTPRecord> = new Map();

  constructor(config?: Partial<MFAConfig>) {
    this.config = { ...DEFAULT_MFA_CONFIG, ...config };
  }

  // ==========================================
  // OTP GENERATION
  // ==========================================

  /**
   * Generate random OTP code
   */
  generateOTP(length?: number): string {
    const otpLength = length || this.config.otpLength;
    const digits = '0123456789';
    const randomBytes = new Uint8Array(otpLength);
    crypto.getRandomValues(randomBytes);

    let otp = '';
    for (let i = 0; i < otpLength; i++) {
      otp += digits[randomBytes[i] % digits.length];
    }

    return otp;
  }

  /**
   * Create OTP record for user
   */
  async createOTP(
    userId: string,
    method: 'sms' | 'email'
  ): Promise<{ code: string; record: OTPRecord }> {
    try {
      // Generate OTP code
      const code = this.generateOTP();

      // Hash the code for storage
      const hashedCode = await this.hashCode(code);

      // Create record
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.otpExpiry * 1000);

      const record: OTPRecord = {
        id: this.generateRecordId(),
        userId,
        method,
        code: hashedCode,
        expiresAt,
        verified: false,
        attempts: 0,
        createdAt: now,
      };

      // Store record
      this.activeOTPs.set(record.id, record);

      // Schedule cleanup
      setTimeout(() => {
        this.activeOTPs.delete(record.id);
      }, this.config.otpExpiry * 1000);

      return { code, record };
    } catch (error) {
      throw new MFAError(
        MFAErrorType.SEND_FAILED,
        'Failed to create OTP',
        { error }
      );
    }
  }

  // ==========================================
  // OTP VERIFICATION
  // ==========================================

  /**
   * Verify OTP code
   */
  async verifyOTP(
    userId: string,
    code: string,
    method: 'sms' | 'email'
  ): Promise<{
    verified: boolean;
    recordId?: string;
    attemptsRemaining?: number;
    error?: string;
  }> {
    try {
      // Find active OTP for user and method
      const record = this.findActiveOTP(userId, method);

      if (!record) {
        return {
          verified: false,
          error: 'No active OTP found',
        };
      }

      // Check if expired
      if (new Date() > record.expiresAt) {
        this.activeOTPs.delete(record.id);
        return {
          verified: false,
          error: 'OTP expired',
        };
      }

      // Check if already verified
      if (record.verified) {
        return {
          verified: false,
          error: 'OTP already used',
        };
      }

      // Check attempts
      if (record.attempts >= this.config.maxAttempts) {
        this.activeOTPs.delete(record.id);
        return {
          verified: false,
          error: 'Too many attempts',
        };
      }

      // Increment attempts
      record.attempts++;

      // Verify code
      const hashedCode = await this.hashCode(code);
      const isValid = hashedCode === record.code;

      if (isValid) {
        // Mark as verified
        record.verified = true;
        
        // Cleanup after short delay
        setTimeout(() => {
          this.activeOTPs.delete(record.id);
        }, 60000); // Remove after 1 minute

        return {
          verified: true,
          recordId: record.id,
        };
      }

      // Invalid code
      const attemptsRemaining = this.config.maxAttempts - record.attempts;

      return {
        verified: false,
        attemptsRemaining,
        error: 'Invalid code',
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        verified: false,
        error: 'Verification failed',
      };
    }
  }

  // ==========================================
  // OTP MANAGEMENT
  // ==========================================

  /**
   * Find active OTP for user
   */
  private findActiveOTP(userId: string, method: 'sms' | 'email'): OTPRecord | null {
    for (const record of this.activeOTPs.values()) {
      if (
        record.userId === userId &&
        record.method === method &&
        !record.verified &&
        new Date() < record.expiresAt
      ) {
        return record;
      }
    }
    return null;
  }

  /**
   * Invalidate OTP
   */
  invalidateOTP(recordId: string): boolean {
    return this.activeOTPs.delete(recordId);
  }

  /**
   * Invalidate all OTPs for user
   */
  invalidateUserOTPs(userId: string): number {
    let count = 0;
    for (const [id, record] of this.activeOTPs.entries()) {
      if (record.userId === userId) {
        this.activeOTPs.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get OTP record
   */
  getOTPRecord(recordId: string): OTPRecord | null {
    return this.activeOTPs.get(recordId) || null;
  }

  /**
   * Get active OTPs count for user
   */
  getUserOTPsCount(userId: string): number {
    let count = 0;
    for (const record of this.activeOTPs.values()) {
      if (record.userId === userId && !record.verified && new Date() < record.expiresAt) {
        count++;
      }
    }
    return count;
  }

  /**
   * Cleanup expired OTPs
   */
  cleanupExpired(): number {
    let count = 0;
    const now = new Date();

    for (const [id, record] of this.activeOTPs.entries()) {
      if (now > record.expiresAt) {
        this.activeOTPs.delete(id);
        count++;
      }
    }

    return count;
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Hash code for storage
   */
  private async hashCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique record ID
   */
  private generateRecordId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes)
      .map((b) => b.toString(36))
      .join('');
    return `otp_${timestamp}_${random}`;
  }

  /**
   * Format OTP for display
   */
  formatOTP(code: string): string {
    // Add space in the middle for readability
    if (code.length === 6) {
      return `${code.substring(0, 3)} ${code.substring(3, 6)}`;
    }
    return code;
  }

  /**
   * Get OTP statistics
   */
  getStatistics(): {
    totalActive: number;
    byMethod: { sms: number; email: number };
    verified: number;
    expired: number;
  } {
    const now = new Date();
    let smsCount = 0;
    let emailCount = 0;
    let verifiedCount = 0;
    let expiredCount = 0;

    for (const record of this.activeOTPs.values()) {
      if (record.method === 'sms') smsCount++;
      if (record.method === 'email') emailCount++;
      if (record.verified) verifiedCount++;
      if (now > record.expiresAt) expiredCount++;
    }

    return {
      totalActive: this.activeOTPs.size,
      byMethod: { sms: smsCount, email: emailCount },
      verified: verifiedCount,
      expired: expiredCount,
    };
  }

  /**
   * Clear all OTPs (for testing/logout)
   */
  clearAll(): void {
    this.activeOTPs.clear();
  }
}

// Export singleton instance
export const otpService = new OTPService();

