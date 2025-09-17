import React, { useState } from 'react';
import { 
  Textarea, 
  Button, 
  Card, 
  Avatar, 
  Subtitle2, 
  Body2, 
  Caption1,
  tokens,
  makeStyles
} from '@fluentui/react-components';
import { SendRegular } from '@fluentui/react-icons';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
}



interface DocumentChatProps {
  documentName?: string;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({ documentName }) => {
  const styles = useStyles();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Документ готов к рассмотрению",
      sender: "System",
      timestamp: new Date(Date.now() - 3600000) // 1 час назад
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const sendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        text: inputValue,
        sender: 'You',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Заголовок чата */}
      <div className={styles.header}>
        <Subtitle2>Document chat</Subtitle2>        
      </div>

      {/* История сообщений */}
      <div className={styles.messagesContainer}>
        {messages.map(msg => (
          <Card 
            key={msg.id} 
            className={`${styles.messageCard} ${msg.sender === 'You' ? styles.userMessage : styles.otherMessage}`}
            style={{
              alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
            }}
          >
            <div className={styles.messageContent}>
              <Avatar size={24}>
                {msg.sender === 'System' ? 'S' : msg.sender[0]}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div className={styles.messageHeader}>
                  <Body2 style={{ fontWeight: 500 }}>
                    {msg.sender}
                  </Body2>
                  <Caption1 style={{ 
                    color: tokens.colorNeutralForeground3
                  }}>
                    {msg.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Caption1>
                </div>
                <Body2 className={styles.messageText}>
                  {msg.text}
                </Body2>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Поле ввода */}
      <div className={styles.inputContainer}>
        <Textarea 
          value={inputValue}
          onChange={(_, data) => setInputValue(data.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className={styles.textarea}
          resize="none"
          rows={2}
        />
        <div className={styles.sendButton}>
          <Button 
            appearance="primary" 
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            icon={<SendRegular />}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}; 

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    flexShrink: 0
  },
  header: {
    padding: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0
  },
  messagesContainer: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: 0,
    maxHeight: '100%'
  },
  messageCard: {
    padding: tokens.spacingHorizontalM,
    maxWidth: '70%',
    borderRadius: tokens.borderRadiusMedium,
    border: 'none',
    boxShadow: tokens.shadow4,
    wordBreak: 'break-word',
    marginBottom: tokens.spacingVerticalXS,
    width: 'auto',
    flexShrink: 0
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    marginLeft: 'auto',
    marginRight: 0,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    marginRight: 'auto',
    marginLeft: 0,
  },
  messageContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS
  },
  messageText: {
    wordBreak: 'break-word',
    lineHeight: tokens.lineHeightBase300
  },
  inputContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0
  },
  textarea: {
    flex: 1,
    '& textarea': {
      resize: 'none',
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      borderRadius: tokens.borderRadiusMedium,
      padding: tokens.spacingHorizontalS,
      fontSize: tokens.fontSizeBase300,
      lineHeight: tokens.lineHeightBase300,
      '&:focus': {
        outline: 'none'
      }
    }
  },
  sendButton: {
    alignSelf: 'flex-end',
    minWidth: 'auto',
    height: '32px',
    padding: `0 ${tokens.spacingHorizontalS}`,
    '& button': {
      height: '32px',
      minWidth: 'auto'
    }
  }
});