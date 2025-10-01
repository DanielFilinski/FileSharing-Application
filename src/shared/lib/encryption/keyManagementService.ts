/**
 * Key Management Service
 * Manages storage and retrieval of encryption keys using IndexedDB
 * Provides secure key lifecycle management
 */

import {
  StoredKeyInfo,
  UserKeyPair,
  SessionKey,
  PublicKeyInfo,
  E2EEError,
  E2EEErrorType,
} from './types';
import { e2eeCryptoService } from './e2eeCryptoService';

const DB_NAME = 'E2EE_KeyStore';
const DB_VERSION = 1;
const STORE_NAMES = {
  USER_KEYS: 'userKeys',
  SESSION_KEYS: 'sessionKeys',
  PUBLIC_KEYS: 'publicKeys',
} as const;

export class KeyManagementService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDatabase();
  }

  // =====================================================
  // DATABASE INITIALIZATION
  // =====================================================

  /**
   * Initialize IndexedDB database
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(
          new E2EEError(
            E2EEErrorType.KEY_STORAGE_FAILED,
            'Failed to open IndexedDB'
          )
        );
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAMES.USER_KEYS)) {
          const userStore = db.createObjectStore(STORE_NAMES.USER_KEYS, {
            keyPath: 'keyId',
          });
          userStore.createIndex('userId', 'userId', { unique: false });
          userStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.SESSION_KEYS)) {
          const sessionStore = db.createObjectStore(STORE_NAMES.SESSION_KEYS, {
            keyPath: 'keyId',
          });
          sessionStore.createIndex('chatId', 'chatId', { unique: false });
          sessionStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.PUBLIC_KEYS)) {
          const publicStore = db.createObjectStore(STORE_NAMES.PUBLIC_KEYS, {
            keyPath: 'userId',
          });
          publicStore.createIndex('keyId', 'keyId', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new E2EEError(
        E2EEErrorType.KEY_STORAGE_FAILED,
        'Database not initialized'
      );
    }
  }

  // =====================================================
  // USER KEYS MANAGEMENT
  // =====================================================

  /**
   * Store user key pair
   */
  async storeUserKeys(userId: string, keyPair: UserKeyPair): Promise<void> {
    await this.ensureInitialized();

    try {
      const publicKeyJWK = await e2eeCryptoService.exportKey(keyPair.publicKey);
      const privateKeyJWK = await e2eeCryptoService.exportKey(keyPair.privateKey);

      const keyId = this.generateKeyId();

      // Store public key
      const publicKeyInfo: StoredKeyInfo = {
        keyId: `${keyId}-public`,
        keyJWK: publicKeyJWK,
        type: 'user-public',
        userId,
        createdAt: new Date().toISOString(),
      };

      // Store private key
      const privateKeyInfo: StoredKeyInfo = {
        keyId: `${keyId}-private`,
        keyJWK: privateKeyJWK,
        type: 'user-private',
        userId,
        createdAt: new Date().toISOString(),
      };

      const transaction = this.db!.transaction([STORE_NAMES.USER_KEYS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.USER_KEYS);

      await Promise.all([
        this.promisifyRequest(store.put(publicKeyInfo)),
        this.promisifyRequest(store.put(privateKeyInfo)),
      ]);
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_STORAGE_FAILED,
        'Failed to store user keys',
        error as Error
      );
    }
  }

  /**
   * Retrieve user key pair
   */
  async getUserKeys(userId: string): Promise<UserKeyPair | null> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.USER_KEYS], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.USER_KEYS);
      const index = store.index('userId');

      const allKeys = await this.promisifyRequest<StoredKeyInfo[]>(index.getAll(userId));

      const publicKeyInfo = allKeys.find((k) => k.type === 'user-public');
      const privateKeyInfo = allKeys.find((k) => k.type === 'user-private');

      if (!publicKeyInfo || !privateKeyInfo) {
        return null;
      }

      const publicKey = await e2eeCryptoService.importPublicKey(publicKeyInfo.keyJWK);
      const privateKey = await e2eeCryptoService.importPrivateKey(privateKeyInfo.keyJWK);

      return {
        publicKey,
        privateKey,
        publicKeyJWK: publicKeyInfo.keyJWK,
      };
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_RETRIEVAL_FAILED,
        'Failed to retrieve user keys',
        error as Error
      );
    }
  }

  /**
   * Delete user keys
   */
  async deleteUserKeys(userId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.USER_KEYS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.USER_KEYS);
      const index = store.index('userId');

      const allKeys = await this.promisifyRequest<StoredKeyInfo[]>(index.getAll(userId));

      for (const key of allKeys) {
        await this.promisifyRequest(store.delete(key.keyId));
      }
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_STORAGE_FAILED,
        'Failed to delete user keys',
        error as Error
      );
    }
  }

  // =====================================================
  // SESSION KEYS MANAGEMENT
  // =====================================================

  /**
   * Store session key for a chat
   */
  async storeSessionKey(chatId: string, sessionKey: SessionKey): Promise<void> {
    await this.ensureInitialized();

    try {
      const keyJWK = await e2eeCryptoService.exportKey(sessionKey.key);

      const keyInfo: StoredKeyInfo = {
        keyId: sessionKey.keyId,
        keyJWK,
        type: 'session',
        chatId,
        createdAt: sessionKey.createdAt.toISOString(),
        expiresAt: sessionKey.expiresAt?.toISOString(),
      };

      const transaction = this.db!.transaction([STORE_NAMES.SESSION_KEYS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.SESSION_KEYS);

      await this.promisifyRequest(store.put(keyInfo));
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_STORAGE_FAILED,
        'Failed to store session key',
        error as Error
      );
    }
  }

  /**
   * Retrieve session key for a chat
   */
  async getSessionKey(chatId: string): Promise<CryptoKey | null> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.SESSION_KEYS], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.SESSION_KEYS);
      const index = store.index('chatId');

      const keys = await this.promisifyRequest<StoredKeyInfo[]>(index.getAll(chatId));

      if (keys.length === 0) {
        return null;
      }

      // Get the most recent non-expired key
      const now = new Date();
      const validKeys = keys.filter((k) => {
        if (!k.expiresAt) return true;
        return new Date(k.expiresAt) > now;
      });

      if (validKeys.length === 0) {
        return null;
      }

      // Sort by creation date (most recent first)
      validKeys.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const latestKey = validKeys[0];
      return await e2eeCryptoService.importSessionKey(latestKey.keyJWK);
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_RETRIEVAL_FAILED,
        'Failed to retrieve session key',
        error as Error
      );
    }
  }

  /**
   * Delete session key
   */
  async deleteSessionKey(keyId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.SESSION_KEYS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.SESSION_KEYS);

      await this.promisifyRequest(store.delete(keyId));
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_STORAGE_FAILED,
        'Failed to delete session key',
        error as Error
      );
    }
  }

  /**
   * Clean up expired session keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.SESSION_KEYS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.SESSION_KEYS);
      const index = store.index('expiresAt');

      const now = new Date();
      const range = IDBKeyRange.upperBound(now.toISOString());

      const expiredKeys = await this.promisifyRequest<StoredKeyInfo[]>(index.getAll(range));

      for (const key of expiredKeys) {
        await this.promisifyRequest(store.delete(key.keyId));
      }

      return expiredKeys.length;
    } catch (error) {
      console.error('Failed to cleanup expired keys:', error);
      return 0;
    }
  }

  // =====================================================
  // PUBLIC KEYS MANAGEMENT (for other users)
  // =====================================================

  /**
   * Store public key of another user
   */
  async storePublicKey(publicKeyInfo: PublicKeyInfo): Promise<void> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.PUBLIC_KEYS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.PUBLIC_KEYS);

      await this.promisifyRequest(store.put(publicKeyInfo));
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_STORAGE_FAILED,
        'Failed to store public key',
        error as Error
      );
    }
  }

  /**
   * Retrieve public key of another user
   */
  async getPublicKey(userId: string): Promise<CryptoKey | null> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.PUBLIC_KEYS], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.PUBLIC_KEYS);

      const publicKeyInfo = await this.promisifyRequest<PublicKeyInfo>(store.get(userId));

      if (!publicKeyInfo) {
        return null;
      }

      return await e2eeCryptoService.importPublicKey(publicKeyInfo.publicKeyJWK);
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_RETRIEVAL_FAILED,
        'Failed to retrieve public key',
        error as Error
      );
    }
  }

  /**
   * Get all stored public keys
   */
  async getAllPublicKeys(): Promise<PublicKeyInfo[]> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([STORE_NAMES.PUBLIC_KEYS], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.PUBLIC_KEYS);

      return await this.promisifyRequest<PublicKeyInfo[]>(store.getAll());
    } catch (error) {
      throw new E2EEError(
        E2EEErrorType.KEY_RETRIEVAL_FAILED,
        'Failed to retrieve public keys',
        error as Error
      );
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Convert IDBRequest to Promise
   */
  private promisifyRequest<T = any>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all stored keys (for testing/debugging)
   */
  async clearAllKeys(): Promise<void> {
    await this.ensureInitialized();

    const transaction = this.db!.transaction(
      [STORE_NAMES.USER_KEYS, STORE_NAMES.SESSION_KEYS, STORE_NAMES.PUBLIC_KEYS],
      'readwrite'
    );

    await Promise.all([
      this.promisifyRequest(transaction.objectStore(STORE_NAMES.USER_KEYS).clear()),
      this.promisifyRequest(transaction.objectStore(STORE_NAMES.SESSION_KEYS).clear()),
      this.promisifyRequest(transaction.objectStore(STORE_NAMES.PUBLIC_KEYS).clear()),
    ]);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    userKeys: number;
    sessionKeys: number;
    publicKeys: number;
    totalSize: string;
  }> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction(
        [STORE_NAMES.USER_KEYS, STORE_NAMES.SESSION_KEYS, STORE_NAMES.PUBLIC_KEYS],
        'readonly'
      );

      const [userKeys, sessionKeys, publicKeys] = await Promise.all([
        this.promisifyRequest<number>(
          transaction.objectStore(STORE_NAMES.USER_KEYS).count()
        ),
        this.promisifyRequest<number>(
          transaction.objectStore(STORE_NAMES.SESSION_KEYS).count()
        ),
        this.promisifyRequest<number>(
          transaction.objectStore(STORE_NAMES.PUBLIC_KEYS).count()
        ),
      ]);

      // Estimate storage size
      let estimatedSize = 'Unknown';
      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          estimatedSize = this.formatBytes(estimate.usage);
        }
      }

      return {
        userKeys,
        sessionKeys,
        publicKeys,
        totalSize: estimatedSize,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        userKeys: 0,
        sessionKeys: 0,
        publicKeys: 0,
        totalSize: 'Error',
      };
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const keyManagementService = new KeyManagementService();

