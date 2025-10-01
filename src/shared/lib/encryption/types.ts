/**
 * End-to-End Encryption Types
 * Type definitions for E2EE cryptographic operations
 */

/**
 * Encrypted message structure
 */
export interface EncryptedMessage {
  ciphertext: string; // Base64 encoded encrypted content
  iv: string; // Base64 encoded initialization vector
  version: number; // Encryption version for future compatibility
  algorithm: 'AES-GCM'; // Encryption algorithm used
}

/**
 * User key pair for E2EE
 */
export interface UserKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyJWK?: JsonWebKey; // For storage/transmission
}

/**
 * Session key for a chat thread
 */
export interface SessionKey {
  key: CryptoKey;
  keyId: string; // Unique identifier for this key
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Stored key information (for IndexedDB)
 */
export interface StoredKeyInfo {
  keyId: string;
  keyJWK: JsonWebKey;
  type: 'session' | 'user-public' | 'user-private';
  userId?: string;
  chatId?: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Public key information for exchange
 */
export interface PublicKeyInfo {
  userId: string;
  publicKeyJWK: JsonWebKey;
  keyId: string;
  createdAt: string;
}

/**
 * Encrypted session key for sharing
 */
export interface EncryptedSessionKey {
  encryptedKey: string; // Base64 encoded encrypted session key
  recipientUserId: string;
  keyId: string;
  algorithm: 'RSA-OAEP';
}

/**
 * E2EE configuration options
 */
export interface E2EEConfig {
  // AES-GCM configuration
  aesKeyLength: 256;
  aesAlgorithm: 'AES-GCM';
  
  // RSA-OAEP configuration
  rsaModulusLength: 2048 | 4096;
  rsaAlgorithm: 'RSA-OAEP';
  rsaHashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  
  // Key rotation
  sessionKeyRotationDays: number; // Default: 30
  userKeyRotationDays: number; // Default: 365
  
  // Storage
  useIndexedDB: boolean;
  storagePrefix: string;
}

/**
 * E2EE status for a chat
 */
export interface E2EEStatus {
  enabled: boolean;
  chatId: string;
  sessionKeyId?: string;
  participantKeys: Map<string, PublicKeyInfo>;
  lastKeyRotation?: Date;
  nextKeyRotation?: Date;
}

/**
 * Decryption result
 */
export interface DecryptionResult {
  success: boolean;
  plaintext?: string;
  error?: string;
  keyId?: string;
}

/**
 * Encryption result
 */
export interface EncryptionResult {
  success: boolean;
  encrypted?: EncryptedMessage;
  error?: string;
  keyId?: string;
}

/**
 * Key rotation result
 */
export interface KeyRotationResult {
  success: boolean;
  oldKeyId: string;
  newKeyId: string;
  rotatedAt: Date;
  messagesReEncrypted?: number;
  error?: string;
}

/**
 * E2EE initialization result
 */
export interface E2EEInitResult {
  success: boolean;
  userId: string;
  publicKeyJWK: JsonWebKey;
  keyId: string;
  error?: string;
}

/**
 * Crypto key usage types
 */
export type KeyUsage = 
  | 'encrypt'
  | 'decrypt'
  | 'sign'
  | 'verify'
  | 'deriveKey'
  | 'deriveBits'
  | 'wrapKey'
  | 'unwrapKey';

/**
 * Algorithm parameters for key generation
 */
export interface KeyGenParams {
  algorithm: RsaHashedKeyGenParams | AesKeyGenParams;
  extractable: boolean;
  usages: KeyUsage[];
}

/**
 * Error types for E2EE operations
 */
export enum E2EEErrorType {
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  KEY_GENERATION_FAILED = 'KEY_GENERATION_FAILED',
  KEY_STORAGE_FAILED = 'KEY_STORAGE_FAILED',
  KEY_RETRIEVAL_FAILED = 'KEY_RETRIEVAL_FAILED',
  INVALID_KEY_FORMAT = 'INVALID_KEY_FORMAT',
  UNSUPPORTED_ALGORITHM = 'UNSUPPORTED_ALGORITHM',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
}

/**
 * E2EE Error class
 */
export class E2EEError extends Error {
  constructor(
    public type: E2EEErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'E2EEError';
  }
}

/**
 * Default E2EE configuration
 */
export const DEFAULT_E2EE_CONFIG: E2EEConfig = {
  aesKeyLength: 256,
  aesAlgorithm: 'AES-GCM',
  rsaModulusLength: 2048,
  rsaAlgorithm: 'RSA-OAEP',
  rsaHashAlgorithm: 'SHA-256',
  sessionKeyRotationDays: 30,
  userKeyRotationDays: 365,
  useIndexedDB: true,
  storagePrefix: 'e2ee_',
};

