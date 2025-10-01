/**
 * Chat System Types and Interfaces
 * Types and interfaces for document chat system
 */

import type { EncryptedMessage } from '../lib/encryption';

// ==========================================
// Core Chat Types
// ==========================================

export type MessageType = 'text' | 'system' | 'fragment_reference' | 'file_attachment' | 'status_update';

export type UserRole = 'service_provider' | 'end_user' | 'admin' | 'team_lead';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type FragmentSelectionType = 'text' | 'paragraph' | 'section' | 'page' | 'table' | 'image';

// ==========================================
// Chat Message Interface
// ==========================================

export interface ChatMessage {
  id: string;
  threadId: string;
  documentId: string;
  
  // Sender information
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: UserRole;
  senderAvatar?: string;
  
  // Message content
  content: string;
  messageType: MessageType;
  formattedContent?: string; // HTML formatted content
  
  // Fragment references
  fragmentReferences?: DocumentFragmentReference[];
  
  // File attachments
  attachments?: MessageAttachment[];
  
  // Message metadata
  timestamp: string;
  editedAt?: string;
  replyToMessageId?: string;
  
  // Status and flags
  status: MessageStatus;
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  
  // End-to-End Encryption
  isEncrypted?: boolean;
  encryptedContent?: EncryptedMessage;
  isDecrypted?: boolean;
  encryptionKeyId?: string;
  
  // Reactions and interactions
  reactions?: MessageReaction[];
  mentions?: string[]; // User IDs mentioned in message
  
  // Technical metadata
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    messageLength: number;
    processingTime?: number;
    editHistory?: MessageEdit[];
  };
}

// ==========================================
// Document Fragment Interfaces
// ==========================================

export interface DocumentFragment {
  id: string;
  documentId: string;
  
  // Selection details
  selectionType: FragmentSelectionType;
  startPosition: number;
  endPosition: number;
  selectedText: string;
  
  // Document context
  pageNumber?: number;
  sectionTitle?: string;
  paragraphIndex?: number;
  
  // Visual representation
  highlightColor: string;
  highlightOpacity: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  
  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  
  // Reference information
  referenceTitle?: string;
  referenceDescription?: string;
  tags?: string[];
  
  // Status
  isActive: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  
  // Additional context
  surroundingText?: {
    before: string;
    after: string;
  };
}

export interface DocumentFragmentReference {
  fragmentId: string;
  referenceText: string;
  contextPreview: string;
  highlightColor: string;
  pageNumber?: number;
  sectionTitle?: string;
}

// ==========================================
// Chat Thread Interface
// ==========================================

export interface ChatThread {
  id: string;
  documentId: string;
  documentName: string;
  documentType?: string;
  
  // Participants
  participants: ChatParticipant[];
  activeParticipants: number;
  
  // Thread status
  isActive: boolean;
  isArchived: boolean;
  lastActivity: string;
  
  // Message statistics
  messageCount: number;
  unreadCount: number;
  lastMessage?: ChatMessage;
  
  // Thread settings
  settings: ChatThreadSettings;
  
  // Workflow integration
  workflowStage?: string;
  workflowStatus?: string;
  
  // Metadata
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  
  // Thread type
  threadType: 'document' | 'workflow' | 'approval' | 'general';
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  avatar?: string;
  
  // Participation info
  joinedAt: string;
  lastSeenAt: string;
  isOnline: boolean;
  isTyping: boolean;
  
  // Permissions
  permissions: ChatPermission[];
  
  // Notification preferences
  notificationSettings: {
    mentions: boolean;
    allMessages: boolean;
    statusUpdates: boolean;
    workflowChanges: boolean;
  };
  
  // Status
  isActive: boolean;
  isMuted: boolean;
}

// ==========================================
// Chat Settings & Configuration
// ==========================================

export interface ChatThreadSettings {
  // Feature toggles
  allowFragmentHighlighting: boolean;
  allowFileAttachments: boolean;
  allowMessageEditing: boolean;
  allowMessageDeletion: boolean;
  allowReactions: boolean;
  
  // Notifications
  notificationsEnabled: boolean;
  notificationSound: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  
  // Retention and compliance
  retentionDays: number;
  autoDeleteEnabled: boolean;
  complianceMode: boolean;
  encryptionEnabled: boolean;
  
  // End-to-End Encryption settings
  e2eeEnabled?: boolean;
  e2eeKeyRotationDays?: number;
  e2eeSessionKeyId?: string;
  e2eeStatus?: 'active' | 'pending' | 'disabled' | 'error';
  
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  messageGrouping: boolean;
  timestampFormat: '12h' | '24h';
  dateFormat: 'relative' | 'absolute';
  
  // Integration settings
  workflowNotifications: boolean;
  documentStatusUpdates: boolean;
  deadlineReminders: boolean;
}

export type ChatPermission = 
  | 'read' 
  | 'write' 
  | 'edit_own_messages' 
  | 'delete_own_messages' 
  | 'create_fragments' 
  | 'manage_fragments' 
  | 'pin_messages' 
  | 'invite_participants' 
  | 'remove_participants' 
  | 'manage_settings';

// ==========================================
// Message Interactions
// ==========================================

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
  timestamp: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  
  // Upload info
  uploadedBy: string;
  uploadedAt: string;
  
  // File metadata
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for video/audio files
  
  // Security
  isScanned: boolean;
  scanResult?: 'safe' | 'suspicious' | 'malware';
}

export interface MessageEdit {
  editedAt: string;
  editedBy: string;
  previousContent: string;
  editReason?: string;
}

// ==========================================
// Chat Events & Real-time Types
// ==========================================

export type ChatEventType = 
  | 'message_sent'
  | 'message_edited'
  | 'message_deleted'
  | 'message_read'
  | 'user_typing_start'
  | 'user_typing_stop'
  | 'user_joined'
  | 'user_left'
  | 'user_online'
  | 'user_offline'
  | 'fragment_created'
  | 'fragment_updated'
  | 'fragment_resolved'
  | 'thread_archived'
  | 'thread_unarchived'
  | 'settings_changed';

export interface ChatEvent {
  id: string;
  type: ChatEventType;
  threadId: string;
  userId: string;
  timestamp: string;
  
  // Event data
  data: {
    messageId?: string;
    fragmentId?: string;
    message?: ChatMessage;
    fragment?: DocumentFragment;
    settings?: Partial<ChatThreadSettings>;
    [key: string]: any;
  };
  
  // Target users (for selective broadcasting)
  targetUsers?: string[];
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  threadId: string;
  isTyping: boolean;
  timestamp: string;
}

// ==========================================
// Search & Filter Types
// ==========================================

export interface ChatSearchQuery {
  threadId?: string;
  documentId?: string;
  query: string;
  
  // Filters
  messageType?: MessageType;
  senderRole?: UserRole;
  senderId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasAttachments?: boolean;
  hasFragments?: boolean;
  isUnread?: boolean;
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Sorting
  sortBy?: 'timestamp' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface ChatSearchResult {
  messages: ChatMessage[];
  totalCount: number;
  hasMore: boolean;
  aggregations?: {
    messageTypes: Record<MessageType, number>;
    senders: Record<string, number>;
    dates: Record<string, number>;
  };
}

// ==========================================
// API Request/Response Types
// ==========================================

export interface CreateMessageRequest {
  content: string;
  messageType?: MessageType;
  fragmentReferences?: string[]; // Fragment IDs
  replyToMessageId?: string;
  attachments?: File[];
  mentions?: string[]; // User IDs
}

export interface CreateFragmentRequest {
  selectionType: FragmentSelectionType;
  startPosition: number;
  endPosition: number;
  selectedText: string;
  pageNumber?: number;
  sectionTitle?: string;
  highlightColor?: string;
  referenceTitle?: string;
  referenceDescription?: string;
  tags?: string[];
}

export interface UpdateFragmentRequest {
  referenceTitle?: string;
  referenceDescription?: string;
  tags?: string[];
  isResolved?: boolean;
  highlightColor?: string;
}

export interface AddParticipantRequest {
  userId: string;
  permissions?: ChatPermission[];
}

export interface UpdateSettingsRequest {
  settings: Partial<ChatThreadSettings>;
}

// ==========================================
// Chat Statistics & Analytics
// ==========================================

export interface ChatStatistics {
  threadId: string;
  documentId: string;
  
  // Message statistics
  totalMessages: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  averageResponseTime: number; // in minutes
  
  // Participation statistics
  activeParticipants: number;
  participationRate: number; // percentage
  
  // Fragment statistics
  totalFragments: number;
  resolvedFragments: number;
  pendingFragments: number;
  
  // Activity timeline
  dailyActivity: Array<{
    date: string;
    messageCount: number;
    participantCount: number;
  }>;
  
  // Top contributors
  topContributors: Array<{
    userId: string;
    userName: string;
    messageCount: number;
    fragmentCount: number;
  }>;
}

// ==========================================
// Chat Notifications
// ==========================================

export interface ChatNotification {
  id: string;
  type: 'message' | 'mention' | 'fragment' | 'status' | 'workflow';
  threadId: string;
  documentId: string;
  recipientId: string;
  
  // Notification content
  title: string;
  message: string;
  actionUrl?: string;
  
  // Sender info
  senderId?: string;
  senderName?: string;
  
  // Status
  isRead: boolean;
  isDelivered: boolean;
  createdAt: string;
  readAt?: string;
  
  // Delivery channels
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  
  // Priority
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// ==========================================
// Error Types
// ==========================================

export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export type ChatErrorCode = 
  | 'THREAD_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'FRAGMENT_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'PARTICIPANT_NOT_FOUND'
  | 'INVALID_MESSAGE_CONTENT'
  | 'ATTACHMENT_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'THREAD_ARCHIVED'
  | 'ENCRYPTION_FAILED'
  | 'VALIDATION_ERROR';

// ==========================================
// Utility Types
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ChatApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ChatError;
}

// ==========================================
// Export All Types
// ==========================================

export type {
  ChatMessage,
  DocumentFragment,
  DocumentFragmentReference,
  ChatThread,
  ChatParticipant,
  ChatThreadSettings,
  MessageReaction,
  MessageAttachment,
  MessageEdit,
  ChatEvent,
  TypingIndicator,
  ChatSearchQuery,
  ChatSearchResult,
  CreateMessageRequest,
  CreateFragmentRequest,
  UpdateFragmentRequest,
  AddParticipantRequest,
  UpdateSettingsRequest,
  ChatStatistics,
  ChatNotification,
  ChatError,
  PaginatedResponse,
  ChatApiResponse
};

// ==========================================
// Constants
// ==========================================

export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_FRAGMENT_TEXT_LENGTH: 1000,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ATTACHMENTS_PER_MESSAGE: 5,
  TYPING_TIMEOUT: 3000, // 3 seconds
  MESSAGE_BATCH_SIZE: 50,
  FRAGMENT_HIGHLIGHT_COLORS: [
    '#ffeb3b', // Yellow
    '#4caf50', // Green
    '#2196f3', // Blue
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#f44336', // Red
    '#00bcd4', // Cyan
    '#795548'  // Brown
  ],
  NOTIFICATION_SOUND_DURATION: 1000,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  CONNECTION_RETRY_ATTEMPTS: 3,
  CONNECTION_RETRY_DELAY: 2000, // 2 seconds
} as const;
