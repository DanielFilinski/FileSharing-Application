import React, { useState, useEffect } from 'react';
import { 
  makeStyles, 
  tokens, 
  Button,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  Text,
  Dialog,
  DialogContent,
  DialogSurface,
  DialogBody
} from '@fluentui/react-components';
import { Button as FluentButton } from '@fluentui/react-components';
import { 
  AddRegular, 
  ArrowUploadRegular, 
  Table20Regular, 
  ShareAndroid20Regular, 
  MoreHorizontalRegular,
  QuestionCircle20Regular
} from '@fluentui/react-icons';
import { UploadForm, DocumentMetadata } from './UploadForm';
import { oneDriveService, OneDriveUploadResult } from '@/shared/api/oneDriveService';
import { CloudUploadDialog } from './CloudUploadDialog';
import { PortalUploadDialog } from './PortalUploadDialog';
import { FilePicker } from './FilePicker';
import { OpenDialog } from './OpenDialog';
import { ShareDialog } from './ShareDialog';
import { HelpDialog } from './HelpDialog';
import { DocumentOperations } from './DocumentOperations';
import { NewDocumentDialog } from './NewDocumentDialog';
import { type Document } from '@/entities/document/api/documentsApi';
import { useNotifications } from '@/shared/lib/useNotifications';
import { DocumentsService } from '@/shared/api/documentsService';
import { apiClient } from '@/shared/api';

interface FilePickerFile {
  id: string;
  name: string;
  url?: string;
  downloadUrl?: string;
  size?: number;
  driveId?: string;
}

export const Toolbar: React.FC<{
  selectedCount: number,
  onAddItem: (type: 'document' | 'spreadsheet' | 'presentation' | 'form') => void,
  isGridView: boolean,
  setIsGridView: (v: boolean) => void,
  documentFilter: 'All Documents' | 'My Documents' | 'Shared Documents' | 'Recent' | 'Favorites',
  onFilterChange: (filter: 'All Documents' | 'My Documents' | 'Shared Documents' | 'Recent' | 'Favorites') => void,
  onUploadFiles: (files: FileList, metadata?: DocumentMetadata) => void,
  showBulkActions?: boolean,
  showAdvancedFilters?: boolean,
  pageType?: 'firm' | 'client',
  statusFilter?: string,
  onStatusFilterChange?: (status: string) => void,
  selectedDocuments?: Document[],
  onDocumentOperation?: (operation: string, documentIds: string[], data?: any) => void,
  onRefresh?: () => void,
  onDocumentOpen?: (documentId: string, mode: 'local' | 'online') => Promise<any>,
  onDocumentClose?: (documentId: string) => Promise<void>
}> = ({ selectedCount, onAddItem, isGridView, setIsGridView, documentFilter, onFilterChange, onUploadFiles, showBulkActions = false, showAdvancedFilters = false, pageType = 'firm', statusFilter = 'All', onStatusFilterChange, selectedDocuments = [], onDocumentOperation, onRefresh, onDocumentOpen, onDocumentClose }) => {
  const styles = useStyles();
  const { showError, showSuccess, showInfo } = useNotifications();
  const documentsService = new DocumentsService(apiClient);
  const [visibleButtons, setVisibleButtons] = useState<boolean>(true);
  const [, setWindowWidth] = useState<number>(window.innerWidth);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState<null | 'cloud' | 'portal' | 'cloud-upload' | 'portal-upload' | 'cloud-picker' | 'portal-picker' | 'open' | 'share' | 'help' | 'new'>(null);
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [selectedCloudFiles, setSelectedCloudFiles] = useState<FilePickerFile[]>([]);
  const [selectedPortalFiles, setSelectedPortalFiles] = useState<FilePickerFile[]>([]);
  const [documentOperationDialog, setDocumentOperationDialog] = useState<{
    isOpen: boolean;
    operation: 'delete' | 'rename' | 'move' | 'copy' | 'download' | 'print' | null;
    documentNames: string[];
    documentIds: string[];
  }>({ isOpen: false, operation: null, documentNames: [], documentIds: [] });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setVisibleButtons(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUploadFromDevice = () => {
    setUploadFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUploadFiles(files);
    }
  };

  const handleUploadWithMetadata = async (files: File[], metadata: DocumentMetadata) => {
    try {
      // Загружаем файлы в OneDrive пользователя
      const uploadResults = await oneDriveService.uploadFromDevice(files, metadata);
      
      // Сохраняем метаданные в базе данных проекта
      for (const result of uploadResults) {
        await saveDocumentMetadata(result);
      }
      
      // Обновляем список документов
      window.location.reload(); // Простое обновление, можно заменить на более элегантное
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Ошибка при загрузке файлов. Попробуйте еще раз.');
    }
  };

  const handleOpenCloud = () => {
    setDialogOpen('cloud-picker');
  };

  const handleOpenPortal = () => {
    setDialogOpen('portal-picker');
  };
  const handleCloseDialog = () => {
    setDialogOpen(null);
    setSelectedCloudFiles([]);
    setSelectedPortalFiles([]);
  };

  // New document handlers
  const handleNewDocument = (type: 'document' | 'spreadsheet' | 'presentation' | 'form') => {
    setDialogOpen('new');
  };

  const handleCreateDocument = async (type: 'document' | 'spreadsheet' | 'presentation' | 'form', data: any) => {
    try {
      showInfo('Creating Document', 'Please wait while we create your document...');
      
      // Create document using Azure Functions
      const response = await documentsService.createDocument({
        name: data.name,
        type: type,
        template: data.template,
        description: data.description,
        metadata: data.metadata,
        openMode: data.openMode
      });
      
      showSuccess('Document Created', `${response.document.name} created successfully`);
      
      // Open the document in the requested mode
      if (data.openMode === 'local') {
        showInfo('Opening Locally', 'Document will download and open in your default application');
        // Open download URL in new tab
        window.open(response.editorUrls.local, '_blank');
      } else {
        showInfo('Opening Online', 'Opening document in collaborative online editor');
        // Open online editor in new tab
        window.open(response.editorUrls.online, '_blank');
      }
      
      // Refresh the document list
      if (onRefresh) {
        onRefresh();
      }
      
      // Also call the document operation callback for consistency
      if (onDocumentOperation) {
        await onDocumentOperation('create', [response.document.id], { 
          type, 
          document: response.document 
        });
      }
      
    } catch (error: any) {
      console.error('Error creating document:', error);
      showError('Creation Error', error.message || 'Failed to create document');
    }
  };

  // Open dialog handlers
  const handleOpenFromDevice = () => {
    setDialogOpen('open');
  };

  const handleOpenDocument = async (documentId: string, mode: 'local' | 'online') => {
    try {
      showInfo('Opening Document', 'Please wait while we prepare your document...');
      
      // Use the passed onDocumentOpen function if available, otherwise use service directly
      if (onDocumentOpen) {
        const response = await onDocumentOpen(documentId, mode);
        if (response) {
          showSuccess('Document Opened', `${response.document.name} is ready for ${mode} editing`);
          
          // Check if document is locked
          if (response.document.isLocked && response.document.lockedBy) {
            showInfo('Document Status', `Document locked for editing by ${response.document.lockedBy}`);
          }
        }
      } else {
        // Fallback to direct service call
        const response = await documentsService.openDocument({
          documentId: documentId,
          mode: mode,
          action: 'edit'
        });
        
        showSuccess('Document Opened', `${response.document.name} is ready for ${mode} editing`);
        
        // Open in the appropriate editor
        if (mode === 'local') {
          showInfo('Downloading Document', 'Your document is downloading for local editing');
          window.open(response.access.downloadUrl, '_blank');
        } else {
          showInfo('Opening Online Editor', 'Opening collaborative online editor');
          window.open(response.access.editorUrl, '_blank');
        }
      }
      
    } catch (error: any) {
      console.error('Error opening document:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.message.includes('locked by another user')) {
        showError('Document Locked', 'This document is currently being edited by another user. Please try again later.');
      } else if (error.message.includes('permission')) {
        showError('Access Denied', 'You do not have permission to edit this document.');
      } else {
        showError('Open Error', error.message || 'Failed to open document');
      }
    }
  };

  const handleOpenFile = (file: File) => {
    // Open file in viewer/editor
    console.log('Opening file:', file.name);
    showInfo('File Opening', `Opening ${file.name}`);
    // In a real app, this would open the file in an appropriate viewer
  };

  const handleOpenUrl = (url: string) => {
    // Open URL in new tab or embedded viewer
    console.log('Opening URL:', url);
    window.open(url, '_blank');
    showInfo('URL Opening', 'Opening document from URL');
  };

  const handleOpenRecent = (item: any) => {
    // Navigate to recent document
    console.log('Opening recent:', item.name);
    showInfo('Recent Document', `Opening ${item.name}`);
    // In a real app, this would navigate to the document
  };

  // Share dialog handlers
  const handleShareClick = () => {
    setDialogOpen('share');
  };

  const handleShareDocuments = async (userEmails: string[], permissions: Record<string, string>, linkSettings: { enabled: boolean; permission: string }) => {
    try {
      console.log('Sharing documents:', { userEmails, permissions, linkSettings });
      
      if (selectedDocuments.length > 0 && onDocumentOperation) {
        await onDocumentOperation('share', selectedDocuments.map(d => d.id), {
          userEmails,
          permissions,
          linkSettings
        });
      }
      
      showSuccess('Documents Shared', `Shared ${selectedDocuments.length} document(s) successfully`);
    } catch (error) {
      console.error('Error sharing documents:', error);
      showError('Share Error', 'Failed to share documents');
    }
  };

  // Help dialog handler
  const handleHelpClick = () => {
    setDialogOpen('help');
  };

  // Document operations handlers
  const handleDocumentOperation = (operation: 'delete' | 'rename' | 'move' | 'copy' | 'download' | 'print') => {
    const documentNames = selectedDocuments.map(d => d.name);
    const documentIds = selectedDocuments.map(d => d.id);
    
    setDocumentOperationDialog({
      isOpen: true,
      operation,
      documentNames,
      documentIds
    });
  };

  const handleOperationConfirm = async (operation: string, data?: any) => {
    try {
      if (onDocumentOperation) {
        await onDocumentOperation(operation, documentOperationDialog.documentIds, data);
      }
      
      switch (operation) {
        case 'delete':
          showSuccess('Documents Deleted', `${documentOperationDialog.documentNames.length} document(s) deleted`);
          break;
        case 'rename':
          showSuccess('Document Renamed', `Document renamed to "${data?.newName}"`);
          break;
        case 'move':
          showSuccess('Documents Moved', `${documentOperationDialog.documentNames.length} document(s) moved to ${data?.targetFolder}`);
          break;
        case 'copy':
          showSuccess('Documents Copied', `${documentOperationDialog.documentNames.length} document(s) copied to ${data?.targetLocation}`);
          break;
        case 'download':
          showSuccess('Download Started', `Downloading ${documentOperationDialog.documentNames.length} document(s)`);
          break;
        case 'print':
          showSuccess('Print Started', `Printing ${documentOperationDialog.documentNames.length} document(s)`);
          break;
      }
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error(`Error during ${operation}:`, error);
      showError(`${operation} Error`, `Failed to ${operation} document(s)`);
    }
  };

  const handleOperationClose = () => {
    setDocumentOperationDialog({
      isOpen: false,
      operation: null,
      documentNames: [],
      documentIds: []
    });
  };

  // Bulk actions handlers
  const handleBulkDelete = () => {
    handleDocumentOperation('delete');
  };

  const handleBulkShare = () => {
    handleShareClick();
  };

  // Handle bulk open documents
  const handleBulkOpenDocuments = async (mode: 'local' | 'online' = 'online') => {
    if (selectedDocuments.length === 0) {
      showError('No Selection', 'Please select documents to open');
      return;
    }

    try {
      showInfo('Opening Documents', `Opening ${selectedDocuments.length} document(s) in ${mode} mode...`);
      
      const documentIds = selectedDocuments.map(doc => doc.id);
      const responses = await documentsService.openMultipleDocuments(documentIds, mode, 'edit');
      
      const successCount = responses.length;
      const failedCount = selectedDocuments.length - successCount;
      
      if (successCount > 0) {
        showSuccess('Documents Opened', `${successCount} document(s) opened successfully`);
        
        // Open all documents in tabs
        responses.forEach(response => {
          if (mode === 'local') {
            window.open(response.access.downloadUrl, '_blank');
          } else {
            window.open(response.access.editorUrl, '_blank');
          }
        });
      }
      
      if (failedCount > 0) {
        showError('Partial Success', `${failedCount} document(s) could not be opened. Check permissions and try again.`);
      }
      
    } catch (error: any) {
      console.error('Error opening multiple documents:', error);
      showError('Bulk Open Error', error.message || 'Failed to open documents');
    }
  };

  // Функция для сохранения метаданных документа в базе данных
  const saveDocumentMetadata = async (uploadResult: OneDriveUploadResult) => {
    try {
      const { api } = await import('@/shared/api');
      await api.uploadDocument({
        oneDriveId: uploadResult.id,
        name: uploadResult.name,
        size: uploadResult.size,
        webUrl: uploadResult.webUrl,
        downloadUrl: uploadResult.downloadUrl,
        source: uploadResult.source,
        metadata: uploadResult.metadata,
        originalUrl: uploadResult.originalUrl,
        originalFileId: uploadResult.originalFileId,
      });
    } catch (error) {
      console.error('Error saving document metadata:', error);
      throw error;
    }
  };

  // Удалено: функция getAccessToken не используется

  // Обработчик выбора файлов из облака
  const handleCloudFilesSelected = (files: FilePickerFile[]) => {
    setSelectedCloudFiles(files);
    setDialogOpen('cloud-upload');
  };

  // Обработчик загрузки из облака
  const handleCloudUpload = async (metadata: DocumentMetadata) => {
    try {
      for (const file of selectedCloudFiles) {
        const uploadResult = await oneDriveService.uploadFromCloud(
          file.downloadUrl || file.url || '', 
          file.name, 
          metadata
        );
        await saveDocumentMetadata(uploadResult);
      }
      
      setSelectedCloudFiles([]);
      
      // Обновляем список документов
      window.location.reload();
    } catch (error) {
      console.error('Error uploading files from cloud:', error);
      alert('Ошибка при загрузке файлов из облака. Попробуйте еще раз.');
    }
  };

  // Обработчик выбора файлов с портала
  const handlePortalFilesSelected = (files: FilePickerFile[]) => {
    setSelectedPortalFiles(files);
    setDialogOpen('portal-upload');
  };

  // Обработчик загрузки с портала
  const handlePortalUpload = async (metadata: DocumentMetadata) => {
    try {
      for (const file of selectedPortalFiles) {
        const uploadResult = await oneDriveService.uploadFromPortal(file.id, file.name, metadata);
        await saveDocumentMetadata(uploadResult);
      }
      
      setSelectedPortalFiles([]);
      
      // Обновляем список документов
      window.location.reload();
    } catch (error) {
      console.error('Error uploading files from portal:', error);
      alert('Ошибка при загрузке файлов с портала. Попробуйте еще раз.');
    }
  };

  const renderMainButtons = () => (
    <>
      <Menu>
        <MenuTrigger>
          <MenuButton
            icon={<ArrowUploadRegular />}
            appearance="primary"
            shape="rounded"
            className={styles.uploadButton}
          >
            Upload
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={handleUploadFromDevice}>From Device</MenuItem>
            <MenuItem onClick={handleOpenCloud}>From Cloud</MenuItem>
            <MenuItem onClick={handleOpenPortal}>From Portal</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        onChange={handleFileChange}
      />
      <Button
        icon={<Table20Regular />}
        iconPosition="before"
        appearance="secondary"
        shape="rounded"
        onClick={() => setIsGridView(!isGridView)}
      >
        {isGridView ? 'Table view' : 'Edit in grid view'}
      </Button>
      <Menu>
        <MenuTrigger>
          <MenuButton
            appearance="secondary"
            shape="rounded"
          >
            Open
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={handleOpenFromDevice}>Open from device</MenuItem>
            <MenuItem onClick={handleOpenFromDevice}>Open from URL</MenuItem>
            <MenuItem onClick={handleOpenFromDevice}>Open recent</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button
        icon={<ShareAndroid20Regular />}
        iconPosition="before"
        appearance="secondary"
        shape="rounded"
        onClick={handleShareClick}
        disabled={selectedDocuments.length === 0}
      >
        Share
      </Button>
      <Menu>
        <MenuTrigger>
          <MenuButton
            icon={<MoreHorizontalRegular />}
            appearance="secondary"
            shape="rounded"
          >
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => handleDocumentOperation('delete')} disabled={selectedDocuments.length === 0}>Delete</MenuItem>
            <MenuItem onClick={() => handleDocumentOperation('rename')} disabled={selectedDocuments.length !== 1}>Rename</MenuItem>
            <MenuItem onClick={() => handleDocumentOperation('move')} disabled={selectedDocuments.length === 0}>Move</MenuItem>
            <MenuItem onClick={() => handleDocumentOperation('copy')} disabled={selectedDocuments.length === 0}>Copy</MenuItem>
            <MenuItem onClick={() => handleDocumentOperation('download')} disabled={selectedDocuments.length === 0}>Download</MenuItem>
            <MenuItem onClick={() => handleDocumentOperation('print')} disabled={selectedDocuments.length === 0}>Print</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </>
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        {pageType === 'firm' && (
          <Menu>
            <MenuTrigger>
              <MenuButton
                icon={<AddRegular />}
                appearance="primary"
                shape="rounded"
                className={styles.primaryButton}
              >
                New
              </MenuButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => handleNewDocument('document')}>Document</MenuItem>
                <MenuItem onClick={() => handleNewDocument('spreadsheet')}>Spreadsheet</MenuItem>
                <MenuItem onClick={() => handleNewDocument('presentation')}>Presentation</MenuItem>
                <MenuItem onClick={() => handleNewDocument('form')}>Form</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
        {visibleButtons ? renderMainButtons() : (
          <Menu>
            <MenuTrigger>
              <MenuButton
                icon={<MoreHorizontalRegular />}
                appearance="secondary"
                shape="rounded"
              >
                More
              </MenuButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {renderMainButtons()}
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
      </div>
      
      <div className={styles.toolbarRight}>
        {showAdvancedFilters && onStatusFilterChange && (
          <Menu>
            <MenuTrigger>
              <MenuButton
                appearance="secondary"
                shape="rounded"
              >
                Status: {statusFilter}
              </MenuButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => onStatusFilterChange('All')}>All Statuses</MenuItem>
                <MenuItem onClick={() => onStatusFilterChange('Active')}>Active</MenuItem>
                <MenuItem onClick={() => onStatusFilterChange('pending validation')}>Pending Validation</MenuItem>
                <MenuItem onClick={() => onStatusFilterChange('validation in process')}>Validation in Process</MenuItem>
                <MenuItem onClick={() => onStatusFilterChange('pending review')}>Pending Review</MenuItem>
                <MenuItem onClick={() => onStatusFilterChange('Locked')}>Locked</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
        <Text className={styles.selectedText}>
          {selectedCount} selected
        </Text>
        {showBulkActions && selectedCount > 0 && (
          <div className={styles.bulkActions}>
            <Button appearance="secondary" size="small" onClick={handleBulkDelete}>Delete Selected</Button>
            <Button appearance="secondary" size="small" onClick={handleBulkShare}>Share Selected</Button>
          </div>
        )}
        <Menu>
          <MenuTrigger>
            <MenuButton
              appearance="secondary"
              shape="rounded"
              className={styles.menuButton}
            >
              {documentFilter}
            </MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={() => onFilterChange('All Documents')}>All Documents</MenuItem>
              <MenuItem onClick={() => onFilterChange('My Documents')}>My Documents</MenuItem>
              <MenuItem onClick={() => onFilterChange('Shared Documents')}>Shared Documents</MenuItem>
              <MenuItem onClick={() => onFilterChange('Recent')}>Recent</MenuItem>
              <MenuItem onClick={() => onFilterChange('Favorites')}>Favorites</MenuItem>
              {showAdvancedFilters && (
                <>
                  <MenuItem onClick={() => onFilterChange('All Documents')}>By Date Range</MenuItem>
                  <MenuItem onClick={() => onFilterChange('All Documents')}>By File Type</MenuItem>
                  <MenuItem onClick={() => onFilterChange('All Documents')}>By Status</MenuItem>
                </>
              )}
            </MenuList>
          </MenuPopover>
        </Menu>
        <Button
          icon={<QuestionCircle20Regular />}
          appearance="transparent"
          shape="circular"
          className={styles.helpButton}
          onClick={handleHelpClick}
        />
      </div>
      {dialogOpen && (
        <Dialog open onOpenChange={handleCloseDialog}>
          <DialogSurface>
            <DialogBody>
              {/* <DialogTitle>
                {dialogOpen === 'cloud' ? 'Cloud Upload' : 'Portal Upload'}
              </DialogTitle> */}
              <DialogContent>
                {(dialogOpen === 'cloud' || dialogOpen === 'portal') && (
                  <div style={{ minWidth: 320, minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ marginBottom: 24 }}>This interface will be available when the server is connected.</span>
                    <FluentButton appearance="primary" onClick={handleCloseDialog}>Close</FluentButton>
                  </div>
                )}
                {dialogOpen === 'cloud-upload' && (
                  <CloudUploadDialog 
                    onClose={handleCloseDialog} 
                    onUpload={handleCloudUpload}
                    selectedFiles={selectedCloudFiles}
                  />
                )}
                {dialogOpen === 'portal-upload' && (
                  <PortalUploadDialog 
                    onClose={handleCloseDialog} 
                    onUpload={handlePortalUpload}
                    selectedFiles={selectedPortalFiles}
                  />
                )}
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
      {uploadFormOpen && (
        <UploadForm
          isOpen={uploadFormOpen}
          onClose={() => setUploadFormOpen(false)}
          onUpload={handleUploadWithMetadata}
        />
      )}
      
      {/* File Picker for Cloud */}
      {dialogOpen === 'cloud-picker' && (
        <FilePicker
          isOpen={true}
          onClose={handleCloseDialog}
          onFilesSelected={handleCloudFilesSelected}
          type="cloud"
          multiSelect={true}
        />
      )}
      
      {/* File Picker for Portal */}
      {dialogOpen === 'portal-picker' && (
        <FilePicker
          isOpen={true}
          onClose={handleCloseDialog}
          onFilesSelected={handlePortalFilesSelected}
          type="portal"
          multiSelect={true}
        />
      )}

      {/* Open Dialog */}
      {dialogOpen === 'open' && (
        <OpenDialog
          isOpen={true}
          onClose={handleCloseDialog}
          onOpenFile={handleOpenFile}
          onOpenUrl={handleOpenUrl}
          onOpenRecent={handleOpenRecent}
          selectedDocuments={selectedDocuments}
          onOpenDocument={handleOpenDocument}
        />
      )}

      {/* New Document Dialog */}
      {dialogOpen === 'new' && (
        <NewDocumentDialog
          isOpen={true}
          onClose={handleCloseDialog}
          onCreate={handleCreateDocument}
        />
      )}

      {/* Share Dialog */}
      {dialogOpen === 'share' && (
        <ShareDialog
          isOpen={true}
          onClose={handleCloseDialog}
          onShare={handleShareDocuments}
          documentNames={selectedDocuments.map(d => d.name)}
          isBulk={selectedDocuments.length > 1}
        />
      )}

      {/* Help Dialog */}
      {dialogOpen === 'help' && (
        <HelpDialog
          isOpen={true}
          onClose={handleCloseDialog}
        />
      )}

      {/* Document Operations Dialog */}
      <DocumentOperations
        isOpen={documentOperationDialog.isOpen}
        operation={documentOperationDialog.operation}
        documentNames={documentOperationDialog.documentNames}
        onClose={handleOperationClose}
        onConfirm={handleOperationConfirm}
      />
    </div>
  );
}; 

const useStyles = makeStyles({
    toolbar: {
      display: 'flex',
      position: 'static',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 24px',
      backgroundColor: tokens.colorNeutralBackground1,
      minHeight: '48px',
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'stretch',
        padding: '8px 16px'
      }
    },
    toolbarLeft: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap',
      '@media (max-width: 768px)': {
        justifyContent: 'center',
        width: '100%'
      }
    },
    toolbarRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      '@media (max-width: 768px)': {
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 0'
      }
    },
    primaryButton: {
      backgroundColor: '#9333EA',
      color: tokens.colorNeutralForegroundOnBrand,
      border: 'none',
      ':hover': {
        backgroundColor: '#7C2EC8'
      },
      ':active': {
        backgroundColor: '#6B2AAE'
      },
      '@media (max-width: 768px)': {
        // width: '100%'
      }
    },
    uploadButton: {
      backgroundColor: tokens.colorPaletteGreenBackground3,
      color: tokens.colorNeutralForegroundOnBrand,
      border: 'none',
      ':hover': {
        backgroundColor: tokens.colorPaletteGreenBackground2
      },
      '@media (max-width: 768px)': {
        width: '100%'
      }
    },
    selectedText: {
      color: tokens.colorNeutralForeground2,
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightMedium
    },
    menuButton: {
      // minWidth: '160px',
      fontWeight: tokens.fontWeightMedium,
      backgroundColor: tokens.colorNeutralBackground1,
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      color: tokens.colorNeutralForeground1,
      '@media (max-width: 768px)': {
        // minWidth: '120px',
        // width: '100%'
      }
    },
    helpButton: {
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1,
      width: '32px',
      height: '32px',
      minWidth: '32px',
      minHeight: '32px',
      padding: 0
    },
    bulkActions: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }
  });
  