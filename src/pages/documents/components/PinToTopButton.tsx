import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Tooltip,
  Spinner
} from '@fluentui/react-components';
import { 
  PinRegular, 
  PinFilled, 
  PinOffRegular,
  ChevronDownRegular 
} from '@fluentui/react-icons';
import { AdvancedDocumentApiClient } from '@/shared/api/advancedDocumentApi';
import { notificationService } from '@/shared/lib/notifications';

interface PinToTopButtonProps {
  selectedDocuments: Array<{ id: string; name: string; pinned?: boolean }>;
  onOperationComplete?: () => void;
  disabled?: boolean;
}

export const PinToTopButton: React.FC<PinToTopButtonProps> = ({
  selectedDocuments,
  onOperationComplete,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const hasPinnedDocs = selectedDocuments.some(doc => doc.pinned);
  const hasUnpinnedDocs = selectedDocuments.some(doc => !doc.pinned);
  const allDocsPinned = selectedDocuments.every(doc => doc.pinned);

  const handlePinOperation = async (operation: 'pin' | 'unpin') => {
    if (selectedDocuments.length === 0) return;

    setIsProcessing(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const document of selectedDocuments) {
        try {
          // Skip if document is already in desired state
          if (operation === 'pin' && document.pinned) continue;
          if (operation === 'unpin' && !document.pinned) continue;

          await AdvancedDocumentApiClient.pinDocument(document.id, operation === 'pin');
          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`${document.name}: ${error.message}`);
          console.error(`Failed to ${operation} document ${document.id}:`, error);
        }
      }

      // Show notifications
      if (successCount > 0) {
        const action = operation === 'pin' ? 'pinned to top' : 'unpinned';
        notificationService.success(
          `${operation === 'pin' ? 'Pin' : 'Unpin'} Successful`, 
          `${successCount} document(s) ${action}`
        );
      }

      if (errorCount > 0) {
        notificationService.error(
          `${operation === 'pin' ? 'Pin' : 'Unpin'} Errors`,
          `${errorCount} document(s) failed: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`
        );
      }

      // Trigger refresh
      onOperationComplete?.();

    } catch (error: any) {
      console.error(`Pin operation failed:`, error);
      notificationService.error(
        'Operation Failed', 
        `Failed to ${operation} documents: ${error.message}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickPin = async () => {
    if (allDocsPinned) {
      await handlePinOperation('unpin');
    } else {
      await handlePinOperation('pin');
    }
  };

  if (selectedDocuments.length === 0) {
    return null;
  }

  const buttonIcon = isProcessing ? (
    <Spinner size="tiny" />
  ) : allDocsPinned ? (
    <PinFilled />
  ) : (
    <PinRegular />
  );

  const buttonText = allDocsPinned ? 'Unpin' : 'Pin to Top';
  const tooltipText = selectedDocuments.length === 1 
    ? `${buttonText} "${selectedDocuments[0].name}"`
    : `${buttonText} ${selectedDocuments.length} documents`;

  return (
    <Menu positioning="below-end">
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content={tooltipText} relationship="label">
          <Button
            icon={buttonIcon}
            disabled={disabled || isProcessing}
            onClick={selectedDocuments.length === 1 ? handleQuickPin : undefined}
            appearance="subtle"
            size="medium"
          >
            {buttonText}
            {selectedDocuments.length > 1 && <ChevronDownRegular />}
          </Button>
        </Tooltip>
      </MenuTrigger>

      {selectedDocuments.length > 1 && (
        <MenuPopover>
          <MenuList>
            {hasUnpinnedDocs && (
              <MenuItem
                icon={<PinRegular />}
                onClick={() => handlePinOperation('pin')}
                disabled={isProcessing}
              >
                Pin to Top ({selectedDocuments.filter(d => !d.pinned).length} documents)
              </MenuItem>
            )}
            
            {hasPinnedDocs && (
              <MenuItem
                icon={<PinOffRegular />}
                onClick={() => handlePinOperation('unpin')}
                disabled={isProcessing}
              >
                Unpin ({selectedDocuments.filter(d => d.pinned).length} documents)
              </MenuItem>
            )}

            {hasUnpinnedDocs && hasPinnedDocs && (
              <>
                <MenuItem divider />
                <MenuItem
                  icon={<PinFilled />}
                  onClick={() => handlePinOperation('pin')}
                  disabled={isProcessing}
                >
                  Pin All Documents
                </MenuItem>
                <MenuItem
                  icon={<PinOffRegular />}
                  onClick={() => handlePinOperation('unpin')}
                  disabled={isProcessing}
                >
                  Unpin All Documents
                </MenuItem>
              </>
            )}
          </MenuList>
        </MenuPopover>
      )}
    </Menu>
  );
};
