/**
 * Chat API Client - for working with chat system
 * Provides methods for interacting with backend Chat API
 */

import { apiClient } from './apiClient';
import {
  ChatThread,
  ChatMessage,
  DocumentFragment,
  ChatParticipant,
  CreateMessageRequest,
  CreateFragmentRequest,
  UpdateFragmentRequest,
  ChatThreadSettings,
  ChatStatistics,
  ChatSearchQuery,
  ChatSearchResult,
  MessageType,
  UserRole
} from '../types/chat';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  totalCount: number;
  hasMore: boolean;
}

export class ChatApiClient {
  
  // ==========================================
  // Chat Thread Management
  // ==========================================

  /**
   * Gets or creates chat for document
   */
  static async getOrCreateDocumentChat(
    documentId: string,
    documentName?: string
  ): Promise<ChatThread> {
    const params = new URLSearchParams();
    if (documentName) {
      params.append('documentName', documentName);
    }

    const response = await apiClient.get<ApiResponse<ChatThread>>(
      `/api/chat/documents/${documentId}/thread${params.toString() ? '?' + params.toString() : ''}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get document chat');
    }

    return response.data.data!;
  }

  /**
   * Gets chat information
   */
  static async getChatThread(threadId: string): Promise<ChatThread> {
    const response = await apiClient.get<ApiResponse<ChatThread>>(
      `/api/chat/threads/${threadId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get chat thread');
    }

    return response.data.data!;
  }

  /**
   * Updates chat settings
   */
  static async updateThreadSettings(
    threadId: string,
    settings: Partial<ChatThreadSettings>
  ): Promise<ChatThread> {
    const response = await apiClient.put<ApiResponse<ChatThread>>(
      `/api/chat/threads/${threadId}/settings`,
      settings
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update thread settings');
    }

    return response.data.data!;
  }

  // ==========================================
  // Message Management
  // ==========================================

  /**
   * Gets chat messages
   */
  static async getThreadMessages(
    threadId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MessagesResponse> {
    const response = await apiClient.get<ApiResponse<MessagesResponse>>(
      `/api/chat/threads/${threadId}/messages?limit=${limit}&offset=${offset}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get thread messages');
    }

    return response.data.data!;
  }

  /**
   * Creates new message
   */
  static async createMessage(
    threadId: string,
    messageRequest: CreateMessageRequest
  ): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      `/api/chat/threads/${threadId}/messages`,
      messageRequest
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create message');
    }

    return response.data.data!;
  }

  /**
   * Creates text message (simplified method)
   */
  static async sendTextMessage(
    threadId: string,
    content: string,
    replyToMessageId?: string,
    mentions?: string[]
  ): Promise<ChatMessage> {
    return this.createMessage(threadId, {
      content,
      messageType: 'text',
      replyToMessageId,
      mentions
    });
  }

  /**
   * Creates message with fragment references
   */
  static async sendFragmentMessage(
    threadId: string,
    content: string,
    fragmentReferences: string[],
    replyToMessageId?: string
  ): Promise<ChatMessage> {
    return this.createMessage(threadId, {
      content,
      messageType: 'fragment_reference',
      fragmentReferences,
      replyToMessageId
    });
  }

  /**
   * Edits message
   */
  static async editMessage(
    messageId: string,
    newContent: string
  ): Promise<ChatMessage> {
    const response = await apiClient.put<ApiResponse<ChatMessage>>(
      `/api/chat/messages/${messageId}`,
      { content: newContent }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to edit message');
    }

    return response.data.data!;
  }

  /**
   * Deletes message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(
      `/api/chat/messages/${messageId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete message');
    }
  }

  // ==========================================
  // Document Fragment Management
  // ==========================================

  /**
   * Gets document fragments
   */
  static async getDocumentFragments(
    documentId: string,
    includeInactive: boolean = false
  ): Promise<DocumentFragment[]> {
    const response = await apiClient.get<ApiResponse<DocumentFragment[]>>(
      `/api/chat/documents/${documentId}/fragments?includeInactive=${includeInactive}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get document fragments');
    }

    return response.data.data!;
  }

  /**
   * Creates document fragment
   */
  static async createDocumentFragment(
    documentId: string,
    fragmentRequest: CreateFragmentRequest
  ): Promise<DocumentFragment> {
    const response = await apiClient.post<ApiResponse<DocumentFragment>>(
      `/api/chat/documents/${documentId}/fragments`,
      fragmentRequest
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create document fragment');
    }

    return response.data.data!;
  }

  /**
   * Creates text fragment (simplified method)
   */
  static async createTextFragment(
    documentId: string,
    selectedText: string,
    startPosition: number,
    endPosition: number,
    options?: {
      pageNumber?: number;
      sectionTitle?: string;
      highlightColor?: string;
      referenceTitle?: string;
      referenceDescription?: string;
      tags?: string[];
    }
  ): Promise<DocumentFragment> {
    return this.createDocumentFragment(documentId, {
      selectionType: 'text',
      selectedText,
      startPosition,
      endPosition,
      ...options
    });
  }

  /**
   * Updates document fragment
   */
  static async updateDocumentFragment(
    fragmentId: string,
    updateRequest: UpdateFragmentRequest
  ): Promise<DocumentFragment> {
    const response = await apiClient.put<ApiResponse<DocumentFragment>>(
      `/api/chat/fragments/${fragmentId}`,
      updateRequest
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update document fragment');
    }

    return response.data.data!;
  }

  /**
   * Marks fragment as resolved
   */
  static async resolveFragment(
    fragmentId: string,
    resolveNote?: string
  ): Promise<DocumentFragment> {
    const updateData: UpdateFragmentRequest = {
      isResolved: true
    };

    if (resolveNote) {
      updateData.referenceDescription = resolveNote;
    }

    return this.updateDocumentFragment(fragmentId, updateData);
  }

  /**
   * Deactivates fragment
   */
  static async deactivateFragment(fragmentId: string): Promise<DocumentFragment> {
    return this.updateDocumentFragment(fragmentId, { isActive: false });
  }

  // ==========================================
  // Participant Management
  // ==========================================

  /**
   * Gets chat participants
   */
  static async getThreadParticipants(threadId: string): Promise<ChatParticipant[]> {
    const response = await apiClient.get<ApiResponse<ChatParticipant[]>>(
      `/api/chat/threads/${threadId}/participants`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get thread participants');
    }

    return response.data.data!;
  }

  // ==========================================
  // Search & Analytics
  // ==========================================

  /**
   * Search messages
   */
  static async searchMessages(query: ChatSearchQuery): Promise<ChatSearchResult> {
    const response = await apiClient.post<ApiResponse<ChatSearchResult>>(
      '/api/chat/search',
      query
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to search messages');
    }

    return response.data.data!;
  }

  /**
   * Simple content search
   */
  static async searchMessagesByContent(
    searchTerm: string,
    threadId?: string,
    documentId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatSearchResult> {
    return this.searchMessages({
      query: searchTerm,
      threadId,
      documentId,
      limit,
      offset,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  /**
   * Search messages from specific user
   */
  static async searchMessagesBySender(
    senderId: string,
    threadId?: string,
    messageType?: MessageType,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatSearchResult> {
    return this.searchMessages({
      senderId,
      threadId,
      messageType,
      limit,
      offset,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  /**
   * Gets chat statistics
   */
  static async getChatStatistics(threadId: string): Promise<ChatStatistics> {
    const response = await apiClient.get<ApiResponse<ChatStatistics>>(
      `/api/chat/threads/${threadId}/statistics`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get chat statistics');
    }

    return response.data.data!;
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Checks if there are new messages in chat
   */
  static async hasNewMessages(
    threadId: string,
    lastSeenTimestamp: string
  ): Promise<boolean> {
    try {
      const result = await this.getThreadMessages(threadId, 1, 0);
      if (result.messages.length === 0) {
        return false;
      }

      const latestMessage = result.messages[0];
      return new Date(latestMessage.timestamp) > new Date(lastSeenTimestamp);
    } catch (error) {
      console.error('Error checking for new messages:', error);
      return false;
    }
  }

  /**
   * Gets unread message count
   */
  static async getUnreadMessageCount(
    threadId: string,
    lastSeenTimestamp: string
  ): Promise<number> {
    try {
      const searchResult = await this.searchMessages({
        threadId,
        limit: 100,
        offset: 0
      });

      return searchResult.messages.filter(
        message => new Date(message.timestamp) > new Date(lastSeenTimestamp)
      ).length;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  /**
   * Gets active document fragments
   */
  static async getActiveDocumentFragments(documentId: string): Promise<DocumentFragment[]> {
    const fragments = await this.getDocumentFragments(documentId, false);
    return fragments.filter(fragment => fragment.isActive && !fragment.isResolved);
  }

  /**
   * Gets resolved document fragments
   */
  static async getResolvedDocumentFragments(documentId: string): Promise<DocumentFragment[]> {
    const fragments = await this.getDocumentFragments(documentId, true);
    return fragments.filter(fragment => fragment.isResolved);
  }

  /**
   * Gets recent messages for multiple chats
   */
  static async getRecentMessagesForThreads(
    threadIds: string[],
    limit: number = 5
  ): Promise<Record<string, ChatMessage[]>> {
    const results: Record<string, ChatMessage[]> = {};

    await Promise.all(
      threadIds.map(async (threadId) => {
        try {
          const result = await this.getThreadMessages(threadId, limit, 0);
          results[threadId] = result.messages;
        } catch (error) {
          console.error(`Error getting messages for thread ${threadId}:`, error);
          results[threadId] = [];
        }
      })
    );

    return results;
  }

  // ==========================================
  // Real-time Communication Support
  // ==========================================

  /**
   * Sends typing indicator
   */
  static async sendTypingIndicator(threadId: string): Promise<void> {
    // This will be implemented later through WebSocket/SignalR
    console.log(`Typing indicator sent for thread: ${threadId}`);
  }

  /**
   * Sends message read indicator
   */
  static async markMessageAsRead(messageId: string): Promise<void> {
    // This will be implemented later through WebSocket/SignalR or separate endpoint
    console.log(`Message marked as read: ${messageId}`);
  }

  /**
   * Marks user as online in chat
   */
  static async updateUserPresence(
    threadId: string,
    isOnline: boolean
  ): Promise<void> {
    // This will be implemented later through WebSocket/SignalR
    console.log(`User presence updated for thread ${threadId}: ${isOnline}`);
  }
}

// Export alias for convenience
export const chatApi = ChatApiClient;
