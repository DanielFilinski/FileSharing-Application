/**
 * ClientForm - Component for creating and editing clients
 * Implements the enhanced client management functionality
 */

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
  Field,
  Dropdown,
  Option,
  Checkbox,
  Textarea,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  Divider,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  Person24Regular,
  Mail24Regular,
  Phone24Regular,
  Building24Regular,
  Save24Regular,
  Cancel24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  Shield24Regular
} from '@fluentui/react-icons';

import { 
  userManagementService, 
  type Client, 
  type CreateClientRequest,
  type Employee 
} from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxWidth: '600px'
  },
  row: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start'
  },
  field: {
    flex: 1
  },
  section: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalM
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalS
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  businessInfo: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  accessControl: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  documentAccess: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXL
  },
  error: {
    marginBottom: tokens.spacingVerticalM
  },
  accessLevelBadge: {
    marginLeft: tokens.spacingHorizontalXS
  }
});

export interface ClientFormProps {
  client?: Client;
  mode: 'create' | 'edit' | 'view';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: Client) => void;
  serviceProviders?: Employee[];
  availableDocuments?: Array<{ id: string; name: string; category: string }>;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  mode,
  isOpen,
  onClose,
  onSubmit,
  serviceProviders = [],
  availableDocuments = []
}) => {
  const styles = useStyles();
  
  // Form state
  const [formData, setFormData] = useState<CreateClientRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    firmName: '',
    firmAddress: '',
    businessType: '',
    isActive: true,
    accessLevel: 'read',
    assignedServiceProvider: '',
    documentsAccess: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Available options
  const accessLevelOptions = [
    { key: 'read', text: 'Read Only', description: 'Can view documents only' },
    { key: 'write', text: 'Read/Write', description: 'Can view and edit documents' },
    { key: 'admin', text: 'Admin', description: 'Full access to all features' }
  ];
  
  const businessTypeOptions = [
    { key: 'law', text: 'Law Firm' },
    { key: 'accounting', text: 'Accounting Firm' },
    { key: 'consulting', text: 'Consulting Firm' },
    { key: 'real-estate', text: 'Real Estate' },
    { key: 'healthcare', text: 'Healthcare' },
    { key: 'technology', text: 'Technology' },
    { key: 'finance', text: 'Finance' },
    { key: 'other', text: 'Other' }
  ];
  
  // Initialize form data when client prop changes
  useEffect(() => {
    if (client && mode !== 'create') {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        firmName: client.firmName || '',
        firmAddress: client.firmAddress || '',
        businessType: client.businessType || '',
        isActive: client.isActive ?? true,
        accessLevel: client.accessLevel || 'read',
        assignedServiceProvider: client.assignedServiceProvider || '',
        documentsAccess: client.documentsAccess || []
      });
    } else if (mode === 'create') {
      // Reset form for new client
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        firmName: '',
        firmAddress: '',
        businessType: '',
        isActive: true,
        accessLevel: 'read',
        assignedServiceProvider: '',
        documentsAccess: []
      });
    }
    setError(null);
  }, [client, mode, isOpen]);
  
  // Handle form field changes
  const handleFieldChange = (field: keyof CreateClientRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle document access changes
  const handleDocumentAccessChange = (documentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      documentsAccess: checked 
        ? [...(prev.documentsAccess || []), documentId]
        : (prev.documentsAccess || []).filter(id => id !== documentId)
    }));
  };
  
  // Handle select all documents
  const handleSelectAllDocuments = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      documentsAccess: checked ? availableDocuments.map(doc => doc.id) : []
    }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Basic phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      let result;
      
      if (mode === 'create') {
        result = await userManagementService.createClient(formData);
      } else if (mode === 'edit' && client) {
        result = await userManagementService.updateClient(client.id, formData);
      } else {
        throw new Error('Invalid mode or missing client data');
      }
      
      if (result.success && result.data) {
        notificationService.success(
          'Success',
          mode === 'create' ? 'Client created successfully' : 'Client updated successfully'
        );
        onSubmit(result.data);
        onClose();
      } else {
        setError(result.error || 'Failed to save client');
      }
    } catch (error: any) {
      console.error('Error saving client:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };
  
  const isReadOnly = mode === 'view';
  const selectedDocumentsCount = formData.documentsAccess?.length || 0;
  const totalDocumentsCount = availableDocuments.length;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <Person24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
            {mode === 'create' ? 'Create New Client' : 
             mode === 'edit' ? 'Edit Client' : 
             'Client Details'}
          </DialogTitle>
          
          <DialogContent>
            {error && (
              <MessageBar intent="error" className={styles.error}>
                <MessageBarBody>
                  <Warning24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
                  {error}
                </MessageBarBody>
              </MessageBar>
            )}
            
            {isLoading ? (
              <div className={styles.loading}>
                <Spinner size="large" label="Loading client data..." />
              </div>
            ) : (
              <div className={styles.form}>
                {/* Basic Information */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Basic Information</Text>
                  
                  <div className={styles.row}>
                    <Field label="First Name" required className={styles.field}>
                      <Input
                        value={formData.firstName}
                        onChange={(_, data) => handleFieldChange('firstName', data.value)}
                        placeholder="Enter first name"
                        disabled={isReadOnly}
                      />
                    </Field>
                    
                    <Field label="Last Name" required className={styles.field}>
                      <Input
                        value={formData.lastName}
                        onChange={(_, data) => handleFieldChange('lastName', data.value)}
                        placeholder="Enter last name"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                  
                  <div className={styles.row}>
                    <Field label="Email" required className={styles.field}>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(_, data) => handleFieldChange('email', data.value)}
                        placeholder="Enter email address"
                        disabled={isReadOnly}
                      />
                    </Field>
                    
                    <Field label="Phone" required className={styles.field}>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(_, data) => handleFieldChange('phone', data.value)}
                        placeholder="Enter phone number"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                  
                  <Field>
                    <Checkbox
                      label="Active Client"
                      checked={formData.isActive}
                      onChange={(_, data) => handleFieldChange('isActive', data.checked)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                
                <Divider />
                
                {/* Business Information */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Business Information</Text>
                  <div className={styles.businessInfo}>
                    <Field label="Firm Name">
                      <Input
                        value={formData.firmName || ''}
                        onChange={(_, data) => handleFieldChange('firmName', data.value)}
                        placeholder="Enter firm name"
                        disabled={isReadOnly}
                      />
                    </Field>
                    
                    <Field label="Business Type">
                      <Dropdown
                        value={formData.businessType || ''}
                        onOptionSelect={(_, data) => handleFieldChange('businessType', data.optionValue)}
                        placeholder="Select business type"
                        disabled={isReadOnly}
                      >
                        {businessTypeOptions.map(option => (
                          <Option key={option.key} value={option.key}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                    
                    <Field label="Firm Address">
                      <Textarea
                        value={formData.firmAddress || ''}
                        onChange={(_, data) => handleFieldChange('firmAddress', data.value)}
                        placeholder="Enter firm address"
                        rows={3}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
                
                <Divider />
                
                {/* Access Control */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Access Control</Text>
                  <div className={styles.accessControl}>
                    <div className={styles.row}>
                      <Field label="Access Level" required className={styles.field}>
                        <Dropdown
                          value={formData.accessLevel}
                          onOptionSelect={(_, data) => handleFieldChange('accessLevel', data.optionValue)}
                          disabled={isReadOnly}
                        >
                          {accessLevelOptions.map(option => (
                            <Option key={option.key} value={option.key}>
                              <div>
                                <div>{option.text}</div>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                                  {option.description}
                                </Text>
                              </div>
                            </Option>
                          ))}
                        </Dropdown>
                        <Badge 
                          appearance="filled" 
                          color={formData.accessLevel === 'admin' ? 'danger' : 
                                 formData.accessLevel === 'write' ? 'warning' : 'success'}
                          className={styles.accessLevelBadge}
                        >
                          {accessLevelOptions.find(opt => opt.key === formData.accessLevel)?.text}
                        </Badge>
                      </Field>
                      
                      <Field label="Assigned Service Provider" className={styles.field}>
                        <Dropdown
                          value={formData.assignedServiceProvider || ''}
                          onOptionSelect={(_, data) => handleFieldChange('assignedServiceProvider', data.optionValue)}
                          placeholder="Select service provider"
                          disabled={isReadOnly}
                        >
                          {serviceProviders.map(provider => (
                            <Option key={provider.id} value={provider.id}>
                              {provider.firstName} {provider.lastName} ({provider.email})
                            </Option>
                          ))}
                        </Dropdown>
                      </Field>
                    </div>
                  </div>
                </div>
                
                <Divider />
                
                {/* Document Access */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>
                    Document Access
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginLeft: tokens.spacingHorizontalS }}>
                      ({selectedDocumentsCount} of {totalDocumentsCount} documents)
                    </Text>
                  </Text>
                  
                  {!isReadOnly && totalDocumentsCount > 0 && (
                    <Field>
                      <Checkbox
                        label="Select All Documents"
                        checked={selectedDocumentsCount === totalDocumentsCount}
                        onChange={(_, data) => handleSelectAllDocuments(data.checked || false)}
                      />
                    </Field>
                  )}
                  
                  <div className={styles.documentAccess}>
                    {availableDocuments.length === 0 ? (
                      <Text style={{ color: tokens.colorNeutralForeground2, fontStyle: 'italic' }}>
                        No documents available for access control
                      </Text>
                    ) : (
                      <div className={styles.checkboxGroup}>
                        {availableDocuments.map(document => (
                          <Checkbox
                            key={document.id}
                            label={`${document.name} (${document.category})`}
                            checked={formData.documentsAccess?.includes(document.id) || false}
                            onChange={(_, data) => handleDocumentAccessChange(document.id, data.checked || false)}
                            disabled={isReadOnly}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Summary */}
                <div className={styles.section}>
                  <Card>
                    <CardHeader
                      image={<Shield24Regular />}
                      header={<Text weight="semibold">Access Summary</Text>}
                    />
                    <CardPreview>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                        <Text size={200}>
                          <strong>Access Level:</strong> {accessLevelOptions.find(opt => opt.key === formData.accessLevel)?.text}
                        </Text>
                        <Text size={200}>
                          <strong>Documents Access:</strong> {selectedDocumentsCount} document{selectedDocumentsCount !== 1 ? 's' : ''}
                        </Text>
                        <Text size={200}>
                          <strong>Service Provider:</strong> {
                            formData.assignedServiceProvider 
                              ? serviceProviders.find(p => p.id === formData.assignedServiceProvider)?.firstName + ' ' +
                                serviceProviders.find(p => p.id === formData.assignedServiceProvider)?.lastName
                              : 'Not assigned'
                          }
                        </Text>
                        <Text size={200}>
                          <strong>Status:</strong> {formData.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </div>
                    </CardPreview>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
          
          {!isReadOnly && (
            <DialogActions>
              <Button
                appearance="secondary"
                icon={<Cancel24Regular />}
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                icon={<Save24Regular />}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Save Changes'}
              </Button>
            </DialogActions>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

