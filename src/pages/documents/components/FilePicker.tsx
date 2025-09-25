import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Spinner,
  Text,
  SearchBox,
  Image,
  Badge,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  DismissRegular,
  FolderRegular,
  DocumentRegular,
  CloudRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    minWidth: '600px',
    minHeight: '500px'
  },
  searchContainer: {
    marginBottom: '16px'
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    padding: '12px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    border: `1px solid transparent`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  fileItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke1}`
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '4px'
  },
  fileName: {
    fontWeight: tokens.fontWeightMedium,
    fontSize: '14px'
  },
  fileDetails: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    minHeight: '200px'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    minHeight: '200px',
    color: tokens.colorNeutralForeground3
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    minHeight: '200px',
    color: tokens.colorPaletteRedForeground1
  }
});

interface FilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: FilePickerFile[]) => void;
  type: 'cloud' | 'portal';
  multiSelect?: boolean;
}

interface FilePickerFile {
  id: string;
  name: string;
  url?: string;
  downloadUrl?: string;
  size?: number;
  driveId?: string;
  thumbnailUrl?: string;
  modifiedDateTime?: string;
  createdBy?: string;
}

interface FilePickerState {
  files: FilePickerFile[];
  selectedFiles: Set<string>;
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  isOpen,
  onClose,
  onFilesSelected,
  type,
  multiSelect = true
}) => {
  const styles = useStyles();
  const [state, setState] = useState<FilePickerState>({
    files: [],
    selectedFiles: new Set(),
    loading: false,
    error: null,
    searchQuery: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, type]);

  const loadFiles = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { oneDriveService } = await import('@/shared/api/oneDriveService');
      
      let files: FilePickerFile[];
      if (type === 'cloud') {
        // Загружаем файлы из OneDrive
        const cloudFiles = await oneDriveService.selectFilesFromCloud();
        files = cloudFiles.map(file => ({
          id: file.id,
          name: file.name,
          url: file.url,
          downloadUrl: file.url,
          size: file.size
        }));
      } else {
        // Загружаем файлы из SharePoint/Teams
        const portalFiles = await oneDriveService.selectFilesFromPortal();
        files = portalFiles.map(file => ({
          id: file.id,
          name: file.name,
          url: file.url,
          driveId: file.driveId
        }));
      }
      
      setState(prev => ({ ...prev, files, loading: false }));
    } catch (error) {
      console.error('Error loading files:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load files. Please try again.' 
      }));
    }
  };

  const handleFileSelect = (fileId: string) => {
    setState(prev => {
      const newSelectedFiles = new Set(prev.selectedFiles);
      
      if (multiSelect) {
        if (newSelectedFiles.has(fileId)) {
          newSelectedFiles.delete(fileId);
        } else {
          newSelectedFiles.add(fileId);
        }
      } else {
        newSelectedFiles.clear();
        newSelectedFiles.add(fileId);
      }
      
      return {
        ...prev,
        selectedFiles: newSelectedFiles
      };
    });
  };

  const handleConfirm = () => {
    const selectedFileObjects = state.files.filter(file => 
      state.selectedFiles.has(file.id)
    );
    
    onFilesSelected(selectedFileObjects);
    onClose();
  };

  const handleClose = () => {
    setState(prev => ({ 
      ...prev, 
      selectedFiles: new Set(), 
      searchQuery: '',
      error: null 
    }));
    onClose();
  };

  const filteredFiles = state.files.filter(file =>
    file.name.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <DocumentRegular />;
      default:
        return <DocumentRegular />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.container}>
        <DialogBody>
          <DialogTitle action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={handleClose}
            />
          }>
            {type === 'cloud' ? 'Select files from OneDrive' : 'Select files from Teams'}
          </DialogTitle>
          
          <DialogContent>
            <div className={styles.searchContainer}>
              <SearchBox
                placeholder="Search files..."
                value={state.searchQuery}
                onChange={(_, data) => setState(prev => ({ 
                  ...prev, 
                  searchQuery: data.value 
                }))}
              />
            </div>

            {state.loading && (
              <div className={styles.loadingContainer}>
                <Spinner size="large" />
                <Text>Loading files...</Text>
              </div>
            )}

            {state.error && (
              <div className={styles.errorContainer}>
                <ErrorCircleRegular style={{ fontSize: '48px' }} />
                <Text>{state.error}</Text>
                <Button appearance="primary" onClick={loadFiles}>
                  Try Again
                </Button>
              </div>
            )}

            {!state.loading && !state.error && filteredFiles.length === 0 && (
              <div className={styles.emptyContainer}>
                <CloudRegular style={{ fontSize: '48px' }} />
                <Text>No files found</Text>
                <Text size={300}>
                  {state.searchQuery ? 'Try adjusting your search criteria' : 'No files available'}
                </Text>
              </div>
            )}

            {!state.loading && !state.error && filteredFiles.length > 0 && (
              <div className={styles.fileList}>
                {filteredFiles.map((file) => {
                  const isSelected = state.selectedFiles.has(file.id);
                  
                  return (
                    <div
                      key={file.id}
                      className={`${styles.fileItem} ${isSelected ? styles.fileItemSelected : ''}`}
                      onClick={() => handleFileSelect(file.id)}
                    >
                      {getFileIcon(file.name)}
                      
                      <div className={styles.fileInfo}>
                        <Text className={styles.fileName}>{file.name}</Text>
                        <Text className={styles.fileDetails}>
                          {formatFileSize(file.size)}
                          {file.modifiedDateTime && ` • Modified ${new Date(file.modifiedDateTime).toLocaleDateString()}`}
                        </Text>
                      </div>
                      
                      {isSelected && (
                        <CheckmarkCircleRegular style={{ 
                          color: tokens.colorBrandForeground1,
                          fontSize: '20px'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              appearance="primary" 
              onClick={handleConfirm}
              disabled={state.selectedFiles.size === 0 || state.loading}
            >
              Select {state.selectedFiles.size > 0 && `(${state.selectedFiles.size} files)`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
