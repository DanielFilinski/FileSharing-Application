import React, { useState } from 'react';
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
import type { Employee } from '@/entities/user';

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  onSubmit: (department: { name: string; description: string; manager?: string; managerId?: number }) => void;
  employees: Employee[];
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
  }
});

export const DepartmentDialog: React.FC<DepartmentDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  employees
}) => {
  const styles = useStyles();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: 0
  });

  // Filter managers from employees list
  const managerEmployees = employees.filter(emp => 
    emp.classification === 'Manager' || emp.role.toLowerCase().includes('manager')
  );

  const handleSubmit = () => {
    const selectedManager = employees.find(emp => emp.id === formData.managerId);
    const departmentData = {
      name: formData.name,
      description: formData.description,
      ...(selectedManager && {
        manager: `${selectedManager.firstName} ${selectedManager.lastName}`,
        managerId: selectedManager.id
      })
    };
    
    onSubmit(departmentData);
    setFormData({ name: '', description: '', managerId: 0 });
    onOpenChange(null, { open: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Add Department</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <Field label="Department Name" required>
              <Input 
                placeholder="Enter department name" 
                value={formData.name}
                onChange={(e, data) => setFormData(prev => ({ ...prev, name: data.value }))}
              />
            </Field>
            <Field label="Description">
              <Textarea 
                placeholder="Enter description" 
                rows={3} 
                value={formData.description}
                onChange={(e, data) => setFormData(prev => ({ ...prev, description: data.value }))}
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
            <Button appearance="primary" onClick={handleSubmit}>
              Add Department
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 