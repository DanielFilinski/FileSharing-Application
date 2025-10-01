/**
 * Multi-Factor Authentication Module
 * Exports all MFA services and types
 */

// Services
export { TOTPService, totpService } from './totpService';
export { OTPService, otpService } from './otpService';
export { MFAManager, mfaManager } from './mfaManager';

// Types
export type {
  MFAMethod,
  MFAStatus,
  MFAConfig,
  UserMFASettings,
  MFAVerificationRequest,
  MFAVerificationResult,
  TOTPSetupData,
  SMSSetupData,
  EmailSetupData,
  OTPRecord,
  BackupCode,
  BackupCodesResult,
  MFASession,
  MFAAuditLog,
  MFAAuditAction,
  QRCodeOptions,
} from './types';

export { MFAError, MFAErrorType, DEFAULT_MFA_CONFIG, DEFAULT_QR_OPTIONS } from './types';

