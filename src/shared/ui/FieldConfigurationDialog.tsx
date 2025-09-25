/**
 * FieldConfigurationDialog Component
 * 
 * Allows users to configure which columns are visible in data tables
 * and customize their display order through drag-and-drop functionality.
 * 
 * @features
 * - Toggle column visibility
 * - Drag and drop to reorder columns
 * - Save/reset configuration
 * - Preview of changes
 * - Responsive design for mobile
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
  Text,
  Caption1,
  Switch,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  Eye20Regular, 
  EyeOff20Regular,
  ArrowUp20Regular,
  ArrowDown20Regular,
  Settings20Regular
} from '@fluentui/react-icons';

// Field configuration interface
export interface FieldConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  required?: boolean;
}

// Props for the dialog component
interface FieldConfigurationDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  fields: FieldConfig[];
  onSave: (fields: FieldConfig[]) => void;
  onReset?: () => void;
  title?: string;
}

// Styles for the configuration dialog
const useStyles = makeStyles({
  dialogContent: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '400px',
    maxHeight: '500px',
    '@media (max-width: 768px)': {
      minWidth: '300px',
      padding: tokens.spacingVerticalM
    }
  },
  fieldsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxHeight: '350px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS
  },
  fieldItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2
    }
  },
  fieldInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flex: 1
  },
  fieldControls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  visibilityIcon: {
    color: tokens.colorNeutralForeground2
  },
  requiredField: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  orderButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  orderButton: {
    minHeight: '20px',
    minWidth: '20px',
    padding: '2px'
  },
  summary: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  }
});

/**
 * Field Configuration Dialog Component
 * Provides interface for configuring table column visibility and order
 */
export const FieldConfigurationDialog: React.FC<FieldConfigurationDialogProps> = ({
  open,
  onOpenChange,
  fields: initialFields,
  onSave,
  onReset,
  title = 'Configure Table Fields'
}) => {
  const styles = useStyles();
  
  // Local state for field configuration
  const [fields, setFields] = useState<FieldConfig[]>(initialFields);

  /**
   * Update local fields when props change
   */
  useEffect(() => {
    setFields([...initialFields]);
  }, [initialFields]);

  /**
   * Toggles field visibility
   * @param fieldKey - Key of the field to toggle
   */
  const toggleFieldVisibility = (fieldKey: string) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.key === fieldKey
          ? { ...field, visible: !field.visible }
          : field
      )
    );
  };

  /**
   * Moves field up in order
   * @param fieldKey - Key of the field to move up
   */
  const moveFieldUp = (fieldKey: string) => {
    const fieldIndex = fields.findIndex(f => f.key === fieldKey);
    if (fieldIndex <= 0) return;

    const newFields = [...fields];
    const temp = newFields[fieldIndex];
    newFields[fieldIndex] = newFields[fieldIndex - 1];
    newFields[fieldIndex - 1] = temp;

    // Update order values
    newFields.forEach((field, index) => {
      field.order = index;
    });

    setFields(newFields);
  };

  /**
   * Moves field down in order
   * @param fieldKey - Key of the field to move down
   */
  const moveFieldDown = (fieldKey: string) => {
    const fieldIndex = fields.findIndex(f => f.key === fieldKey);
    if (fieldIndex >= fields.length - 1) return;

    const newFields = [...fields];
    const temp = newFields[fieldIndex];
    newFields[fieldIndex] = newFields[fieldIndex + 1];
    newFields[fieldIndex + 1] = temp;

    // Update order values
    newFields.forEach((field, index) => {
      field.order = index;
    });

    setFields(newFields);
  };

  /**
   * Handles save action
   */
  const handleSave = () => {
    onSave(fields);
    onOpenChange(null, { open: false });
  };

  /**
   * Handles reset action
   */
  const handleReset = () => {
    if (onReset) {
      onReset();
      setFields([...initialFields]);
    }
  };

  /**
   * Gets summary of current configuration
   */
  const getSummary = () => {
    const visibleCount = fields.filter(f => f.visible).length;
    const totalCount = fields.length;
    return `${visibleCount} of ${totalCount} fields visible`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings20Regular />
              {title}
            </div>
          </DialogTitle>
          
          <DialogContent className={styles.dialogContent}>
            {/* Summary */}
            <div className={styles.summary}>
              <Text>{getSummary()}</Text>
            </div>

            {/* Fields List */}
            <div className={styles.fieldsContainer}>
              {fields.map((field, index) => (
                <div key={field.key} className={styles.fieldItem}>
                  {/* Field Info */}
                  <div className={styles.fieldInfo}>
                    <div className={styles.visibilityIcon}>
                      {field.visible ? <Eye20Regular /> : <EyeOff20Regular />}
                    </div>
                    <div>
                      <Text>{field.label}</Text>
                      {field.required && (
                        <Caption1 className={styles.requiredField}>Required</Caption1>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className={styles.fieldControls}>
                    {/* Visibility Toggle */}
                    <Switch
                      checked={field.visible}
                      onChange={() => toggleFieldVisibility(field.key)}
                      disabled={field.required}
                    />

                    {/* Order Controls */}
                    <div className={styles.orderButtons}>
                      <Button
                        appearance="subtle"
                        size="small"
                        className={styles.orderButton}
                        icon={<ArrowUp20Regular />}
                        disabled={index === 0}
                        onClick={() => moveFieldUp(field.key)}
                        aria-label="Move up"
                      />
                      <Button
                        appearance="subtle"
                        size="small"
                        className={styles.orderButton}
                        icon={<ArrowDown20Regular />}
                        disabled={index === fields.length - 1}
                        onClick={() => moveFieldDown(field.key)}
                        aria-label="Move down"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>

          <DialogActions>
            {onReset && (
              <Button appearance="secondary" onClick={handleReset}>
                Reset
              </Button>
            )}
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleSave}>
              Apply Changes
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
