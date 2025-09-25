import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Button,
  Body1,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Warning20Regular } from '@fluentui/react-icons';

// Props interface for the confirmation dialog
interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger';
}

// Styles for the confirmation dialog
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
  warningContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorPaletteRedForeground1
  },
  message: {
    lineHeight: '1.4'
  }
});

/**
 * Reusable confirmation dialog component
 * Used for confirming destructive actions like deletions
 * 
 * @param open - Controls dialog visibility
 * @param onOpenChange - Handler for dialog state changes
 * @param title - Dialog title
 * @param message - Confirmation message to display
 * @param confirmText - Text for confirm button (default: "Confirm")
 * @param cancelText - Text for cancel button (default: "Cancel")
 * @param onConfirm - Handler called when user confirms action
 * @param variant - Visual variant of dialog (default | danger)
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default'
}) => {
  const styles = useStyles();
  const isDanger = variant === 'danger';

  /**
   * Handles confirmation action
   * Calls onConfirm callback and closes dialog
   */
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(null, { open: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {isDanger && (
              <div className={styles.warningContainer}>
                <Warning20Regular />
                <Body1>Warning: This action cannot be undone.</Body1>
              </div>
            )}
            <Body1 className={styles.message}>{message}</Body1>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">{cancelText}</Button>
            </DialogTrigger>
            <Button 
              appearance={isDanger ? 'primary' : 'primary'}
              onClick={handleConfirm}
              style={isDanger ? { 
                backgroundColor: tokens.colorPaletteRedBackground3,
                borderColor: tokens.colorPaletteRedBorder2
              } : undefined}
            >
              {confirmText}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
