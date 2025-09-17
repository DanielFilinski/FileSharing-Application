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
  DialogTitle,
  DialogContent,
  DialogActions,
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
  onStatusFilterChange?: (status: string) => void
}> = ({ selectedCount, onAddItem, isGridView, setIsGridView, documentFilter, onFilterChange, onUploadFiles, showBulkActions = false, showAdvancedFilters = false, pageType = 'firm', statusFilter = 'All', onStatusFilterChange }) => {
  const styles = useStyles();
  const [visibleButtons, setVisibleButtons] = useState<boolean>(true);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState<null | 'cloud' | 'portal'>(null);
  const [uploadFormOpen, setUploadFormOpen] = useState(false);

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

  const handleUploadWithMetadata = (files: File[], metadata: DocumentMetadata) => {
    // Создаем FileList из массива файлов для совместимости
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    onUploadFiles(dataTransfer.files, metadata);
  };

  const handleOpenCloud = () => setDialogOpen('cloud');
  const handleOpenPortal = () => setDialogOpen('portal');
  const handleCloseDialog = () => setDialogOpen(null);

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
            <MenuItem onClick={() => { console.log('Open from device') }}>Open from device</MenuItem>
            <MenuItem onClick={() => { console.log('Open from URL') }}>Open from URL</MenuItem>
            <MenuItem onClick={() => { console.log('Open recent') }}>Open recent</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button
        icon={<ShareAndroid20Regular />}
        iconPosition="before"
        appearance="secondary"
        shape="rounded"
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
            <MenuItem onClick={() => { console.log('Delete document') }}>Delete</MenuItem>
            <MenuItem onClick={() => { console.log('Rename document') }}>Rename</MenuItem>
            <MenuItem onClick={() => { console.log('Move document') }}>Move</MenuItem>
            <MenuItem onClick={() => { console.log('Copy document') }}>Copy</MenuItem>
            <MenuItem onClick={() => { console.log('Download document') }}>Download</MenuItem>
            <MenuItem onClick={() => { console.log('Print document') }}>Print</MenuItem>
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
                <MenuItem onClick={() => onAddItem('document')}>Document</MenuItem>
                <MenuItem onClick={() => onAddItem('spreadsheet')}>Spreadsheet</MenuItem>
                <MenuItem onClick={() => onAddItem('presentation')}>Presentation</MenuItem>
                <MenuItem onClick={() => onAddItem('form')}>Form</MenuItem>
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
            <Button appearance="secondary" size="small">Delete Selected</Button>
            <Button appearance="secondary" size="small">Share Selected</Button>
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
                <div style={{ minWidth: 320, minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ marginBottom: 24 }}>This interface will be available when the server is connected.</span>
                  <FluentButton appearance="primary" onClick={handleCloseDialog}>Close</FluentButton>
                </div>
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
  