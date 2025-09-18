import React from 'react';
import {
  Title3,
  Input,
  Field,
  Button,
  Body1,
  Caption1,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  Save24Regular,
} from '@fluentui/react-icons';

interface TemplateManagerModalProps {
  isOpen: boolean;
  newTemplateName: string;
  firmType: string;
  timeStructure: string;
  clientTypes: string[];
  binderStructure: string;
  onNewTemplateNameChange: (name: string) => void;
  onSaveTemplate: () => void;
  onClose: () => void;
}

const useStyles = makeStyles({
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: tokens.spacingVerticalXXL,
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  configSummary: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
  },
});

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  newTemplateName,
  firmType,
  timeStructure,
  clientTypes,
  binderStructure,
  onNewTemplateNameChange,
  onSaveTemplate,
  onClose,
}) => {
  const styles = useStyles();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <Title3 style={{ marginBottom: tokens.spacingVerticalL }}>Save Template</Title3>
        <div className={styles.dialogContent}>
          <Field label="Template Name">
            <Input
              value={newTemplateName}
              onChange={(e) => onNewTemplateNameChange(e.target.value)}
              placeholder="Enter template name"
            />
          </Field>
          <div className={styles.configSummary}>
            <Body1 style={{ marginBottom: tokens.spacingVerticalS }}>
              Current Configuration:
            </Body1>
            <Caption1>
              • Firm Type: {firmType || 'Not set'}<br/>
              • Period: {timeStructure}<br/>
              • Client Types: {clientTypes.length} types<br/>
              • Structure: {binderStructure}
            </Caption1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, justifyContent: 'flex-end', marginTop: tokens.spacingVerticalXL }}>
          <Button
            appearance="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            onClick={onSaveTemplate}
            style={{ backgroundColor: tokens.colorBrandBackground }}
          >
            Save Template
          </Button>
        </div>
      </div>
    </div>
  );
}; 