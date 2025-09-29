/**
 * Chat API - Azure Functions endpoints для системы чата
 * Обеспечивает REST API для работы с чатами, сообщениями и фрагментами документов
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ChatService, ChatContext } from '../shared/chat/chatService';
import { createProtectedFunction, RBAC_CONFIGS } from '../shared/middleware/rbacMiddleware';
import { auditMiddleware } from '../shared/audit/auditMiddleware';
import { AuditActions, AuditLogResourceType } from '../../../src/shared/types/audit';
import { z } from 'zod';

// Создание экземпляра сервиса
const chatService = new ChatService();

// ==========================================
// Validation Schemas
// ==========================================

const createMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  messageType: z.enum(['text', 'system', 'file', 'fragment_reference']).default('text'),
  replyToMessageId: z.string().optional(),
  fragmentReferences: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional()
});

const createFragmentSchema = z.object({
  selectionType: z.enum(['text', 'image', 'section']),
  startPosition: z.number().min(0),
  endPosition: z.number().min(0),
  selectedText: z.string().min(1).max(2000),
  pageNumber: z.number().min(1).optional(),
  sectionTitle: z.string().optional(),
  highlightColor: z.string().optional(),
  referenceTitle: z.string().optional(),
  referenceDescription: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateFragmentSchema = z.object({
  highlightColor: z.string().optional(),
  referenceTitle: z.string().optional(),
  referenceDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isResolved: z.boolean().optional(),
  isActive: z.boolean().optional()
});

const searchMessagesSchema = z.object({
  threadId: z.string().optional(),
  documentId: z.string().optional(),
  query: z.string().optional(),
  messageType: z.enum(['text', 'system', 'file', 'fragment_reference']).optional(),
  senderId: z.string().optional(),
  sortBy: z.enum(['timestamp', 'relevance']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

// ==========================================
// Helper Functions
// ==========================================

function createChatContext(req: HttpRequest, user: any): ChatContext {
  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    organizationId: user.organizationId,
    ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };
}

function createSuccessResponse(data: any, message?: string): HttpResponseInit {
  return {
    status: 200,
    jsonBody: {
      success: true,
      data,
      message
    }
  };
}

function createErrorResponse(status: number, message: string, details?: any): HttpResponseInit {
  return {
    status,
    jsonBody: {
      success: false,
      error: message,
      details
    }
  };
}

// ==========================================
// Chat Thread Management
// ==========================================

/**
 * GET /api/chat/documents/{documentId}/thread
 * Получает или создает чат для документа
 */
const getOrCreateDocumentChat = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const documentId = request.params.documentId;
      const documentName = request.query.get('documentName') || `Document ${documentId}`;

      if (!documentId) {
        return createErrorResponse(400, 'Document ID is required');
      }

      const chatContext = createChatContext(request, user);
      const thread = await chatService.getOrCreateDocumentChat(documentId, documentName, chatContext);

      // Audit log
      await auditMiddleware.recordAuditLog(
        user.id,
        user.name,
        user.email,
        AuditActions.ChatViewed,
        AuditLogResourceType.Chat,
        thread.id,
        `Chat thread for document ${documentName}`,
        { documentId, threadId: thread.id },
        chatContext.ipAddress,
        chatContext.userAgent
      );

      return createSuccessResponse(thread, 'Chat thread retrieved successfully');
    } catch (error) {
      context.error('Error getting/creating document chat:', error);
      return createErrorResponse(500, 'Failed to get document chat');
    }
  }
);

/**
 * GET /api/chat/threads/{threadId}
 * Получает информацию о чате
 */
const getChatThread = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const threadId = request.params.threadId;

      if (!threadId) {
        return createErrorResponse(400, 'Thread ID is required');
      }

      const thread = await (chatService as any).getThreadById(threadId);
      
      if (!thread) {
        return createErrorResponse(404, 'Chat thread not found');
      }

      return createSuccessResponse(thread, 'Chat thread retrieved successfully');
    } catch (error) {
      context.error('Error getting chat thread:', error);
      return createErrorResponse(500, 'Failed to get chat thread');
    }
  }
);

/**
 * PUT /api/chat/threads/{threadId}/settings
 * Обновляет настройки чата
 */
const updateThreadSettings = createProtectedFunction(
  [RBAC_CONFIGS.documents.update],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const threadId = request.params.threadId;
      const settings = await request.json();

      if (!threadId) {
        return createErrorResponse(400, 'Thread ID is required');
      }

      const chatContext = createChatContext(request, user);
      const updatedThread = await chatService.updateThreadSettings(threadId, settings, chatContext);

      return createSuccessResponse(updatedThread, 'Chat settings updated successfully');
    } catch (error) {
      context.error('Error updating thread settings:', error);
      return createErrorResponse(500, 'Failed to update chat settings');
    }
  }
);

// ==========================================
// Message Management
// ==========================================

/**
 * GET /api/chat/threads/{threadId}/messages
 * Получает сообщения чата
 */
const getThreadMessages = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const threadId = request.params.threadId;
      const limit = parseInt(request.query.get('limit') || '20');
      const offset = parseInt(request.query.get('offset') || '0');

      if (!threadId) {
        return createErrorResponse(400, 'Thread ID is required');
      }

      const result = await chatService.getThreadMessages(threadId, limit, offset);

      return createSuccessResponse(result, 'Messages retrieved successfully');
    } catch (error) {
      context.error('Error getting thread messages:', error);
      return createErrorResponse(500, 'Failed to get messages');
    }
  }
);

/**
 * POST /api/chat/threads/{threadId}/messages
 * Создает новое сообщение
 */
const createMessage = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const threadId = request.params.threadId;
      const body = await request.json();

      if (!threadId) {
        return createErrorResponse(400, 'Thread ID is required');
      }

      // Валидация входных данных
      const validation = createMessageSchema.safeParse(body);
      if (!validation.success) {
        return createErrorResponse(400, 'Invalid message data', validation.error.errors);
      }

      const chatContext = createChatContext(request, user);
      const message = await chatService.createMessage(threadId, validation.data, chatContext);

      // Audit log
      await auditMiddleware.recordAuditLog(
        user.id,
        user.name,
        user.email,
        AuditActions.ChatSent,
        AuditLogResourceType.Chat,
        message.id,
        `Message in thread ${threadId}`,
        { threadId, messageType: message.messageType, contentLength: message.content.length },
        chatContext.ipAddress,
        chatContext.userAgent
      );

      return createSuccessResponse(message, 'Message created successfully');
    } catch (error) {
      context.error('Error creating message:', error);
      return createErrorResponse(500, 'Failed to create message');
    }
  }
);

/**
 * PUT /api/chat/messages/{messageId}
 * Редактирует сообщение
 */
const editMessage = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const messageId = request.params.messageId;
      const { content } = await request.json();

      if (!messageId) {
        return createErrorResponse(400, 'Message ID is required');
      }

      if (!content || typeof content !== 'string') {
        return createErrorResponse(400, 'Message content is required');
      }

      const chatContext = createChatContext(request, user);
      const updatedMessage = await chatService.editMessage(messageId, content, chatContext);

      return createSuccessResponse(updatedMessage, 'Message edited successfully');
    } catch (error) {
      context.error('Error editing message:', error);
      if (error instanceof Error && error.message.includes('Permission denied')) {
        return createErrorResponse(403, error.message);
      }
      return createErrorResponse(500, 'Failed to edit message');
    }
  }
);

/**
 * DELETE /api/chat/messages/{messageId}
 * Удаляет сообщение
 */
const deleteMessage = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const messageId = request.params.messageId;

      if (!messageId) {
        return createErrorResponse(400, 'Message ID is required');
      }

      const chatContext = createChatContext(request, user);
      await chatService.deleteMessage(messageId, chatContext);

      return createSuccessResponse(null, 'Message deleted successfully');
    } catch (error) {
      context.error('Error deleting message:', error);
      if (error instanceof Error && error.message.includes('Permission denied')) {
        return createErrorResponse(403, error.message);
      }
      return createErrorResponse(500, 'Failed to delete message');
    }
  }
);

// ==========================================
// Document Fragment Management
// ==========================================

/**
 * GET /api/chat/documents/{documentId}/fragments
 * Получает фрагменты документа
 */
const getDocumentFragments = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const documentId = request.params.documentId;
      const includeInactive = request.query.get('includeInactive') === 'true';

      if (!documentId) {
        return createErrorResponse(400, 'Document ID is required');
      }

      const fragments = await chatService.getDocumentFragments(documentId, includeInactive);

      return createSuccessResponse(fragments, 'Document fragments retrieved successfully');
    } catch (error) {
      context.error('Error getting document fragments:', error);
      return createErrorResponse(500, 'Failed to get document fragments');
    }
  }
);

/**
 * POST /api/chat/documents/{documentId}/fragments
 * Создает фрагмент документа
 */
const createDocumentFragment = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const documentId = request.params.documentId;
      const body = await request.json();

      if (!documentId) {
        return createErrorResponse(400, 'Document ID is required');
      }

      // Валидация входных данных
      const validation = createFragmentSchema.safeParse(body);
      if (!validation.success) {
        return createErrorResponse(400, 'Invalid fragment data', validation.error.errors);
      }

      const chatContext = createChatContext(request, user);
      const fragment = await chatService.createDocumentFragment(documentId, validation.data, chatContext);

      return createSuccessResponse(fragment, 'Document fragment created successfully');
    } catch (error) {
      context.error('Error creating document fragment:', error);
      return createErrorResponse(500, 'Failed to create document fragment');
    }
  }
);

/**
 * PUT /api/chat/fragments/{fragmentId}
 * Обновляет фрагмент документа
 */
const updateDocumentFragment = createProtectedFunction(
  [RBAC_CONFIGS.documents.update],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const fragmentId = request.params.fragmentId;
      const body = await request.json();

      if (!fragmentId) {
        return createErrorResponse(400, 'Fragment ID is required');
      }

      // Валидация входных данных
      const validation = updateFragmentSchema.safeParse(body);
      if (!validation.success) {
        return createErrorResponse(400, 'Invalid fragment update data', validation.error.errors);
      }

      const chatContext = createChatContext(request, user);
      const fragment = await chatService.updateDocumentFragment(fragmentId, validation.data, chatContext);

      return createSuccessResponse(fragment, 'Document fragment updated successfully');
    } catch (error) {
      context.error('Error updating document fragment:', error);
      return createErrorResponse(500, 'Failed to update document fragment');
    }
  }
);

// ==========================================
// Participant Management
// ==========================================

/**
 * GET /api/chat/threads/{threadId}/participants
 * Получает участников чата
 */
const getThreadParticipants = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const threadId = request.params.threadId;

      if (!threadId) {
        return createErrorResponse(400, 'Thread ID is required');
      }

      const participants = await chatService.getThreadParticipants(threadId);

      return createSuccessResponse(participants, 'Thread participants retrieved successfully');
    } catch (error) {
      context.error('Error getting thread participants:', error);
      return createErrorResponse(500, 'Failed to get thread participants');
    }
  }
);

// ==========================================
// Search & Analytics
// ==========================================

/**
 * POST /api/chat/search
 * Поиск сообщений
 */
const searchMessages = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const body = await request.json();

      // Валидация входных данных
      const validation = searchMessagesSchema.safeParse(body);
      if (!validation.success) {
        return createErrorResponse(400, 'Invalid search parameters', validation.error.errors);
      }

      const result = await chatService.searchMessages(validation.data);

      return createSuccessResponse(result, 'Message search completed successfully');
    } catch (error) {
      context.error('Error searching messages:', error);
      return createErrorResponse(500, 'Failed to search messages');
    }
  }
);

/**
 * GET /api/chat/threads/{threadId}/statistics
 * Получает статистику чата
 */
const getChatStatistics = createProtectedFunction(
  [RBAC_CONFIGS.documents.read],
  async (request: HttpRequest, context: InvocationContext, user: any): Promise<HttpResponseInit> => {
    try {
      const threadId = request.params.threadId;

      if (!threadId) {
        return createErrorResponse(400, 'Thread ID is required');
      }

      const statistics = await chatService.getChatStatistics(threadId);

      return createSuccessResponse(statistics, 'Chat statistics retrieved successfully');
    } catch (error) {
      context.error('Error getting chat statistics:', error);
      return createErrorResponse(500, 'Failed to get chat statistics');
    }
  }
);

// ==========================================
// Register Azure Functions
// ==========================================

// Chat Thread Management
app.http('getChatDocumentThread', {
  methods: ['GET'],
  route: 'chat/documents/{documentId}/thread',
  authLevel: 'anonymous',
  handler: getOrCreateDocumentChat
});

app.http('getChatThread', {
  methods: ['GET'],
  route: 'chat/threads/{threadId}',
  authLevel: 'anonymous',
  handler: getChatThread
});

app.http('updateChatThreadSettings', {
  methods: ['PUT'],
  route: 'chat/threads/{threadId}/settings',
  authLevel: 'anonymous',
  handler: updateThreadSettings
});

// Message Management
app.http('getChatThreadMessages', {
  methods: ['GET'],
  route: 'chat/threads/{threadId}/messages',
  authLevel: 'anonymous',
  handler: getThreadMessages
});

app.http('createChatMessage', {
  methods: ['POST'],
  route: 'chat/threads/{threadId}/messages',
  authLevel: 'anonymous',
  handler: createMessage
});

app.http('editChatMessage', {
  methods: ['PUT'],
  route: 'chat/messages/{messageId}',
  authLevel: 'anonymous',
  handler: editMessage
});

app.http('deleteChatMessage', {
  methods: ['DELETE'],
  route: 'chat/messages/{messageId}',
  authLevel: 'anonymous',
  handler: deleteMessage
});

// Document Fragment Management
app.http('getDocumentFragments', {
  methods: ['GET'],
  route: 'chat/documents/{documentId}/fragments',
  authLevel: 'anonymous',
  handler: getDocumentFragments
});

app.http('createDocumentFragment', {
  methods: ['POST'],
  route: 'chat/documents/{documentId}/fragments',
  authLevel: 'anonymous',
  handler: createDocumentFragment
});

app.http('updateDocumentFragment', {
  methods: ['PUT'],
  route: 'chat/fragments/{fragmentId}',
  authLevel: 'anonymous',
  handler: updateDocumentFragment
});

// Participant Management
app.http('getChatThreadParticipants', {
  methods: ['GET'],
  route: 'chat/threads/{threadId}/participants',
  authLevel: 'anonymous',
  handler: getThreadParticipants
});

// Search & Analytics
app.http('searchChatMessages', {
  methods: ['POST'],
  route: 'chat/search',
  authLevel: 'anonymous',
  handler: searchMessages
});

app.http('getChatStatistics', {
  methods: ['GET'],
  route: 'chat/threads/{threadId}/statistics',
  authLevel: 'anonymous',
  handler: getChatStatistics
});
