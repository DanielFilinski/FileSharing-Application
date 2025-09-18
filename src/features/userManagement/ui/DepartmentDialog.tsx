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
  makeStyles,
  tokens
} from '@fluentui/react-components';

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  onSubmit: (department: { name: string; description: string }) => void;
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
  onSubmit
}) => {
  const styles = useStyles();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({ name: '', description: '' });
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