import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Subtitle2, 
  tokens,
  makeStyles
} from '@fluentui/react-components';
import { ChatRegular, DismissRegular } from '@fluentui/react-icons';
import { ChatWidget } from '../../../components/Chat/ChatWidget';
import { DocumentFragment } from '../../../shared/types/chat';

interface DocumentChatProps {
  documentId: string;
  documentName: string;
  onFragmentCreate?: (fragment: DocumentFragment) => void;
  onFragmentHighlight?: (fragment: DocumentFragment) => void;
  className?: string;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({ 
  documentId, 
  documentName, 
  onFragmentCreate,
  onFragmentHighlight,
  className = ''
}) => {
  const styles = useStyles();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setHasNewMessages(false);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleFragmentCreate = (fragment: DocumentFragment) => {
    onFragmentCreate?.(fragment);
    // Show visual indication of new fragment
    setHasNewMessages(true);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Chat Toggle Button */}
      <div className={styles.chatToggle}>
        <Button
          appearance="primary"
          onClick={handleOpenChat}
          icon={<ChatRegular />}
          className={styles.toggleButton}
          size="large"
        >
          Document Chat
          {hasNewMessages && (
            <div className={styles.notificationBadge} />
          )}
        </Button>
      </div>

      {/* Full ChatWidget Integration */}
      <ChatWidget
        documentId={documentId}
        documentName={documentName}
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onFragmentCreate={handleFragmentCreate}
        onFragmentHighlight={onFragmentHighlight}
        className={styles.chatWidget}
      />
    </div>
  );
}; 

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: '100%',
    height: 'fit-content'
  },
  chatToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalM
  },
  toggleButton: {
    position: 'relative',
    minWidth: '150px',
    height: '40px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    boxShadow: tokens.shadow4,
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: tokens.shadow8
    },
    transition: 'all 0.2s ease-in-out'
  },
  notificationBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '12px',
    height: '12px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    borderRadius: '50%',
    border: `2px solid ${tokens.colorNeutralBackground1}`,
    animation: 'pulse 2s infinite'
  },
  chatWidget: {
    position: 'fixed',
    top: 0,
    right: 0,
    zIndex: 1000,
    height: '100vh'
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.95)',
      boxShadow: `0 0 0 0 ${tokens.colorPaletteRedBackground3}`
    },
    '70%': {
      transform: 'scale(1)',
      boxShadow: `0 0 0 10px rgba(255, 0, 0, 0)`
    },
    '100%': {
      transform: 'scale(0.95)',
      boxShadow: `0 0 0 0 rgba(255, 0, 0, 0)`
    }
  }
});