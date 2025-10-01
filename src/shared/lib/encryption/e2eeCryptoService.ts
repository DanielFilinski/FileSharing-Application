/**
 * End-to-End Encryption Crypto Service
 * Implements cryptographic operations using Web Crypto API
 * 
 * Algorithm: AES-GCM (256-bit) for message encryption
 * Key Exchange: RSA-OAEP (2048-bit) for session key sharing
 */

import {
  EncryptedMessage,
  UserKeyPair,
  SessionKey,
  E2EEConfig,
  DEFAULT_E2EE_CONFIG,
  E2EEError,
  E2EEErrorType,
  EncryptionResult,
  DecryptionResult,
  E2EEInitResult,
} from './types';

export class E2EECryptoService {
  private config: E2EEConfig;
  private crypto: SubtleCrypto;

  constructor(config?: Partial<E2EEConfig>) {
    // Check browser support
    if (!window.crypto || !window.crypto.subtle) {
      throw new E2EEError(
        E2EEErrorType.BROWSER_NOT_SUPPORTED,
        'Web Crypto API is not supported in this browser'
      );
    }

    this.crypto = window.crypto.subtle;
    this.config = { ...DEFAULT_E2EE_CONFIG, ...config };
  }

  // =====================================================
  // KEY GENERATION
  // =====================================================

  /**
   * Generate RSA key pair for user
   * Used for encrypting/decrypting session keys
   */
  async generateUserKeyPair(): Promise<UserKeyPair> {
    try {
      const keyPair = await this.crypto.generateKey(
        {
          name: this.config.rsaAlgorithm,
          modulusLength: this.config.rsaModulusLength,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: this.config.rsaHashAlgorithm,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Export public key for sharing
      const publicKeyJWK = await this.crypto.exportKey('jwk', keyPair.publicKey);

      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyJWK,
      };
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_GENERATION_FAILED,
        'Failed to generate user key pair',
        error as Error
      );
    }
  }

  /**
   * Generate AES session key for chat thread
   * Used for encrypting/decrypting messages
   */
  async generateSessionKey(): Promise<SessionKey> {
    try {
      const key = await this.crypto.generateKey(
        {
          name: this.config.aesAlgorithm,
          length: this.config.aesKeyLength,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      const keyId = this.generateKeyId();
      const createdAt = new Date();
      const expiresAt = new Date(
        createdAt.getTime() + this.config.sessionKeyRotationDays * 24 * 60 * 60 * 1000
      );

      return {
        key,
        keyId,
        createdAt,
        expiresAt,
      };
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_GENERATION_FAILED,
        'Failed to generate session key',
        error as Error
      );
    }
  }

  // =====================================================
  // ENCRYPTION / DECRYPTION
  // =====================================================

  /**
   * Encrypt message with session key
   */
  async encryptMessage(plaintext: string, sessionKey: CryptoKey): Promise<EncryptionResult> {
    try {
      // Convert string to bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Generate random IV (Initialization Vector)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encrypted = await this.crypto.encrypt(
        {
          name: this.config.aesAlgorithm,
          iv,
        },
        sessionKey,
        data
      );

      // Convert to base64 for storage/transmission
      const ciphertext = this.arrayBufferToBase64(encrypted);
      const ivBase64 = this.arrayBufferToBase64(iv);

      const encryptedMessage: EncryptedMessage = {
        ciphertext,
        iv: ivBase64,
        version: 1,
        algorithm: this.config.aesAlgorithm,
      };

      return {
        success: true,
        encrypted: encryptedMessage,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
      };
    }
  }

  /**
   * Decrypt message with session key
   */
  async decryptMessage(
    encrypted: EncryptedMessage,
    sessionKey: CryptoKey
  ): Promise<DecryptionResult> {
    try {
      // Convert base64 to ArrayBuffer
      const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);
      const iv = this.base64ToArrayBuffer(encrypted.iv);

      // Decrypt
      const decrypted = await this.crypto.decrypt(
        {
          name: encrypted.algorithm,
          iv,
        },
        sessionKey,
        ciphertext
      );

      // Convert bytes to string
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decrypted);

      return {
        success: true,
        plaintext,
      };
    } catch (error) {
      console.error('Decryption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  // =====================================================
  // KEY EXCHANGE
  // =====================================================

  /**
   * Encrypt session key with recipient's public key
   * Used to share session key with other chat participants
   */
  async encryptSessionKey(
    sessionKey: CryptoKey,
    recipientPublicKey: CryptoKey
  ): Promise<string> {
    try {
      // Export session key
      const sessionKeyRaw = await this.crypto.exportKey('raw', sessionKey);

      // Encrypt with recipient's public key
      const encrypted = await this.crypto.encrypt(
        {
          name: this.config.rsaAlgorithm,
        },
        recipientPublicKey,
        sessionKeyRaw
      );

      return this.arrayBufferToBase64(encrypted);
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.ENCRYPTION_FAILED,
        'Failed to encrypt session key',
        error as Error
      );
    }
  }

  /**
   * Decrypt session key with user's private key
   */
  async decryptSessionKey(
    encryptedSessionKey: string,
    privateKey: CryptoKey
  ): Promise<CryptoKey> {
    try {
      // Convert base64 to ArrayBuffer
      const encrypted = this.base64ToArrayBuffer(encryptedSessionKey);

      // Decrypt with private key
      const decrypted = await this.crypto.decrypt(
        {
          name: this.config.rsaAlgorithm,
        },
        privateKey,
        encrypted
      );

      // Import as AES key
      const sessionKey = await this.crypto.importKey(
        'raw',
        decrypted,
        {
          name: this.config.aesAlgorithm,
          length: this.config.aesKeyLength,
        },
        true,
        ['encrypt', 'decrypt']
      );

      return sessionKey;
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.DECRYPTION_FAILED,
        'Failed to decrypt session key',
        error as Error
      );
    }
  }

  // =====================================================
  // KEY IMPORT / EXPORT
  // =====================================================

  /**
   * Export key to JWK format for storage
   */
  async exportKey(key: CryptoKey): Promise<JsonWebKey> {
    try {
      return await this.crypto.exportKey('jwk', key);
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_STORAGE_FAILED,
        'Failed to export key',
        error as Error
      );
    }
  }

  /**
   * Import public key from JWK
   */
  async importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    try {
      return await this.crypto.importKey(
        'jwk',
        jwk,
        {
          name: this.config.rsaAlgorithm,
          hash: this.config.rsaHashAlgorithm,
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.INVALID_KEY_FORMAT,
        'Failed to import public key',
        error as Error
      );
    }
  }

  /**
   * Import private key from JWK
   */
  async importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
    try {
      return await this.crypto.importKey(
        'jwk',
        jwk,
        {
          name: this.config.rsaAlgorithm,
          hash: this.config.rsaHashAlgorithm,
        },
        true,
        ['decrypt']
      );
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.INVALID_KEY_FORMAT,
        'Failed to import private key',
        error as Error
      );
    }
  }

  /**
   * Import session key from JWK
   */
  async importSessionKey(jwk: JsonWebKey): Promise<CryptoKey> {
    try {
      return await this.crypto.importKey(
        'jwk',
        jwk,
        {
          name: this.config.aesAlgorithm,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.INVALID_KEY_FORMAT,
        'Failed to import session key',
        error as Error
      );
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Check if E2EE is supported
   */
  static isSupported(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * Get browser crypto capabilities
   */
  static async checkCapabilities(): Promise<{
    supported: boolean;
    algorithms: string[];
    features: string[];
  }> {
    if (!E2EECryptoService.isSupported()) {
      return {
        supported: false,
        algorithms: [],
        features: [],
      };
    }

    const algorithms: string[] = [];
    const features: string[] = [];

    // Check AES-GCM support
    try {
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      if (key) algorithms.push('AES-GCM-256');
    } catch (e) {
      // Not supported
    }

    // Check RSA-OAEP support
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        false,
        ['encrypt', 'decrypt']
      );
      if (keyPair) algorithms.push('RSA-OAEP-2048');
    } catch (e) {
      // Not supported
    }

    // Check features
    if (typeof indexedDB !== 'undefined') features.push('IndexedDB');
    if (typeof localStorage !== 'undefined') features.push('LocalStorage');

    return {
      supported: algorithms.length > 0,
      algorithms,
      features,
    };
  }
}

// Export singleton instance
export const e2eeCryptoService = new E2EECryptoService();

