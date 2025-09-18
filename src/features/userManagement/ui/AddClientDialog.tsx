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
  makeStyles,
  tokens
} from '@fluentui/react-components';
import type { Client } from '@/entities/user';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  onSubmit: (client: Omit<Client, 'id'>) => void;
  editingClient?: Client | null;
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

export const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  editingClient
}) => {
  const styles = useStyles();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    firmName: '',
    firmAddress: ''
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        firstName: editingClient.firstName,
        lastName: editingClient.lastName,
        phone: editingClient.phone,
        email: editingClient.email,
        firmName: editingClient.firmName,
        firmAddress: editingClient.firmAddress
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        firmName: '',
        firmAddress: ''
      });
    }
  }, [editingClient]);

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(null, { open: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
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
            <Field label="Phone Number" required>
              <Input 
                type="tel" 
                placeholder="Enter phone number" 
                value={formData.phone}
                onChange={(e, data) => setFormData(prev => ({ ...prev, phone: data.value }))}
              />
            </Field>
            <Field label="Email" required>
              <Input 
                type="email" 
                placeholder="Enter email address" 
                value={formData.email}
                onChange={(e, data) => setFormData(prev => ({ ...prev, email: data.value }))}
              />
            </Field>
            <Field label="Firm Name">
              <Input 
                placeholder="Enter firm name" 
                value={formData.firmName}
                onChange={(e, data) => setFormData(prev => ({ ...prev, firmName: data.value }))}
              />
            </Field>
            <Field label="Firm Address">
              <Textarea 
                placeholder="Enter firm address" 
                rows={2} 
                value={formData.firmAddress}
                onChange={(e, data) => setFormData(prev => ({ ...prev, firmAddress: data.value }))}
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleSubmit}>
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 