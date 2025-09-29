/**
 * ChatWidget - основной компонент чата для документов
 * Предоставляет полнофункциональный интерфейс для общения о документе
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Panel,
  PanelType,
  Stack,
  Text,
  IconButton,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  SearchBox,
  CommandBar,
  ICommandBarItemProps,
  Separator
} from '@fluentui/react';
import {
  Dismiss24Regular,
  Chat24Regular,
  Settings24Regular,
  Search24Regular,
  Pin24Regular,
  More24Regular
} from '@fluentui/react-icons';
import { ChatThread, ChatMessage, DocumentFragment } from '../../shared/types/chat';
import { chatApi } from '../../shared/api/chatApi';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FragmentList } from './FragmentList';
import { ChatParticipants } from './ChatParticipants';
import { ChatSettings } from './ChatSettings';

export interface ChatWidgetProps {
  documentId: string;
  documentName: string;
  isOpen: boolean;
  onClose: () => void;
  onFragmentCreate?: (fragment: DocumentFragment) => void;
  onFragmentHighlight?: (fragment: DocumentFragment) => void;
  className?: string;
}

type ChatTab = 'messages' | 'fragments' | 'participants' | 'settings';

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  documentId,
  documentName,
  isOpen,
  onClose,
  onFragmentCreate,
  onFragmentHighlight,
  className = ''
}) => {
  // State
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fragments, setFragments] = useState<DocumentFragment[]>([]);
  const [activeTab, setActiveTab] = useState<ChatTab>('messages');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // Initialization & Data Loading
  // ==========================================

  useEffect(() => {
    if (isOpen && documentId) {
      initializeChat();
    }
  }, [isOpen, documentId]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Получение или создание чата
      const thread = await chatApi.getOrCreateDocumentChat(documentId, documentName);
      setChatThread(thread);

      // Загрузка сообщений
      await loadMessages();

      // Загрузка фрагментов
      await loadFragments();

    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to load chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (offset: number = 0, append: boolean = false) => {
    try {
      if (!chatThread) return;

      if (offset === 0) {
        setIsLoadingMore(false);
      } else {
        setIsLoadingMore(true);
      }

      const result = await chatApi.getThreadMessages(chatThread.id, 20, offset);
      
      if (append) {
        setMessages(prev => [...prev, ...result.messages]);
      } else {
        setMessages(result.messages);
        // Прокрутить к концу для новых сообщений
        setTimeout(scrollToBottom, 100);
      }
      
      setHasMore(result.hasMore);

    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadFragments = async () => {
    try {
      const fragmentList = await chatApi.getDocumentFragments(documentId);
      setFragments(fragmentList);
    } catch (error) {
      console.error('Error loading fragments:', error);
    }
  };

  // ==========================================
  // Message Handling
  // ==========================================

  const handleSendMessage = async (content: string, fragmentRefs?: string[]) => {
    try {
      if (!chatThread || !content.trim()) return;

      const newMessage = await chatApi.createMessage(chatThread.id, {
        content: content.trim(),
        messageType: fragmentRefs && fragmentRefs.length > 0 ? 'fragment_reference' : 'text',
        fragmentReferences: fragmentRefs
      });

      // Добавить сообщение в список
      setMessages(prev => [...prev, newMessage]);
      
      // Прокрутить к концу
      setTimeout(scrollToBottom, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const editedMessage = await chatApi.editMessage(messageId, newContent);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? editedMessage : msg
        )
      );

    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      
      // Обновить сообщение в UI (оно будет помечено как удаленное на бекенде)
      await loadMessages();

    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
    }
  };

  const handleLoadMoreMessages = () => {
    if (chatThread && hasMore && !isLoadingMore) {
      loadMessages(messages.length, true);
    }
  };

  // ==========================================
  // Fragment Handling
  // ==========================================

  const handleCreateFragment = async (fragment: Omit<DocumentFragment, 'id' | 'documentId' | 'createdAt' | 'createdBy' | 'createdByName' | 'isActive' | 'isResolved'>) => {
    try {
      const newFragment = await chatApi.createDocumentFragment(documentId, {
        selectionType: fragment.selectionType,
        startPosition: fragment.startPosition,
        endPosition: fragment.endPosition,
        selectedText: fragment.selectedText,
        pageNumber: fragment.pageNumber,
        sectionTitle: fragment.sectionTitle,
        highlightColor: fragment.highlightColor,
        referenceTitle: fragment.referenceTitle,
        referenceDescription: fragment.referenceDescription,
        tags: fragment.tags
      });

      setFragments(prev => [...prev, newFragment]);
      onFragmentCreate?.(newFragment);

    } catch (error) {
      console.error('Error creating fragment:', error);
      setError('Failed to create fragment');
    }
  };

  const handleUpdateFragment = async (fragmentId: string, updates: any) => {
    try {
      const updatedFragment = await chatApi.updateDocumentFragment(fragmentId, updates);
      
      setFragments(prev => 
        prev.map(frag => 
          frag.id === fragmentId ? updatedFragment : frag
        )
      );

    } catch (error) {
      console.error('Error updating fragment:', error);
      setError('Failed to update fragment');
    }
  };

  const handleFragmentHighlight = (fragment: DocumentFragment) => {
    onFragmentHighlight?.(fragment);
  };

  // ==========================================
  // Utility Functions
  // ==========================================

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || !chatThread) {
      await loadMessages();
      return;
    }

    try {
      const searchResult = await chatApi.searchMessages({
        threadId: chatThread.id,
        query: query.trim(),
        limit: 50,
        offset: 0
      });

      setMessages(searchResult.messages);
      setHasMore(false);

    } catch (error) {
      console.error('Error searching messages:', error);
      setError('Failed to search messages');
    }
  }, [chatThread]);

  const clearSearch = () => {
    setSearchQuery('');
    loadMessages();
  };

  // ==========================================
  // Command Bar Items
  // ==========================================

  const getCommandBarItems = (): ICommandBarItemProps[] => [
    {
      key: 'messages',
      text: 'Messages',
      iconProps: { iconName: 'Message' },
      onClick: () => setActiveTab('messages'),
      className: activeTab === 'messages' ? 'is-selected' : ''
    },
    {
      key: 'fragments',
      text: `Fragments (${fragments.length})`,
      iconProps: { iconName: 'Highlight' },
      onClick: () => setActiveTab('fragments'),
      className: activeTab === 'fragments' ? 'is-selected' : ''
    },
    {
      key: 'participants',
      text: 'Participants',
      iconProps: { iconName: 'People' },
      onClick: () => setActiveTab('participants'),
      className: activeTab === 'participants' ? 'is-selected' : ''
    }
  ];

  const getFarCommandBarItems = (): ICommandBarItemProps[] => [
    {
      key: 'settings',
      iconProps: { iconName: 'Settings' },
      onClick: () => setActiveTab('settings')
    },
    {
      key: 'close',
      iconProps: { iconName: 'Cancel' },
      onClick: onClose
    }
  ];

  // ==========================================
  // Render Methods
  // ==========================================

  const renderTabContent = () => {
    if (!chatThread) return null;

    switch (activeTab) {
      case 'messages':
        return (
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { height: '100%', flex: 1 } }}>
            {searchQuery && (
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Text variant="small">
                  Search results for: "{searchQuery}"
                </Text>
                <IconButton
                  iconProps={{ iconName: 'Clear' }}
                  onClick={clearSearch}
                  title="Clear search"
                />
              </Stack>
            )}
            
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px',
                maxHeight: 'calc(100vh - 300px)'
              }}
            >
              {hasMore && !searchQuery && (
                <Stack horizontalAlign="center" tokens={{ padding: 8 }}>
                  {isLoadingMore ? (
                    <Spinner size={SpinnerSize.small} />
                  ) : (
                    <IconButton
                      iconProps={{ iconName: 'ChevronUp' }}
                      text="Load more messages"
                      onClick={handleLoadMoreMessages}
                    />
                  )}
                </Stack>
              )}
              
              <MessageList
                messages={messages}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onFragmentReference={handleFragmentHighlight}
              />
            </div>
            
            <MessageInput
              onSendMessage={handleSendMessage}
              fragments={fragments}
              disabled={isLoading}
            />
          </Stack>
        );

      case 'fragments':
        return (
          <FragmentList
            fragments={fragments}
            onCreateFragment={handleCreateFragment}
            onUpdateFragment={handleUpdateFragment}
            onFragmentClick={handleFragmentHighlight}
          />
        );

      case 'participants':
        return (
          <ChatParticipants
            threadId={chatThread.id}
          />
        );

      case 'settings':
        return (
          <ChatSettings
            threadId={chatThread.id}
            settings={chatThread.settings}
            onSettingsUpdate={(settings) => {
              setChatThread(prev => prev ? { ...prev, settings } : null);
            }}
          />
        );

      default:
        return null;
    }
  };

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onClose}
      type={PanelType.medium}
      headerText={`Chat: ${documentName}`}
      closeButtonAriaLabel="Close chat"
      className={`chat-widget ${className}`}
      isLightDismiss={false}
      customWidth="420px"
    >
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { height: '100%' } }}>
        {/* Error Message */}
        {error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={() => setError(null)}
          >
            {error}
          </MessageBar>
        )}

        {/* Search Box */}
        {activeTab === 'messages' && (
          <SearchBox
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(_, newValue) => setSearchQuery(newValue || '')}
            onSearch={handleSearch}
            onClear={clearSearch}
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <Stack horizontalAlign="center" tokens={{ padding: 20 }}>
            <Spinner size={SpinnerSize.large} label="Loading chat..." />
          </Stack>
        ) : (
          <>
            {/* Command Bar */}
            <CommandBar
              items={getCommandBarItems()}
              farItems={getFarCommandBarItems()}
              styles={{
                root: {
                  paddingLeft: 0,
                  paddingRight: 0
                }
              }}
            />

            <Separator />

            {/* Tab Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {renderTabContent()}
            </div>
          </>
        )}
      </Stack>
    </Panel>
  );
};
