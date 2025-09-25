/**
 * AddEmployeeDialog Component
 * 
 * A form dialog component for adding and editing employee records.
 * Features comprehensive form validation, responsive design, and
 * integration with department and office data.
 * 
 * @features
 * - Form validation for required fields
 * - Real-time error feedback
 * - Support for both add and edit modes
 * - Responsive layout for mobile devices
 * - Integration with dropdown data sources
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Button,
  Input,
  Field,
  Dropdown,
  Option,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import type { Employee } from '@/entities/user';

// Props interface for the employee dialog component
interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  onSubmit: (employee: Omit<Employee, 'id'>) => void;
  editingEmployee?: Employee | null;
  departments: Array<{ id: number; name: string }>;
  offices: string[];
}

const useStyles = makeStyles({
  dialogContent: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '400px',
    '@media (max-width: 768px)': {
      minWidth: '300px',
      padding: tokens.spacingVerticalM
    }
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalM,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  }
});

export const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  editingEmployee,
  departments,
  offices
}) => {
  const styles = useStyles();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classification: 'Associate' as Employee['classification'],
    office: '',
    role: '',
    department: ''
  });
  
  // Form validation state
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    classification: '',
    office: ''
  });

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        firstName: editingEmployee.firstName,
        lastName: editingEmployee.lastName,
        classification: editingEmployee.classification,
        office: editingEmployee.office,
        role: editingEmployee.role,
        department: editingEmployee.department
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        classification: 'Associate',
        office: '',
        role: '',
        department: ''
      });
    }
    // Clear validation errors when dialog opens/closes
    setErrors({ firstName: '', lastName: '', classification: '', office: '' });
  }, [editingEmployee, open]);

  /**
   * Validates the employee form data
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    const newErrors = { firstName: '', lastName: '', classification: '', office: '' };
    let isValid = true;

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
      isValid = false;
    }

    // Validate office selection
    if (!formData.office) {
      newErrors.office = 'Office selection is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handles form submission with validation
   */
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Trim string values before submission
    const cleanedData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      role: formData.role.trim(),
      department: formData.department
    };

    onSubmit(cleanedData);
    onOpenChange(null, { open: false });
  };

  /**
   * Handles input changes and clears validation errors
   */
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (field in errors && errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const classifications: Employee['classification'][] = ['Manager', 'Senior', 'Associate', 'Junior'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.formGrid}>
              <Field 
                label="First Name" 
                required
                validationState={errors.firstName ? 'error' : 'none'}
                validationMessage={errors.firstName}
              >
                <Input 
                  placeholder="Enter first name" 
                  value={formData.firstName}
                  onChange={(e, data) => handleInputChange('firstName', data.value)}
                />
              </Field>
              <Field 
                label="Last Name" 
                required
                validationState={errors.lastName ? 'error' : 'none'}
                validationMessage={errors.lastName}
              >
                <Input 
                  placeholder="Enter last name" 
                  value={formData.lastName}
                  onChange={(e, data) => handleInputChange('lastName', data.value)}
                />
              </Field>
            </div>
            <Field 
              label="Classification" 
              required
              validationState={errors.classification ? 'error' : 'none'}
              validationMessage={errors.classification}
            >
              <Dropdown 
                placeholder="Select classification"
                value={formData.classification}
                onOptionSelect={(e, data) => handleInputChange('classification', data.optionValue as Employee['classification'] || '')}
              >
                {classifications.map(classification => (
                  <Option key={classification} value={classification}>
                    {classification}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field 
              label="Affiliated Office" 
              required
              validationState={errors.office ? 'error' : 'none'}
              validationMessage={errors.office}
            >
              <Dropdown 
                placeholder="Select office"
                value={formData.office}
                onOptionSelect={(e, data) => handleInputChange('office', data.optionValue || '')}
              >
                {offices.map(office => (
                  <Option key={office} value={office}>
                    {office}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Role">
              <Input 
                placeholder="Enter role" 
                value={formData.role}
                onChange={(e, data) => handleInputChange('role', data.value)}
              />
            </Field>
            <Field label="Department">
              <Dropdown 
                placeholder="Select department"
                value={formData.department}
                onOptionSelect={(e, data) => handleInputChange('department', data.optionValue || '')}
              >
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.name}>
                    {dept.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={handleSubmit}
              disabled={!formData.firstName.trim() || !formData.lastName.trim() || !formData.office}
            >
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 