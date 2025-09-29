import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridCell,
  DataGridBody,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  Badge,
  Button,
  Text,
  Spinner,
  Card,
  CardHeader,
  makeStyles,
  tokens,
  ProgressBar,
  Tooltip
} from '@fluentui/react-components';
import {
  PlayRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  ErrorCircleRegular,
  ImportantRegular,
  ChevronRightRegular,
  CalendarClockRegular,
  PersonRegular
} from '@fluentui/react-icons';
import { WorkflowApiClient, WorkflowInstance } from '@/shared/api/workflowApi';
import { notificationService } from '@/shared/lib/notifications';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px'
  },
  card: {
    height: 'fit-content'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px'
  },
  statusBadge: {
    minWidth: '80px',
    justifyContent: 'center'
  },
  priorityBadge: {
    minWidth: '60px',
    justifyContent: 'center'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '120px'
  },
  progressText: {
    minWidth: '35px',
    fontSize: tokens.fontSizeBase200
  },
  actionButton: {
    minHeight: '32px'
  },
  overdueText: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  currentStepText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  }
});

interface WorkflowListProps {
  filter?: 'all' | 'assigned' | 'created' | 'pending';
  documentId?: string;
  onWorkflowSelect?: (workflow: WorkflowInstance) => void;
  onWorkflowAction?: (workflowId: string, action: string) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  filter = 'all',
  documentId,
  onWorkflowSelect,
  onWorkflowAction
}) => {
  const styles = useStyles();
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, [filter, documentId]);

  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: WorkflowInstance[] = [];

      switch (filter) {
        case 'assigned':
          data = await WorkflowApiClient.getMyWorkflows();
          break;
        case 'created':
          data = await WorkflowApiClient.getMyCreatedWorkflows();
          break;
        case 'pending':
          data = await WorkflowApiClient.getPendingWorkflows();
          break;
        case 'all':
        default:
          if (documentId) {
            data = await WorkflowApiClient.getWorkflowsForDocument(documentId);
          } else {
            const response = await WorkflowApiClient.getWorkflows();
            data = response.data;
          }
          break;
      }

      setWorkflows(data);
    } catch (error: any) {
      console.error('Failed to load workflows:', error);
      setError(error.message || 'Failed to load workflows');
      notificationService.error('Error', 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (workflow: WorkflowInstance) => {
    onWorkflowSelect?.(workflow);
  };

  const handleQuickAction = async (workflowId: string, action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onWorkflowAction?.(workflowId, action);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockRegular />;
      case 'in-progress':
        return <PlayRegular />;
      case 'completed':
        return <CheckmarkCircleRegular />;
      case 'cancelled':
        return <ErrorCircleRegular />;
      case 'escalated':
        return <ImportantRegular />;
      default:
        return <ClockRegular />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ImportantRegular style={{ color: tokens.colorPaletteRedForeground1 }} />;
      case 'high':
        return <ChevronRightRegular style={{ color: tokens.colorPaletteOrangeForeground1 }} />;
      case 'medium':
        return <ChevronRightRegular />;
      case 'low':
        return <ChevronRightRegular style={{ color: tokens.colorNeutralForeground3 }} />;
      default:
        return <ChevronRightRegular />;
    }
  };

  const columns: TableColumnDefinition<WorkflowInstance>[] = [
    createTableColumn<WorkflowInstance>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Workflow',
      renderCell: (workflow) => (
        <TableCellLayout>
          <div>
            <Text weight="semibold">{workflow.name}</Text>
            {workflow.description && (
              <div>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  {workflow.description}
                </Text>
              </div>
            )}
            <div>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {WorkflowApiClient.formatWorkflowType(workflow.type)} • {workflow.documentName}
              </Text>
            </div>
          </div>
        </TableCellLayout>
      )
    }),

    createTableColumn<WorkflowInstance>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (workflow) => {
        const statusInfo = WorkflowApiClient.getWorkflowStatusInfo(workflow.status);
        return (
          <TableCellLayout>
            <Badge
              className={styles.statusBadge}
              color={statusInfo.color}
              icon={getStatusIcon(workflow.status)}
            >
              {statusInfo.text}
            </Badge>
          </TableCellLayout>
        );
      }
    }),

    createTableColumn<WorkflowInstance>({
      columnId: 'priority',
      compare: (a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      },
      renderHeaderCell: () => 'Priority',
      renderCell: (workflow) => {
        const priorityInfo = WorkflowApiClient.getPriorityInfo(workflow.priority);
        return (
          <TableCellLayout>
            <Badge
              className={styles.priorityBadge}
              color={priorityInfo.color}
              icon={getPriorityIcon(workflow.priority)}
            >
              {priorityInfo.text}
            </Badge>
          </TableCellLayout>
        );
      }
    }),

    createTableColumn<WorkflowInstance>({
      columnId: 'progress',
      compare: (a, b) => (a.progressPercentage || 0) - (b.progressPercentage || 0),
      renderHeaderCell: () => 'Progress',
      renderCell: (workflow) => {
        const progress = workflow.progressPercentage || 0;
        return (
          <TableCellLayout>
            <div className={styles.progressContainer}>
              <ProgressBar value={progress / 100} />
              <Text className={styles.progressText}>{progress}%</Text>
            </div>
          </TableCellLayout>
        );
      }
    }),

    createTableColumn<WorkflowInstance>({
      columnId: 'currentStep',
      compare: (a, b) => a.currentStep - b.currentStep,
      renderHeaderCell: () => 'Current Step',
      renderCell: (workflow) => (
        <TableCellLayout>
          <div>
            {workflow.currentStepInfo ? (
              <>
                <Text size={300}>{workflow.currentStepInfo.name}</Text>
                <div>
                  <Text className={styles.currentStepText}>
                    <PersonRegular style={{ marginRight: '4px' }} />
                    {workflow.currentStepInfo.assigneeName}
                  </Text>
                </div>
              </>
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                {workflow.status === 'completed' ? 'Completed' : 'No active step'}
              </Text>
            )}
          </div>
        </TableCellLayout>
      )
    }),

    createTableColumn<WorkflowInstance>({
      columnId: 'dueDate',
      compare: (a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      },
      renderHeaderCell: () => 'Due Date',
      renderCell: (workflow) => (
        <TableCellLayout>
          {workflow.dueDate ? (
            <div>
              <Text 
                size={300}
                className={workflow.isOverdue ? styles.overdueText : undefined}
              >
                <CalendarClockRegular style={{ marginRight: '4px' }} />
                {new Date(workflow.dueDate).toLocaleDateString()}
              </Text>
              {workflow.isOverdue && (
                <div>
                  <Text size={200} className={styles.overdueText}>
                    Overdue
                  </Text>
                </div>
              )}
            </div>
          ) : (
            <Text style={{ color: tokens.colorNeutralForeground3 }}>
              No due date
            </Text>
          )}
        </TableCellLayout>
      )
    }),

    createTableColumn<WorkflowInstance>({
      columnId: 'actions',
      compare: () => 0,
      renderHeaderCell: () => 'Actions',
      renderCell: (workflow) => {
        const availableActions = WorkflowApiClient.getAvailableActions(workflow);
        
        return (
          <TableCellLayout>
            <div style={{ display: 'flex', gap: '8px' }}>
              {availableActions.length > 0 ? (
                availableActions.slice(0, 2).map((actionInfo) => (
                  <Tooltip
                    key={actionInfo.action}
                    content={actionInfo.label}
                    relationship="label"
                  >
                    <Button
                      className={styles.actionButton}
                      size="small"
                      appearance={actionInfo.appearance}
                      onClick={(e) => handleQuickAction(workflow.id, actionInfo.action, e)}
                    >
                      {actionInfo.label}
                    </Button>
                  </Tooltip>
                ))
              ) : (
                <Button
                  className={styles.actionButton}
                  size="small"
                  appearance="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(workflow);
                  }}
                >
                  View
                </Button>
              )}
            </div>
          </TableCellLayout>
        );
      }
    })
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading workflows..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
          Error: {error}
        </Text>
        <Button onClick={loadWorkflows}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text size={500} weight="semibold">
                Workflows ({workflows.length})
              </Text>
              <Button
                appearance="subtle"
                onClick={loadWorkflows}
              >
                Refresh
              </Button>
            </div>
          }
        />

        {workflows.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Text style={{ color: tokens.colorNeutralForeground3 }}>
              No workflows found for the selected filter.
            </Text>
          </div>
        ) : (
          <DataGrid
            items={workflows}
            columns={columns}
            sortable
            getRowId={(item) => item.id}
            onSelectionChange={(e, data) => {
              if (data.selectedItems.size > 0) {
                const selectedWorkflow = Array.from(data.selectedItems)[0] as WorkflowInstance;
                handleRowClick(selectedWorkflow);
              }
            }}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<WorkflowInstance>>
              {({ item, rowId }) => (
                <DataGridRow<WorkflowInstance>
                  key={rowId}
                  style={{ cursor: 'pointer' }}
                >
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        )}
      </Card>
    </div>
  );
};
