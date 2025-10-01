/**
 * E2EE API Service
 * Frontend service for managing E2EE keys via API
 */

import { PublicKeyInfo, EncryptedSessionKey } from '../lib/encryption';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ==========================================
// API TYPES
// ==========================================

interface StorePublicKeyRequest {
  userId: string;
  publicKeyJWK: JsonWebKey;
}

interface StorePublicKeyResponse {
  success: boolean;
  userId: string;
  keyId: string;
  createdAt: string;
}

interface GetPublicKeyResponse {
  userId: string;
  publicKeyJWK: JsonWebKey;
  keyId: string;
  createdAt: string;
}

interface GetPublicKeysBatchRequest {
  userIds: string[];
}

interface GetPublicKeysBatchResponse {
  keys: PublicKeyInfo[];
}

interface ShareSessionKeyRequest {
  chatId: string;
  recipientUserId: string;
  encryptedSessionKey: string;
  keyId: string;
}

interface ShareSessionKeyResponse {
  success: boolean;
  chatId: string;
  recipientUserId: string;
  sharedAt: string;
}

interface SharedSessionKeyDocument {
  id: string;
  chatId: string;
  recipientUserId: string;
  encryptedSessionKey: string;
  keyId: string;
  sharedBy: string;
  sharedAt: string;
}

interface GetSharedSessionKeysResponse {
  sharedKeys: SharedSessionKeyDocument[];
}

// ==========================================
// E2EE API SERVICE
// ==========================================

export class E2EEService {
  /**
   * Store user's public key on server
   */
  static async storePublicKey(request: StorePublicKeyRequest): Promise<StorePublicKeyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/e2ee/keys/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store public key');
      }

      return await response.json();
    } catch (error) {
      console.error('Error storing public key:', error);
      throw error;
    }
  }

  /**
   * Get user's public key from server
   */
  static async getPublicKey(userId: string): Promise<PublicKeyInfo | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/e2ee/keys/public/${userId}`, {
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
        throw new Error(error.error || 'Failed to fetch public key');
      }

      const data: GetPublicKeyResponse = await response.json();
      
      return {
        userId: data.userId,
        publicKeyJWK: data.publicKeyJWK,
        keyId: data.keyId,
        createdAt: data.createdAt,
      };
    } catch (error) {
      console.error(`Error fetching public key for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple users' public keys from server
   */
  static async getPublicKeysBatch(userIds: string[]): Promise<Map<string, PublicKeyInfo>> {
    try {
      const request: GetPublicKeysBatchRequest = { userIds };

      const response = await fetch(`${API_BASE_URL}/e2ee/keys/public/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch public keys');
      }

      const data: GetPublicKeysBatchResponse = await response.json();

      // Convert to Map for easy lookup
      const keysMap = new Map<string, PublicKeyInfo>();
      data.keys.forEach((key) => {
        keysMap.set(key.userId, key);
      });

      return keysMap;
    } catch (error) {
      console.error('Error fetching public keys batch:', error);
      throw error;
    }
  }

  /**
   * Share encrypted session key with another user
   */
  static async shareSessionKey(request: ShareSessionKeyRequest): Promise<ShareSessionKeyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/e2ee/keys/session/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to share session key');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sharing session key:', error);
      throw error;
    }
  }

  /**
   * Get shared session keys for current user
   */
  static async getSharedSessionKeys(userId: string): Promise<EncryptedSessionKey[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/e2ee/keys/session/shared?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch shared session keys');
      }

      const data: GetSharedSessionKeysResponse = await response.json();

      // Transform to EncryptedSessionKey format
      return data.sharedKeys.map((key) => ({
        encryptedKey: key.encryptedSessionKey,
        recipientUserId: key.recipientUserId,
        keyId: key.keyId,
        algorithm: 'RSA-OAEP' as const,
      }));
    } catch (error) {
      console.error('Error fetching shared session keys:', error);
      throw error;
    }
  }

  /**
   * Sync public key with server after generation
   */
  static async syncPublicKey(userId: string, publicKeyJWK: JsonWebKey): Promise<boolean> {
    try {
      const result = await E2EEService.storePublicKey({
        userId,
        publicKeyJWK,
      });

      return result.success;
    } catch (error) {
      console.error('Error syncing public key:', error);
      return false;
    }
  }

  /**
   * Fetch and cache public keys for chat participants
   */
  static async fetchParticipantKeys(participantIds: string[]): Promise<Map<string, PublicKeyInfo>> {
    try {
      const keys = await E2EEService.getPublicKeysBatch(participantIds);
      return keys;
    } catch (error) {
      console.error('Error fetching participant keys:', error);
      return new Map();
    }
  }
}

// Export as singleton
export const e2eeService = E2EEService;

