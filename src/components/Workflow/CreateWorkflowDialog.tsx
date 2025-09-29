import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Textarea,
  Dropdown,
  Option,
  Field,
  Checkbox,
  SpinButton,
  Text,
  Badge,
  Card,
  CardHeader,
  MessageBar,
  MessageBarType,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  AddRegular,
  DeleteRegular,
  PersonRegular,
  CalendarRegular
} from '@fluentui/react-icons';
import { CreateWorkflowRequest, WorkflowStep } from '@/shared/api/workflowApi';

const useStyles = makeStyles({
  dialog: {
    minWidth: '600px',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  stepCard: {
    marginBottom: '12px'
  },
  stepHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stepFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '12px'
  },
  businessRulesSection: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: '16px'
  },
  addStepButton: {
    width: '100%',
    marginTop: '8px'
  }
});

interface CreateWorkflowDialogProps {
  isOpen: boolean;
  documentId?: string;
  documentName?: string;
  onClose: () => void;
  onSuccess: (workflow: any) => void;
}

const workflowTypes = [
  { key: 'approval', text: 'Approval Workflow' },
  { key: 'review', text: 'Review Workflow' },
  { key: 'signature-collection', text: 'Signature Collection' },
  { key: 'compliance-check', text: 'Compliance Check' }
];

const stepTypes = [
  { key: 'approval', text: 'Approval' },
  { key: 'review', text: 'Review' },
  { key: 'signature', text: 'Signature' },
  { key: 'notification', text: 'Notification' }
];

const priorities = [
  { key: 'low', text: 'Low', color: 'success' as const },
  { key: 'medium', text: 'Medium', color: 'neutral' as const },
  { key: 'high', text: 'High', color: 'warning' as const },
  { key: 'urgent', text: 'Urgent', color: 'danger' as const }
];

const approvalLevels = [
  { key: 'basic', text: 'Basic' },
  { key: 'advanced', text: 'Advanced' },
  { key: 'executive', text: 'Executive' }
];

const timeoutActions = [
  { key: 'escalate', text: 'Escalate' },
  { key: 'auto-approve', text: 'Auto Approve' },
  { key: 'auto-reject', text: 'Auto Reject' }
];

export const CreateWorkflowDialog: React.FC<CreateWorkflowDialogProps> = ({
  isOpen,
  documentId,
  documentName,
  onClose,
  onSuccess
}) => {
  const styles = useStyles();

  // Form state
  const [formData, setFormData] = useState<Partial<CreateWorkflowRequest>>({
    documentId: documentId || '',
    workflowType: 'approval',
    name: '',
    description: '',
    steps: [createEmptyStep()],
    priority: 'medium',
    businessRules: {
      requireAllApprovals: true,
      allowParallelProcessing: false,
      escalationTimeoutHours: 24,
      autoCompleteOnTimeout: false,
      notifyCreatorOnUpdate: true
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function createEmptyStep(): Omit<WorkflowStep, 'status' | 'completedAt' | 'completedBy'> {
    return {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'approval',
      assigneeId: '',
      assigneeName: '',
      assigneeEmail: '',
      priority: 'medium',
      requirements: {
        approvalLevel: 'basic',
        delegationAllowed: false,
        timeoutAction: 'escalate'
      }
    };
  }

  useEffect(() => {
    if (documentId && !formData.documentId) {
      setFormData(prev => ({ ...prev, documentId }));
    }
  }, [documentId, formData.documentId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleBusinessRuleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      businessRules: {
        ...prev.businessRules,
        [field]: value
      }
    }));
  };

  const handleStepChange = (stepIndex: number, field: string, value: any) => {
    const updatedSteps = [...(formData.steps || [])];
    if (field.startsWith('requirements.')) {
      const reqField = field.split('.')[1];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        requirements: {
          ...updatedSteps[stepIndex].requirements,
          [reqField]: value
        }
      };
    } else {
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        [field]: value
      };
    }
    setFormData(prev => ({ ...prev, steps: updatedSteps }));
  };

  const addStep = () => {
    const newSteps = [...(formData.steps || []), createEmptyStep()];
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const removeStep = (stepIndex: number) => {
    if ((formData.steps?.length || 0) <= 1) return; // Keep at least one step
    
    const updatedSteps = formData.steps?.filter((_, index) => index !== stepIndex) || [];
    setFormData(prev => ({ ...prev, steps: updatedSteps }));
  };

  const validateForm = (): string | null => {
    if (!formData.name?.trim()) return 'Workflow name is required';
    if (!formData.documentId?.trim()) return 'Document ID is required';
    if (!formData.steps || formData.steps.length === 0) return 'At least one step is required';

    for (let i = 0; i < formData.steps.length; i++) {
      const step = formData.steps[i];
      if (!step.name?.trim()) return `Step ${i + 1}: Name is required`;
      if (!step.assigneeEmail?.trim()) return `Step ${i + 1}: Assignee email is required`;
      if (!step.assigneeName?.trim()) return `Step ${i + 1}: Assignee name is required`;
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Here you would call the API to create the workflow
      // For now, we'll simulate success
      console.log('Creating workflow:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(formData);
      handleClose();
    } catch (error: any) {
      console.error('Failed to create workflow:', error);
      setError(error.message || 'Failed to create workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    // Reset form
    setFormData({
      documentId: documentId || '',
      workflowType: 'approval',
      name: '',
      description: '',
      steps: [createEmptyStep()],
      priority: 'medium',
      businessRules: {
        requireAllApprovals: true,
        allowParallelProcessing: false,
        escalationTimeoutHours: 24,
        autoCompleteOnTimeout: false,
        notifyCreatorOnUpdate: true
      }
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>Create New Workflow</DialogTitle>
          
          <DialogContent className={styles.content}>
            {/* Basic Information */}
            <Field label="Workflow Name" required>
              <Input
                value={formData.name || ''}
                onChange={(_, data) => handleInputChange('name', data.value)}
                placeholder="Enter workflow name..."
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={formData.description || ''}
                onChange={(_, data) => handleInputChange('description', data.value)}
                placeholder="Describe the purpose of this workflow..."
                disabled={isSubmitting}
                rows={3}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Workflow Type" required>
                <Dropdown
                  value={workflowTypes.find(t => t.key === formData.workflowType)?.text || ''}
                  selectedOptions={formData.workflowType ? [formData.workflowType] : []}
                  onOptionSelect={(_, data) => handleInputChange('workflowType', data.optionValue)}
                  disabled={isSubmitting}
                >
                  {workflowTypes.map((type) => (
                    <Option key={type.key} value={type.key}>
                      {type.text}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label="Priority">
                <Dropdown
                  value={priorities.find(p => p.key === formData.priority)?.text || ''}
                  selectedOptions={formData.priority ? [formData.priority] : []}
                  onOptionSelect={(_, data) => handleInputChange('priority', data.optionValue)}
                  disabled={isSubmitting}
                >
                  {priorities.map((priority) => (
                    <Option key={priority.key} value={priority.key}>
                      <Badge color={priority.color}>{priority.text}</Badge>
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            {/* Document Information */}
            {documentName && (
              <Field label="Document">
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: tokens.borderRadiusSmall 
                }}>
                  <Text>{documentName}</Text>
                </div>
              </Field>
            )}

            <Field label="Due Date">
              <Input
                type="datetime-local"
                value={formData.dueDate || ''}
                onChange={(_, data) => handleInputChange('dueDate', data.value)}
                disabled={isSubmitting}
              />
            </Field>

            {/* Workflow Steps */}
            <div>
              <Text size={400} weight="semibold">Workflow Steps</Text>
              
              {formData.steps?.map((step, index) => (
                <Card key={step.id} className={styles.stepCard}>
                  <CardHeader
                    header={
                      <div className={styles.stepHeader}>
                        <Text weight="semibold">Step {index + 1}</Text>
                        {(formData.steps?.length || 0) > 1 && (
                          <Button
                            appearance="subtle"
                            icon={<DeleteRegular />}
                            onClick={() => removeStep(index)}
                            disabled={isSubmitting}
                            size="small"
                          />
                        )}
                      </div>
                    }
                  />

                  <div className={styles.stepFields}>
                    <Field label="Step Name" required>
                      <Input
                        value={step.name}
                        onChange={(_, data) => handleStepChange(index, 'name', data.value)}
                        placeholder="Enter step name..."
                        disabled={isSubmitting}
                      />
                    </Field>

                    <Field label="Step Type">
                      <Dropdown
                        value={stepTypes.find(t => t.key === step.type)?.text || ''}
                        selectedOptions={[step.type]}
                        onOptionSelect={(_, data) => handleStepChange(index, 'type', data.optionValue)}
                        disabled={isSubmitting}
                      >
                        {stepTypes.map((type) => (
                          <Option key={type.key} value={type.key}>
                            {type.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>

                    <Field label="Assignee Name" required>
                      <Input
                        value={step.assigneeName}
                        onChange={(_, data) => handleStepChange(index, 'assigneeName', data.value)}
                        placeholder="Enter assignee name..."
                        disabled={isSubmitting}
                      />
                    </Field>

                    <Field label="Assignee Email" required>
                      <Input
                        type="email"
                        value={step.assigneeEmail}
                        onChange={(_, data) => handleStepChange(index, 'assigneeEmail', data.value)}
                        placeholder="Enter assignee email..."
                        disabled={isSubmitting}
                      />
                    </Field>

                    <Field label="Step Priority">
                      <Dropdown
                        value={priorities.find(p => p.key === step.priority)?.text || ''}
                        selectedOptions={[step.priority]}
                        onOptionSelect={(_, data) => handleStepChange(index, 'priority', data.optionValue)}
                        disabled={isSubmitting}
                      >
                        {priorities.map((priority) => (
                          <Option key={priority.key} value={priority.key}>
                            {priority.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>

                    <Field label="Approval Level">
                      <Dropdown
                        value={approvalLevels.find(l => l.key === step.requirements?.approvalLevel)?.text || ''}
                        selectedOptions={step.requirements?.approvalLevel ? [step.requirements.approvalLevel] : []}
                        onOptionSelect={(_, data) => handleStepChange(index, 'requirements.approvalLevel', data.optionValue)}
                        disabled={isSubmitting}
                      >
                        {approvalLevels.map((level) => (
                          <Option key={level.key} value={level.key}>
                            {level.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                    <Checkbox
                      checked={step.requirements?.delegationAllowed || false}
                      onChange={(_, data) => handleStepChange(index, 'requirements.delegationAllowed', data.checked)}
                      label="Allow delegation"
                      disabled={isSubmitting}
                    />
                  </div>
                </Card>
              ))}

              <Button
                className={styles.addStepButton}
                appearance="outline"
                icon={<AddRegular />}
                onClick={addStep}
                disabled={isSubmitting}
              >
                Add Step
              </Button>
            </div>

            {/* Business Rules */}
            <div className={styles.businessRulesSection}>
              <Text size={400} weight="semibold" style={{ marginBottom: '12px' }}>
                Business Rules
              </Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Checkbox
                  checked={formData.businessRules?.requireAllApprovals || false}
                  onChange={(_, data) => handleBusinessRuleChange('requireAllApprovals', data.checked)}
                  label="Require all approvals"
                  disabled={isSubmitting}
                />
                
                <Checkbox
                  checked={formData.businessRules?.allowParallelProcessing || false}
                  onChange={(_, data) => handleBusinessRuleChange('allowParallelProcessing', data.checked)}
                  label="Allow parallel processing"
                  disabled={isSubmitting}
                />

                <Field label="Escalation timeout (hours)">
                  <SpinButton
                    value={formData.businessRules?.escalationTimeoutHours || 24}
                    onChange={(_, data) => handleBusinessRuleChange('escalationTimeoutHours', data.value)}
                    min={1}
                    max={168} // 1 week
                    disabled={isSubmitting}
                  />
                </Field>
                
                <Checkbox
                  checked={formData.businessRules?.notifyCreatorOnUpdate || false}
                  onChange={(_, data) => handleBusinessRuleChange('notifyCreatorOnUpdate', data.checked)}
                  label="Notify creator on updates"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <MessageBar intent="error">
                {error}
              </MessageBar>
            )}
          </DialogContent>

          <DialogActions>
            <Button 
              appearance="secondary" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              appearance="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Workflow'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
