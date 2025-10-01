/**
 * Multi-Factor Authentication Types
 * Type definitions for MFA system
 */

// ==========================================
// MFA METHOD TYPES
// ==========================================

export type MFAMethod = 'totp' | 'sms' | 'email' | 'authenticator' | 'backup_code';

export type MFAStatus = 'disabled' | 'pending_setup' | 'active' | 'locked';

// ==========================================
// MFA CONFIGURATION
// ==========================================

export interface MFAConfig {
  // TOTP settings
  totpIssuer: string; // App name for TOTP (e.g., "FileSharing")
  totpPeriod: number; // Time period in seconds (default: 30)
  totpDigits: number; // Number of digits (default: 6)
  totpAlgorithm: 'SHA1' | 'SHA256' | 'SHA512'; // Hash algorithm
  
  // OTP settings
  otpLength: number; // Length of OTP code (default: 6)
  otpExpiry: number; // Expiry time in seconds (default: 300 = 5 min)
  
  // Security settings
  maxAttempts: number; // Max verification attempts before locking
  lockoutDuration: number; // Lockout duration in seconds
  backupCodesCount: number; // Number of backup codes to generate
  
  // SMS settings
  smsProvider?: 'twilio' | 'azure-communication' | 'custom';
  
  // Email settings
  emailProvider?: 'sendgrid' | 'azure-communication' | 'custom';
}

export const DEFAULT_MFA_CONFIG: MFAConfig = {
  totpIssuer: 'FileSharing',
  totpPeriod: 30,
  totpDigits: 6,
  totpAlgorithm: 'SHA1',
  otpLength: 6,
  otpExpiry: 300,
  maxAttempts: 3,
  lockoutDuration: 900, // 15 minutes
  backupCodesCount: 10,
  smsProvider: 'azure-communication',
  emailProvider: 'azure-communication',
};

// ==========================================
// USER MFA SETTINGS
// ==========================================

export interface UserMFASettings {
  userId: string;
  status: MFAStatus;
  enabledMethods: MFAMethod[];
  primaryMethod?: MFAMethod;
  
  // TOTP settings
  totpEnabled: boolean;
  totpSecret?: string; // Encrypted secret
  totpVerified: boolean;
  totpBackupCodes?: string[]; // Hashed backup codes
  
  // SMS settings
  smsEnabled: boolean;
  phoneNumber?: string; // Encrypted
  phoneVerified: boolean;
  
  // Email settings
  emailEnabled: boolean;
  email?: string;
  emailVerified: boolean;
  
  // Microsoft Authenticator
  authenticatorEnabled: boolean;
  authenticatorDeviceId?: string;
  
  // Security
  failedAttempts: number;
  lockedUntil?: Date;
  lastVerified?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// MFA VERIFICATION
// ==========================================

export interface MFAVerificationRequest {
  userId: string;
  method: MFAMethod;
  code: string;
  sessionId?: string; // For tracking verification session
}

export interface MFAVerificationResult {
  success: boolean;
  verified: boolean;
  error?: string;
  attemptsRemaining?: number;
  lockedUntil?: Date;
  sessionToken?: string; // Token to bypass MFA for this session
}

// ==========================================
// MFA SETUP
// ==========================================

export interface TOTPSetupData {
  secret: string; // Base32 encoded secret
  qrCodeUrl: string; // Data URL for QR code
  manualEntryKey: string; // Formatted secret for manual entry
  backupCodes: string[]; // Plain text backup codes (show only once)
}

export interface SMSSetupData {
  phoneNumber: string;
  verificationCode: string;
  expiresAt: Date;
}

export interface EmailSetupData {
  email: string;
  verificationCode: string;
  expiresAt: Date;
}

// ==========================================
// OTP MANAGEMENT
// ==========================================

export interface OTPRecord {
  id: string;
  userId: string;
  method: 'sms' | 'email';
  code: string; // Hashed
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

// ==========================================
// BACKUP CODES
// ==========================================

export interface BackupCode {
  code: string; // Hashed
  used: boolean;
  usedAt?: Date;
}

export interface BackupCodesResult {
  codes: string[]; // Plain text codes (show only once)
  createdAt: Date;
  userId: string;
}

// ==========================================
// MFA SESSION
// ==========================================

export interface MFASession {
  sessionId: string;
  userId: string;
  method: MFAMethod;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ==========================================
// MFA AUDIT LOG
// ==========================================

export interface MFAAuditLog {
  id: string;
  userId: string;
  action: MFAAuditAction;
  method?: MFAMethod;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export type MFAAuditAction =
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_verified'
  | 'mfa_failed'
  | 'mfa_locked'
  | 'totp_setup'
  | 'sms_setup'
  | 'email_setup'
  | 'backup_code_used'
  | 'backup_codes_regenerated'
  | 'method_changed';

// ==========================================
// ERROR TYPES
// ==========================================

export enum MFAErrorType {
  INVALID_CODE = 'INVALID_CODE',
  EXPIRED_CODE = 'EXPIRED_CODE',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  METHOD_NOT_ENABLED = 'METHOD_NOT_ENABLED',
  SETUP_INCOMPLETE = 'SETUP_INCOMPLETE',
  INVALID_SECRET = 'INVALID_SECRET',
  PHONE_NOT_VERIFIED = 'PHONE_NOT_VERIFIED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  BACKUP_CODE_ALREADY_USED = 'BACKUP_CODE_ALREADY_USED',
  SEND_FAILED = 'SEND_FAILED',
}

export class MFAError extends Error {
  constructor(
    public type: MFAErrorType,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MFAError';
  }
}

// ==========================================
// QR CODE OPTIONS
// ==========================================

export interface QRCodeOptions {
  width: number;
  height: number;
  colorDark: string;
  colorLight: string;
  correctLevel: 'L' | 'M' | 'Q' | 'H';
}

export const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  width: 256,
  height: 256,
  colorDark: '#000000',
  colorLight: '#ffffff',
  correctLevel: 'M',
};

