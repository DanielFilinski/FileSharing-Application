import React from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  ProgressBar,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  DocumentRegular,
  ClockRegular,
  AlertRegular,
} from '@fluentui/react-icons';
import { Client, Document } from '../ui/FirmSide2Page';

const useStyles = makeStyles({
  mainContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  card: {
    background: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    padding: '20px',
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    height: 'fit-content',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  progressContainer: {
    marginBottom: '20px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${tokens.colorBrandForeground1}, ${tokens.colorBrandForeground2})`,
    width: '0%',
    transition: 'width 0.3s ease',
  },
  progressText: {
    marginTop: '8px',
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  statusItem: {
    textAlign: 'center',
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  statusNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
  },
  statusLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  deadlineList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  deadlineItem: {
    padding: '12px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  deadlineItemLast: {
    borderBottom: 'none',
  },
  deadlinePriority: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    marginTop: '4px',
    flexShrink: 0,
  },
  priorityHigh: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },
  priorityMedium: {
    backgroundColor: tokens.colorPaletteDarkOrangeBackground3,
  },
  priorityLow: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  documentList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  documentItem: {
    padding: '12px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  documentItemLast: {
    borderBottom: 'none',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px',
    color: tokens.colorNeutralForeground1,
  },
  documentMeta: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  documentStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    marginTop: '4px',
  },
  statusPending: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  statusReview: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  statusApproved: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  activityList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  activityItem: {
    padding: '12px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  activityItemLast: {
    borderBottom: 'none',
  },
  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandForeground1,
    marginTop: '6px',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px',
    color: tokens.colorNeutralForeground1,
  },
  activityTime: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
});

interface DashboardContentProps {
  selectedClient: Client;
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  selectedClient,
  documents,
  onDocumentSelect,
}) => {
  const styles = useStyles();

  // Анимация progress bar при загрузке
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const progressFill = document.querySelector(`.${styles.progressFill}`) as HTMLElement;
      if (progressFill) {
        progressFill.style.width = '73%';
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [styles.progressFill]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validation Required':
        return 'warning';
      case 'Signature Required':
        return 'informative';
      case 'Final Approval':
        return 'success';
      default:
        return 'brand';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Validation Required':
        return styles.statusPending;
      case 'Signature Required':
        return styles.statusReview;
      case 'Final Approval':
        return styles.statusApproved;
      default:
        return styles.statusPending;
    }
  };

  const mockDeadlines = [
    { title: 'Contract Amendment', due: '2 days', priority: 'high', action: 'Signature required' },
    { title: 'Tax Filing Documents', due: '5 days', priority: 'medium', action: 'Approval needed' },
    { title: 'Annual Report', due: '12 days', priority: 'low', action: 'Review pending' },
  ];

  const mockActivities = [
    { title: 'Document validated by James Patterson', description: 'Contract Amendment for TechCorp Solutions', time: '15 minutes ago' },
    { title: 'New document uploaded by client', description: 'Tax documents from Martinez Construction', time: '1 hour ago' },
    { title: 'Document signed by client', description: 'Service Agreement for Digital Marketing Inc', time: '3 hours ago' },
    { title: 'Document approved by Lisa Chen', description: 'Business License Application', time: 'Yesterday' },
  ];

  return (
    <main className={styles.mainContent}>
      <div className={styles.dashboardGrid}>
        {/* Project Status Summary */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Text className={styles.cardTitle}>Project Status Summary</Text>
          </div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
            <Text className={styles.progressText}>73% Complete</Text>
          </div>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <Text className={styles.statusNumber}>5</Text>
              <Text className={styles.statusLabel}>Pending Validation</Text>
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusNumber}>3</Text>
              <Text className={styles.statusLabel}>Pending Signing</Text>
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusNumber}>2</Text>
              <Text className={styles.statusLabel}>Pending Approval</Text>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Text className={styles.cardTitle}>Upcoming Deadlines</Text>
          </div>
          <div className={styles.deadlineList}>
            {mockDeadlines.map((deadline, index) => (
              <div
                key={index}
                className={`${styles.deadlineItem} ${
                  index === mockDeadlines.length - 1 ? styles.deadlineItemLast : ''
                }`}
              >
                <div
                  className={`${styles.deadlinePriority} ${
                    deadline.priority === 'high' ? styles.priorityHigh :
                    deadline.priority === 'medium' ? styles.priorityMedium :
                    styles.priorityLow
                  }`}
                />
                <div>
                  <Text className={styles.documentName}>{deadline.title}</Text>
                  <Text className={styles.documentMeta}>
                    Due in {deadline.due} - {deadline.action}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Required Documents */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Text className={styles.cardTitle}>Action Required Documents</Text>
        </div>
        <div className={styles.documentList}>
          {documents.map((document, index) => (
            <div
              key={document.id}
              className={`${styles.documentItem} ${
                index === documents.length - 1 ? styles.documentItemLast : ''
              }`}
              onClick={() => onDocumentSelect(document)}
            >
              <div className={styles.documentInfo}>
                <Text className={styles.documentName}>{document.name}</Text>
                <Text className={styles.documentMeta}>
                  Uploaded {document.uploadedTime} by {document.uploadedBy}
                </Text>
              </div>
              <div className={`${styles.documentStatus} ${getStatusClass(document.status)}`}>
                {document.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Text className={styles.cardTitle}>Recent Activity</Text>
        </div>
        <div className={styles.activityList}>
          {mockActivities.map((activity, index) => (
            <div
              key={index}
              className={`${styles.activityItem} ${
                index === mockActivities.length - 1 ? styles.activityItemLast : ''
              }`}
            >
              <div className={styles.activityDot} />
              <div className={styles.activityContent}>
                <Text className={styles.activityTitle}>{activity.title}</Text>
                <Text className={styles.activityTime}>
                  {activity.description} - {activity.time}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}; 