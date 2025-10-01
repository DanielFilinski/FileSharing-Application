/**
 * Recent Activity Feed Widget
 * Displays chronological timeline of recent activities
 * Requirements: PROGECT.md section 4.1.1 - Recent Activity Feed
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Avatar,
  Spinner,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  DocumentRegular,
  PersonRegular,
  CheckmarkCircleRegular,
  ArrowUploadRegular,
  SignatureRegular,
  ChatRegular,
  ArrowSyncRegular,
} from '@fluentui/react-icons';
import { dashboardService, ActivityItem } from '@/shared/api';

const useStyles = makeStyles({
  card: {
    width: '100%',
    height: 'fit-content',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    padding: '16px',
  },
  activityItem: {
    display: 'flex',
    gap: '12px',
    paddingBottom: '20px',
    position: 'relative',
    '&:not(:last-child)::after': {
      content: '""',
      position: 'absolute',
      left: '20px',
      top: '40px',
      bottom: '0',
      width: '2px',
      backgroundColor: tokens.colorNeutralStroke2,
    },
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  activityContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  activityTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  activityDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  activityTime: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
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
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  loadMoreButton: {
    width: '100%',
    marginTop: '8px',
  },
});

interface ActivityFeedProps {
  maxItems?: number;
  showLoadMore?: boolean;
}

const getActivityIcon = (type: string) => {
  const iconStyle = { fontSize: '20px' };
  
  switch (type) {
    case 'upload':
      return <ArrowUploadRegular style={iconStyle} />;
    case 'review':
    case 'approval':
      return <CheckmarkCircleRegular style={iconStyle} />;
    case 'signature':
      return <SignatureRegular style={iconStyle} />;
    case 'client':
      return <PersonRegular style={iconStyle} />;
    case 'chat':
    case 'comment':
      return <ChatRegular style={iconStyle} />;
    case 'sync':
      return <ArrowSyncRegular style={iconStyle} />;
    default:
      return <DocumentRegular style={iconStyle} />;
  }
};

const getActivityIconColor = (type: string) => {
  switch (type) {
    case 'upload':
      return {
        bg: tokens.colorPaletteBlueBorder2,
        color: tokens.colorPaletteBlueForeground2,
      };
    case 'review':
    case 'approval':
      return {
        bg: tokens.colorPaletteGreenBorder2,
        color: tokens.colorPaletteGreenForeground2,
      };
    case 'signature':
      return {
        bg: tokens.colorPalettePurpleBorder2,
        color: tokens.colorPalettePurpleForeground2,
      };
    case 'client':
      return {
        bg: tokens.colorPaletteOrangeBorder2,
        color: tokens.colorPaletteOrangeForeground2,
      };
    case 'chat':
    case 'comment':
      return {
        bg: tokens.colorPaletteTealBorder2,
        color: tokens.colorPaletteTealForeground2,
      };
    default:
      return {
        bg: tokens.colorNeutralBackground3,
        color: tokens.colorNeutralForeground2,
      };
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  maxItems = 10,
  showLoadMore = true,
}) => {
  const styles = useStyles();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [maxItems]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getRecentActivities(maxItems);
      setActivities(data);
      
      // Check if there are more activities
      setHasMore(data.length >= maxItems);
    } catch (err: any) {
      console.error('Error loading activities:', err);
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      
      // Load next batch
      const nextBatch = await dashboardService.getRecentActivities(maxItems);
      setActivities(prev => [...prev, ...nextBatch]);
      
      setHasMore(nextBatch.length >= maxItems);
    } catch (err: any) {
      console.error('Error loading more activities:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading recent activity..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.card}>
        <CardHeader header={<Title3>Recent Activity</Title3>} />
        <CardPreview>
          <div className={styles.emptyState}>
            <Text>Failed to load activities: {error}</Text>
          </div>
        </CardPreview>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={styles.card}>
        <CardHeader header={<Title3>Recent Activity</Title3>} />
        <CardPreview>
          <div className={styles.emptyState}>
            <Text weight="semibold" size={400}>
              No recent activity
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              Activity will appear here as documents are processed.
            </Text>
          </div>
        </CardPreview>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<Title3>Recent Activity</Title3>}
        description={`${activities.length} recent event${activities.length !== 1 ? 's' : ''}`}
      />

      <CardPreview>
        <div className={styles.timeline}>
          {activities.map((activity) => {
            const iconColors = getActivityIconColor(activity.type);
            const timestamp = activity.createdAt || activity.time;
            
            return (
              <div key={activity.id} className={styles.activityItem}>
                <div
                  className={styles.activityIcon}
                  style={{
                    backgroundColor: iconColors.bg,
                    color: iconColors.color,
                  }}
                >
                  {getActivityIcon(activity.type)}
                </div>

                <div className={styles.activityContent}>
                  <Text className={styles.activityTitle}>
                    {activity.title}
                  </Text>
                  
                  <Text className={styles.activityDescription}>
                    {activity.description}
                  </Text>
                  
                  <Text className={styles.activityTime}>
                    {timestamp ? formatTimestamp(timestamp) : activity.time}
                  </Text>
                </div>
              </div>
            );
          })}

          {showLoadMore && hasMore && (
            <Button
              appearance="subtle"
              className={styles.loadMoreButton}
              onClick={loadMore}
              disabled={loadingMore}
              icon={loadingMore ? <Spinner size="tiny" /> : undefined}
            >
              {loadingMore ? 'Loading...' : 'Load More Activity'}
            </Button>
          )}
        </div>
      </CardPreview>
    </Card>
  );
};

export default ActivityFeed;

