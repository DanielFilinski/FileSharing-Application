/**
 * E2EE Manager
 * High-level service for managing end-to-end encryption in chat
 * Coordinates crypto operations and key management
 */

import { e2eeCryptoService } from './e2eeCryptoService';
import { keyManagementService } from './keyManagementService';
import {
  E2EEStatus,
  EncryptedMessage,
  PublicKeyInfo,
  E2EEError,
  E2EEErrorType,
  E2EEInitResult,
  EncryptionResult,
  DecryptionResult,
  SessionKey,
  EncryptedSessionKey,
} from './types';

export class E2EEManager {
  private currentUserId: string | null = null;
  private activeChats: Map<string, E2EEStatus> = new Map();

  // =====================================================
  // INITIALIZATION
  // =====================================================

  /**
   * Initialize E2EE for current user
   * Generates or retrieves user key pair
   */
  async initializeForUser(userId: string): Promise<E2EEInitResult> {
    try {
      this.currentUserId = userId;

      // Check if user already has keys
      let keyPair = await keyManagementService.getUserKeys(userId);

      if (!keyPair) {
        // Generate new key pair
        console.log(`Generating new key pair for user ${userId}`);
        keyPair = await e2eeCryptoService.generateUserKeyPair();
        await keyManagementService.storeUserKeys(userId, keyPair);
      }

      if (!keyPair.publicKeyJWK) {
        throw new Error('Public key JWK not available');
      }

      return {
        success: true,
        userId,
        publicKeyJWK: keyPair.publicKeyJWK,
        keyId: `user_${userId}_${Date.now()}`,
      };
    } catch (error) {
      console.error('Failed to initialize E2EE:', error);
      return {
        success: false,
        userId,
        publicKeyJWK: {},
        keyId: '',
        error: error instanceof Error ? error.message : 'Initialization failed',
      };
    }
  }

  /**
   * Enable E2EE for a chat thread
   */
  async enableForChat(chatId: string, participantUserIds: string[]): Promise<E2EEStatus> {
    if (!this.currentUserId) {
      throw new E2EEError(
        E2EEErrorType.KEY_NOT_FOUND,
        'User not initialized. Call initializeForUser first.'
      );
    }

    try {
      // Check if chat already has E2EE enabled
      if (this.activeChats.has(chatId)) {
        return this.activeChats.get(chatId)!;
      }

      // Generate session key for this chat
      const sessionKey = await e2eeCryptoService.generateSessionKey();
      await keyManagementService.storeSessionKey(chatId, sessionKey);

      // Fetch public keys for all participants
      const participantKeys = new Map<string, PublicKeyInfo>();
      for (const userId of participantUserIds) {
        // In production, fetch from API
        // For now, we'll mark as pending
        console.log(`Need to fetch public key for user ${userId}`);
      }

      const status: E2EEStatus = {
        enabled: true,
        chatId,
        sessionKeyId: sessionKey.keyId,
        participantKeys,
        lastKeyRotation: new Date(),
        nextKeyRotation: sessionKey.expiresAt,
      };

      this.activeChats.set(chatId, status);
      return status;
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_GENERATION_FAILED,
        `Failed to enable E2EE for chat ${chatId}`,
        error as Error
      );
    }
  }

  /**
   * Disable E2EE for a chat
   */
  async disableForChat(chatId: string): Promise<void> {
    this.activeChats.delete(chatId);
    // Note: We don't delete the session key from storage
    // to allow decryption of old messages
  }

  // =====================================================
  // MESSAGE ENCRYPTION / DECRYPTION
  // =====================================================

  /**
   * Encrypt a message for a chat
   */
  async encryptMessage(chatId: string, plaintext: string): Promise<EncryptionResult> {
    try {
      // Get session key for this chat
      const sessionKey = await keyManagementService.getSessionKey(chatId);

      if (!sessionKey) {
        // Try to create session key if not exists
        await this.enableForChat(chatId, []);
        const newSessionKey = await keyManagementService.getSessionKey(chatId);
        if (!newSessionKey) {
          return {
            success: false,
            error: 'Session key not found and could not be created',
          };
        }
        return await e2eeCryptoService.encryptMessage(plaintext, newSessionKey);
      }

      return await e2eeCryptoService.encryptMessage(plaintext, sessionKey);
    } catch (error) {
      console.error('Encryption error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
      };
    }
  }

  /**
   * Decrypt a message from a chat
   */
  async decryptMessage(chatId: string, encrypted: EncryptedMessage): Promise<DecryptionResult> {
    try {
      // Get session key for this chat
      const sessionKey = await keyManagementService.getSessionKey(chatId);

      if (!sessionKey) {
        return {
          success: false,
          error: 'Session key not found for this chat',
        };
      }

      return await e2eeCryptoService.decryptMessage(encrypted, sessionKey);
    } catch (error) {
      console.error('Decryption error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  /**
   * Encrypt message batch (for bulk operations)
   */
  async encryptMessageBatch(
    chatId: string,
    messages: string[]
  ): Promise<EncryptionResult[]> {
    const sessionKey = await keyManagementService.getSessionKey(chatId);

    if (!sessionKey) {
      return messages.map(() => ({
        success: false,
        error: 'Session key not found',
      }));
    }

    return Promise.all(
      messages.map((msg) => e2eeCryptoService.encryptMessage(msg, sessionKey))
    );
  }

  /**
   * Decrypt message batch (for bulk operations)
   */
  async decryptMessageBatch(
    chatId: string,
    encrypted: EncryptedMessage[]
  ): Promise<DecryptionResult[]> {
    const sessionKey = await keyManagementService.getSessionKey(chatId);

    if (!sessionKey) {
      return encrypted.map(() => ({
        success: false,
        error: 'Session key not found',
      }));
    }

    return Promise.all(
      encrypted.map((enc) => e2eeCryptoService.decryptMessage(enc, sessionKey))
    );
  }

  // =====================================================
  // KEY SHARING
  // =====================================================

  /**
   * Share session key with a new participant
   * Encrypts the session key with recipient's public key
   */
  async shareSessionKey(
    chatId: string,
    recipientUserId: string
  ): Promise<EncryptedSessionKey | null> {
    try {
      // Get session key
      const sessionKey = await keyManagementService.getSessionKey(chatId);
      if (!sessionKey) {
        throw new E2EEError(
          E2EEErrorType.KEY_NOT_FOUND,
          'Session key not found for this chat'
        );
      }

      // Get recipient's public key
      const recipientPublicKey = await keyManagementService.getPublicKey(recipientUserId);
      if (!recipientPublicKey) {
        throw new E2EEError(
          E2EEErrorType.KEY_NOT_FOUND,
          `Public key not found for user ${recipientUserId}`
        );
      }

      // Encrypt session key with recipient's public key
      const encryptedKey = await e2eeCryptoService.encryptSessionKey(
        sessionKey,
        recipientPublicKey
      );

      const status = this.activeChats.get(chatId);

      return {
        encryptedKey,
        recipientUserId,
        keyId: status?.sessionKeyId || 'unknown',
        algorithm: 'RSA-OAEP',
      };
    } catch (error) {
      console.error('Failed to share session key:', error);
      return null;
    }
  }

  /**
   * Receive and decrypt a shared session key
   */
  async receiveSessionKey(
    chatId: string,
    encryptedSessionKey: EncryptedSessionKey
  ): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        throw new E2EEError(E2EEErrorType.KEY_NOT_FOUND, 'Current user not set');
      }

      // Get user's private key
      const keyPair = await keyManagementService.getUserKeys(this.currentUserId);
      if (!keyPair) {
        throw new E2EEError(
          E2EEErrorType.KEY_NOT_FOUND,
          'User key pair not found'
        );
      }

      // Decrypt session key
      const sessionKey = await e2eeCryptoService.decryptSessionKey(
        encryptedSessionKey.encryptedKey,
        keyPair.privateKey
      );

      // Store session key
      const sessionKeyObj: SessionKey = {
        key: sessionKey,
        keyId: encryptedSessionKey.keyId,
        createdAt: new Date(),
      };

      await keyManagementService.storeSessionKey(chatId, sessionKeyObj);

      return true;
    } catch (error) {
      console.error('Failed to receive session key:', error);
      return false;
    }
  }

  // =====================================================
  // PUBLIC KEY MANAGEMENT
  // =====================================================

  /**
   * Register public key for another user
   */
  async registerPublicKey(publicKeyInfo: PublicKeyInfo): Promise<void> {
    await keyManagementService.storePublicKey(publicKeyInfo);
  }

  /**
   * Get current user's public key for sharing
   */
  async getMyPublicKey(): Promise<PublicKeyInfo | null> {
    if (!this.currentUserId) {
      return null;
    }

    const keyPair = await keyManagementService.getUserKeys(this.currentUserId);
    if (!keyPair || !keyPair.publicKeyJWK) {
      return null;
    }

    return {
      userId: this.currentUserId,
      publicKeyJWK: keyPair.publicKeyJWK,
      keyId: `user_${this.currentUserId}`,
      createdAt: new Date().toISOString(),
    };
  }

  // =====================================================
  // STATUS & UTILITIES
  // =====================================================

  /**
   * Get E2EE status for a chat
   */
  getChatStatus(chatId: string): E2EEStatus | null {
    return this.activeChats.get(chatId) || null;
  }

  /**
   * Check if E2EE is enabled for a chat
   */
  isChatEncrypted(chatId: string): boolean {
    return this.activeChats.has(chatId);
  }

  /**
   * Get all active encrypted chats
   */
  getActiveChats(): string[] {
    return Array.from(this.activeChats.keys());
  }

  /**
   * Cleanup expired keys
   */
  async performMaintenance(): Promise<{
    expiredKeysRemoved: number;
    error?: string;
  }> {
    try {
      const expiredKeysRemoved = await keyManagementService.cleanupExpiredKeys();
      return { expiredKeysRemoved };
    } catch (error) {
      return {
        expiredKeysRemoved: 0,
        error: error instanceof Error ? error.message : 'Maintenance failed',
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    return await keyManagementService.getStorageStats();
  }

  /**
   * Check if E2EE is supported in current browser
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.crypto !== 'undefined' &&
      typeof window.crypto.subtle !== 'undefined' &&
      typeof indexedDB !== 'undefined'
    );
  }

  /**
   * Reset all encryption data (for testing/logout)
   */
  async reset(): Promise<void> {
    this.currentUserId = null;
    this.activeChats.clear();
    await keyManagementService.clearAllKeys();
  }
}

// Export singleton instance
export const e2eeManager = new E2EEManager();

