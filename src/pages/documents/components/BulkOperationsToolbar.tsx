import React, { useState } from 'react';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Badge,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  DeleteRegular,
  ArchiveRegular,
  ArrowUndoRegular,
  ArrowRightRegular,
  CopyRegular,
  PinRegular,
  TagRegular,
  ChevronDownRegular,
  SelectAllOnRegular,
  SelectAllOffRegular
} from '@fluentui/react-icons';
import { PinToTopButton } from './PinToTopButton';
import { MoveToFolderDialog } from './MoveToFolderDialog';
import { TagDocumentsDialog } from './TagDocumentsDialog';
import { AdvancedDocumentApiClient } from '@/shared/api/advancedDocumentApi';
import { notificationService } from '@/shared/lib/notifications';

const useStyles = makeStyles({
  toolbar: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '8px 16px',
    gap: '8px'
  },
  selectionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginRight: '16px'
  },
  badge: {
    marginLeft: '4px'
  },
  divider: {
    margin: '0 8px'
  }
});

interface BulkOperationsToolbarProps {
  selectedDocuments: Array<{ 
    id: string; 
    name: string; 
    folderPath?: string;
    pinned?: boolean;
    archived?: boolean;
    deleted?: boolean;
  }>;
  totalDocuments: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOperationComplete: () => void;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedDocuments,
  totalDocuments,
  onSelectAll,
  onClearSelection,
  onOperationComplete
}) => {
  const styles = useStyles();
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedDocuments.length;
  const allSelected = selectedCount === totalDocuments && totalDocuments > 0;
  
  // Check states of selected documents
  const hasArchived = selectedDocuments.some(doc => doc.archived);
  const hasDeleted = selectedDocuments.some(doc => doc.deleted);
  const hasNormalDocs = selectedDocuments.some(doc => !doc.deleted && !doc.archived);

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkOperation = async (operation: 'delete' | 'archive' | 'restore') => {
    if (selectedCount === 0) return;

    setIsProcessing(true);
    
    try {
      const result = await AdvancedDocumentApiClient.bulkOperation(
        selectedDocuments.map(doc => doc.id),
        operation
      );

      // Show success notification
      if (result.summary.successful > 0) {
        const operationText = operation === 'delete' ? 'deleted' : 
                             operation === 'archive' ? 'archived' : 'restored';
        notificationService.success(
          `Bulk ${operation} successful`,
          `${result.summary.successful} document(s) ${operationText}`
        );
      }

      // Show error notification if some failed
      if (result.summary.failed > 0) {
        notificationService.error(
          `Bulk ${operation} errors`,
          `${result.summary.failed} document(s) failed`
        );
      }

      onOperationComplete();
      
    } catch (error: any) {
      console.error(`Bulk ${operation} failed:`, error);
      notificationService.error(
        'Operation Failed',
        `Failed to ${operation} documents: ${error.message}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Toolbar className={styles.toolbar} size="small">
        {/* Selection Info */}
        <div className={styles.selectionInfo}>
          <SelectAllOnRegular />
          <Text weight="semibold">
            {selectedCount} selected
            <Badge className={styles.badge} size="small" color="brand">
              {selectedCount}
            </Badge>
          </Text>
          
          <ToolbarButton
            appearance="subtle"
            size="small"
            icon={allSelected ? <SelectAllOffRegular /> : <SelectAllOnRegular />}
            onClick={allSelected ? onClearSelection : onSelectAll}
          >
            {allSelected ? 'Clear All' : 'Select All'}
          </ToolbarButton>
        </div>

        <ToolbarDivider className={styles.divider} />

        {/* Pin Operations */}
        <PinToTopButton
          selectedDocuments={selectedDocuments}
          onOperationComplete={onOperationComplete}
          disabled={isProcessing}
        />

        <ToolbarDivider className={styles.divider} />

        {/* Move/Copy Operations */}
        <ToolbarButton
          appearance="subtle"
          size="small"
          icon={<ArrowRightRegular />}
          onClick={() => setIsMoveDialogOpen(true)}
          disabled={isProcessing || selectedCount === 0}
        >
          Move
        </ToolbarButton>

        <ToolbarButton
          appearance="subtle"
          size="small"
          icon={<CopyRegular />}
          onClick={() => setIsCopyDialogOpen(true)}
          disabled={isProcessing || selectedCount === 0}
        >
          Copy
        </ToolbarButton>

        <ToolbarDivider className={styles.divider} />

        {/* Archive/Delete Operations */}
        {hasNormalDocs && (
          <>
            <ToolbarButton
              appearance="subtle"
              size="small"
              icon={<ArchiveRegular />}
              onClick={() => handleBulkOperation('archive')}
              disabled={isProcessing}
            >
              Archive
            </ToolbarButton>

            <Menu positioning="below-start">
              <MenuTrigger disableButtonEnhancement>
                <ToolbarButton
                  appearance="subtle"
                  size="small"
                  icon={<DeleteRegular />}
                  iconAfter={<ChevronDownRegular />}
                  disabled={isProcessing}
                >
                  Delete
                </ToolbarButton>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    icon={<DeleteRegular />}
                    onClick={() => handleBulkOperation('delete')}
                  >
                    Soft Delete ({selectedDocuments.filter(d => !d.deleted).length} documents)
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </>
        )}

        {/* Restore Operations */}
        {(hasArchived || hasDeleted) && (
          <ToolbarButton
            appearance="subtle"
            size="small"
            icon={<ArrowUndoRegular />}
            onClick={() => handleBulkOperation('restore')}
            disabled={isProcessing}
          >
            Restore ({selectedDocuments.filter(d => d.deleted || d.archived).length})
          </ToolbarButton>
        )}

        <ToolbarDivider className={styles.divider} />

        {/* Tag Operations */}
        <ToolbarButton
          appearance="subtle"
          size="small"
          icon={<TagRegular />}
          onClick={() => setIsTagDialogOpen(true)}
          disabled={isProcessing || selectedCount === 0}
        >
          Tag
        </ToolbarButton>

        {/* Clear Selection */}
        <ToolbarButton
          appearance="secondary"
          size="small"
          onClick={onClearSelection}
          disabled={isProcessing}
        >
          Clear Selection
        </ToolbarButton>
      </Toolbar>

      {/* Move Dialog */}
      <MoveToFolderDialog
        isOpen={isMoveDialogOpen}
        documents={selectedDocuments.map(doc => ({
          id: doc.id,
          name: doc.name,
          folderPath: doc.folderPath
        }))}
        onClose={() => setIsMoveDialogOpen(false)}
        onSuccess={() => {
          setIsMoveDialogOpen(false);
          onOperationComplete();
        }}
      />

      {/* Copy Dialog - reuse MoveToFolderDialog */}
      {isCopyDialogOpen && (
        <MoveToFolderDialog
          isOpen={isCopyDialogOpen}
          documents={selectedDocuments.map(doc => ({
            id: doc.id,
            name: doc.name,
            folderPath: doc.folderPath
          }))}
          onClose={() => setIsCopyDialogOpen(false)}
          onSuccess={() => {
            setIsCopyDialogOpen(false);
            onOperationComplete();
          }}
        />
      )}

      {/* Tag Dialog */}
      <TagDocumentsDialog
        isOpen={isTagDialogOpen}
        documents={selectedDocuments.map(doc => ({
          id: doc.id,
          name: doc.name
        }))}
        onClose={() => setIsTagDialogOpen(false)}
        onSuccess={() => {
          setIsTagDialogOpen(false);
          onOperationComplete();
        }}
      />
    </>
  );
};
