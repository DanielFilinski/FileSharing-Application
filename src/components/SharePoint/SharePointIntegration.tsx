/**
 * SharePoint Integration Component
 * Main component for SharePoint document management with End User context
 */

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  makeStyles, 
  tokens,
  Spinner,
  Text,
  Badge,
  MessageBar,
  MessageBarType
} from '@fluentui/react-components';
import { 
  CloudUpload20Regular,
  FolderOpen20Regular,
  Document20Regular,
  SharePointLogo20Filled
} from '@fluentui/react-icons';
import { SharePointApiClient, SharePointDocument } from '../../shared/api/sharePointApi';
import { useSelectedEndUser } from '../../contexts/EndUserContext';
import { useNotifications } from '../../shared/lib/useNotifications';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4
  },
  
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  
  folderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  
  folderCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      borderColor: tokens.colorBrandStroke1,
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8
    }
  },
  
  folderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  
  folderIcon: {
    fontSize: '24px'
  },
  
  folderTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  
  folderDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
    lineHeight: '1.4'
  },
  
  folderActions: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto'
  },
  
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    
    ':hover': {
      borderColor: tokens.colorBrandStroke1,
      backgroundColor: tokens.colorNeutralBackground3
    }
  },
  
  uploadActive: {
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2
  },
  
  fileInput: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none'
  },
  
  documentsSection: {
    marginTop: '24px'
  },
  
  documentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  documentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      borderColor: tokens.colorBrandStroke1
    }
  },
  
  documentIcon: {
    color: tokens.colorBrandForeground1
  },
  
  documentInfo: {
    flex: 1,
    minWidth: 0
  },
  
  documentName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  
  documentMeta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: '2px'
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: tokens.colorNeutralForeground2
  }
});

interface FolderData {
  type: 'dms' | 'portal-to-end-user' | 'portal-from-end-user';
  title: string;
  description: string;
  icon: string;
  documents: SharePointDocument[];
  isLoading: boolean;
}

export const SharePointIntegration: React.FC = () => {
  const styles = useStyles();
  const { selectedEndUser } = useSelectedEndUser();
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const [folders, setFolders] = useState<Record<string, FolderData>>({
    dms: {
      type: 'dms',
      title: 'Internal Documents (DMS)',
      description: 'Internal company documents accessible only to employees',
      icon: '🏢',
      documents: [],
      isLoading: false
    },
    'portal-to-end-user': {
      type: 'portal-to-end-user',
      title: 'To End User',
      description: 'Documents sent from company to end user',
      icon: '📤',
      documents: [],
      isLoading: false
    },
    'portal-from-end-user': {
      type: 'portal-from-end-user',
      title: 'From End User',
      description: 'Documents received from end user',
      icon: '📥',
      documents: [],
      isLoading: false
    }
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load documents for all folders when End User is selected
  useEffect(() => {
    if (selectedEndUser) {
      loadAllDocuments();
    }
  }, [selectedEndUser]);

  const loadAllDocuments = async () => {
    if (!selectedEndUser) return;

    const folderTypes: Array<'dms' | 'portal-to-end-user' | 'portal-from-end-user'> = [
      'dms', 
      'portal-to-end-user', 
      'portal-from-end-user'
    ];

    for (const folderType of folderTypes) {
      setFolders(prev => ({
        ...prev,
        [folderType]: { ...prev[folderType], isLoading: true }
      }));

      try {
        const documents = await SharePointApiClient.getDocumentsByFolder(
          selectedEndUser.id,
          folderType
        );

        setFolders(prev => ({
          ...prev,
          [folderType]: { 
            ...prev[folderType], 
            documents, 
            isLoading: false 
          }
        }));
      } catch (error: any) {
        console.error(`Failed to load ${folderType} documents:`, error);
        setFolders(prev => ({
          ...prev,
          [folderType]: { ...prev[folderType], isLoading: false }
        }));
      }
    }
  };

  const handleFileUpload = async (files: FileList, folderType: string) => {
    if (!selectedEndUser || !files.length) return;

    setIsUploading(true);
    
    try {
      const results = await SharePointApiClient.bulkUploadToSharePoint(
        files,
        selectedEndUser.id,
        folderType as any,
        {
          tags: ['web-upload'],
          uploadedAt: new Date().toISOString()
        }
      );

      if (results.successful.length > 0) {
        showSuccess(
          'Upload Successful',
          `${results.successful.length} file(s) uploaded to SharePoint`
        );

        // Refresh documents for the specific folder
        const documents = await SharePointApiClient.getDocumentsByFolder(
          selectedEndUser.id,
          folderType as any
        );

        setFolders(prev => ({
          ...prev,
          [folderType]: { ...prev[folderType], documents }
        }));
      }

      if (results.failed.length > 0) {
        showError(
          'Upload Errors',
          `${results.failed.length} file(s) failed to upload`
        );
      }
    } catch (error: any) {
      showError('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    folderType: string
  ) => {
    if (event.target.files) {
      handleFileUpload(event.target.files, folderType);
      event.target.value = ''; // Reset input
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent, folderType: string) => {
    event.preventDefault();
    setDragActive(false);
    
    if (event.dataTransfer.files) {
      handleFileUpload(event.dataTransfer.files, folderType);
    }
  };

  const handleDocumentOpen = async (document: SharePointDocument, editMode = false) => {
    try {
      showInfo('Opening Document', 'Opening document in SharePoint...');
      
      const result = await SharePointApiClient.openSharePointDocument(
        document.id,
        editMode ? 'edit' : 'view'
      );
      
      window.open(result.openUrl, '_blank');
    } catch (error: any) {
      showError('Failed to Open', error.message);
    }
  };

  const createFolderSection = (folderKey: string, folder: FolderData) => (
    <div key={folderKey} className={styles.folderCard}>
      <div className={styles.folderHeader}>
        <span className={styles.folderIcon}>{folder.icon}</span>
        <div>
          <Text className={styles.folderTitle}>{folder.title}</Text>
          <Badge 
            color={folder.documents.length > 0 ? 'success' : 'neutral'}
            size="small"
          >
            {folder.documents.length} documents
          </Badge>
        </div>
      </div>
      
      <Text className={styles.folderDescription}>
        {folder.description}
      </Text>
      
      <div className={styles.folderActions}>
        <input
          type="file"
          multiple
          className={styles.fileInput}
          id={`file-${folderKey}`}
          onChange={(e) => handleFileInputChange(e, folderKey)}
          disabled={isUploading || !selectedEndUser}
        />
        
        <Button
          appearance="primary"
          size="small"
          icon={<CloudUpload20Regular />}
          disabled={isUploading || !selectedEndUser}
          onClick={() => document.getElementById(`file-${folderKey}`)?.click()}
        >
          Upload Files
        </Button>
        
        <Button
          appearance="secondary"
          size="small"
          icon={<FolderOpen20Regular />}
          disabled={folder.isLoading}
          onClick={() => setSelectedFolder(
            selectedFolder === folderKey ? null : folderKey
          )}
        >
          {folder.isLoading ? 'Loading...' : `View (${folder.documents.length})`}
        </Button>
      </div>
      
      {/* Documents list for selected folder */}
      {selectedFolder === folderKey && (
        <div className={styles.documentsSection}>
          {folder.isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spinner size="small" />
              <Text>Loading documents...</Text>
            </div>
          ) : folder.documents.length > 0 ? (
            <div className={styles.documentsList}>
              {folder.documents.map((doc) => (
                <div key={doc.id} className={styles.documentItem}>
                  <Document20Regular className={styles.documentIcon} />
                  <div className={styles.documentInfo}>
                    <div className={styles.documentName}>{doc.name}</div>
                    <div className={styles.documentMeta}>
                      {new Date(doc.uploadedAt).toLocaleDateString()} • {
                        Math.round(doc.size / 1024)
                      }KB
                    </div>
                  </div>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => handleDocumentOpen(doc)}
                  >
                    Open
                  </Button>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => handleDocumentOpen(doc, true)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Text>No documents in this folder yet.</Text>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!selectedEndUser) {
    return (
      <div className={styles.container}>
        <MessageBar type={MessageBarType.info}>
          Please select an End User to access SharePoint integration.
        </MessageBar>
      </div>
    );
  }

  if (!selectedEndUser.sharePointSite) {
    return (
      <div className={styles.container}>
        <MessageBar type={MessageBarType.warning}>
          SharePoint site not found for this End User. 
          <Button 
            appearance="primary" 
            size="small"
            style={{ marginLeft: '12px' }}
            onClick={async () => {
              try {
                showInfo('Creating Site', 'Creating SharePoint site...');
                await SharePointApiClient.createEndUserSite(selectedEndUser);
                showSuccess('Site Created', 'SharePoint site created successfully');
                window.location.reload(); // Refresh to load new site
              } catch (error: any) {
                showError('Creation Failed', error.message);
              }
            }}
          >
            Create SharePoint Site
          </Button>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SharePointLogo20Filled style={{ color: tokens.colorBrandForeground1 }} />
        <Text className={styles.title}>
          SharePoint Integration - {selectedEndUser.displayName}
        </Text>
      </div>

      {isUploading && (
        <MessageBar type={MessageBarType.info}>
          <Spinner size="tiny" style={{ marginRight: '8px' }} />
          Uploading files to SharePoint...
        </MessageBar>
      )}

      <div className={styles.folderGrid}>
        {Object.entries(folders).map(([key, folder]) => 
          createFolderSection(key, folder)
        )}
      </div>
    </div>
  );
};
