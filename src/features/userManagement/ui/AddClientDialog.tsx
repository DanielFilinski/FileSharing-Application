/**
 * AddClientDialog Component
 * 
 * A form dialog component for adding and editing client records.
 * Features comprehensive form validation, responsive design, and
 * support for both add and edit modes.
 * 
 * @features
 * - Form validation for required fields (name, phone, email)
 * - Email format validation
 * - Real-time error feedback
 * - Support for both add and edit modes
 * - Responsive layout for mobile devices
 * - Optional firm information
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
  Textarea,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import type { Client } from '@/entities/user';

// Props interface for the client dialog component
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

/**
 * Enhanced AddClientDialog component with comprehensive validation
 */
export const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  editingClient
}) => {
  const styles = useStyles();
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    firmName: '',
    firmAddress: ''
  });
  
  // Form validation state
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
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
    // Clear validation errors when dialog opens/closes
    setErrors({ firstName: '', lastName: '', phone: '', email: '' });
  }, [editingClient, open]);

  /**
   * Validates the client form data
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    const newErrors = { firstName: '', lastName: '', phone: '', email: '' };
    let isValid = true;
    
    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Phone regex pattern (basic US phone format)
    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$|^\d{3}-\d{3}-\d{4}$|^\+?1?\d{10,}$/;

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

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      firmName: formData.firmName.trim(),
      firmAddress: formData.firmAddress.trim()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
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
              label="Phone Number" 
              required
              validationState={errors.phone ? 'error' : 'none'}
              validationMessage={errors.phone}
            >
              <Input 
                type="tel" 
                placeholder="(555) 123-4567" 
                value={formData.phone}
                onChange={(e, data) => handleInputChange('phone', data.value)}
              />
            </Field>
            <Field 
              label="Email" 
              required
              validationState={errors.email ? 'error' : 'none'}
              validationMessage={errors.email}
            >
              <Input 
                type="email" 
                placeholder="john.doe@example.com" 
                value={formData.email}
                onChange={(e, data) => handleInputChange('email', data.value)}
              />
            </Field>
            <Field label="Firm Name">
              <Input 
                placeholder="Enter firm name (optional)" 
                value={formData.firmName}
                onChange={(e, data) => handleInputChange('firmName', data.value)}
              />
            </Field>
            <Field label="Firm Address">
              <Textarea 
                placeholder="Enter firm address (optional)" 
                rows={2} 
                value={formData.firmAddress}
                onChange={(e, data) => handleInputChange('firmAddress', data.value)}
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={handleSubmit}
              disabled={!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.email.trim()}
            >
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 