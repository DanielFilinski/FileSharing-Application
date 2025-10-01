/**
 * TOTP Service
 * Time-based One-Time Password implementation
 * Based on RFC 6238
 */

import {
  TOTPSetupData,
  MFAConfig,
  DEFAULT_MFA_CONFIG,
  MFAError,
  MFAErrorType,
  QRCodeOptions,
  DEFAULT_QR_OPTIONS,
} from './types';

export class TOTPService {
  private config: MFAConfig;

  constructor(config?: Partial<MFAConfig>) {
    this.config = { ...DEFAULT_MFA_CONFIG, ...config };
  }

  // ==========================================
  // SECRET GENERATION
  // ==========================================

  /**
   * Generate random secret for TOTP
   * Returns base32 encoded secret
   */
  generateSecret(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 charset
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += charset[randomBytes[i] % charset.length];
    }

    return secret;
  }

  // ==========================================
  // TOTP GENERATION
  // ==========================================

  /**
   * Generate TOTP code from secret
   */
  async generateTOTP(secret: string, timestamp?: number): Promise<string> {
    try {
      // Decode base32 secret
      const key = this.base32Decode(secret);

      // Calculate time counter
      const time = timestamp || Date.now();
      const counter = Math.floor(time / 1000 / this.config.totpPeriod);

      // Generate HMAC
      const hmac = await this.generateHMAC(key, counter);

      // Dynamic truncation
      const code = this.dynamicTruncate(hmac);

      // Format to required digits
      return code.toString().padStart(this.config.totpDigits, '0');
    } catch (error) {
      throw new MFAError(
        MFAErrorType.INVALID_SECRET,
        'Failed to generate TOTP',
        { error }
      );
    }
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTP(
    secret: string,
    code: string,
    window: number = 1
  ): Promise<boolean> {
    try {
      const now = Date.now();

      // Check current time window and adjacent windows
      for (let i = -window; i <= window; i++) {
        const timestamp = now + i * this.config.totpPeriod * 1000;
        const expectedCode = await this.generateTOTP(secret, timestamp);

        if (code === expectedCode) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  // ==========================================
  // SETUP
  // ==========================================

  /**
   * Generate TOTP setup data including QR code
   */
  async setupTOTP(
    userId: string,
    userEmail: string,
    issuer?: string
  ): Promise<TOTPSetupData> {
    try {
      // Generate secret
      const secret = this.generateSecret();

      // Create otpauth URL
      const otpauthUrl = this.generateOTPAuthUrl(
        userId,
        userEmail,
        secret,
        issuer || this.config.totpIssuer
      );

      // Generate QR code
      const qrCodeUrl = await this.generateQRCode(otpauthUrl);

      // Format secret for manual entry (add spaces every 4 chars)
      const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      return {
        secret,
        qrCodeUrl,
        manualEntryKey,
        backupCodes,
      };
    } catch (error) {
      throw new MFAError(
        MFAErrorType.SETUP_INCOMPLETE,
        'Failed to setup TOTP',
        { error }
      );
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Generate OTPAuth URL for QR code
   */
  private generateOTPAuthUrl(
    userId: string,
    userEmail: string,
    secret: string,
    issuer: string
  ): string {
    const label = encodeURIComponent(`${issuer}:${userEmail}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: this.config.totpAlgorithm,
      digits: this.config.totpDigits.toString(),
      period: this.config.totpPeriod.toString(),
    });

    return `otpauth://totp/${label}?${params.toString()}`;
  }

  /**
   * Generate QR code from URL
   */
  private async generateQRCode(
    url: string,
    options: QRCodeOptions = DEFAULT_QR_OPTIONS
  ): Promise<string> {
    // Use QRCode.js or similar library
    // For now, return a placeholder that can be replaced with actual QR code generation
    
    // In production, use a library like 'qrcode' or 'qrcode-generator'
    // Example: import QRCode from 'qrcode';
    // return await QRCode.toDataURL(url, options);

    // Placeholder implementation
    return `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}">
        <text x="50%" y="50%" text-anchor="middle" font-family="monospace" font-size="12">
          QR Code: ${url.substring(0, 30)}...
        </text>
      </svg>`
    )}`;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < this.config.backupCodesCount; i++) {
      let code = '';
      const randomBytes = new Uint8Array(8);
      crypto.getRandomValues(randomBytes);

      for (let j = 0; j < 8; j++) {
        code += charset[randomBytes[j] % charset.length];
      }

      // Format as XXXX-XXXX
      codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
    }

    return codes;
  }

  /**
   * Generate HMAC
   */
  private async generateHMAC(key: Uint8Array, counter: number): Promise<Uint8Array> {
    // Convert counter to 8-byte array (big-endian)
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(4, counter, false); // Big-endian

    // Import key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: this.config.totpAlgorithm },
      false,
      ['sign']
    );

    // Generate HMAC
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);

    return new Uint8Array(signature);
  }

  /**
   * Dynamic truncation (RFC 4226)
   */
  private dynamicTruncate(hmac: Uint8Array): number {
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return binary % Math.pow(10, this.config.totpDigits);
  }

  /**
   * Decode base32 string to bytes
   */
  private base32Decode(base32: string): Uint8Array {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    base32 = base32.toUpperCase().replace(/=+$/, '');

    let bits = '';
    for (let i = 0; i < base32.length; i++) {
      const val = charset.indexOf(base32[i]);
      if (val === -1) {
        throw new Error('Invalid base32 character');
      }
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }

    return bytes;
  }

  /**
   * Get remaining time in current TOTP period
   */
  getRemainingTime(): number {
    const now = Math.floor(Date.now() / 1000);
    const remaining = this.config.totpPeriod - (now % this.config.totpPeriod);
    return remaining;
  }

  /**
   * Validate secret format
   */
  isValidSecret(secret: string): boolean {
    const base32Regex = /^[A-Z2-7]+=*$/;
    return base32Regex.test(secret) && secret.length >= 16;
  }
}

// Export singleton instance
export const totpService = new TOTPService();

