/**
 * EmployeeForm - Component for creating and editing employees
 * Implements the enhanced employee management functionality
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
  CheckmarkCircle24Regular
} from '@fluentui/react-icons';

import { 
  userManagementService, 
  type Employee, 
  type CreateEmployeeRequest,
  type Department 
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
  skillTag: {
    margin: tokens.spacingVerticalXS
  },
  emergencyContact: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  workSchedule: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXL
  },
  error: {
    marginBottom: tokens.spacingVerticalM
  }
});

export interface EmployeeFormProps {
  employee?: Employee;
  mode: 'create' | 'edit' | 'view';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: Employee) => void;
  departments?: Department[];
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  mode,
  isOpen,
  onClose,
  onSubmit,
  departments = []
}) => {
  const styles = useStyles();
  
  // Form state
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    firstName: '',
    lastName: '',
    email: '',
    classification: 'Associate',
    office: '',
    role: '',
    department: '',
    departmentId: '',
    managerId: '',
    phone: '',
    isActive: true,
    permissions: [],
    skills: [],
    certifications: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    workSchedule: {
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'UTC',
      workDays: [1, 2, 3, 4, 5] // Monday to Friday
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Available options
  const classificationOptions = [
    { key: 'Manager', text: 'Manager' },
    { key: 'Senior', text: 'Senior' },
    { key: 'Associate', text: 'Associate' },
    { key: 'Junior', text: 'Junior' }
  ];
  
  const officeOptions = [
    { key: 'New York', text: 'New York' },
    { key: 'Chicago', text: 'Chicago' },
    { key: 'Los Angeles', text: 'Los Angeles' },
    { key: 'Boston', text: 'Boston' },
    { key: 'Seattle', text: 'Seattle' }
  ];
  
  const permissionOptions = [
    { key: 'documents:view', text: 'View Documents' },
    { key: 'documents:create', text: 'Create Documents' },
    { key: 'documents:edit', text: 'Edit Documents' },
    { key: 'documents:delete', text: 'Delete Documents' },
    { key: 'users:view', text: 'View Users' },
    { key: 'users:create', text: 'Create Users' },
    { key: 'workflow:manage', text: 'Manage Workflows' },
    { key: 'settings:view', text: 'View Settings' }
  ];
  
  const workDayOptions = [
    { key: 0, text: 'Sunday' },
    { key: 1, text: 'Monday' },
    { key: 2, text: 'Tuesday' },
    { key: 3, text: 'Wednesday' },
    { key: 4, text: 'Thursday' },
    { key: 5, text: 'Friday' },
    { key: 6, text: 'Saturday' }
  ];
  
  // Initialize form data when employee prop changes
  useEffect(() => {
    if (employee && mode !== 'create') {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        classification: employee.classification || 'Associate',
        office: employee.office || '',
        role: employee.role || '',
        department: employee.department || '',
        departmentId: employee.departmentId || '',
        managerId: employee.managerId || '',
        phone: employee.phone || '',
        isActive: employee.isActive ?? true,
        permissions: employee.permissions || [],
        skills: employee.skills || [],
        certifications: employee.certifications || [],
        emergencyContact: employee.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        },
        workSchedule: employee.workSchedule || {
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'UTC',
          workDays: [1, 2, 3, 4, 5]
        }
      });
    } else if (mode === 'create') {
      // Reset form for new employee
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        classification: 'Associate',
        office: '',
        role: '',
        department: '',
        departmentId: '',
        managerId: '',
        phone: '',
        isActive: true,
        permissions: [],
        skills: [],
        certifications: [],
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        workSchedule: {
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'UTC',
          workDays: [1, 2, 3, 4, 5]
        }
      });
    }
    setError(null);
  }, [employee, mode, isOpen]);
  
  // Handle form field changes
  const handleFieldChange = (field: keyof CreateEmployeeRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle emergency contact changes
  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact!,
        [field]: value
      }
    }));
  };
  
  // Handle work schedule changes
  const handleWorkScheduleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule!,
        [field]: value
      }
    }));
  };
  
  // Handle permission changes
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...(prev.permissions || []), permission]
        : (prev.permissions || []).filter(p => p !== permission)
    }));
  };
  
  // Handle work days changes
  const handleWorkDayChange = (day: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule!,
        workDays: checked
          ? [...(prev.workSchedule?.workDays || []), day]
          : (prev.workSchedule?.workDays || []).filter(d => d !== day)
      }
    }));
  };
  
  // Handle skill addition
  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !formData.skills?.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill.trim()]
      }));
    }
  };
  
  // Handle skill removal
  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(skill => skill !== skillToRemove)
    }));
  };
  
  // Handle certification addition
  const handleCertificationAdd = (certification: string) => {
    if (certification.trim() && !formData.certifications?.includes(certification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), certification.trim()]
      }));
    }
  };
  
  // Handle certification removal
  const handleCertificationRemove = (certificationToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: (prev.certifications || []).filter(cert => cert !== certificationToRemove)
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
    if (!formData.office.trim()) {
      setError('Office is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
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
        result = await userManagementService.createEmployee(formData);
      } else if (mode === 'edit' && employee) {
        result = await userManagementService.updateEmployee(employee.id, formData);
      } else {
        throw new Error('Invalid mode or missing employee data');
      }
      
      if (result.success && result.data) {
        notificationService.success(
          'Success',
          mode === 'create' ? 'Employee created successfully' : 'Employee updated successfully'
        );
        onSubmit(result.data);
        onClose();
      } else {
        setError(result.error || 'Failed to save employee');
      }
    } catch (error: any) {
      console.error('Error saving employee:', error);
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
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <Person24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
            {mode === 'create' ? 'Create New Employee' : 
             mode === 'edit' ? 'Edit Employee' : 
             'Employee Details'}
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
                <Spinner size="large" label="Loading employee data..." />
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
                    
                    <Field label="Phone" className={styles.field}>
                      <Input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(_, data) => handleFieldChange('phone', data.value)}
                        placeholder="Enter phone number"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                  
                  <div className={styles.row}>
                    <Field label="Classification" required className={styles.field}>
                      <Dropdown
                        value={formData.classification}
                        onOptionSelect={(_, data) => handleFieldChange('classification', data.optionValue)}
                        disabled={isReadOnly}
                      >
                        {classificationOptions.map(option => (
                          <Option key={option.key} value={option.key}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                    
                    <Field label="Office" required className={styles.field}>
                      <Dropdown
                        value={formData.office}
                        onOptionSelect={(_, data) => handleFieldChange('office', data.optionValue)}
                        disabled={isReadOnly}
                      >
                        {officeOptions.map(option => (
                          <Option key={option.key} value={option.key}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                  </div>
                  
                  <div className={styles.row}>
                    <Field label="Role" className={styles.field}>
                      <Input
                        value={formData.role || ''}
                        onChange={(_, data) => handleFieldChange('role', data.value)}
                        placeholder="Enter job role"
                        disabled={isReadOnly}
                      />
                    </Field>
                    
                    <Field label="Department" className={styles.field}>
                      <Dropdown
                        value={formData.department || ''}
                        onOptionSelect={(_, data) => handleFieldChange('department', data.optionValue)}
                        disabled={isReadOnly}
                      >
                        {departments.map(dept => (
                          <Option key={dept.id} value={dept.name}>
                            {dept.name}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                  </div>
                  
                  <Field>
                    <Checkbox
                      label="Active Employee"
                      checked={formData.isActive}
                      onChange={(_, data) => handleFieldChange('isActive', data.checked)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                
                <Divider />
                
                {/* Permissions */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Permissions</Text>
                  <div className={styles.checkboxGroup}>
                    {permissionOptions.map(permission => (
                      <Checkbox
                        key={permission.key}
                        label={permission.text}
                        checked={formData.permissions?.includes(permission.key) || false}
                        onChange={(_, data) => handlePermissionChange(permission.key, data.checked || false)}
                        disabled={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
                
                <Divider />
                
                {/* Skills & Certifications */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Skills & Certifications</Text>
                  
                  <Field label="Skills">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingVerticalXS, marginBottom: tokens.spacingVerticalS }}>
                      {formData.skills?.map(skill => (
                        <Badge
                          key={skill}
                          className={styles.skillTag}
                          size="medium"
                          color="brand"
                        >
                          {skill}
                          {!isReadOnly && (
                            <button
                              onClick={() => handleSkillRemove(skill)}
                              style={{ 
                                marginLeft: tokens.spacingHorizontalXS,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {!isReadOnly && (
                      <Input
                        placeholder="Add skill and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSkillAdd((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    )}
                  </Field>
                  
                  <Field label="Certifications">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingVerticalXS, marginBottom: tokens.spacingVerticalS }}>
                      {formData.certifications?.map(cert => (
                        <Badge
                          key={cert}
                          className={styles.skillTag}
                          size="medium"
                          color="success"
                        >
                          {cert}
                          {!isReadOnly && (
                            <button
                              onClick={() => handleCertificationRemove(cert)}
                              style={{ 
                                marginLeft: tokens.spacingHorizontalXS,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {!isReadOnly && (
                      <Input
                        placeholder="Add certification and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCertificationAdd((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    )}
                  </Field>
                </div>
                
                <Divider />
                
                {/* Emergency Contact */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Emergency Contact</Text>
                  <div className={styles.emergencyContact}>
                    <div className={styles.row}>
                      <Field label="Name" className={styles.field}>
                        <Input
                          value={formData.emergencyContact?.name || ''}
                          onChange={(_, data) => handleEmergencyContactChange('name', data.value)}
                          placeholder="Emergency contact name"
                          disabled={isReadOnly}
                        />
                      </Field>
                      
                      <Field label="Phone" className={styles.field}>
                        <Input
                          type="tel"
                          value={formData.emergencyContact?.phone || ''}
                          onChange={(_, data) => handleEmergencyContactChange('phone', data.value)}
                          placeholder="Emergency contact phone"
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                    
                    <Field label="Relationship">
                      <Input
                        value={formData.emergencyContact?.relationship || ''}
                        onChange={(_, data) => handleEmergencyContactChange('relationship', data.value)}
                        placeholder="Relationship (e.g., Spouse, Parent, Sibling)"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
                
                <Divider />
                
                {/* Work Schedule */}
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Work Schedule</Text>
                  <div className={styles.workSchedule}>
                    <div className={styles.row}>
                      <Field label="Start Time" className={styles.field}>
                        <Input
                          type="time"
                          value={formData.workSchedule?.startTime || '09:00'}
                          onChange={(_, data) => handleWorkScheduleChange('startTime', data.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      
                      <Field label="End Time" className={styles.field}>
                        <Input
                          type="time"
                          value={formData.workSchedule?.endTime || '17:00'}
                          onChange={(_, data) => handleWorkScheduleChange('endTime', data.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                    
                    <Field label="Timezone">
                      <Dropdown
                        value={formData.workSchedule?.timezone || 'UTC'}
                        onOptionSelect={(_, data) => handleWorkScheduleChange('timezone', data.optionValue)}
                        disabled={isReadOnly}
                      >
                        <Option value="UTC">UTC</Option>
                        <Option value="EST">Eastern Time (EST)</Option>
                        <Option value="CST">Central Time (CST)</Option>
                        <Option value="MST">Mountain Time (MST)</Option>
                        <Option value="PST">Pacific Time (PST)</Option>
                      </Dropdown>
                    </Field>
                    
                    <Field label="Work Days">
                      <div className={styles.checkboxGroup}>
                        {workDayOptions.map(day => (
                          <Checkbox
                            key={day.key}
                            label={day.text}
                            checked={formData.workSchedule?.workDays?.includes(day.key) || false}
                            onChange={(_, data) => handleWorkDayChange(day.key, data.checked || false)}
                            disabled={isReadOnly}
                          />
                        ))}
                      </div>
                    </Field>
                  </div>
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
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Employee' : 'Save Changes'}
              </Button>
            </DialogActions>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

