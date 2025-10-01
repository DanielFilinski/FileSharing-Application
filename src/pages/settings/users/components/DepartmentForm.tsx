/**
 * DepartmentForm - Component for creating and editing departments
 * Implements the enhanced department management functionality
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
  Building24Regular,
  Person24Regular,
  Save24Regular,
  Cancel24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  People24Regular,
  Shield24Regular
} from '@fluentui/react-icons';

import { 
  userManagementService, 
  type Department, 
  type CreateDepartmentRequest,
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
  permissions: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  hierarchy: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  employeeList: {
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
  managerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    marginTop: tokens.spacingVerticalXS
  }
});

export interface DepartmentFormProps {
  department?: Department;
  mode: 'create' | 'edit' | 'view';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (department: Department) => void;
  managers?: Employee[];
  parentDepartments?: Department[];
  availableEmployees?: Employee[];
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  mode,
  isOpen,
  onClose,
  onSubmit,
  managers = [],
  parentDepartments = [],
  availableEmployees = []
}) => {
  const styles = useStyles();
  
  // Form state
  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    name: '',
    description: '',
    managerId: '',
    managerName: '',
    officeId: '',
    permissions: {
      canCreateUsers: false,
      canManageDocuments: true,
      canApproveDocuments: false,
      canManageWorkflows: false
    },
    hierarchy: {
      parentDepartmentId: '',
      level: 1,
      children: []
    }
  });
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Available options
  const officeOptions = [
    { key: 'new-york', text: 'New York' },
    { key: 'chicago', text: 'Chicago' },
    { key: 'los-angeles', text: 'Los Angeles' },
    { key: 'boston', text: 'Boston' },
    { key: 'seattle', text: 'Seattle' }
  ];
  
  // Initialize form data when department prop changes
  useEffect(() => {
    if (department && mode !== 'create') {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        managerId: department.managerId || '',
        managerName: department.managerName || '',
        officeId: department.officeId || '',
        permissions: department.permissions || {
          canCreateUsers: false,
          canManageDocuments: true,
          canApproveDocuments: false,
          canManageWorkflows: false
        },
        hierarchy: department.hierarchy || {
          parentDepartmentId: '',
          level: 1,
          children: []
        }
      });
      setSelectedEmployees(department.employees || []);
    } else if (mode === 'create') {
      // Reset form for new department
      setFormData({
        name: '',
        description: '',
        managerId: '',
        managerName: '',
        officeId: '',
        permissions: {
          canCreateUsers: false,
          canManageDocuments: true,
          canApproveDocuments: false,
          canManageWorkflows: false
        },
        hierarchy: {
          parentDepartmentId: '',
          level: 1,
          children: []
        }
      });
      setSelectedEmployees([]);
    }
    setError(null);
  }, [department, mode, isOpen]);
  
  // Handle form field changes
  const handleFieldChange = (field: keyof CreateDepartmentRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle manager selection
  const handleManagerChange = (managerId: string) => {
    const selectedManager = managers.find(m => m.id === managerId);
    setFormData(prev => ({
      ...prev,
      managerId: managerId,
      managerName: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : ''
    }));
  };
  
  // Handle permission changes
  const handlePermissionChange = (permission: keyof typeof formData.permissions, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions!,
        [permission]: checked
      }
    }));
  };
  
  // Handle hierarchy changes
  const handleHierarchyChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      hierarchy: {
        ...prev.hierarchy!,
        [field]: value
      }
    }));
  };
  
  // Handle employee selection
  const handleEmployeeChange = (employeeId: string, checked: boolean) => {
    setSelectedEmployees(prev => 
      checked 
        ? [...prev, employeeId]
        : prev.filter(id => id !== employeeId)
    );
  };
  
  // Handle select all employees
  const handleSelectAllEmployees = (checked: boolean) => {
    setSelectedEmployees(checked ? availableEmployees.map(emp => emp.id) : []);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Department name is required');
      return false;
    }
    if (!formData.managerId.trim()) {
      setError('Manager is required');
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
      // Prepare department data with employees
      const departmentData = {
        ...formData,
        employees: selectedEmployees
      };
      
      let result;
      
      if (mode === 'create') {
        result = await userManagementService.createDepartment(departmentData);
      } else if (mode === 'edit' && department) {
        result = await userManagementService.updateDepartment(department.id, departmentData);
      } else {
        throw new Error('Invalid mode or missing department data');
      }
      
      if (result.success && result.data) {
        notificationService.success(
          'Success',
          mode === 'create' ? 'Department created successfully' : 'Department updated successfully'
        );
        onSubmit(result.data);
        onClose();
      } else {
        setError(result.error || 'Failed to save department');
      }
    } catch (error: any) {
      console.error('Error saving department:', error);
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
  const selectedEmployeesCount = selectedEmployees.length;
  const totalEmployeesCount = availableEmployees.length;
  const selectedManager = managers.find(m => m.id === formData.managerId);
  const selectedParentDepartment = parentDepartments.find(d => d.id === formData.hierarchy?.parentDepartmentId);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <Building24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
            {mode === 'create' ? 'Create New Department' : 
             mode === 'edit' ? 'Edit Department' : 
             'Department Details'}
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
                <Spinner size="large" label="Loading department data..." />
              </div>
            ) : (
              <div className={styles.form}>
                {/* Basic Information */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Basic Information</Text>
                  
                  <Field label="Department Name" required>
                    <Input
                      value={formData.name}
                      onChange={(_, data) => handleFieldChange('name', data.value)}
                      placeholder="Enter department name"
                      disabled={isReadOnly}
                    />
                  </Field>
                  
                  <Field label="Description">
                    <Textarea
                      value={formData.description || ''}
                      onChange={(_, data) => handleFieldChange('description', data.value)}
                      placeholder="Enter department description"
                      rows={3}
                      disabled={isReadOnly}
                    />
                  </Field>
                  
                  <div className={styles.row}>
                    <Field label="Office" className={styles.field}>
                      <Dropdown
                        value={formData.officeId || ''}
                        onOptionSelect={(_, data) => handleFieldChange('officeId', data.optionValue)}
                        placeholder="Select office"
                        disabled={isReadOnly}
                      >
                        {officeOptions.map(option => (
                          <Option key={option.key} value={option.key}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                    
                    <Field label="Manager" required className={styles.field}>
                      <Dropdown
                        value={formData.managerId}
                        onOptionSelect={(_, data) => handleManagerChange(data.optionValue as string)}
                        placeholder="Select manager"
                        disabled={isReadOnly}
                      >
                        {managers.map(manager => (
                          <Option key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName} ({manager.email})
                          </Option>
                        ))}
                      </Dropdown>
                      {selectedManager && (
                        <div className={styles.managerInfo}>
                          <Person24Regular />
                          <Text size={200}>
                            {selectedManager.firstName} {selectedManager.lastName} - {selectedManager.classification}
                          </Text>
                        </div>
                      )}
                    </Field>
                  </div>
                </div>
                
                <Divider />
                
                {/* Permissions */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Department Permissions</Text>
                  <div className={styles.permissions}>
                    <div className={styles.checkboxGroup}>
                      <Checkbox
                        label="Can Create Users"
                        description="Allow department to create new users"
                        checked={formData.permissions?.canCreateUsers || false}
                        onChange={(_, data) => handlePermissionChange('canCreateUsers', data.checked || false)}
                        disabled={isReadOnly}
                      />
                      <Checkbox
                        label="Can Manage Documents"
                        description="Allow department to manage documents"
                        checked={formData.permissions?.canManageDocuments || false}
                        onChange={(_, data) => handlePermissionChange('canManageDocuments', data.checked || false)}
                        disabled={isReadOnly}
                      />
                      <Checkbox
                        label="Can Approve Documents"
                        description="Allow department to approve documents"
                        checked={formData.permissions?.canApproveDocuments || false}
                        onChange={(_, data) => handlePermissionChange('canApproveDocuments', data.checked || false)}
                        disabled={isReadOnly}
                      />
                      <Checkbox
                        label="Can Manage Workflows"
                        description="Allow department to manage workflows"
                        checked={formData.permissions?.canManageWorkflows || false}
                        onChange={(_, data) => handlePermissionChange('canManageWorkflows', data.checked || false)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
                
                <Divider />
                
                {/* Hierarchy */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Department Hierarchy</Text>
                  <div className={styles.hierarchy}>
                    <Field label="Parent Department">
                      <Dropdown
                        value={formData.hierarchy?.parentDepartmentId || ''}
                        onOptionSelect={(_, data) => handleHierarchyChange('parentDepartmentId', data.optionValue)}
                        placeholder="Select parent department (optional)"
                        disabled={isReadOnly}
                      >
                        {parentDepartments
                          .filter(d => d.id !== department?.id) // Don't allow self-reference
                          .map(dept => (
                            <Option key={dept.id} value={dept.id}>
                              {dept.name} (Level {dept.hierarchy?.level || 1})
                            </Option>
                          ))}
                      </Dropdown>
                      {selectedParentDepartment && (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: tokens.spacingVerticalXS }}>
                          Parent: {selectedParentDepartment.name}
                        </Text>
                      )}
                    </Field>
                    
                    <Field label="Hierarchy Level">
                      <Input
                        type="number"
                        value={formData.hierarchy?.level?.toString() || '1'}
                        onChange={(_, data) => handleHierarchyChange('level', parseInt(data.value) || 1)}
                        placeholder="Hierarchy level"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
                
                <Divider />
                
                {/* Employee Assignment */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>
                    Department Employees
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginLeft: tokens.spacingHorizontalS }}>
                      ({selectedEmployeesCount} of {totalEmployeesCount} employees)
                    </Text>
                  </Text>
                  
                  {!isReadOnly && totalEmployeesCount > 0 && (
                    <Field>
                      <Checkbox
                        label="Select All Employees"
                        checked={selectedEmployeesCount === totalEmployeesCount}
                        onChange={(_, data) => handleSelectAllEmployees(data.checked || false)}
                      />
                    </Field>
                  )}
                  
                  <div className={styles.employeeList}>
                    {availableEmployees.length === 0 ? (
                      <Text style={{ color: tokens.colorNeutralForeground2, fontStyle: 'italic' }}>
                        No employees available for assignment
                      </Text>
                    ) : (
                      <div className={styles.checkboxGroup}>
                        {availableEmployees.map(employee => (
                          <Checkbox
                            key={employee.id}
                            label={`${employee.firstName} ${employee.lastName} (${employee.classification})`}
                            description={employee.email}
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={(_, data) => handleEmployeeChange(employee.id, data.checked || false)}
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
                      header={<Text weight="semibold">Department Summary</Text>}
                    />
                    <CardPreview>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                        <Text size={200}>
                          <strong>Manager:</strong> {formData.managerName || 'Not selected'}
                        </Text>
                        <Text size={200}>
                          <strong>Employees:</strong> {selectedEmployeesCount} employee{selectedEmployeesCount !== 1 ? 's' : ''}
                        </Text>
                        <Text size={200}>
                          <strong>Parent Department:</strong> {selectedParentDepartment?.name || 'None'}
                        </Text>
                        <Text size={200}>
                          <strong>Hierarchy Level:</strong> {formData.hierarchy?.level || 1}
                        </Text>
                        <Text size={200}>
                          <strong>Permissions:</strong> {
                            Object.entries(formData.permissions || {})
                              .filter(([_, value]) => value)
                              .map(([key, _]) => key.replace('can', '').replace(/([A-Z])/g, ' $1').trim())
                              .join(', ') || 'None'
                          }
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
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Department' : 'Save Changes'}
              </Button>
            </DialogActions>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
