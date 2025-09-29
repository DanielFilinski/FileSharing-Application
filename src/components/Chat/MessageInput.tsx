/**
 * MessageInput - компонент для ввода и отправки сообщений
 * Поддерживает текст, упоминания, ссылки на фрагменты и файлы
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Stack,
  TextField,
  IconButton,
  Callout,
  DirectionalHint,
  List,
  Text,
  Separator,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType
} from '@fluentui/react';
import {
  Send24Regular,
  Attach24Regular,
  Highlight24Regular,
  Emoji24Regular,
  Mention24Regular
} from '@fluentui/react-icons';
import { DocumentFragment } from '../../shared/types/chat';

export interface MessageInputProps {
  onSendMessage: (content: string, fragmentReferences?: string[]) => Promise<void>;
  fragments: DocumentFragment[];
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

interface FragmentSuggestion {
  fragment: DocumentFragment;
  searchScore: number;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  fragments,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 1000
}) => {
  // State
  const [message, setMessage] = useState('');
  const [selectedFragments, setSelectedFragments] = useState<DocumentFragment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showFragmentSuggestions, setShowFragmentSuggestions] = useState(false);
  const [fragmentSuggestions, setFragmentSuggestions] = useState<FragmentSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const textFieldRef = useRef<HTMLInputElement>(null);
  const fragmentButtonRef = useRef<HTMLButtonElement>(null);

  // ==========================================
  // Fragment Suggestions Logic
  // ==========================================

  const searchFragments = (query: string): FragmentSuggestion[] => {
    if (!query.trim() || fragments.length === 0) {
      return fragments
        .filter(f => f.isActive && !f.isResolved)
        .map(fragment => ({ fragment, searchScore: 1 }))
        .slice(0, 5);
    }

    const searchTerm = query.toLowerCase().trim();
    
    return fragments
      .filter(f => f.isActive && !f.isResolved)
      .map(fragment => {
        let score = 0;
        
        // Search in reference title
        if (fragment.referenceTitle?.toLowerCase().includes(searchTerm)) {
          score += 3;
        }
        
        // Search in selected text
        if (fragment.selectedText.toLowerCase().includes(searchTerm)) {
          score += 2;
        }
        
        // Search in description
        if (fragment.referenceDescription?.toLowerCase().includes(searchTerm)) {
          score += 1;
        }
        
        // Search in tags
        if (fragment.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
          score += 2;
        }

        return { fragment, searchScore: score };
      })
      .filter(item => item.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, 10);
  };

  const updateFragmentSuggestions = (input: string) => {
    // Check if user is typing # to reference fragments
    const hashIndex = input.lastIndexOf('#');
    if (hashIndex === -1) {
      setShowFragmentSuggestions(false);
      return;
    }

    const textAfterHash = input.substring(hashIndex + 1);
    if (textAfterHash.includes(' ')) {
      setShowFragmentSuggestions(false);
      return;
    }

    const suggestions = searchFragments(textAfterHash);
    setFragmentSuggestions(suggestions);
    setShowFragmentSuggestions(true);
  };

  // ==========================================
  // Event Handlers
  // ==========================================

  const handleInputChange = (_: any, newValue?: string) => {
    const value = newValue || '';
    setMessage(value);
    setError(null);

    // Update fragment suggestions
    updateFragmentSuggestions(value);
  };

  const handleKeyPress = async (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSendMessage();
    }

    if (event.key === 'Escape') {
      setShowFragmentSuggestions(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || disabled) {
      return;
    }

    if (message.length > maxLength) {
      setError(`Message too long. Maximum ${maxLength} characters allowed.`);
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const fragmentIds = selectedFragments.map(f => f.id);
      await onSendMessage(message.trim(), fragmentIds.length > 0 ? fragmentIds : undefined);

      // Clear input after successful send
      setMessage('');
      setSelectedFragments([]);
      setShowFragmentSuggestions(false);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFragmentSuggestionClick = (suggestion: FragmentSuggestion) => {
    const hashIndex = message.lastIndexOf('#');
    if (hashIndex !== -1) {
      const beforeHash = message.substring(0, hashIndex);
      const newMessage = beforeHash + `#${suggestion.fragment.referenceTitle || suggestion.fragment.selectedText.substring(0, 30)} `;
      setMessage(newMessage);
      
      // Add fragment to selected if not already there
      if (!selectedFragments.find(f => f.id === suggestion.fragment.id)) {
        setSelectedFragments(prev => [...prev, suggestion.fragment]);
      }
    }
    
    setShowFragmentSuggestions(false);
    textFieldRef.current?.focus();
  };

  const handleFragmentButtonClick = () => {
    if (fragments.length === 0) {
      return;
    }

    const suggestions = searchFragments('');
    setFragmentSuggestions(suggestions);
    setShowFragmentSuggestions(!showFragmentSuggestions);
  };

  const removeSelectedFragment = (fragmentId: string) => {
    setSelectedFragments(prev => prev.filter(f => f.id !== fragmentId));
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const renderFragmentSuggestions = () => (
    <Callout
      target={showFragmentSuggestions ? textFieldRef.current : fragmentButtonRef.current}
      onDismiss={() => setShowFragmentSuggestions(false)}
      directionalHint={DirectionalHint.topLeftEdge}
      isBeakVisible={true}
      styles={{
        calloutMain: {
          maxHeight: '300px',
          overflowY: 'auto',
          padding: 0
        }
      }}
    >
      <div style={{ padding: '8px 0' }}>
        <Text variant="smallPlus" styles={{ root: { padding: '8px 16px' } }}>
          Reference document fragments:
        </Text>
        <Separator />
        
        {fragmentSuggestions.length === 0 ? (
          <Text variant="small" styles={{ root: { padding: '16px', color: '#666' } }}>
            No fragments found
          </Text>
        ) : (
          <List
            items={fragmentSuggestions}
            onRenderCell={(suggestion, index) => (
              <div
                key={suggestion?.fragment.id}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderBottom: index === fragmentSuggestions.length - 1 ? 'none' : '1px solid #f0f0f0'
                }}
                onClick={() => suggestion && handleFragmentSuggestionClick(suggestion)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Stack tokens={{ childrenGap: 4 }}>
                  <Text variant="small" weight="semibold">
                    {suggestion?.fragment.referenceTitle || 
                     suggestion?.fragment.selectedText.substring(0, 50) + '...'}
                  </Text>
                  <Text variant="xSmall" style={{ color: '#666' }}>
                    {suggestion?.fragment.selectedText.length > 100 
                      ? suggestion?.fragment.selectedText.substring(0, 100) + '...'
                      : suggestion?.fragment.selectedText}
                  </Text>
                  {suggestion?.fragment.pageNumber && (
                    <Text variant="xSmall" style={{ color: '#888' }}>
                      Page {suggestion.fragment.pageNumber}
                      {suggestion.fragment.sectionTitle && ` • ${suggestion.fragment.sectionTitle}`}
                    </Text>
                  )}
                </Stack>
              </div>
            )}
          />
        )}
      </div>
    </Callout>
  );

  const renderSelectedFragments = () => {
    if (selectedFragments.length === 0) return null;

    return (
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small" weight="semibold">
          Referenced fragments:
        </Text>
        <Stack horizontal wrap tokens={{ childrenGap: 4 }}>
          {selectedFragments.map(fragment => (
            <div
              key={fragment.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#e1f5fe',
                border: '1px solid #b3e5fc',
                borderRadius: '16px',
                padding: '4px 8px',
                fontSize: '12px',
                gap: '4px'
              }}
            >
              <Highlight24Regular style={{ width: '12px', height: '12px' }} />
              <span>{fragment.referenceTitle || fragment.selectedText.substring(0, 20) + '...'}</span>
              <IconButton
                iconProps={{ iconName: 'Cancel', style: { fontSize: '10px' } }}
                styles={{ 
                  root: { 
                    minWidth: 'auto', 
                    width: '16px', 
                    height: '16px',
                    padding: 0
                  } 
                }}
                onClick={() => removeSelectedFragment(fragment.id)}
              />
            </div>
          ))}
        </Stack>
      </Stack>
    );
  };

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      {/* Error Message */}
      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setError(null)}
        >
          {error}
        </MessageBar>
      )}

      {/* Selected Fragments */}
      {renderSelectedFragments()}

      {/* Input Area */}
      <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
        <TextField
          componentRef={textFieldRef}
          multiline
          rows={3}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isSending}
          styles={{
            root: { flex: 1 },
            field: { 
              resize: 'vertical',
              minHeight: '60px',
              maxHeight: '120px'
            }
          }}
          description={`${message.length}/${maxLength} characters`}
        />

        <Stack tokens={{ childrenGap: 4 }}>
          {/* Fragment Reference Button */}
          <IconButton
            componentRef={fragmentButtonRef}
            iconProps={{ iconName: 'Highlight' }}
            title="Reference document fragments"
            disabled={disabled || fragments.length === 0}
            onClick={handleFragmentButtonClick}
            styles={{
              root: {
                backgroundColor: selectedFragments.length > 0 ? '#e1f5fe' : 'transparent'
              }
            }}
          />

          {/* File Attachment Button */}
          <IconButton
            iconProps={{ iconName: 'Attach' }}
            title="Attach file"
            disabled={disabled}
            onClick={() => {
              // TODO: Implement file attachment
              console.log('File attachment clicked');
            }}
          />

          {/* Send Button */}
          <IconButton
            iconProps={isSending ? undefined : { iconName: 'Send' }}
            title="Send message"
            disabled={disabled || !message.trim() || isSending}
            onClick={handleSendMessage}
            styles={{
              root: {
                backgroundColor: '#0078d4',
                color: 'white'
              },
              rootHovered: {
                backgroundColor: '#106ebe',
                color: 'white'
              },
              rootDisabled: {
                backgroundColor: '#f0f0f0',
                color: '#999'
              }
            }}
          >
            {isSending && <Spinner size={SpinnerSize.small} />}
          </IconButton>
        </Stack>
      </Stack>

      {/* Fragment Suggestions Callout */}
      {showFragmentSuggestions && renderFragmentSuggestions()}
    </Stack>
  );
};
