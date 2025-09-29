/**
 * ChatParticipants - component for displaying and managing chat participants
 * Shows participant status, roles and activity
 */

import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Persona,
  PersonaSize,
  PersonaPresence,
  IconButton,
  ContextualMenu,
  IContextualMenuItem,
  DirectionalHint,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  SearchBox,
  DefaultButton
} from '@fluentui/react';
import {
  More24Regular,
  PersonAdd24Regular,
  PersonDelete24Regular,
  Settings24Regular
} from '@fluentui/react-icons';
import { ChatParticipant } from '../../shared/types/chat';
import { chatApi } from '../../shared/api/chatApi';
import { formatRelativeTime } from '../../shared/utils/dateUtils';

export interface ChatParticipantsProps {
  threadId: string;
  currentUserId?: string;
  canManageParticipants?: boolean;
}

export const ChatParticipants: React.FC<ChatParticipantsProps> = ({
  threadId,
  currentUserId = 'current-user', // TODO: Get from auth context
  canManageParticipants = false
}) => {
  // State
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<ChatParticipant | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuTarget, setContextMenuTarget] = useState<HTMLElement | null>(null);

  // ==========================================
  // Data Loading
  // ==========================================

  useEffect(() => {
    loadParticipants();
  }, [threadId]);

  const loadParticipants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const participantList = await chatApi.getThreadParticipants(threadId);
      setParticipants(participantList);
    } catch (error) {
      console.error('Error loading participants:', error);
      setError('Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // Event Handlers
  // ==========================================

  const handleParticipantMoreClick = (
    participant: ChatParticipant, 
    event: React.MouseEvent<HTMLElement>
  ) => {
    setSelectedParticipant(participant);
    setContextMenuTarget(event.currentTarget as HTMLElement);
    setShowContextMenu(true);
  };

  const handleContextMenuDismiss = () => {
    setShowContextMenu(false);
    setSelectedParticipant(null);
    setContextMenuTarget(null);
  };

  // ==========================================
  // Context Menu Items
  // ==========================================

  const getContextMenuItems = (): IContextualMenuItem[] => {
    if (!selectedParticipant) return [];

    const items: IContextualMenuItem[] = [
      {
        key: 'viewProfile',
        text: 'View Profile',
        iconProps: { iconName: 'Contact' },
        onClick: () => {
          // TODO: Open user profile
          console.log('View profile:', selectedParticipant.userId);
          handleContextMenuDismiss();
        }
      },
      {
        key: 'directMessage',
        text: 'Send Direct Message',
        iconProps: { iconName: 'Mail' },
        onClick: () => {
          // TODO: Open direct message
          console.log('Direct message:', selectedParticipant.userId);
          handleContextMenuDismiss();
        }
      }
    ];

    if (canManageParticipants && selectedParticipant.userId !== currentUserId) {
      items.push(
        {
          key: 'divider1',
          itemType: 'divider' as any
        },
        {
          key: 'changeRole',
          text: 'Change Role',
          iconProps: { iconName: 'People' },
          subMenuProps: {
            items: [
              {
                key: 'viewer',
                text: 'Viewer',
                canCheck: true,
                checked: selectedParticipant.permissions.includes('read') && 
                        !selectedParticipant.permissions.includes('write'),
                onClick: () => {
                  // TODO: Update participant role
                  console.log('Change to viewer:', selectedParticipant.userId);
                  handleContextMenuDismiss();
                }
              },
              {
                key: 'contributor',
                text: 'Contributor',
                canCheck: true,
                checked: selectedParticipant.permissions.includes('write'),
                onClick: () => {
                  // TODO: Update participant role
                  console.log('Change to contributor:', selectedParticipant.userId);
                  handleContextMenuDismiss();
                }
              },
              {
                key: 'moderator',
                text: 'Moderator',
                canCheck: true,
                checked: selectedParticipant.permissions.includes('moderate'),
                onClick: () => {
                  // TODO: Update participant role
                  console.log('Change to moderator:', selectedParticipant.userId);
                  handleContextMenuDismiss();
                }
              }
            ]
          }
        },
        {
          key: 'removeParticipant',
          text: 'Remove from Chat',
          iconProps: { iconName: 'PersonRemove' },
          onClick: () => {
            if (confirm(`Remove ${selectedParticipant.userName} from this chat?`)) {
              // TODO: Remove participant
              console.log('Remove participant:', selectedParticipant.userId);
            }
            handleContextMenuDismiss();
          }
        }
      );
    }

    return items;
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const getPersonaPresence = (participant: ChatParticipant): PersonaPresence => {
    if (!participant.isActive) return PersonaPresence.offline;
    if (participant.isOnline) return PersonaPresence.online;
    if (participant.lastSeenAt) {
      const lastSeen = new Date(participant.lastSeenAt);
      const now = new Date();
      const minutesAgo = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      if (minutesAgo < 5) return PersonaPresence.away;
      if (minutesAgo < 30) return PersonaPresence.busy;
    }
    return PersonaPresence.offline;
  };

  const getRoleDisplayName = (participant: ChatParticipant): string => {
    if (participant.permissions.includes('moderate')) return 'Moderator';
    if (participant.permissions.includes('create_fragments')) return 'Contributor';
    if (participant.permissions.includes('write')) return 'Member';
    return 'Viewer';
  };

  const getParticipantSecondaryText = (participant: ChatParticipant): string => {
    const role = getRoleDisplayName(participant);
    if (participant.isOnline) {
      return `${role} • Online`;
    }
    if (participant.lastSeenAt) {
      return `${role} • Last seen ${formatRelativeTime(participant.lastSeenAt)}`;
    }
    return role;
  };

  const filterParticipants = (participants: ChatParticipant[]): ChatParticipant[] => {
    if (!searchQuery.trim()) return participants;
    
    const query = searchQuery.toLowerCase();
    return participants.filter(participant => 
      participant.userName.toLowerCase().includes(query) ||
      participant.userEmail.toLowerCase().includes(query) ||
      participant.userRole.toLowerCase().includes(query)
    );
  };

  const renderParticipant = (participant: ChatParticipant) => (
    <div
      key={participant.userId}
      style={{
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f9fa';
        e.currentTarget.style.borderColor = '#e9ecef';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Persona
          text={participant.userName}
          secondaryText={getParticipantSecondaryText(participant)}
          size={PersonaSize.size40}
          presence={getPersonaPresence(participant)}
          imageUrl={participant.avatar}
          styles={{
            root: { 
              cursor: 'pointer',
              flex: 1
            },
            primaryText: {
              fontWeight: participant.userId === currentUserId ? 600 : 400
            },
            secondaryText: {
              color: participant.isOnline ? '#107c10' : '#666'
            }
          }}
        />

        <Stack horizontal tokens={{ childrenGap: 4 }}>
          {/* Typing Indicator */}
          {participant.isTyping && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                backgroundColor: '#e1f5fe',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#0078d4'
              }}
            >
              <Spinner size={SpinnerSize.xSmall} styles={{ root: { marginRight: '4px' } }} />
              typing...
            </div>
          )}

          {/* Current User Indicator */}
          {participant.userId === currentUserId && (
            <Text variant="xSmall" style={{ color: '#0078d4', fontWeight: 600 }}>
              (You)
            </Text>
          )}

          {/* Muted Indicator */}
          {participant.isMuted && (
            <IconButton
              iconProps={{ iconName: 'MicOff2', style: { color: '#a80000' } }}
              title="Notifications muted"
              styles={{ root: { minWidth: 'auto' } }}
            />
          )}

          {/* More Actions */}
          <IconButton
            iconProps={{ iconName: 'More' }}
            title="More actions"
            onClick={(e) => handleParticipantMoreClick(participant, e)}
            styles={{ root: { minWidth: 'auto' } }}
          />
        </Stack>
      </Stack>
    </div>
  );

  // ==========================================
  // Main Render
  // ==========================================

  if (isLoading) {
    return (
      <Stack horizontalAlign="center" tokens={{ padding: 20 }}>
        <Spinner size={SpinnerSize.large} label="Loading participants..." />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack tokens={{ childrenGap: 16 }}>
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setError(null)}
        >
          {error}
        </MessageBar>
        <DefaultButton text="Retry" onClick={loadParticipants} />
      </Stack>
    );
  }

  const filteredParticipants = filterParticipants(participants);
  const onlineParticipants = filteredParticipants.filter(p => p.isOnline);
  const offlineParticipants = filteredParticipants.filter(p => !p.isOnline);

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      {/* Header */}
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack>
          <Text variant="mediumPlus" weight="semibold">
            Participants ({participants.length})
          </Text>
          <Text variant="small" style={{ color: '#666' }}>
            {onlineParticipants.length} online, {offlineParticipants.length} offline
          </Text>
        </Stack>

        {canManageParticipants && (
          <IconButton
            iconProps={{ iconName: 'PersonAdd' }}
            title="Add participant"
            onClick={() => {
              // TODO: Open add participant dialog
              console.log('Add participant clicked');
            }}
          />
        )}
      </Stack>

      {/* Search */}
      <SearchBox
        placeholder="Search participants..."
        value={searchQuery}
        onChange={(_, newValue) => setSearchQuery(newValue || '')}
      />

      {/* Participants List */}
      <Stack tokens={{ childrenGap: 8 }}>
        {/* Online Participants */}
        {onlineParticipants.length > 0 && (
          <Stack tokens={{ childrenGap: 4 }}>
            <Text variant="small" weight="semibold" style={{ color: '#107c10' }}>
              Online ({onlineParticipants.length})
            </Text>
            {onlineParticipants.map(renderParticipant)}
          </Stack>
        )}

        {/* Offline Participants */}
        {offlineParticipants.length > 0 && (
          <Stack tokens={{ childrenGap: 4 }}>
            <Text variant="small" weight="semibold" style={{ color: '#666' }}>
              Offline ({offlineParticipants.length})
            </Text>
            {offlineParticipants.map(renderParticipant)}
          </Stack>
        )}

        {/* No Results */}
        {filteredParticipants.length === 0 && (
          <Stack horizontalAlign="center" tokens={{ padding: 20 }}>
            <Text variant="medium" style={{ color: '#666' }}>
              {searchQuery ? 'No participants match your search' : 'No participants found'}
            </Text>
          </Stack>
        )}
      </Stack>

      {/* Context Menu */}
      <ContextualMenu
        items={getContextMenuItems()}
        target={contextMenuTarget}
        onDismiss={handleContextMenuDismiss}
        hidden={!showContextMenu}
        directionalHint={DirectionalHint.bottomLeftEdge}
      />
    </Stack>
  );
};
