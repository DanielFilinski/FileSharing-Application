import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Text,
  Field,
  Textarea,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Dismiss24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';

interface AddOfficeFormProps {
  onAdd: (name: string, address: string) => void;
  onCancel: () => void;
}

const AddOfficeForm: React.FC<AddOfficeFormProps> = ({ onAdd, onCancel }) => {
  const styles = useStyles();
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeAddress, setNewOfficeAddress] = useState('');

  const handleAdd = () => {
    if (newOfficeName.trim() && newOfficeAddress.trim()) {
      onAdd(newOfficeName, newOfficeAddress);
      setNewOfficeName('');
      setNewOfficeAddress('');
    }
  };

  return (
    <div className={styles.addOfficeForm}>
      <div className={styles.formHeader}>
        <div className={styles.formTitle}>
          <Add24Regular />
          <Text weight="medium">Add New Office</Text>
        </div>
        <Button
          appearance="subtle"
          icon={<Dismiss24Regular />}
          size="small"
          onClick={onCancel}
        />
      </div>
      
      <div className={styles.formGrid}>
        <Field label="Office Name" required>
          <Input
            value={newOfficeName}
            onChange={(e) => setNewOfficeName(e.target.value)}
            placeholder="Enter office name"
          />
        </Field>
        
        <Field label="Office Address" required>
          <Textarea
            value={newOfficeAddress}
            onChange={(e) => setNewOfficeAddress(e.target.value)}
            placeholder="Enter office address"
            rows={2}
          />
        </Field>
        
        <div className={styles.formActions}>
          <Button
            appearance="subtle"
            onClick={onCancel}
          >
            Cancel
          </Button>
          
          <Button
            appearance="primary"
            icon={<Checkmark24Regular />}
            onClick={handleAdd}
            disabled={!newOfficeName.trim() || !newOfficeAddress.trim()}
          >
            Add Office
          </Button>
        </div>
      </div>
    </div>
  );
};

const useStyles = makeStyles({
  addOfficeForm: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    '@media (max-width: 640px)': {
      padding: tokens.spacingVerticalM,
    },
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  formTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground1,
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    '@media (max-width: 640px)': {
      flexDirection: 'column',
    },
  },
});

export default AddOfficeForm; 