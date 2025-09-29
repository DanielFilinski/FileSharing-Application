import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Dropdown,
  Option,
  Text,
  ProgressBar,
  MessageBar,
  MessageBarType,
  RadioGroup,
  Radio,
  Field,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  ArrowRightRegular,
  CopyRegular,
  FolderRegular
} from '@fluentui/react-icons';
import { AdvancedDocumentApiClient } from '@/shared/api/advancedDocumentApi';

const useStyles = makeStyles({
  dialog: {
    minWidth: '450px',
    maxWidth: '600px'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  folderDropdown: {
    minWidth: '300px'
  },
  operationSection: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: '8px'
  },
  documentsList: {
    maxHeight: '120px',
    overflowY: 'auto',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  documentItem: {
    padding: '4px 0',
    fontSize: tokens.fontSizeBase200
  },
  progress: {
    marginTop: '12px'
  }
});

interface MoveToFolderDialogProps {
  isOpen: boolean;
  documents: Array<{ id: string; name: string; folderPath?: string }>;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MoveToFolderDialog: React.FC<MoveToFolderDialogProps> = ({
  isOpen,
  documents,
  onClose,
  onSuccess
}) => {
  const styles = useStyles();
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [operationType, setOperationType] = useState<'move' | 'copy'>('move');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const availableFolders = AdvancedDocumentApiClient.getAvailableFolders();
  
  // Filter out current folders to avoid moving to same location
  const currentFolders = new Set(documents.map(doc => doc.folderPath).filter(Boolean));
  const validFolders = availableFolders.filter(folder => 
    !currentFolders.has(folder.path) && !currentFolders.has(folder.id)
  );

  const handleConfirm = async () => {
    if (!selectedFolder || documents.length === 0) {
      setError('Please select a target folder');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResults(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      const documentIds = documents.map(doc => doc.id);
      const result = await AdvancedDocumentApiClient.moveDocuments(
        documentIds,
        selectedFolder,
        operationType
      );

      setProgress(100);
      setResults(result);

      // Show success/error results
      const { successMessages, errorMessages } = AdvancedDocumentApiClient.formatOperationResults(result.results);
      
      if (result.summary.successful > 0 && result.summary.failed === 0) {
        // All successful - close dialog
        setTimeout(() => {
          clearInterval(progressInterval);
          onSuccess?.();
          handleClose();
        }, 1000);
      } else if (result.summary.failed > 0) {
        // Some failures - show results for user review
        setError(`${result.summary.failed} documents failed: ${errorMessages.join(', ')}`);
      }

    } catch (error: any) {
      console.error('Move/Copy operation failed:', error);
      setError(`Operation failed: ${error.message}`);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    
    setSelectedFolder('');
    setOperationType('move');
    setProgress(0);
    setError(null);
    setResults(null);
    onClose();
  };

  const selectedFolderName = availableFolders.find(f => f.id === selectedFolder || f.path === selectedFolder)?.name || selectedFolder;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            {operationType === 'move' ? (
              <>
                <ArrowRightRegular /> Move Documents
              </>
            ) : (
              <>
                <CopyRegular /> Copy Documents
              </>
            )}
          </DialogTitle>
          
          <DialogContent className={styles.content}>
            {/* Operation Type Selection */}
            <Field label="Operation Type">
              <RadioGroup
                value={operationType}
                onChange={(_, data) => setOperationType(data.value as 'move' | 'copy')}
                layout="horizontal"
                disabled={isProcessing}
              >
                <Radio value="move" label="Move (relocate documents)" />
                <Radio value="copy" label="Copy (create duplicates)" />
              </RadioGroup>
            </Field>

            {/* Documents List */}
            <Field label={`Documents to ${operationType} (${documents.length})`}>
              <div className={styles.documentsList}>
                {documents.slice(0, 10).map((doc, index) => (
                  <div key={doc.id} className={styles.documentItem}>
                    • {doc.name}
                    {doc.folderPath && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {' '}(from: {AdvancedDocumentApiClient.getFolderDisplayName(doc.folderPath)})
                      </Text>
                    )}
                  </div>
                ))}
                {documents.length > 10 && (
                  <div className={styles.documentItem}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      ... and {documents.length - 10} more documents
                    </Text>
                  </div>
                )}
              </div>
            </Field>

            {/* Target Folder Selection */}
            <Field 
              label="Target Folder"
              required
              validationMessage={error && error.includes('folder') ? error : undefined}
              validationState={error && error.includes('folder') ? 'error' : 'none'}
            >
              <Dropdown
                className={styles.folderDropdown}
                placeholder="Select destination folder"
                value={selectedFolderName}
                selectedOptions={selectedFolder ? [selectedFolder] : []}
                onOptionSelect={(_, data) => {
                  setSelectedFolder(data.optionValue || '');
                  setError(null);
                }}
                disabled={isProcessing}
              >
                {validFolders.map((folder) => (
                  <Option key={folder.id} value={folder.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FolderRegular />
                      <div>
                        <div>{folder.name}</div>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {folder.path}
                        </Text>
                      </div>
                    </div>
                  </Option>
                ))}
              </Dropdown>
            </Field>

            {/* Operation Summary */}
            {selectedFolder && (
              <div className={styles.operationSection}>
                <Text weight="semibold">
                  Operation Summary:
                </Text>
                <Text size={300}>
                  {operationType === 'move' ? 'Move' : 'Copy'} {documents.length} document(s) 
                  to "{selectedFolderName}"
                </Text>
                {operationType === 'move' && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Documents will be relocated from their current folders
                  </Text>
                )}
                {operationType === 'copy' && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Copies will be created in the target folder with "Copy of" prefix
                  </Text>
                )}
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className={styles.progress}>
                <Text>
                  {operationType === 'move' ? 'Moving' : 'Copying'} documents...
                </Text>
                <ProgressBar value={progress / 100} />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <MessageBar intent="error">
                {error}
              </MessageBar>
            )}

            {/* Results */}
            {results && results.summary.failed > 0 && (
              <MessageBar 
                intent={results.summary.successful > 0 ? "warning" : "error"}
              >
                <div>
                  <strong>Operation Results:</strong>
                  <br />
                  • Successful: {results.summary.successful}
                  <br />
                  • Failed: {results.summary.failed}
                  {results.summary.successful > 0 && (
                    <>
                      <br />
                      <Text size={200}>
                        Successful documents have been {operationType === 'move' ? 'moved' : 'copied'} to {selectedFolderName}
                      </Text>
                    </>
                  )}
                </div>
              </MessageBar>
            )}
          </DialogContent>

          <DialogActions>
            <Button 
              appearance="secondary" 
              onClick={handleClose}
              disabled={isProcessing}
            >
              {results && results.summary.failed > 0 ? 'Close' : 'Cancel'}
            </Button>
            <Button 
              appearance="primary"
              onClick={handleConfirm}
              disabled={!selectedFolder || isProcessing || documents.length === 0}
              icon={isProcessing ? undefined : (operationType === 'move' ? <ArrowRightRegular /> : <CopyRegular />)}
            >
              {isProcessing 
                ? `${operationType === 'move' ? 'Moving' : 'Copying'}...` 
                : `${operationType === 'move' ? 'Move' : 'Copy'} Documents`
              }
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
