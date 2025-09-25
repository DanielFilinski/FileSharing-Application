import React, { useState } from 'react';
import {
  Title3,
  Button,
  Body1,
  Caption1,
  Spinner,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  Warning24Filled,
  Send24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { apiClient } from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';

interface NotEnoughSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEscalate: () => void;
  requestedAmount?: number;
  requestedUnit?: string;
  availableAmount?: number;
  storageType?: string;
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
  spaceDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  spaceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export const NotEnoughSpaceModal: React.FC<NotEnoughSpaceModalProps> = ({
  isOpen,
  onClose,
  onEscalate,
  requestedAmount = 0,
  requestedUnit = 'GB',
  availableAmount = 0,
  storageType = 'unknown',
}) => {
  const styles = useStyles();
  const [isEscalating, setIsEscalating] = useState(false);

  const handleEscalateCase = async () => {
    setIsEscalating(true);
    try {
      // Call escalation API
      const response = await apiClient.post('/escalateCase', {
        type: 'storage_insufficient',
        details: `Storage allocation request exceeded available space. Requested: ${requestedAmount}${requestedUnit}, Available: ${availableAmount}GB`,
        requestedAmount: `${requestedAmount}${requestedUnit}`,
        currentAmount: `${availableAmount}GB`,
        storageType
      });

      if (response.data.success) {
        notificationService.success(
          'Case Escalated', 
          `Ticket ${response.data.ticketId} created. IT team will respond within ${response.data.estimatedResponseTime}.`
        );
        onEscalate();
        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to escalate case');
      }
    } catch (error: any) {
      console.error('Escalation failed:', error);
      notificationService.error(
        'Escalation Failed', 
        error.response?.data?.error || 'Unable to contact IT department. Please try again later.'
      );
    } finally {
      setIsEscalating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: tokens.spacingHorizontalM, 
          marginBottom: tokens.spacingVerticalL 
        }}>
          <Warning24Filled style={{ color: tokens.colorPaletteRedForeground2 }} />
          <Title3>Insufficient Storage Space</Title3>
        </div>

        {/* Content */}
        <div style={{ marginBottom: tokens.spacingVerticalXL }}>
          <Body1 style={{ marginBottom: tokens.spacingVerticalM }}>
            The requested storage amount exceeds available space.
          </Body1>
          
          <div className={styles.spaceDetails}>
            <div className={styles.spaceItem}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>Requested:</Caption1>
              <Body1 style={{ fontWeight: tokens.fontWeightMedium }}>
                {requestedAmount} {requestedUnit}
              </Body1>
            </div>
            <div className={styles.spaceItem}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>Available:</Caption1>
              <Body1 style={{ 
                fontWeight: tokens.fontWeightMedium,
                color: tokens.colorPaletteRedForeground2
              }}>
                {availableAmount} GB
              </Body1>
            </div>
          </div>

          <Caption1 style={{ 
            color: tokens.colorNeutralForeground2,
            marginTop: tokens.spacingVerticalM,
            display: 'block'
          }}>
            You can either reduce the allocation amount or escalate this issue to the IT department for additional storage capacity.
          </Caption1>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: tokens.spacingHorizontalM, 
          justifyContent: 'flex-end' 
        }}>
          <Button
            appearance="secondary"
            icon={<Dismiss24Regular />}
            onClick={onClose}
            disabled={isEscalating}
          >
            Dismiss
          </Button>
          <Button 
            appearance="primary" 
            icon={isEscalating ? <Spinner size="tiny" /> : <Send24Regular />}
            onClick={handleEscalateCase}
            disabled={isEscalating}
            style={{ backgroundColor: tokens.colorBrandBackground }}
          >
            {isEscalating ? 'Escalating...' : 'Escalate to IT'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 