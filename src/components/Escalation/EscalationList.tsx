/**
 * EscalationList Component
 * Main component for displaying and managing escalations
 */

import React, { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  Button,
  Badge,
  SearchBox,
  Dropdown,
  Option,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Search24Regular,
  Filter24Regular,
  MoreHorizontal24Regular,
  Edit24Regular,
  Eye24Regular,
  Comment24Regular,
  Clock24Regular,
  Alert24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
} from '@fluentui/react-icons';
import { useEscalations, useEscalationActions } from '../../shared/hooks/useEscalation';
import { Escalation, EscalationStatus, EscalationPriority, EscalationType } from '../../shared/lib/escalation/types';
import { CreateEscalationDialog } from './CreateEscalationDialog';
import { EscalationDetailsDialog } from './EscalationDetailsDialog';

interface EscalationListProps {
  tenantId?: string;
  autoRefresh?: boolean;
}

export const EscalationList: React.FC<EscalationListProps> = ({
  tenantId,
  autoRefresh = true,
}) => {
  const [filters, setFilters] = useState<{
    status?: EscalationStatus;
    priority?: EscalationPriority;
    type?: EscalationType;
    search?: string;
  }>({});

  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const {
    escalations,
    statistics,
    loading,
    error,
    pagination,
    fetchEscalations,
    createEscalation,
  } = useEscalations(filters, {
    autoRefresh,
    refreshInterval: 30000, // 30 seconds
    tenantId,
  });

  const escalationActions = useEscalationActions({ tenantId });

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleStatusFilter = (status: EscalationStatus | undefined) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handlePriorityFilter = (priority: EscalationPriority | undefined) => {
    setFilters(prev => ({ ...prev, priority }));
  };

  const handleTypeFilter = (type: EscalationType | undefined) => {
    setFilters(prev => ({ ...prev, type }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined }));
  };

  const handleEscalationSelect = (escalation: Escalation) => {
    setSelectedEscalation(escalation);
    setShowDetailsDialog(true);
  };

  const handleCreateEscalation = async (request: any) => {
    const result = await createEscalation(request);
    if (result.success) {
      setShowCreateDialog(false);
      // Refresh the list
      fetchEscalations();
    }
    return result;
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const getPriorityColor = (priority: EscalationPriority): string => {
    switch (priority) {
      case 'critical': return '#d13438';
      case 'high': return '#ff8c00';
      case 'medium': return '#ffd700';
      case 'low': return '#107c10';
      default: return '#605e5c';
    }
  };

  const getStatusColor = (status: EscalationStatus): string => {
    switch (status) {
      case 'open': return '#d13438';
      case 'acknowledged': return '#ff8c00';
      case 'in_progress': return '#0078d4';
      case 'resolved': return '#107c10';
      case 'closed': return '#605e5c';
      case 'escalated': return '#a80000';
      default: return '#605e5c';
    }
  };

  const getStatusIcon = (status: EscalationStatus) => {
    switch (status) {
      case 'open': return <Alert24Regular />;
      case 'acknowledged': return <Eye24Regular />;
      case 'in_progress': return <Clock24Regular />;
      case 'resolved': return <CheckmarkCircle24Regular />;
      case 'closed': return <DismissCircle24Regular />;
      case 'escalated': return <Alert24Regular />;
      default: return <Clock24Regular />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (escalation: Escalation): boolean => {
    if (!escalation.dueDate) return false;
    const now = new Date();
    const dueDate = new Date(escalation.dueDate);
    return now > dueDate && escalation.status !== 'resolved' && escalation.status !== 'closed';
  };

  // ==========================================
  // FILTERED ESCALATIONS
  // ==========================================

  const filteredEscalations = escalations.filter(escalation => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        escalation.title.toLowerCase().includes(searchLower) ||
        escalation.description.toLowerCase().includes(searchLower) ||
        escalation.id.toLowerCase().includes(searchLower) ||
        escalation.createdByName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // ==========================================
  // RENDER
  // ==========================================

  if (loading && escalations.length === 0) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="flex items-center justify-center p-8">
          <Spinner size="large" />
          <Text className="ml-2">Loading escalations...</Text>
        </div>
      </FluentProvider>
    );
  }

  if (error) {
    return (
      <FluentProvider theme={webLightTheme}>
        <MessageBar intent="error">
          <MessageBarBody>
            <Text>Error loading escalations: {error}</Text>
            <Button onClick={fetchEscalations} className="ml-2">
              Retry
            </Button>
          </MessageBarBody>
        </MessageBar>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Text size={600} weight="semibold">
              Escalations
            </Text>
            <Text className="text-gray-600">
              {statistics?.total || 0} total • {statistics?.byStatus?.open || 0} open • {statistics?.overdue || 0} overdue
            </Text>
          </div>
          
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Escalation
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <Text weight="semibold">Filters</Text>
          </CardHeader>
          <CardPreview>
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <SearchBox
                  placeholder="Search escalations..."
                  value={filters.search || ''}
                  onChange={(_, data) => handleSearch(data.value)}
                  icon={<Search24Regular />}
                />
              </div>
              
              <Dropdown
                placeholder="Status"
                value={filters.status || ''}
                onOptionSelect={(_, data) => handleStatusFilter(data.optionValue as EscalationStatus)}
              >
                <Option value="">All Statuses</Option>
                <Option value="open">Open</Option>
                <Option value="acknowledged">Acknowledged</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="resolved">Resolved</Option>
                <Option value="closed">Closed</Option>
                <Option value="escalated">Escalated</Option>
              </Dropdown>

              <Dropdown
                placeholder="Priority"
                value={filters.priority || ''}
                onOptionSelect={(_, data) => handlePriorityFilter(data.optionValue as EscalationPriority)}
              >
                <Option value="">All Priorities</Option>
                <Option value="critical">Critical</Option>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Dropdown>

              <Dropdown
                placeholder="Type"
                value={filters.type || ''}
                onOptionSelect={(_, data) => handleTypeFilter(data.optionValue as EscalationType)}
              >
                <Option value="">All Types</Option>
                <Option value="storage_overflow">Storage Overflow</Option>
                <Option value="storage_quota_warning">Storage Warning</Option>
                <Option value="document_validation_failed">Validation Failed</Option>
                <Option value="document_approval_overdue">Approval Overdue</Option>
                <Option value="document_signing_failed">Signing Failed</Option>
                <Option value="sharepoint_sync_failed">SharePoint Sync Failed</Option>
                <Option value="system_error">System Error</Option>
                <Option value="security_breach">Security Breach</Option>
                <Option value="user_access_issue">User Access Issue</Option>
                <Option value="workflow_blocked">Workflow Blocked</Option>
                <Option value="deadline_missed">Deadline Missed</Option>
                <Option value="api_integration_failed">API Integration Failed</Option>
                <Option value="custom">Custom</Option>
              </Dropdown>
            </div>
          </CardPreview>
        </Card>

        {/* Escalations Table */}
        <Card>
          <DataGrid items={filteredEscalations} focusMode="composite">
            <DataGridHeader>
              <DataGridRow>
                <DataGridHeaderCell>ID</DataGridHeaderCell>
                <DataGridHeaderCell>Title</DataGridHeaderCell>
                <DataGridHeaderCell>Priority</DataGridHeaderCell>
                <DataGridHeaderCell>Status</DataGridHeaderCell>
                <DataGridHeaderCell>Type</DataGridHeaderCell>
                <DataGridHeaderCell>Created By</DataGridHeaderCell>
                <DataGridHeaderCell>Created</DataGridHeaderCell>
                <DataGridHeaderCell>Due Date</DataGridHeaderCell>
                <DataGridHeaderCell>Actions</DataGridHeaderCell>
              </DataGridRow>
            </DataGridHeader>
            
            <DataGridBody<Escalation>>
              {({ item: escalation }) => (
                <DataGridRow key={escalation.id}>
                  <DataGridCell>
                    <Text font="monospace" size={200}>
                      {escalation.id}
                    </Text>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <div>
                      <Text weight="semibold">{escalation.title}</Text>
                      {isOverdue(escalation) && (
                        <Badge appearance="filled" color="danger" className="ml-2">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <Badge
                      appearance="filled"
                      style={{ backgroundColor: getPriorityColor(escalation.priority) }}
                    >
                      {escalation.priority.toUpperCase()}
                    </Badge>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(escalation.status)}
                      <Badge
                        appearance="filled"
                        style={{ backgroundColor: getStatusColor(escalation.status) }}
                      >
                        {escalation.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <Text size={200}>
                      {escalation.type.replace('_', ' ')}
                    </Text>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <Text>{escalation.createdByName}</Text>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <Text size={200}>{formatDate(escalation.createdAt)}</Text>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <Text size={200}>
                      {escalation.dueDate ? formatDate(escalation.dueDate) : 'N/A'}
                    </Text>
                  </DataGridCell>
                  
                  <DataGridCell>
                    <Menu>
                      <MenuTrigger>
                        <Button appearance="subtle" icon={<MoreHorizontal24Regular />} />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuItem
                            icon={<Eye24Regular />}
                            onClick={() => handleEscalationSelect(escalation)}
                          >
                            View Details
                          </MenuItem>
                          <MenuItem
                            icon={<Comment24Regular />}
                            onClick={() => handleEscalationSelect(escalation)}
                          >
                            Add Comment
                          </MenuItem>
                          <MenuItem
                            icon={<Edit24Regular />}
                            onClick={() => handleEscalationSelect(escalation)}
                          >
                            Edit
                          </MenuItem>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  </DataGridCell>
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </Card>

        {/* Pagination */}
        {pagination && pagination.total > pagination.limit && (
          <div className="flex items-center justify-center gap-2">
            <Button
              disabled={pagination.offset === 0}
              onClick={() => {
                // TODO: Implement pagination
                console.log('Previous page');
              }}
            >
              Previous
            </Button>
            <Text>
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
              {Math.ceil(pagination.total / pagination.limit)}
            </Text>
            <Button
              disabled={pagination.offset + pagination.limit >= pagination.total}
              onClick={() => {
                // TODO: Implement pagination
                console.log('Next page');
              }}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateEscalationDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateEscalation}
        />
      )}

      {showDetailsDialog && selectedEscalation && (
        <EscalationDetailsDialog
          escalation={selectedEscalation}
          open={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedEscalation(null);
          }}
          onUpdate={() => fetchEscalations()}
        />
      )}
    </FluentProvider>
  );
};
