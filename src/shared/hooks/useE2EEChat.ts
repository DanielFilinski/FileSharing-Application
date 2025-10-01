/**
 * useE2EEChat Hook
 * React hook for integrating E2EE with chat functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { e2eeManager, EncryptedMessage, E2EEStatus } from '../lib/encryption';
import { ChatMessage } from '../types/chat';

export interface UseE2EEChatOptions {
  chatId: string;
  userId: string;
  enabled?: boolean;
  participantIds?: string[];
  onError?: (error: Error) => void;
}

export interface UseE2EEChatResult {
  isE2EEEnabled: boolean;
  isInitializing: boolean;
  status: E2EEStatus | null;
  error: string | null;
  
  // Actions
  enableE2EE: () => Promise<void>;
  disableE2EE: () => Promise<void>;
  encryptMessage: (plaintext: string) => Promise<EncryptedMessage | null>;
  decryptMessage: (encrypted: EncryptedMessage) => Promise<string | null>;
  decryptMessages: (messages: ChatMessage[]) => Promise<ChatMessage[]>;
  
  // Utilities
  isSupported: boolean;
  checkSupport: () => boolean;
}

/**
 * Hook for managing E2EE in chat
 */
export const useE2EEChat = (options: UseE2EEChatOptions): UseE2EEChatResult => {
  const {
    chatId,
    userId,
    enabled = false,
    participantIds = [],
    onError,
  } = options;

  // State
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [status, setStatus] = useState<E2EEStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => e2eeManager.constructor.isSupported());

  // Refs
  const isInitialized = useRef(false);
  const currentChatId = useRef(chatId);

  // ==========================================
  // INITIALIZATION
  // ==========================================

  useEffect(() => {
    if (!isSupported) {
      setError('E2EE is not supported in this browser');
      return;
    }

    if (chatId !== currentChatId.current) {
      currentChatId.current = chatId;
      isInitialized.current = false;
    }

    if (enabled && !isInitialized.current) {
      initializeE2EE();
    }
  }, [chatId, userId, enabled, isSupported]);

  /**
   * Initialize E2EE for user and chat
   */
  const initializeE2EE = async () => {
    if (isInitialized.current) return;

    try {
      setIsInitializing(true);
      setError(null);

      // Initialize user keys
      const initResult = await e2eeManager.initializeForUser(userId);
      if (!initResult.success) {
        throw new Error(initResult.error || 'Failed to initialize E2EE');
      }

      // Enable E2EE for this chat
      if (enabled) {
        await enableE2EE();
      }

      isInitialized.current = true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'E2EE initialization failed';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // ==========================================
  // E2EE CONTROL
  // ==========================================

  /**
   * Enable E2EE for current chat
   */
  const enableE2EE = useCallback(async () => {
    try {
      setError(null);
      const chatStatus = await e2eeManager.enableForChat(chatId, participantIds);
      setStatus(chatStatus);
      setIsE2EEEnabled(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable E2EE';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      throw err;
    }
  }, [chatId, participantIds, onError]);

  /**
   * Disable E2EE for current chat
   */
  const disableE2EE = useCallback(async () => {
    try {
      await e2eeManager.disableForChat(chatId);
      setStatus(null);
      setIsE2EEEnabled(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable E2EE';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  }, [chatId, onError]);

  // ==========================================
  // ENCRYPTION / DECRYPTION
  // ==========================================

  /**
   * Encrypt a message
   */
  const encryptMessage = useCallback(
    async (plaintext: string): Promise<EncryptedMessage | null> => {
      if (!isE2EEEnabled) {
        console.warn('E2EE is not enabled for this chat');
        return null;
      }

      try {
        const result = await e2eeManager.encryptMessage(chatId, plaintext);
        
        if (!result.success || !result.encrypted) {
          throw new Error(result.error || 'Encryption failed');
        }

        return result.encrypted;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Encryption failed';
        console.error('Encryption error:', errorMessage);
        setError(errorMessage);
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
        return null;
      }
    },
    [chatId, isE2EEEnabled, onError]
  );

  /**
   * Decrypt a message
   */
  const decryptMessage = useCallback(
    async (encrypted: EncryptedMessage): Promise<string | null> => {
      try {
        const result = await e2eeManager.decryptMessage(chatId, encrypted);
        
        if (!result.success || !result.plaintext) {
          throw new Error(result.error || 'Decryption failed');
        }

        return result.plaintext;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Decryption failed';
        console.error('Decryption error:', errorMessage);
        // Don't set error state for individual message decryption failures
        // to avoid blocking the UI
        return null;
      }
    },
    [chatId]
  );

  /**
   * Decrypt multiple messages
   */
  const decryptMessages = useCallback(
    async (messages: ChatMessage[]): Promise<ChatMessage[]> => {
      if (!isE2EEEnabled) {
        return messages;
      }

      try {
        const decryptedMessages = await Promise.all(
          messages.map(async (message) => {
            // Check if message has encrypted content
            if (message.isEncrypted && message.encryptedContent) {
              try {
                const plaintext = await decryptMessage(message.encryptedContent);
                
                if (plaintext) {
                  return {
                    ...message,
                    content: plaintext,
                    isDecrypted: true,
                  };
                }
              } catch (err) {
                console.error(`Failed to decrypt message ${message.id}:`, err);
                return {
                  ...message,
                  content: '[Encrypted message - decryption failed]',
                  isDecrypted: false,
                };
              }
            }
            
            return message;
          })
        );

        return decryptedMessages;
      } catch (err) {
        console.error('Batch decryption error:', err);
        return messages;
      }
    },
    [isE2EEEnabled, decryptMessage]
  );

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Check if E2EE is supported
   */
  const checkSupport = useCallback(() => {
    return e2eeManager.constructor.isSupported();
  }, []);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    isE2EEEnabled,
    isInitializing,
    status,
    error,
    
    enableE2EE,
    disableE2EE,
    encryptMessage,
    decryptMessage,
    decryptMessages,
    
    isSupported,
    checkSupport,
  };
};

