/**
 * MessageList - component for displaying chat message list
 * Supports different message types, editing and deletion
 */

import React, { useState } from 'react';
import {
  Stack,
  Text,
  IconButton,
  PersonaCoin,
  PersonaSize,
  ContextualMenu,
  IContextualMenuItem,
  DirectionalHint,
  TextField,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType
} from '@fluentui/react';
import {
  Edit24Regular,
  Delete24Regular,
  Reply24Regular,
  More24Regular,
  Pin24Regular,
  Copy24Regular,
  Highlight24Regular
} from '@fluentui/react-icons';
import { ChatMessage, MessageType, DocumentFragment } from '../../shared/types/chat';
import { formatRelativeTime } from '../../shared/utils/dateUtils';

export interface MessageListProps {
  messages: ChatMessage[];
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReplyToMessage?: (messageId: string) => void;
  onFragmentReference?: (fragment: DocumentFragment) => void;
  currentUserId?: string;
}

export interface MessageItemProps {
  message: ChatMessage;
  isOwn?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReplyToMessage?: (messageId: string) => void;
  onFragmentReference?: (fragment: DocumentFragment) => void;
}

// ==========================================
// Individual Message Component
// ==========================================

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn = false,
  onEditMessage,
  onDeleteMessage,
  onReplyToMessage,
  onFragmentReference
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuTarget, setContextMenuTarget] = useState<HTMLElement | null>(null);

  // ==========================================
  // Context Menu Items
  // ==========================================

  const getContextMenuItems = (): IContextualMenuItem[] => {
    const items: IContextualMenuItem[] = [
      {
        key: 'copy',
        text: 'Copy message',
        iconProps: { iconName: 'Copy' },
        onClick: () => {
          navigator.clipboard.writeText(message.content);
          setShowContextMenu(false);
        }
      },
      {
        key: 'reply',
        text: 'Reply',
        iconProps: { iconName: 'Reply' },
        onClick: () => {
          onReplyToMessage?.(message.id);
          setShowContextMenu(false);
        }
      }
    ];

    if (isOwn && message.messageType === 'text') {
      items.push(
        {
          key: 'divider1',
          itemType: 'divider' as any
        },
        {
          key: 'edit',
          text: 'Edit message',
          iconProps: { iconName: 'Edit' },
          onClick: () => {
            setIsEditing(true);
            setShowContextMenu(false);
          }
        },
        {
          key: 'delete',
          text: 'Delete message',
          iconProps: { iconName: 'Delete' },
          onClick: () => {
            if (confirm('Are you sure you want to delete this message?')) {
              onDeleteMessage?.(message.id);
            }
            setShowContextMenu(false);
          }
        }
      );
    }

    return items;
  };

  // ==========================================
  // Event Handlers
  // ==========================================

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setContextMenuTarget(event.currentTarget as HTMLElement);
    setShowContextMenu(true);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEditMessage?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleFragmentClick = (fragmentRef: any) => {
    // Here will be the logic for highlighting fragment in document
    if (onFragmentReference && fragmentRef.fragment) {
      onFragmentReference(fragmentRef.fragment);
    }
  };

  // ==========================================
  // Render Helper Methods
  // ==========================================

  const renderMessageContent = () => {
    if (isEditing) {
      return (
        <Stack tokens={{ childrenGap: 8 }}>
          <TextField
            multiline
            rows={3}
            value={editContent}
            onChange={(_, newValue) => setEditContent(newValue || '')}
            placeholder="Edit your message..."
          />
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <PrimaryButton
              text="Save"
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
            />
            <DefaultButton
              text="Cancel"
              onClick={handleCancelEdit}
            />
          </Stack>
        </Stack>
      );
    }

    switch (message.messageType) {
      case 'system':
        return (
          <MessageBar messageBarType={MessageBarType.info}>
            {message.content}
          </MessageBar>
        );

      case 'fragment_reference':
        return (
          <Stack tokens={{ childrenGap: 8 }}>
            <Text>{message.content}</Text>
            {message.fragmentReferences && message.fragmentReferences.length > 0 && (
              <Stack tokens={{ childrenGap: 4 }}>
                {message.fragmentReferences.map((fragRef, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleFragmentClick(fragRef)}
                  >
                    <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                      <Highlight24Regular style={{ color: fragRef.highlightColor || '#0078d4' }} />
                      <Stack tokens={{ childrenGap: 2 }}>
                        <Text variant="small" weight="semibold">
                          {fragRef.referenceText}
                        </Text>
                        <Text variant="xSmall" style={{ color: '#666' }}>
                          {fragRef.contextPreview && fragRef.contextPreview.length > 100
                            ? fragRef.contextPreview.substring(0, 100) + '...'
                            : fragRef.contextPreview
                          }
                        </Text>
                        {fragRef.pageNumber && (
                          <Text variant="xSmall" style={{ color: '#888' }}>
                            Page {fragRef.pageNumber}
                          </Text>
                        )}
                      </Stack>
                    </Stack>
                  </div>
                ))}
              </Stack>
            )}
          </Stack>
        );

      case 'file':
        return (
          <Stack tokens={{ childrenGap: 8 }}>
            <Text>{message.content}</Text>
            {/* TODO: File attachments rendering */}
          </Stack>
        );

      default: // 'text'
        return (
          <Text>
            {message.content}
            {message.isEdited && (
              <Text variant="xSmall" style={{ color: '#666', marginLeft: 8 }}>
                (edited)
              </Text>
            )}
          </Text>
        );
    }
  };

  const getMessageBackgroundColor = () => {
    if (message.messageType === 'system') return 'transparent';
    return isOwn ? '#e1f5fe' : '#ffffff';
  };

  const getMessageAlignment = () => {
    if (message.messageType === 'system') return 'center';
    return isOwn ? 'end' : 'start';
  };

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <div style={{ width: '100%' }}>
      <Stack
        horizontal={message.messageType !== 'system'}
        horizontalAlign={getMessageAlignment() as any}
        tokens={{ childrenGap: 12 }}
        styles={{
          root: {
            marginBottom: '16px',
            padding: message.messageType === 'system' ? '8px' : '0'
          }
        }}
      >
        {message.messageType !== 'system' && !isOwn && (
          <PersonaCoin
            text={message.senderName}
            size={PersonaSize.size32}
            styles={{
              coin: {
                flexShrink: 0
              }
            }}
          />
        )}

        <Stack
          tokens={{ childrenGap: 4 }}
          styles={{
            root: {
              backgroundColor: getMessageBackgroundColor(),
              padding: message.messageType === 'system' ? '0' : '12px',
              borderRadius: '8px',
              border: message.messageType === 'system' ? 'none' : '1px solid #e1e1e1',
              maxWidth: '70%',
              minWidth: message.messageType === 'system' ? 'auto' : '200px',
              position: 'relative'
            }
          }}
        >
          {message.messageType !== 'system' && (
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
              <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                <Text variant="small" weight="semibold">
                  {message.senderName}
                </Text>
                <Text variant="xSmall" style={{ color: '#666' }}>
                  {formatRelativeTime(message.timestamp)}
                </Text>
                {message.senderRole && (
                  <Text variant="xSmall" style={{ color: '#888' }}>
                    ({message.senderRole})
                  </Text>
                )}
              </Stack>
              
              <IconButton
                iconProps={{ iconName: 'More' }}
                styles={{ root: { minWidth: 'auto' } }}
                onClick={handleMoreClick}
              />
            </Stack>
          )}

          {renderMessageContent()}

          {/* Mentions */}
          {message.mentions && message.mentions.length > 0 && (
            <Text variant="xSmall" style={{ color: '#0078d4' }}>
              @{message.mentions.join(' @')}
            </Text>
          )}

          {/* Reply indicator */}
          {message.replyToMessageId && (
            <Text variant="xSmall" style={{ color: '#666', fontStyle: 'italic' }}>
              Reply to message
            </Text>
          )}
        </Stack>

        {message.messageType !== 'system' && isOwn && (
          <PersonaCoin
            text={message.senderName}
            size={PersonaSize.size32}
            styles={{
              coin: {
                flexShrink: 0
              }
            }}
          />
        )}
      </Stack>

      {/* Context Menu */}
      <ContextualMenu
        items={getContextMenuItems()}
        target={contextMenuTarget}
        onDismiss={() => setShowContextMenu(false)}
        hidden={!showContextMenu}
        directionalHint={DirectionalHint.bottomLeftEdge}
      />
    </div>
  );
};

// ==========================================
// Main MessageList Component
// ==========================================

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onEditMessage,
  onDeleteMessage,
  onReplyToMessage,
  onFragmentReference,
  currentUserId = 'current-user' // TODO: Get from auth context
}) => {
  if (messages.length === 0) {
    return (
      <Stack horizontalAlign="center" tokens={{ padding: 32 }}>
        <Text variant="mediumPlus" style={{ color: '#666' }}>
          No messages yet. Start the conversation!
        </Text>
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 0 }}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onReplyToMessage={onReplyToMessage}
          onFragmentReference={onFragmentReference}
        />
      ))}
    </Stack>
  );
};
