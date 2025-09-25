import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Text,
  Dropdown,
  Option,
  makeStyles,
  tokens,
  ProgressBar
} from '@fluentui/react-components';
import { 
  DeleteRegular, 
  EditRegular, 
  ArrowRightRegular, 
  CopyRegular, 
  ArrowDownloadRegular, 
  PrintRegular 
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  dialog: {
    minWidth: '400px',
    maxWidth: '500px'
  },
  input: {
    width: '100%',
    marginTop: '8px'
  },
  warningText: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: '8px'
  },
  progressSection: {
    marginTop: '16px'
  }
});

interface DocumentOperationsProps {
  isOpen: boolean;
  operation: 'delete' | 'rename' | 'move' | 'copy' | 'download' | 'print' | null;
  documentNames: string[];
  onClose: () => void;
  onConfirm: (operation: string, data?: any) => void;
}

const folderOptions = [
  { id: 'documents', name: 'Documents' },
  { id: 'client-files', name: 'Client Files' },
  { id: 'tax-documents', name: 'Tax Documents' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'reports', name: 'Reports' },
  { id: 'archive', name: 'Archive' }
];

export const DocumentOperations: React.FC<DocumentOperationsProps> = ({
  isOpen,
  operation,
  documentNames,
  onClose,
  onConfirm
}) => {
  const styles = useStyles();
  const [newName, setNewName] = useState('');
  const [targetFolder, setTargetFolder] = useState('');
  const [copyLocation, setCopyLocation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setProgress(0);

    // Simulate progress for operations
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    try {
      switch (operation) {
        case 'delete':
          await onConfirm('delete');
          break;
        case 'rename':
          if (newName.trim()) {
            await onConfirm('rename', { newName: newName.trim() });
          }
          break;
        case 'move':
          if (targetFolder) {
            await onConfirm('move', { targetFolder });
          }
          break;
        case 'copy':
          if (copyLocation) {
            await onConfirm('copy', { targetLocation: copyLocation });
          }
          break;
        case 'download':
          await onConfirm('download');
          break;
        case 'print':
          await onConfirm('print');
          break;
      }

      // Wait for progress to complete
      setTimeout(() => {
        clearInterval(progressInterval);
        setIsProcessing(false);
        setProgress(0);
        onClose();
        resetForm();
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setProgress(0);
      console.error('Operation failed:', error);
    }
  };

  const resetForm = () => {
    setNewName('');
    setTargetFolder('');
    setCopyLocation('');
  };

  const getDialogTitle = () => {
    const isBulk = documentNames.length > 1;
    switch (operation) {
      case 'delete':
        return `Delete ${isBulk ? `${documentNames.length} documents` : 'document'}`;
      case 'rename':
        return 'Rename document';
      case 'move':
        return `Move ${isBulk ? `${documentNames.length} documents` : 'document'}`;
      case 'copy':
        return `Copy ${isBulk ? `${documentNames.length} documents` : 'document'}`;
      case 'download':
        return `Download ${isBulk ? `${documentNames.length} documents` : 'document'}`;
      case 'print':
        return `Print ${isBulk ? `${documentNames.length} documents` : 'document'}`;
      default:
        return 'Document Operation';
    }
  };

  const getIcon = () => {
    switch (operation) {
      case 'delete': return <DeleteRegular />;
      case 'rename': return <EditRegular />;
      case 'move': return <ArrowRightRegular />;
      case 'copy': return <CopyRegular />;
      case 'download': return <ArrowDownloadRegular />;
      case 'print': return <PrintRegular />;
      default: return null;
    }
  };

  const isConfirmDisabled = () => {
    switch (operation) {
      case 'rename':
        return !newName.trim() || isProcessing;
      case 'move':
        return !targetFolder || isProcessing;
      case 'copy':
        return !copyLocation || isProcessing;
      default:
        return isProcessing;
    }
  };

  if (!operation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            {getIcon()}
            <span style={{ marginLeft: '8px' }}>{getDialogTitle()}</span>
          </DialogTitle>
          <DialogContent>
            {documentNames.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text weight="semibold">
                  {documentNames.length === 1 ? 'Document:' : 'Documents:'}
                </Text>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {documentNames.slice(0, 3).map((name, index) => (
                    <li key={index}>
                      <Text>{name}</Text>
                    </li>
                  ))}
                  {documentNames.length > 3 && (
                    <li>
                      <Text>... and {documentNames.length - 3} more</Text>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {operation === 'delete' && (
              <div>
                <Text>Are you sure you want to delete {documentNames.length === 1 ? 'this document' : 'these documents'}?</Text>
                <Text className={styles.warningText} size={200}>
                  This action cannot be undone.
                </Text>
              </div>
            )}

            {operation === 'rename' && documentNames.length === 1 && (
              <div>
                <Text>Enter new name for the document:</Text>
                <Input
                  className={styles.input}
                  placeholder="New document name"
                  value={newName}
                  onChange={(_, data) => setNewName(data.value)}
                />
              </div>
            )}

            {operation === 'move' && (
              <div>
                <Text>Select destination folder:</Text>
                <Dropdown
                  placeholder="Choose folder"
                  value={targetFolder ? folderOptions.find(f => f.id === targetFolder)?.name : ''}
                  onOptionSelect={(_, data) => setTargetFolder(data.optionValue || '')}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {folderOptions.map(folder => (
                    <Option key={folder.id} value={folder.id}>
                      {folder.name}
                    </Option>
                  ))}
                </Dropdown>
              </div>
            )}

            {operation === 'copy' && (
              <div>
                <Text>Select destination for copies:</Text>
                <Dropdown
                  placeholder="Choose destination"
                  value={copyLocation ? folderOptions.find(f => f.id === copyLocation)?.name : ''}
                  onOptionSelect={(_, data) => setCopyLocation(data.optionValue || '')}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {folderOptions.map(folder => (
                    <Option key={folder.id} value={folder.id}>
                      {folder.name}
                    </Option>
                  ))}
                </Dropdown>
              </div>
            )}

            {operation === 'download' && (
              <div>
                <Text>
                  {documentNames.length === 1 
                    ? 'The document will be downloaded to your device.'
                    : `${documentNames.length} documents will be downloaded as a ZIP file.`
                  }
                </Text>
              </div>
            )}

            {operation === 'print' && (
              <div>
                <Text>
                  {documentNames.length === 1
                    ? 'The document will be sent to your default printer.'
                    : `${documentNames.length} documents will be printed.`
                  }
                </Text>
              </div>
            )}

            {isProcessing && (
              <div className={styles.progressSection}>
                <Text size={200}>Processing...</Text>
                <ProgressBar value={progress} max={100} />
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              appearance={operation === 'delete' ? 'primary' : 'primary'}
              onClick={handleConfirm}
              disabled={isConfirmDisabled()}
            >
              {isProcessing ? 'Processing...' : 
               operation === 'delete' ? 'Delete' : 
               operation === 'rename' ? 'Rename' :
               operation === 'move' ? 'Move' :
               operation === 'copy' ? 'Copy' :
               operation === 'download' ? 'Download' :
               operation === 'print' ? 'Print' : 'Confirm'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
