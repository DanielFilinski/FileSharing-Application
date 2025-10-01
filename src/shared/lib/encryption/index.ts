/**
 * End-to-End Encryption Module
 * Exports all E2EE services and types
 */

// Services
export { E2EECryptoService, e2eeCryptoService } from './e2eeCryptoService';
export { KeyManagementService, keyManagementService } from './keyManagementService';
export { E2EEManager, e2eeManager } from './e2eeManager';
export { KeyRotationService, keyRotationService } from './keyRotationService';

// Types
export type {
  EncryptedMessage,
  UserKeyPair,
  SessionKey,
  StoredKeyInfo,
  PublicKeyInfo,
  EncryptedSessionKey,
  E2EEConfig,
  E2EEStatus,
  DecryptionResult,
  EncryptionResult,
  KeyRotationResult,
  E2EEInitResult,
  KeyUsage,
  KeyGenParams,
} from './types';

export { E2EEError, E2EEErrorType, DEFAULT_E2EE_CONFIG } from './types';

