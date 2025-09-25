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
  Tab,
  TabList,
  Text,
  RadioGroup,
  Radio,
  Field,
  makeStyles,
  tokens
} from '@fluentui/react-components';

const useStyles = makeStyles({
  dialog: {
    minWidth: '500px',
    maxWidth: '600px'
  },
  tab: {
    padding: '16px'
  },
  urlInput: {
    width: '100%',
    marginTop: '8px'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    width: '100%',
    minHeight: '100px',
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
      borderColor: tokens.colorBrandBackground
    }
  },
  recentItem: {
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2
    }
  }
});

interface OpenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (file: File) => void;
  onOpenUrl: (url: string) => void;
  onOpenRecent: (item: any) => void;
  selectedDocuments?: any[];
  onOpenDocument?: (documentId: string, mode: 'local' | 'online') => void;
}

// Mock recent files data
const recentFiles = [
  { id: '1', name: 'Annual Report 2023.pdf', url: '/documents/annual-report-2023', lastOpened: '2023-10-15' },
  { id: '2', name: 'Tax Documents Q3.xlsx', url: '/documents/tax-q3', lastOpened: '2023-10-14' },
  { id: '3', name: 'Contract Template.docx', url: '/documents/contract-template', lastOpened: '2023-10-13' },
  { id: '4', name: 'Financial Summary.pdf', url: '/documents/financial-summary', lastOpened: '2023-10-12' },
];

export const OpenDialog: React.FC<OpenDialogProps> = ({
  isOpen,
  onClose,
  onOpenFile,
  onOpenUrl,
  onOpenRecent,
  selectedDocuments = [],
  onOpenDocument
}) => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<'selected' | 'device' | 'url' | 'recent'>(
    selectedDocuments.length > 0 ? 'selected' : 'device'
  );
  const [openMode, setOpenMode] = useState<'local' | 'online'>('online');
  const [url, setUrl] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onOpenFile(files[0]);
      onClose();
    }
  };

  const handleUrlOpen = () => {
    if (url.trim()) {
      onOpenUrl(url);
      onClose();
    }
  };

  const handleRecentClick = (item: any) => {
    onOpenRecent(item);
    onClose();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleOpenSelectedDocument = (documentId: string) => {
    if (onOpenDocument) {
      onOpenDocument(documentId, openMode);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>Open Document</DialogTitle>
          <DialogContent>
            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, data) => setActiveTab(data.value as 'selected' | 'device' | 'url' | 'recent')}
            >
              {selectedDocuments.length > 0 && (
                <Tab value="selected">Selected ({selectedDocuments.length})</Tab>
              )}
              <Tab value="device">From Device</Tab>
              <Tab value="url">From URL</Tab>
              <Tab value="recent">Recent</Tab>
            </TabList>

            <div className={styles.tab}>
              {activeTab === 'selected' && selectedDocuments.length > 0 && (
                <div>
                  <Text>Open selected documents:</Text>
                  
                  <Field label="Open Mode" style={{ marginTop: '12px', marginBottom: '16px' }}>
                    <RadioGroup
                      value={openMode}
                      onChange={(_, data) => setOpenMode(data.value as 'local' | 'online')}
                    >
                      <Radio value="online" label="Online Editor (Collaborative editing, auto-save)" />
                      <Radio value="local" label="Local Editor (Download and open with desktop app)" />
                    </RadioGroup>
                  </Field>

                  <div style={{ marginTop: '12px' }}>
                    {selectedDocuments.slice(0, 5).map(doc => (
                      <div
                        key={doc.id || doc.key}
                        className={styles.recentItem}
                        onClick={() => handleOpenSelectedDocument(doc.id || doc.key)}
                      >
                        <Text weight="semibold">{doc.name}</Text>
                        <br />
                        <Text size={200}>
                          Status: {doc.status} | 
                          Modified: {doc.modified ? new Date(doc.modified).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </div>
                    ))}
                    {selectedDocuments.length > 5 && (
                      <Text size={200}>... and {selectedDocuments.length - 5} more documents</Text>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'device' && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                  />
                  <Button
                    appearance="subtle"
                    className={styles.uploadButton}
                    onClick={handleUploadClick}
                  >
                    <div>
                      <Text size={400}>Click to select file from your device</Text>
                      <br />
                      <Text size={200}>Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG</Text>
                    </div>
                  </Button>
                </div>
              )}

              {activeTab === 'url' && (
                <div>
                  <Text>Enter URL to open document:</Text>
                  <Input
                    className={styles.urlInput}
                    placeholder="https://example.com/document.pdf"
                    value={url}
                    onChange={(_, data) => setUrl(data.value)}
                  />
                </div>
              )}

              {activeTab === 'recent' && (
                <div>
                  <Text>Recently opened documents:</Text>
                  <div style={{ marginTop: '12px' }}>
                    {recentFiles.map(item => (
                      <div
                        key={item.id}
                        className={styles.recentItem}
                        onClick={() => handleRecentClick(item)}
                      >
                        <Text weight="semibold">{item.name}</Text>
                        <br />
                        <Text size={200}>Last opened: {new Date(item.lastOpened).toLocaleDateString()}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            {activeTab === 'selected' && selectedDocuments.length === 1 && (
              <Button 
                appearance="primary" 
                onClick={() => handleOpenSelectedDocument(selectedDocuments[0].id || selectedDocuments[0].key)}
              >
                Open in {openMode === 'online' ? 'Online' : 'Local'} Editor
              </Button>
            )}
            {activeTab === 'selected' && selectedDocuments.length > 1 && (
              <Button appearance="primary" onClick={onClose}>
                Click individual documents to open
              </Button>
            )}
            {activeTab === 'url' && (
              <Button appearance="primary" onClick={handleUrlOpen} disabled={!url.trim()}>
                Open URL
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
