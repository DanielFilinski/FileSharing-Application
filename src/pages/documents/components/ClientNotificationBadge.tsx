import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Card,
  Text,
  Divider,
} from '@fluentui/react-components';
import {
  AlertRegular,
  ClockRegular,
  DocumentRegular,
  DismissRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  notificationBadge: {
    background: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.1)',
      background: '#dc2626',
    },
  },
  
  popover: {
    position: 'absolute',
    top: '25px',
    right: '0px',
    background: 'white',
    boxShadow: tokens.shadow16,
    borderRadius: '8px',
    padding: '16px',
    width: '320px',
    zIndex: 1000,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    background: 'transparent',
  },
  
  popoverHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  
  popoverTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  
  notificationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  
  notificationIcon: {
    width: '16px',
    height: '16px',
    color: tokens.colorNeutralForeground2,
  },
  
  notificationContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  
  notificationText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground1,
    fontWeight: '500',
  },
  
  notificationMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  
  actionButton: {
    fontSize: '10px',
    padding: '4px 8px',
    height: 'auto',
    minHeight: 'auto',
  },
  
  urgentIcon: {
    color: '#ef4444',
  },
  
  warningIcon: {
    color: '#f59e0b',
  },
  
  infoIcon: {
    color: '#3b82f6',
  },
  
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '8px',
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '16px',
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
});

export interface NotificationDetail {
  id: string;
  type: 'pending_document' | 'urgent_deadline' | 'recent_upload' | 'pending_approval';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionText: string;
  documentId?: string;
  deadlineId?: string;
}

interface ClientNotificationBadgeProps {
  count: number;
  details: NotificationDetail[];
  onActionClick: (notificationId: string, action: string) => void;
}

export const ClientNotificationBadge: React.FC<ClientNotificationBadgeProps> = ({
  count,
  details,
  onActionClick,
}) => {
  const styles = useStyles();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  if (count === 0) return null;
  
  const getNotificationIcon = (type: NotificationDetail['type']) => {
    switch (type) {
      case 'pending_document':
        return <DocumentRegular className={`${styles.notificationIcon} ${styles.urgentIcon}`} />;
      case 'urgent_deadline':
        return <ClockRegular className={`${styles.notificationIcon} ${styles.urgentIcon}`} />;
      case 'recent_upload':
        return <DocumentRegular className={`${styles.notificationIcon} ${styles.infoIcon}`} />;
      case 'pending_approval':
        return <AlertRegular className={`${styles.notificationIcon} ${styles.warningIcon}`} />;
      default:
        return <AlertRegular className={styles.notificationIcon} />;
    }
  };
  
  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(!isPopoverOpen);
  };
  
  const handleActionClick = (notificationId: string, action: string) => {
    onActionClick(notificationId, action);
    if (action !== 'view_all') {
      setIsPopoverOpen(false);
    }
  };
  
  return (
    <div style={{ position: 'relative' }}>
      <div 
        className={styles.notificationBadge}
        onClick={handleBadgeClick}
        title={`${count} notifications - click for details`}
      >
        {count}
      </div>
      
      {isPopoverOpen && (
        <>
          {/* Backdrop */}
          <div
            className={styles.backdrop}
            onClick={() => setIsPopoverOpen(false)}
          />
          
          {/* Popover */}
          <Card className={styles.popover}>
            <div className={styles.popoverHeader}>
              <Text className={styles.popoverTitle}>
                {count} Notification{count > 1 ? 's' : ''}
              </Text>
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissRegular />}
                onClick={() => setIsPopoverOpen(false)}
                className={styles.actionButton}
              />
            </div>
            
            <div>
              {details.length > 0 ? (
                details.map((notification) => (
                  <div key={notification.id} className={styles.notificationItem}>
                    {getNotificationIcon(notification.type)}
                    
                    <div className={styles.notificationContent}>
                      <Text className={styles.notificationText}>
                        {notification.title}
                      </Text>
                      <Text className={styles.notificationMeta}>
                        {notification.description}
                      </Text>
                    </div>
                    
                    <Button
                      appearance="primary"
                      size="small"
                      className={styles.actionButton}
                      onClick={() => handleActionClick(notification.id, notification.actionText)}
                    >
                      {notification.actionText}
                    </Button>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  No notifications available
                </div>
              )}
            </div>
            
            {details.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0 8px 0' }} />
                
                <div className={styles.actionsRow}>
                  <Button
                    appearance="subtle"
                    size="small"
                    className={styles.actionButton}
                    onClick={() => handleActionClick('all', 'view_all')}
                  >
                    View All
                  </Button>
                  <Button
                    appearance="subtle"
                    size="small"
                    className={styles.actionButton}
                    onClick={() => {
                      details.forEach(n => handleActionClick(n.id, 'mark_read'));
                    }}
                  >
                    Mark All Read
                  </Button>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
