/**
 * Action Required Documents Widget
 * Displays documents that require immediate action from the user
 * Requirements: PROGECT.md section 4.1.1 - Action Required Documents
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Button,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components';
import {
  DocumentArrowRight24Regular,
  SignatureRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { dashboardService, ActionRequiredDocument } from '@/shared/api';

const useStyles = makeStyles({
  card: {
    width: '100%',
    height: 'fit-content',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: {
    backgroundColor: 'transparent',
  },
  priorityBadge: {
    minWidth: '80px',
    justifyContent: 'center',
  },
  actionButton: {
    minWidth: '100px',
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
    color: tokens.colorNeutralForeground3,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  dueDateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  overdue: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  urgent: {
    color: tokens.colorPaletteOrangeForeground1,
  },
  row: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
});

// Re-export type from API for backward compatibility
export type { ActionRequiredDocument as ActionDocument };

interface ActionRequiredWidgetProps {
  maxItems?: number;
  onActionClick?: (documentId: string, action: string) => void;
}

export const ActionRequiredWidget: React.FC<ActionRequiredWidgetProps> = ({
  maxItems = 10,
  onActionClick,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<ActionRequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActionRequiredDocuments();
  }, []);

  const loadActionRequiredDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use real API call
      const data = await dashboardService.getActionRequiredDocuments(maxItems);
      setDocuments(data);
    } catch (err: any) {
      console.error('Error loading action required documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeColor = (priority: ActionRequiredDocument['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'informative';
      case 'low':
        return 'subtle';
      default:
        return 'subtle';
    }
  };

  const getStatusIcon = (status: ActionRequiredDocument['status']) => {
    switch (status) {
      case 'review':
        return <DocumentArrowRight24Regular />;
      case 'sign':
        return <SignatureRegular />;
      case 'approve':
        return <CheckmarkCircleRegular />;
      case 'validate':
        return <ClockRegular />;
      default:
        return <DocumentArrowRight24Regular />;
    }
  };

  const getStatusLabel = (status: ActionRequiredDocument['status']): string => {
    switch (status) {
      case 'review':
        return 'Review Required';
      case 'sign':
        return 'Signature Required';
      case 'approve':
        return 'Approval Required';
      case 'validate':
        return 'Validation Required';
      default:
        return 'Action Required';
    }
  };

  const formatDueDate = (dateString: string): { text: string; isOverdue: boolean; isUrgent: boolean } => {
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return {
        text: 'Overdue',
        isOverdue: true,
        isUrgent: false,
      };
    }

    if (diffHours < 24) {
      return {
        text: `${diffHours} hours`,
        isOverdue: false,
        isUrgent: true,
      };
    }

    if (diffDays === 1) {
      return {
        text: 'Tomorrow',
        isOverdue: false,
        isUrgent: true,
      };
    }

    return {
      text: `${diffDays} days`,
      isOverdue: false,
      isUrgent: diffDays <= 2,
    };
  };

  const handleDocumentClick = (doc: ActionRequiredDocument) => {
    navigate(`/firm-side-2?documentId=${doc.id}`);
  };

  const handleAction = (doc: ActionRequiredDocument, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (onActionClick) {
      onActionClick(doc.id, doc.status);
    } else {
      // Default behavior - navigate to document
      navigate(`/firm-side-2?documentId=${doc.id}&action=${doc.status}`);
    }
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading action required documents..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.card}>
        <CardHeader header={<Title3>Action Required</Title3>} />
        <CardPreview>
          <div className={styles.emptyState}>
            <Text>Failed to load documents: {error}</Text>
          </div>
        </CardPreview>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className={styles.card}>
        <CardHeader header={<Title3>Action Required</Title3>} />
        <CardPreview>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>✅</div>
            <Text weight="semibold" size={400}>
              All caught up!
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              No documents require your immediate attention.
            </Text>
          </div>
        </CardPreview>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<Title3>Action Required</Title3>}
        description={`${documents.length} document${documents.length !== 1 ? 's' : ''} need${documents.length === 1 ? 's' : ''} your attention`}
      />

      <CardPreview>
        <Table className={styles.table} size="small">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Due</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {documents.map((doc) => {
              const dueInfo = formatDueDate(doc.dueDate);
              
              return (
                <TableRow 
                  key={doc.id} 
                  className={styles.row}
                  onClick={() => handleDocumentClick(doc)}
                >
                  <TableCell>
                    <TableCellLayout>
                      <div>
                        <Text weight="semibold">{doc.name}</Text>
                        {doc.clientName && (
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                            {doc.clientName}
                          </Text>
                        )}
                      </div>
                    </TableCellLayout>
                  </TableCell>

                  <TableCell>
                    <TableCellLayout media={getStatusIcon(doc.status)}>
                      {getStatusLabel(doc.status)}
                    </TableCellLayout>
                  </TableCell>

                  <TableCell>
                    <Badge
                      appearance="filled"
                      color={getPriorityBadgeColor(doc.priority)}
                      className={styles.priorityBadge}
                    >
                      {doc.priority.toUpperCase()}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className={styles.dueDateCell}>
                      <ClockRegular />
                      <Text
                        className={dueInfo.isOverdue ? styles.overdue : dueInfo.isUrgent ? styles.urgent : undefined}
                        weight={dueInfo.isOverdue || dueInfo.isUrgent ? 'semibold' : 'regular'}
                      >
                        {dueInfo.text}
                      </Text>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      appearance="primary"
                      size="small"
                      icon={<ChevronRightRegular />}
                      iconPosition="after"
                      className={styles.actionButton}
                      onClick={(e) => handleAction(doc, e)}
                    >
                      Take Action
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardPreview>
    </Card>
  );
};

export default ActionRequiredWidget;

