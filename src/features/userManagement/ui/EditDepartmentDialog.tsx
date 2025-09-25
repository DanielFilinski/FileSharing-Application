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
  Textarea,
  Dropdown,
  Option,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import type { Department, Employee } from '@/entities/user';

// Props interface for the edit department dialog
interface EditDepartmentDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  onSubmit: (department: Department) => void;
  department: Department | null;
  employees: Employee[];
}

// Styles for the dialog layout
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
  }
});

/**
 * Dialog component for editing existing departments
 * Allows users to modify department name and description
 */
export const EditDepartmentDialog: React.FC<EditDepartmentDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  department,
  employees
}) => {
  const styles = useStyles();
  
  // Form state for department data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: 0
  });
  
  // Validation state
  const [errors, setErrors] = useState({
    name: ''
  });

  // Filter managers from employees list
  const managerEmployees = employees.filter(emp => 
    emp.classification === 'Manager' || emp.role.toLowerCase().includes('manager')
  );

  /**
   * Populate form with department data when dialog opens
   */
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || '',
        managerId: department.managerId || 0
      });
      // Clear any previous validation errors
      setErrors({ name: '' });
    }
  }, [department]);

  /**
   * Validates the form data
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    const newErrors = { name: '' };
    let isValid = true;

    // Validate department name
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handles form submission with validation
   */
  const handleSubmit = () => {
    if (!validateForm() || !department) {
      return;
    }

    const selectedManager = formData.managerId ? employees.find(emp => emp.id === formData.managerId) : null;
    
    const updatedDepartment: Department = {
      ...department,
      name: formData.name.trim(),
      description: formData.description.trim(),
      ...(selectedManager ? {
        manager: `${selectedManager.firstName} ${selectedManager.lastName}`,
        managerId: selectedManager.id
      } : {
        manager: undefined,
        managerId: undefined
      })
    };

    onSubmit(updatedDepartment);
    onOpenChange(null, { open: false });
  };

  /**
   * Handles input changes and clears validation errors
   */
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (field === 'name' && errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {/* Department Name Field */}
            <Field 
              label="Department Name" 
              required
              validationState={errors.name ? 'error' : 'none'}
              validationMessage={errors.name}
            >
              <Input 
                placeholder="Enter department name" 
                value={formData.name}
                onChange={(e, data) => handleInputChange('name', data.value)}
              />
            </Field>
            
            {/* Department Description Field */}
            <Field label="Description">
              <Textarea 
                placeholder="Enter department description" 
                rows={3} 
                value={formData.description}
                onChange={(e, data) => handleInputChange('description', data.value)}
              />
            </Field>
            <Field label="Manager">
              <Dropdown
                placeholder="Select manager (optional)"
                value={formData.managerId ? formData.managerId.toString() : ''}
                onOptionSelect={(e, data) => setFormData(prev => ({ 
                  ...prev, 
                  managerId: data.optionValue ? parseInt(data.optionValue) : 0 
                }))}
              >
                <Option value="">No manager</Option>
                {managerEmployees.map(emp => (
                  <Option key={emp.id} value={emp.id.toString()}>
                    {emp.firstName} {emp.lastName} - {emp.role}
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
              disabled={!formData.name.trim()}
            >
              Update Department
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
