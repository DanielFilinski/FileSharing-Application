import React from 'react';
import {
  Title3,
  Button,
  Body1,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  Warning24Filled,
} from '@fluentui/react-icons';

interface NotEnoughSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEscalate: () => void;
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
});

export const NotEnoughSpaceModal: React.FC<NotEnoughSpaceModalProps> = ({
  isOpen,
  onClose,
  onEscalate,
}) => {
  const styles = useStyles();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, marginBottom: tokens.spacingVerticalL }}>
          <Warning24Filled style={{ color: tokens.colorPaletteRedForeground2 }} />
          <Title3>Not Enough Space</Title3>
        </div>
        <Body1 style={{ marginBottom: tokens.spacingVerticalXL }}>
          The requested storage amount exceeds available space. Please reduce allocation or contact IT.
        </Body1>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, justifyContent: 'flex-end' }}>
          <Button
            appearance="secondary"
            onClick={onClose}
          >
            Dismiss
          </Button>
          <Button appearance="primary" style={{ backgroundColor: tokens.colorPaletteRedBackground3 }}>
            Escalate Case
          </Button>
        </div>
      </div>
    </div>
  );
}; 