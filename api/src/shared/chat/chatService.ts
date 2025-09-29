/**
 * Chat Service - main service for managing chats
 * Implements business logic for working with messages, threads and document fragments
 */

import { CosmosClient, Container } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
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
  UserRole,
  MessageStatus,
  ChatEvent,
  ChatEventType,
  CHAT_CONSTANTS
} from '../../../../src/shared/types/chat';

export interface ChatContext {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ChatService {
  private cosmosClient: CosmosClient;
  private databaseId: string;
  
  // Containers
  private threadsContainer: Container;
  private messagesContainer: Container;
  private fragmentsContainer: Container;
  private participantsContainer: Container;
  private eventsContainer: Container;

  constructor() {
    this.cosmosClient = new CosmosClient(process.env.CosmosDbConnectionString || '');
    this.databaseId = process.env.CosmosDbDatabaseId || 'FileSharingDb';
    
    // Initialize containers
    this.threadsContainer = this.cosmosClient.database(this.databaseId).container('chat-threads');
    this.messagesContainer = this.cosmosClient.database(this.databaseId).container('chat-messages');
    this.fragmentsContainer = this.cosmosClient.database(this.databaseId).container('document-fragments');
    this.participantsContainer = this.cosmosClient.database(this.databaseId).container('chat-participants');
    this.eventsContainer = this.cosmosClient.database(this.databaseId).container('chat-events');
  }

  // ==========================================
  // Chat Thread Management
  // ==========================================

  /**
   * Creates or gets existing chat for document
   */
  async getOrCreateDocumentChat(
    documentId: string, 
    documentName: string, 
    context: ChatContext
  ): Promise<ChatThread> {
    try {
      // Try to find existing chat
      const existingThread = await this.getDocumentChat(documentId);
      if (existingThread) {
        // Add participant if they don't exist
        await this.ensureParticipant(existingThread.id, context);
        return existingThread;
      }

      // Create new chat
      const threadId = `thread-${documentId}`;
      const now = new Date().toISOString();

      const newThread: ChatThread = {
        id: threadId,
        documentId,
        documentName,
        participants: [],
        activeParticipants: 0,
        isActive: true,
        isArchived: false,
        lastActivity: now,
        messageCount: 0,
        unreadCount: 0,
        settings: this.getDefaultThreadSettings(),
        createdAt: now,
        createdBy: context.userId,
        updatedAt: now,
        threadType: 'document'
      };

      await this.threadsContainer.items.create(newThread);

      // Add creator as participant
      await this.addParticipant(threadId, context, ['read', 'write', 'create_fragments']);

      // Create system message about chat creation
      await this.createSystemMessage(
        threadId,
        `Chat created for document: ${documentName}`,
        context
      );

      // Update participant count
      const updatedThread = await this.updateActiveParticipants(threadId);
      
      return updatedThread;
    } catch (error) {
      console.error('Error creating/getting document chat:', error);
      throw error;
    }
  }

  /**
   * Gets document chat
   */
  async getDocumentChat(documentId: string): Promise<ChatThread | null> {
    try {
      const threadId = `thread-${documentId}`;
      const { resource } = await this.threadsContainer.item(threadId, documentId).read();
      return resource || null;
    } catch (error) {
      if ((error as any).code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Updates chat settings
   */
  async updateThreadSettings(
    threadId: string, 
    settings: Partial<ChatThreadSettings>,
    context: ChatContext
  ): Promise<ChatThread> {
    try {
      const thread = await this.getThreadById(threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const updatedThread: ChatThread = {
        ...thread,
        settings: { ...thread.settings, ...settings },
        updatedAt: new Date().toISOString()
      };

      await this.threadsContainer.items.upsert(updatedThread);

      // Create settings change event
      await this.createEvent(threadId, 'settings_changed', context.userId, { settings });

      return updatedThread;
    } catch (error) {
      console.error('Error updating thread settings:', error);
      throw error;
    }
  }

  // ==========================================
  // Message Management
  // ==========================================

  /**
   * Creates new message
   */
  async createMessage(
    threadId: string,
    request: CreateMessageRequest,
    context: ChatContext
  ): Promise<ChatMessage> {
    try {
      // Проверка прав доступа
      await this.validateParticipantPermission(threadId, context.userId, 'write');

      // Валидация контента
      if (!request.content || request.content.length > CHAT_CONSTANTS.MAX_MESSAGE_LENGTH) {
        throw new Error('Invalid message content length');
      }

      const messageId = uuidv4();
      const now = new Date().toISOString();

      // Получение ссылок на фрагменты
      const fragmentReferences = await this.getFragmentReferences(
        request.fragmentReferences || []
      );

      const message: ChatMessage = {
        id: messageId,
        threadId,
        documentId: await this.getThreadDocumentId(threadId),
        senderId: context.userId,
        senderName: context.userName,
        senderEmail: context.userEmail,
        senderRole: context.userRole,
        content: request.content,
        messageType: request.messageType || 'text',
        fragmentReferences,
        replyToMessageId: request.replyToMessageId,
        timestamp: now,
        status: 'sent',
        isRead: false,
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        reactions: [],
        mentions: request.mentions || [],
        metadata: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          messageLength: request.content.length
        }
      };

      await this.messagesContainer.items.create(message);

      // Обновить счетчики в потоке
      await this.updateThreadCounters(threadId, message);

      // Создать событие отправки сообщения
      await this.createEvent(threadId, 'message_sent', context.userId, { messageId, message });

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Получает сообщения потока
   */
  async getThreadMessages(
    threadId: string,
    limit: number = CHAT_CONSTANTS.MESSAGE_BATCH_SIZE,
    offset: number = 0
  ): Promise<{ messages: ChatMessage[]; totalCount: number; hasMore: boolean }> {
    try {
      const query = `
        SELECT * FROM c 
        WHERE c.threadId = @threadId 
          AND c.isDeleted != true 
        ORDER BY c.timestamp DESC 
        OFFSET @offset LIMIT @limit
      `;

      const { resources: messages } = await this.messagesContainer.items.query({
        query,
        parameters: [
          { name: '@threadId', value: threadId },
          { name: '@offset', value: offset },
          { name: '@limit', value: limit }
        ]
      }).fetchAll();

      // Получить общее количество сообщений
      const countQuery = `
        SELECT VALUE COUNT(1) FROM c 
        WHERE c.threadId = @threadId AND c.isDeleted != true
      `;
      
      const { resources: [totalCount] } = await this.messagesContainer.items.query({
        query: countQuery,
        parameters: [{ name: '@threadId', value: threadId }]
      }).fetchAll();

      return {
        messages: messages.reverse(), // Возвращаем в хронологическом порядке
        totalCount: totalCount || 0,
        hasMore: offset + messages.length < totalCount
      };
    } catch (error) {
      console.error('Error getting thread messages:', error);
      throw error;
    }
  }

  /**
   * Редактирует сообщение
   */
  async editMessage(
    messageId: string,
    newContent: string,
    context: ChatContext
  ): Promise<ChatMessage> {
    try {
      const message = await this.getMessageById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Проверка прав (можно редактировать только свои сообщения)
      if (message.senderId !== context.userId) {
        throw new Error('Permission denied: can only edit own messages');
      }

      // Проверка возможности редактирования
      const thread = await this.getThreadById(message.threadId);
      if (!thread?.settings.allowMessageEditing) {
        throw new Error('Message editing is disabled for this thread');
      }

      const now = new Date().toISOString();
      const editHistory = message.metadata?.editHistory || [];

      const updatedMessage: ChatMessage = {
        ...message,
        content: newContent,
        isEdited: true,
        editedAt: now,
        metadata: {
          ...message.metadata,
          editHistory: [
            ...editHistory,
            {
              editedAt: now,
              editedBy: context.userId,
              previousContent: message.content
            }
          ]
        }
      };

      await this.messagesContainer.items.upsert(updatedMessage);

      // Создать событие редактирования
      await this.createEvent(message.threadId, 'message_edited', context.userId, { messageId });

      return updatedMessage;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Удаляет сообщение
   */
  async deleteMessage(messageId: string, context: ChatContext): Promise<void> {
    try {
      const message = await this.getMessageById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Проверка прав
      if (message.senderId !== context.userId) {
        throw new Error('Permission denied: can only delete own messages');
      }

      // Мягкое удаление
      const updatedMessage: ChatMessage = {
        ...message,
        isDeleted: true,
        content: '[Deleted message]',
        metadata: {
          ...message.metadata,
          deletedAt: new Date().toISOString(),
          deletedBy: context.userId
        }
      };

      await this.messagesContainer.items.upsert(updatedMessage);

      // Создать событие удаления
      await this.createEvent(message.threadId, 'message_deleted', context.userId, { messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // ==========================================
  // Document Fragment Management
  // ==========================================

  /**
   * Создает фрагмент документа
   */
  async createDocumentFragment(
    documentId: string,
    request: CreateFragmentRequest,
    context: ChatContext
  ): Promise<DocumentFragment> {
    try {
      const fragmentId = uuidv4();
      const now = new Date().toISOString();

      const fragment: DocumentFragment = {
        id: fragmentId,
        documentId,
        selectionType: request.selectionType,
        startPosition: request.startPosition,
        endPosition: request.endPosition,
        selectedText: request.selectedText.substring(0, CHAT_CONSTANTS.MAX_FRAGMENT_TEXT_LENGTH),
        pageNumber: request.pageNumber,
        sectionTitle: request.sectionTitle,
        highlightColor: request.highlightColor || CHAT_CONSTANTS.FRAGMENT_HIGHLIGHT_COLORS[0],
        highlightOpacity: 0.3,
        createdBy: context.userId,
        createdByName: context.userName,
        createdAt: now,
        referenceTitle: request.referenceTitle,
        referenceDescription: request.referenceDescription,
        tags: request.tags || [],
        isActive: true,
        isResolved: false
      };

      await this.fragmentsContainer.items.create(fragment);

      // Создать событие создания фрагмента
      const threadId = `thread-${documentId}`;
      await this.createEvent(threadId, 'fragment_created', context.userId, { fragmentId, fragment });

      return fragment;
    } catch (error) {
      console.error('Error creating document fragment:', error);
      throw error;
    }
  }

  /**
   * Получает фрагменты документа
   */
  async getDocumentFragments(documentId: string, includeInactive: boolean = false): Promise<DocumentFragment[]> {
    try {
      let query = 'SELECT * FROM c WHERE c.documentId = @documentId';
      const parameters = [{ name: '@documentId', value: documentId }];

      if (!includeInactive) {
        query += ' AND c.isActive = true';
      }

      query += ' ORDER BY c.createdAt DESC';

      const { resources: fragments } = await this.fragmentsContainer.items.query({
        query,
        parameters
      }).fetchAll();

      return fragments;
    } catch (error) {
      console.error('Error getting document fragments:', error);
      throw error;
    }
  }

  /**
   * Обновляет фрагмент документа
   */
  async updateDocumentFragment(
    fragmentId: string,
    request: UpdateFragmentRequest,
    context: ChatContext
  ): Promise<DocumentFragment> {
    try {
      const fragment = await this.getFragmentById(fragmentId);
      if (!fragment) {
        throw new Error('Fragment not found');
      }

      const updatedFragment: DocumentFragment = {
        ...fragment,
        ...request,
        updatedAt: new Date().toISOString(),
        ...(request.isResolved && {
          resolvedBy: context.userId,
          resolvedAt: new Date().toISOString()
        })
      };

      await this.fragmentsContainer.items.upsert(updatedFragment);

      // Создать событие обновления фрагмента
      const threadId = `thread-${fragment.documentId}`;
      const eventType = request.isResolved ? 'fragment_resolved' : 'fragment_updated';
      await this.createEvent(threadId, eventType, context.userId, { fragmentId });

      return updatedFragment;
    } catch (error) {
      console.error('Error updating document fragment:', error);
      throw error;
    }
  }

  // ==========================================
  // Participant Management
  // ==========================================

  /**
   * Добавляет участника в чат
   */
  async addParticipant(
    threadId: string,
    context: ChatContext,
    permissions: string[] = ['read', 'write']
  ): Promise<ChatParticipant> {
    try {
      const participantId = uuidv4();
      const now = new Date().toISOString();

      const participant: ChatParticipant = {
        userId: context.userId,
        userName: context.userName,
        userEmail: context.userEmail,
        userRole: context.userRole,
        joinedAt: now,
        lastSeenAt: now,
        isOnline: true,
        isTyping: false,
        permissions: permissions as any,
        notificationSettings: {
          mentions: true,
          allMessages: true,
          statusUpdates: true,
          workflowChanges: true
        },
        isActive: true,
        isMuted: false
      };

      await this.participantsContainer.items.create({
        id: participantId,
        threadId,
        ...participant
      });

      // Обновить счетчик активных участников
      await this.updateActiveParticipants(threadId);

      // Создать событие присоединения
      await this.createEvent(threadId, 'user_joined', context.userId, { participant });

      return participant;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Получает участников чата
   */
  async getThreadParticipants(threadId: string): Promise<ChatParticipant[]> {
    try {
      const query = 'SELECT * FROM c WHERE c.threadId = @threadId AND c.isActive = true';
      const { resources: participants } = await this.participantsContainer.items.query({
        query,
        parameters: [{ name: '@threadId', value: threadId }]
      }).fetchAll();

      return participants.map(p => ({
        userId: p.userId,
        userName: p.userName,
        userEmail: p.userEmail,
        userRole: p.userRole,
        avatar: p.avatar,
        joinedAt: p.joinedAt,
        lastSeenAt: p.lastSeenAt,
        isOnline: p.isOnline,
        isTyping: p.isTyping,
        permissions: p.permissions,
        notificationSettings: p.notificationSettings,
        isActive: p.isActive,
        isMuted: p.isMuted
      }));
    } catch (error) {
      console.error('Error getting thread participants:', error);
      throw error;
    }
  }

  // ==========================================
  // Search & Analytics
  // ==========================================

  /**
   * Поиск сообщений
   */
  async searchMessages(query: ChatSearchQuery): Promise<ChatSearchResult> {
    try {
      let sqlQuery = 'SELECT * FROM c WHERE 1=1';
      const parameters: any[] = [];

      // Добавление фильтров
      if (query.threadId) {
        sqlQuery += ' AND c.threadId = @threadId';
        parameters.push({ name: '@threadId', value: query.threadId });
      }

      if (query.documentId) {
        sqlQuery += ' AND c.documentId = @documentId';
        parameters.push({ name: '@documentId', value: query.documentId });
      }

      if (query.query) {
        sqlQuery += ' AND CONTAINS(LOWER(c.content), LOWER(@searchQuery))';
        parameters.push({ name: '@searchQuery', value: query.query });
      }

      if (query.messageType) {
        sqlQuery += ' AND c.messageType = @messageType';
        parameters.push({ name: '@messageType', value: query.messageType });
      }

      if (query.senderId) {
        sqlQuery += ' AND c.senderId = @senderId';
        parameters.push({ name: '@senderId', value: query.senderId });
      }

      // Исключить удаленные сообщения
      sqlQuery += ' AND c.isDeleted != true';

      // Сортировка
      const sortBy = query.sortBy || 'timestamp';
      const sortOrder = query.sortOrder || 'desc';
      sqlQuery += ` ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}`;

      // Пагинация
      const limit = query.limit || CHAT_CONSTANTS.MESSAGE_BATCH_SIZE;
      const offset = query.offset || 0;
      sqlQuery += ` OFFSET ${offset} LIMIT ${limit}`;

      const { resources: messages } = await this.messagesContainer.items.query({
        query: sqlQuery,
        parameters
      }).fetchAll();

      // Подсчет общего количества без пагинации
      let countQuery = sqlQuery.replace('SELECT *', 'SELECT VALUE COUNT(1)');
      countQuery = countQuery.replace(/ORDER BY.*$/i, '').replace(/OFFSET.*$/i, '');

      const { resources: [totalCount] } = await this.messagesContainer.items.query({
        query: countQuery,
        parameters
      }).fetchAll();

      return {
        messages,
        totalCount: totalCount || 0,
        hasMore: offset + messages.length < totalCount
      };
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Получает статистику чата
   */
  async getChatStatistics(threadId: string): Promise<ChatStatistics> {
    try {
      const thread = await this.getThreadById(threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      // Получение основных метрик
      const messagesQuery = 'SELECT * FROM c WHERE c.threadId = @threadId AND c.isDeleted != true';
      const { resources: messages } = await this.messagesContainer.items.query({
        query: messagesQuery,
        parameters: [{ name: '@threadId', value: threadId }]
      }).fetchAll();

      const fragments = await this.getDocumentFragments(thread.documentId, true);
      const participants = await this.getThreadParticipants(threadId);

      // Вычисление статистики
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const messagesThisWeek = messages.filter(m => new Date(m.timestamp) > weekAgo).length;
      const messagesThisMonth = messages.filter(m => new Date(m.timestamp) > monthAgo).length;

      const statistics: ChatStatistics = {
        threadId,
        documentId: thread.documentId,
        totalMessages: messages.length,
        messagesThisWeek,
        messagesThisMonth,
        averageResponseTime: this.calculateAverageResponseTime(messages),
        activeParticipants: participants.filter(p => p.isActive).length,
        participationRate: this.calculateParticipationRate(messages, participants),
        totalFragments: fragments.length,
        resolvedFragments: fragments.filter(f => f.isResolved).length,
        pendingFragments: fragments.filter(f => f.isActive && !f.isResolved).length,
        dailyActivity: this.calculateDailyActivity(messages),
        topContributors: this.calculateTopContributors(messages, fragments)
      };

      return statistics;
    } catch (error) {
      console.error('Error getting chat statistics:', error);
      throw error;
    }
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private getDefaultThreadSettings(): ChatThreadSettings {
    return {
      allowFragmentHighlighting: true,
      allowFileAttachments: true,
      allowMessageEditing: true,
      allowMessageDeletion: true,
      allowReactions: true,
      notificationsEnabled: true,
      notificationSound: true,
      desktopNotifications: true,
      emailNotifications: false,
      retentionDays: 365,
      autoDeleteEnabled: false,
      complianceMode: false,
      encryptionEnabled: true,
      theme: 'light',
      messageGrouping: true,
      timestampFormat: '24h',
      dateFormat: 'relative',
      workflowNotifications: true,
      documentStatusUpdates: true,
      deadlineReminders: true
    };
  }

  private async ensureParticipant(threadId: string, context: ChatContext): Promise<void> {
    const participants = await this.getThreadParticipants(threadId);
    const existingParticipant = participants.find(p => p.userId === context.userId);
    
    if (!existingParticipant) {
      await this.addParticipant(threadId, context);
    }
  }

  private async getThreadById(threadId: string): Promise<ChatThread | null> {
    try {
      const { resource } = await this.threadsContainer.item(threadId, threadId.split('-')[1]).read();
      return resource || null;
    } catch (error) {
      if ((error as any).code === 404) {
        return null;
      }
      throw error;
    }
  }

  private async getMessageById(messageId: string): Promise<ChatMessage | null> {
    try {
      const query = 'SELECT * FROM c WHERE c.id = @messageId';
      const { resources } = await this.messagesContainer.items.query({
        query,
        parameters: [{ name: '@messageId', value: messageId }]
      }).fetchAll();

      return resources[0] || null;
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return null;
    }
  }

  private async getFragmentById(fragmentId: string): Promise<DocumentFragment | null> {
    try {
      const query = 'SELECT * FROM c WHERE c.id = @fragmentId';
      const { resources } = await this.fragmentsContainer.items.query({
        query,
        parameters: [{ name: '@fragmentId', value: fragmentId }]
      }).fetchAll();

      return resources[0] || null;
    } catch (error) {
      console.error('Error getting fragment by ID:', error);
      return null;
    }
  }

  private async getFragmentReferences(fragmentIds: string[]): Promise<any[]> {
    if (!fragmentIds.length) return [];

    try {
      const fragments = await Promise.all(
        fragmentIds.map(id => this.getFragmentById(id))
      );

      return fragments
        .filter(f => f !== null)
        .map(fragment => ({
          fragmentId: fragment!.id,
          referenceText: fragment!.referenceTitle || fragment!.selectedText.substring(0, 50) + '...',
          contextPreview: fragment!.selectedText,
          highlightColor: fragment!.highlightColor,
          pageNumber: fragment!.pageNumber,
          sectionTitle: fragment!.sectionTitle
        }));
    } catch (error) {
      console.error('Error getting fragment references:', error);
      return [];
    }
  }

  private async getThreadDocumentId(threadId: string): Promise<string> {
    const thread = await this.getThreadById(threadId);
    return thread?.documentId || '';
  }

  private async validateParticipantPermission(
    threadId: string, 
    userId: string, 
    permission: string
  ): Promise<void> {
    const participants = await this.getThreadParticipants(threadId);
    const participant = participants.find(p => p.userId === userId);
    
    if (!participant || !participant.permissions.includes(permission as any)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  private async updateThreadCounters(threadId: string, message: ChatMessage): Promise<void> {
    try {
      const thread = await this.getThreadById(threadId);
      if (!thread) return;

      const updatedThread: ChatThread = {
        ...thread,
        messageCount: thread.messageCount + 1,
        lastActivity: message.timestamp,
        lastMessage: message,
        updatedAt: new Date().toISOString()
      };

      await this.threadsContainer.items.upsert(updatedThread);
    } catch (error) {
      console.error('Error updating thread counters:', error);
    }
  }

  private async updateActiveParticipants(threadId: string): Promise<ChatThread> {
    const thread = await this.getThreadById(threadId);
    const participants = await this.getThreadParticipants(threadId);
    
    if (thread) {
      const updatedThread: ChatThread = {
        ...thread,
        activeParticipants: participants.filter(p => p.isActive).length,
        participants,
        updatedAt: new Date().toISOString()
      };

      await this.threadsContainer.items.upsert(updatedThread);
      return updatedThread;
    }
    
    return thread!;
  }

  private async createSystemMessage(
    threadId: string, 
    content: string, 
    context: ChatContext
  ): Promise<void> {
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      threadId,
      documentId: await this.getThreadDocumentId(threadId),
      senderId: 'system',
      senderName: 'System',
      senderEmail: '',
      senderRole: 'admin' as UserRole,
      content,
      messageType: 'system',
      timestamp: new Date().toISOString(),
      status: 'sent',
      isRead: false,
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      reactions: [],
      mentions: []
    };

    await this.messagesContainer.items.create(systemMessage);
  }

  private async createEvent(
    threadId: string,
    eventType: ChatEventType,
    userId: string,
    data: any
  ): Promise<void> {
    try {
      const event: ChatEvent = {
        id: uuidv4(),
        type: eventType,
        threadId,
        userId,
        timestamp: new Date().toISOString(),
        data
      };

      await this.eventsContainer.items.create(event);
    } catch (error) {
      console.error('Error creating chat event:', error);
    }
  }

  private calculateAverageResponseTime(messages: ChatMessage[]): number {
    if (messages.length < 2) return 0;

    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const currentTime = new Date(messages[i].timestamp).getTime();
      const previousTime = new Date(messages[i-1].timestamp).getTime();
      responseTimes.push((currentTime - previousTime) / (1000 * 60)); // in minutes
    }

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private calculateParticipationRate(messages: ChatMessage[], participants: ChatParticipant[]): number {
    const activeParticipants = new Set(messages.map(m => m.senderId)).size;
    return participants.length > 0 ? (activeParticipants / participants.length) * 100 : 0;
  }

  private calculateDailyActivity(messages: ChatMessage[]): Array<{ date: string; messageCount: number; participantCount: number }> {
    const dailyStats: Record<string, { messageCount: number; participants: Set<string> }> = {};

    messages.forEach(message => {
      const date = message.timestamp.split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { messageCount: 0, participants: new Set() };
      }
      dailyStats[date].messageCount++;
      dailyStats[date].participants.add(message.senderId);
    });

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      messageCount: stats.messageCount,
      participantCount: stats.participants.size
    }));
  }

  private calculateTopContributors(
    messages: ChatMessage[], 
    fragments: DocumentFragment[]
  ): Array<{ userId: string; userName: string; messageCount: number; fragmentCount: number }> {
    const contributors: Record<string, { userName: string; messageCount: number; fragmentCount: number }> = {};

    // Подсчет сообщений
    messages.forEach(message => {
      if (!contributors[message.senderId]) {
        contributors[message.senderId] = {
          userName: message.senderName,
          messageCount: 0,
          fragmentCount: 0
        };
      }
      contributors[message.senderId].messageCount++;
    });

    // Подсчет фрагментов
    fragments.forEach(fragment => {
      if (contributors[fragment.createdBy]) {
        contributors[fragment.createdBy].fragmentCount++;
      }
    });

    return Object.entries(contributors)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => (b.messageCount + b.fragmentCount) - (a.messageCount + a.fragmentCount))
      .slice(0, 10); // Top 10 contributors
  }
}
