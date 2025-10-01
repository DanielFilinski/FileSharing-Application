/**
 * CreateEscalationDialog Component
 * Dialog for creating new escalations
 */

import React, { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Textarea,
  Dropdown,
  Option,
  Label,
  Field,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  CreateEscalationRequest,
  EscalationType,
  EscalationPriority,
  EscalationCategory,
} from '../../shared/lib/escalation/types';

interface CreateEscalationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: CreateEscalationRequest) => Promise<{ success: boolean; error?: string }>;
}

export const CreateEscalationDialog: React.FC<CreateEscalationDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEscalationRequest>({
    type: 'custom',
    title: '',
    description: '',
    priority: 'medium',
    category: 'technical',
    details: {},
    tags: [],
  });

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onSubmit(formData);
      
      if (result.success) {
        // Reset form
        setFormData({
          type: 'custom',
          title: '',
          description: '',
          priority: 'medium',
          category: 'technical',
          details: {},
          tags: [],
        });
        onClose();
      } else {
        setError(result.error || 'Failed to create escalation');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleFieldChange = (field: keyof CreateEscalationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ==========================================
  // ESCALATION TYPE OPTIONS
  // ==========================================

  const escalationTypes: { value: EscalationType; label: string; description: string }[] = [
    { value: 'storage_overflow', label: 'Storage Overflow', description: 'User exceeded storage quota' },
    { value: 'storage_quota_warning', label: 'Storage Warning', description: 'User approaching storage limit' },
    { value: 'document_validation_failed', label: 'Validation Failed', description: 'Document validation error' },
    { value: 'document_approval_overdue', label: 'Approval Overdue', description: 'Document approval deadline missed' },
    { value: 'document_signing_failed', label: 'Signing Failed', description: 'Document signing error' },
    { value: 'sharepoint_sync_failed', label: 'SharePoint Sync Failed', description: 'SharePoint synchronization error' },
    { value: 'system_error', label: 'System Error', description: 'General system error' },
    { value: 'security_breach', label: 'Security Breach', description: 'Security incident detected' },
    { value: 'user_access_issue', label: 'User Access Issue', description: 'User access problem' },
    { value: 'workflow_blocked', label: 'Workflow Blocked', description: 'Document workflow stuck' },
    { value: 'deadline_missed', label: 'Deadline Missed', description: 'Important deadline missed' },
    { value: 'api_integration_failed', label: 'API Integration Failed', description: 'External API integration error' },
    { value: 'custom', label: 'Custom', description: 'Custom escalation type' },
  ];

  const priorityOptions: { value: EscalationPriority; label: string; description: string }[] = [
    { value: 'low', label: 'Low', description: 'Non-urgent issue' },
    { value: 'medium', label: 'Medium', description: 'Standard priority' },
    { value: 'high', label: 'High', description: 'Important issue' },
    { value: 'critical', label: 'Critical', description: 'Urgent issue requiring immediate attention' },
  ];

  const categoryOptions: { value: EscalationCategory; label: string; description: string }[] = [
    { value: 'technical', label: 'Technical', description: 'Technical issues' },
    { value: 'business', label: 'Business', description: 'Business process issues' },
    { value: 'security', label: 'Security', description: 'Security-related issues' },
    { value: 'compliance', label: 'Compliance', description: 'Compliance and regulatory issues' },
    { value: 'performance', label: 'Performance', description: 'Performance-related issues' },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <FluentProvider theme={webLightTheme}>
      <Dialog open={open} onOpenChange={(_, data) => !data.open && handleCancel()}>
        <DialogSurface>
          <DialogTitle>Create New Escalation</DialogTitle>
          
          <DialogBody>
            <DialogContent>
              {error && (
                <MessageBar intent="error" className="mb-4">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              <div className="space-y-4">
                {/* Escalation Type */}
                <Field label="Escalation Type" required>
                  <Dropdown
                    value={formData.type}
                    selectedOptions={[formData.type]}
                    onOptionSelect={(_, data) => handleFieldChange('type', data.optionValue)}
                  >
                    {escalationTypes.map((type) => (
                      <Option key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                {/* Priority */}
                <Field label="Priority" required>
                  <Dropdown
                    value={formData.priority}
                    selectedOptions={[formData.priority]}
                    onOptionSelect={(_, data) => handleFieldChange('priority', data.optionValue)}
                  >
                    {priorityOptions.map((priority) => (
                      <Option key={priority.value} value={priority.value}>
                        <div>
                          <div className="font-medium">{priority.label}</div>
                          <div className="text-sm text-gray-600">{priority.description}</div>
                        </div>
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                {/* Category */}
                <Field label="Category" required>
                  <Dropdown
                    value={formData.category}
                    selectedOptions={[formData.category]}
                    onOptionSelect={(_, data) => handleFieldChange('category', data.optionValue)}
                  >
                    {categoryOptions.map((category) => (
                      <Option key={category.value} value={category.value}>
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-sm text-gray-600">{category.description}</div>
                        </div>
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                {/* Title */}
                <Field label="Title" required>
                  <Input
                    value={formData.title}
                    onChange={(_, data) => handleFieldChange('title', data.value)}
                    placeholder="Brief description of the issue"
                    maxLength={200}
                  />
                </Field>

                {/* Description */}
                <Field label="Description" required>
                  <Textarea
                    value={formData.description}
                    onChange={(_, data) => handleFieldChange('description', data.value)}
                    placeholder="Detailed description of the issue, including steps to reproduce if applicable"
                    rows={4}
                    maxLength={2000}
                  />
                </Field>

                {/* Affected User */}
                <Field label="Affected User ID (Optional)">
                  <Input
                    value={formData.affectedUserId || ''}
                    onChange={(_, data) => handleFieldChange('affectedUserId', data.value || undefined)}
                    placeholder="User ID of the affected user"
                  />
                </Field>

                {/* Affected Document */}
                <Field label="Affected Document ID (Optional)">
                  <Input
                    value={formData.affectedDocumentId || ''}
                    onChange={(_, data) => handleFieldChange('affectedDocumentId', data.value || undefined)}
                    placeholder="Document ID of the affected document"
                  />
                </Field>

                {/* Affected Resource */}
                <Field label="Affected Resource ID (Optional)">
                  <Input
                    value={formData.affectedResourceId || ''}
                    onChange={(_, data) => handleFieldChange('affectedResourceId', data.value || undefined)}
                    placeholder="Resource ID of the affected resource"
                  />
                </Field>

                {/* Tags */}
                <Field label="Tags (Optional)">
                  <Input
                    value={formData.tags?.join(', ') || ''}
                    onChange={(_, data) => {
                      const tags = data.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                      handleFieldChange('tags', tags);
                    }}
                    placeholder="Comma-separated tags (e.g., storage, critical, user-facing)"
                  />
                </Field>
              </div>
            </DialogContent>
          </DialogBody>

          <DialogActions>
            <Button
              appearance="secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
            >
              {loading ? (
                <>
                  <Spinner size="tiny" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Escalation'
              )}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </FluentProvider>
  );
};
