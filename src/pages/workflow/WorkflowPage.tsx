import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Tab,
  TabList,
  Text,
  Card,
  CardHeader,
  MessageBar,
  MessageBarType,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Textarea,
  Field,
  Badge,
  Spinner
} from '@fluentui/react-components';
import {
  AddRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  EditRegular,
  PeopleRegular
} from '@fluentui/react-icons';
import { WorkflowList } from '../../components/Workflow/WorkflowList';
import { CreateWorkflowDialog } from '../../components/Workflow/CreateWorkflowDialog';
import { WorkflowApiClient, WorkflowInstance, AdvanceWorkflowRequest } from '../../shared/api/workflowApi';
import { notificationService } from '../../shared/lib/notifications';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  tabsContainer: {
    marginBottom: '16px'
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden'
  },
  actionDialog: {
    minWidth: '400px'
  },
  workflowDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px'
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1
  },
  currentStep: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke1}`
  },
  completedStep: {
    backgroundColor: tokens.colorPaletteGreenBackground1
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  }
});

type TabValue = 'all' | 'assigned' | 'created' | 'pending';

export const WorkflowPage: React.FC = () => {
  const styles = useStyles();
  
  // State
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<{
    workflowId: string;
    action: string;
  } | null>(null);
  const [actionComments, setActionComments] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
  };

  const handleCreateWorkflow = () => {
    setIsCreateDialogOpen(true);
  };

  const handleWorkflowCreated = (workflow: any) => {
    console.log('Workflow created:', workflow);
    notificationService.success('Success', 'Workflow created successfully');
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  const handleWorkflowSelect = (workflow: WorkflowInstance) => {
    console.log('Workflow selected:', workflow);
    // Could open a detailed view dialog or navigate to a detail page
    setSelectedWorkflow(workflow);
  };

  const handleWorkflowAction = (workflowId: string, action: string) => {
    setWorkflowAction({ workflowId, action });
    setActionComments('');
    setIsActionDialogOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!workflowAction) return;

    setIsProcessingAction(true);

    try {
      const request: AdvanceWorkflowRequest = {
        action: workflowAction.action as any,
        comments: actionComments || undefined
      };

      await WorkflowApiClient.advanceWorkflow(workflowAction.workflowId, request);
      
      notificationService.success(
        'Action Successful', 
        `Workflow ${workflowAction.action} completed successfully`
      );

      setIsActionDialogOpen(false);
      setWorkflowAction(null);
      setActionComments('');
      setRefreshKey(prev => prev + 1); // Trigger refresh
      
    } catch (error: any) {
      console.error('Failed to perform workflow action:', error);
      notificationService.error(
        'Action Failed', 
        error.message || 'Failed to perform workflow action'
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getActionDialogTitle = () => {
    if (!workflowAction) return 'Workflow Action';
    
    switch (workflowAction.action) {
      case 'approve':
        return 'Approve Workflow Step';
      case 'reject':
        return 'Reject Workflow Step';
      case 'request-changes':
        return 'Request Changes';
      case 'delegate':
        return 'Delegate Workflow Step';
      case 'skip':
        return 'Skip Workflow Step';
      default:
        return 'Workflow Action';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckmarkCircleRegular />;
      case 'reject':
        return <DismissCircleRegular />;
      case 'request-changes':
        return <EditRegular />;
      case 'delegate':
        return <PeopleRegular />;
      default:
        return <CheckmarkCircleRegular />;
    }
  };

  const renderWorkflowDetails = (workflow: WorkflowInstance) => {
    return (
      <div>
        <div className={styles.workflowDetails}>
          <div>
            <Text size={300} weight="semibold">Workflow: {workflow.name}</Text>
            <div style={{ marginTop: '8px' }}>
              <Text size={200}>Type: {WorkflowApiClient.formatWorkflowType(workflow.type)}</Text>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Text size={200}>Document: {workflow.documentName}</Text>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Badge color={WorkflowApiClient.getPriorityInfo(workflow.priority).color}>
                {WorkflowApiClient.getPriorityInfo(workflow.priority).text} Priority
              </Badge>
            </div>
          </div>
          
          <div>
            <Text size={300} weight="semibold">Progress</Text>
            <div style={{ marginTop: '8px' }}>
              <Badge color={WorkflowApiClient.getWorkflowStatusInfo(workflow.status).color}>
                {WorkflowApiClient.getWorkflowStatusInfo(workflow.status).text}
              </Badge>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Text size={200}>{workflow.progressPercentage}% Complete</Text>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Text size={200}>Step {workflow.currentStep + 1} of {workflow.steps.length}</Text>
            </div>
          </div>
        </div>

        <Text size={300} weight="semibold">Workflow Steps</Text>
        <div className={styles.stepsList}>
          {workflow.steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`${styles.step} ${
                index === workflow.currentStep ? styles.currentStep :
                index < workflow.currentStep ? styles.completedStep : ''
              }`}
            >
              <div style={{ minWidth: '24px' }}>
                {index < workflow.currentStep ? (
                  <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                ) : index === workflow.currentStep ? (
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: tokens.colorBrandForeground1 
                  }} />
                ) : (
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: tokens.colorNeutralForeground3 
                  }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <Text size={200} weight={index === workflow.currentStep ? 'semibold' : 'regular'}>
                  {step.name}
                </Text>
                <div>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    {step.assigneeName} ({WorkflowApiClient.formatWorkflowType(step.type)})
                  </Text>
                </div>
              </div>
              {step.status && step.status !== 'pending' && (
                <Badge 
                  size="small" 
                  color={WorkflowApiClient.getStepStatusInfo(step.status).color}
                >
                  {WorkflowApiClient.getStepStatusInfo(step.status).text}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Text size={600} weight="semibold">Workflow Management</Text>
          <div style={{ marginTop: '4px' }}>
            <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
              Manage document approval and review workflows
            </Text>
          </div>
        </div>
        
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={handleCreateWorkflow}
        >
          Create Workflow
        </Button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <TabList selectedValue={activeTab} onTabSelect={(_, data) => handleTabChange(data.value as TabValue)}>
          <Tab value="all">All Workflows</Tab>
          <Tab value="assigned">Assigned to Me</Tab>
          <Tab value="created">Created by Me</Tab>
          <Tab value="pending">Pending Actions</Tab>
        </TabList>
      </div>

      {/* Content */}
      <div className={styles.contentArea}>
        <WorkflowList
          key={`${activeTab}-${refreshKey}`}
          filter={activeTab}
          onWorkflowSelect={handleWorkflowSelect}
          onWorkflowAction={handleWorkflowAction}
        />
      </div>

      {/* Create Workflow Dialog */}
      <CreateWorkflowDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleWorkflowCreated}
      />

      {/* Workflow Action Dialog */}
      <Dialog 
        open={isActionDialogOpen} 
        onOpenChange={(_, data) => !data.open && !isProcessingAction && setIsActionDialogOpen(false)}
      >
        <DialogSurface className={styles.actionDialog}>
          <DialogBody>
            <DialogTitle>
              {getActionIcon(workflowAction?.action || '')}
              {getActionDialogTitle()}
            </DialogTitle>
            
            <DialogContent>
              {selectedWorkflow && renderWorkflowDetails(selectedWorkflow)}
              
              <Field label="Comments" hint="Optional comments for this action">
                <Textarea
                  value={actionComments}
                  onChange={(_, data) => setActionComments(data.value)}
                  placeholder="Enter your comments..."
                  rows={3}
                  disabled={isProcessingAction}
                />
              </Field>
              
              {workflowAction?.action === 'approve' && (
                <MessageBar intent="success">
                  This will approve the current step and move the workflow forward.
                </MessageBar>
              )}
              
              {workflowAction?.action === 'reject' && (
                <MessageBar intent="error">
                  This will reject the workflow and stop the approval process.
                </MessageBar>
              )}

              {workflowAction?.action === 'request-changes' && (
                <MessageBar intent="warning">
                  This will request changes to the document and pause the workflow.
                </MessageBar>
              )}
            </DialogContent>

            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setIsActionDialogOpen(false)}
                disabled={isProcessingAction}
              >
                Cancel
              </Button>
              <Button 
                appearance="primary"
                onClick={handleActionSubmit}
                disabled={isProcessingAction}
              >
                {isProcessingAction ? (
                  <>
                    <Spinner size="tiny" />
                    Processing...
                  </>
                ) : (
                  `${workflowAction?.action?.charAt(0).toUpperCase()}${workflowAction?.action?.slice(1)} Step`
                )}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
