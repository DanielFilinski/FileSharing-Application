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
  }, [editingEmployee]);

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(null, { open: false });
  };

  const classifications: Employee['classification'][] = ['Manager', 'Senior', 'Associate', 'Junior'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.formGrid}>
              <Field label="First Name" required>
                <Input 
                  placeholder="Enter first name" 
                  value={formData.firstName}
                  onChange={(e, data) => setFormData(prev => ({ ...prev, firstName: data.value }))}
                />
              </Field>
              <Field label="Last Name" required>
                <Input 
                  placeholder="Enter last name" 
                  value={formData.lastName}
                  onChange={(e, data) => setFormData(prev => ({ ...prev, lastName: data.value }))}
                />
              </Field>
            </div>
            <Field label="Classification" required>
              <Dropdown 
                placeholder="Select classification"
                value={formData.classification}
                onOptionSelect={(e, data) => setFormData(prev => ({ ...prev, classification: data.optionValue as Employee['classification'] }))}
              >
                {classifications.map(classification => (
                  <Option key={classification} value={classification}>
                    {classification}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Affiliated Office" required>
              <Dropdown 
                placeholder="Select office"
                value={formData.office}
                onOptionSelect={(e, data) => setFormData(prev => ({ ...prev, office: data.optionValue || '' }))}
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
                onChange={(e, data) => setFormData(prev => ({ ...prev, role: data.value }))}
              />
            </Field>
            <Field label="Department">
              <Dropdown 
                placeholder="Select department"
                value={formData.department}
                onOptionSelect={(e, data) => setFormData(prev => ({ ...prev, department: data.optionValue || '' }))}
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
            <Button appearance="primary" onClick={handleSubmit}>
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 