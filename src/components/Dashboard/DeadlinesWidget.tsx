/**
 * Upcoming Deadlines Widget
 * Displays upcoming document deadlines with priority indicators
 * Requirements: PROGECT.md section 4.1.1 - Upcoming Deadlines
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Badge,
  Spinner,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  CalendarLtrRegular,
  AlertUrgentRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import { dashboardService, DeadlineItem } from '@/shared/api';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  card: {
    width: '100%',
    height: 'fit-content',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  deadlinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
  },
  deadlineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
      borderColor: tokens.colorBrandStroke1,
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow4,
    },
  },
  deadlineItemUrgent: {
    borderLeftWidth: '4px',
    borderLeftColor: tokens.colorPaletteRedBorder1,
  },
  deadlineItemHigh: {
    borderLeftWidth: '4px',
    borderLeftColor: tokens.colorPaletteOrangeBorder1,
  },
  deadlineIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deadlineContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  deadlineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  deadlineTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    flex: 1,
  },
  deadlineMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  deadlineAction: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  deadlineDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    gap: '12px',
  },
  emptyStateIcon: {
    fontSize: '48px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
});

interface DeadlinesWidgetProps {
  maxItems?: number;
}

const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high':
      return {
        badge: 'danger' as const,
        icon: tokens.colorPaletteRedForeground1,
        bg: tokens.colorPaletteRedBackground2,
      };
    case 'medium':
      return {
        badge: 'warning' as const,
        icon: tokens.colorPaletteYellowForeground1,
        bg: tokens.colorPaletteYellowBackground2,
      };
    case 'low':
      return {
        badge: 'success' as const,
        icon: tokens.colorPaletteGreenForeground1,
        bg: tokens.colorPaletteGreenBackground2,
      };
  }
};

const formatDeadlineDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if it's today
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return 'Today';
  }

  // Check if it's tomorrow
  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return 'Tomorrow';
  }

  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const getTimeRemaining = (dateString: string): { text: string; isUrgent: boolean } => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return { text: 'Overdue', isUrgent: true };
  }

  if (diffHours < 24) {
    return { text: `${diffHours}h remaining`, isUrgent: true };
  }

  if (diffDays === 1) {
    return { text: '1 day', isUrgent: true };
  }

  if (diffDays <= 3) {
    return { text: `${diffDays} days`, isUrgent: true };
  }

  return { text: `${diffDays} days`, isUrgent: false };
};

export const DeadlinesWidget: React.FC<DeadlinesWidgetProps> = ({ maxItems = 5 }) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeadlines();
  }, [maxItems]);

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardService.getUpcomingDeadlines(maxItems);
      
      // Sort by due date (earliest first)
      const sorted = data.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      
      setDeadlines(sorted);
    } catch (err: any) {
      console.error('Error loading deadlines:', err);
      setError(err.message || 'Failed to load deadlines');
    } finally {
      setLoading(false);
    }
  };

  const handleDeadlineClick = (deadline: DeadlineItem) => {
    // Navigate to the relevant document or page
    if (deadline.clientId) {
      navigate(`/firm-side-2?clientId=${deadline.clientId}&deadlineId=${deadline.id}`);
    } else {
      navigate(`/firm-side-2?deadlineId=${deadline.id}`);
    }
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading deadlines..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.card}>
        <CardHeader header={<Title3>Upcoming Deadlines</Title3>} />
        <CardPreview>
          <div className={styles.emptyState}>
            <Text>Failed to load deadlines: {error}</Text>
          </div>
        </CardPreview>
      </Card>
    );
  }

  if (deadlines.length === 0) {
    return (
      <Card className={styles.card}>
        <CardHeader header={<Title3>Upcoming Deadlines</Title3>} />
        <CardPreview>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📅</div>
            <Text weight="semibold" size={400}>
              No upcoming deadlines
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              You're all caught up on deadlines!
            </Text>
          </div>
        </CardPreview>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<Title3>Upcoming Deadlines</Title3>}
        description={`${deadlines.length} deadline${deadlines.length !== 1 ? 's' : ''} approaching`}
      />

      <CardPreview>
        <div className={styles.deadlinesList}>
          {deadlines.map((deadline) => {
            const priorityStyle = getPriorityColor(deadline.priority);
            const timeInfo = getTimeRemaining(deadline.dueDate);
            const isHighPriority = deadline.priority === 'high';
            
            return (
              <div
                key={deadline.id}
                className={`${styles.deadlineItem} ${
                  isHighPriority ? styles.deadlineItemHigh : ''
                } ${timeInfo.isUrgent ? styles.deadlineItemUrgent : ''}`}
                onClick={() => handleDeadlineClick(deadline)}
              >
                <div
                  className={styles.deadlineIcon}
                  style={{
                    backgroundColor: priorityStyle.bg,
                    color: priorityStyle.icon,
                  }}
                >
                  {timeInfo.isUrgent ? (
                    <AlertUrgentRegular fontSize={20} />
                  ) : (
                    <CalendarLtrRegular fontSize={20} />
                  )}
                </div>

                <div className={styles.deadlineContent}>
                  <div className={styles.deadlineHeader}>
                    <Text className={styles.deadlineTitle}>{deadline.title}</Text>
                    <Badge appearance="filled" color={priorityStyle.badge} size="small">
                      {deadline.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <Text className={styles.deadlineAction}>{deadline.action}</Text>

                  <div className={styles.deadlineMeta}>
                    <div className={styles.deadlineDate}>
                      <CalendarLtrRegular fontSize={16} />
                      <Text>{formatDeadlineDate(deadline.dueDate)}</Text>
                    </div>
                    <Text>•</Text>
                    <div
                      className={styles.deadlineDate}
                      style={{
                        color: timeInfo.isUrgent
                          ? tokens.colorPaletteRedForeground1
                          : tokens.colorNeutralForeground3,
                      }}
                    >
                      <ClockRegular fontSize={16} />
                      <Text>{timeInfo.text}</Text>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardPreview>
    </Card>
  );
};

export default DeadlinesWidget;

