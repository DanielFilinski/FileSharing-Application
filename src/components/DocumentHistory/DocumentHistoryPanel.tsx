import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Card,
  CardHeader,
  Badge,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  MessageBar,
  MessageBarType,
  Tooltip,
  Menu,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  Divider
} from '@fluentui/react-components';
import {
  History20Regular,
  ChevronDown20Regular,
  ArrowDownload20Regular,
  ArrowUndo20Regular,
  Eye20Regular,
  Info20Regular,
  Person20Regular,
  Calendar20Regular,
  Document20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  Edit20Regular
} from '@fluentui/react-icons';
import { documentVersionsApi, DocumentVersion, DocumentHistoryEvent } from '../../shared/api/documentVersionsApi';
import { notificationService } from '../../shared/lib/notifications';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '20px',
    gap: '16px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px'
  },
  versionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    overflowY: 'auto'
  },
  versionCard: {
    padding: '16px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'border-color 0.2s ease',
    ':hover': {
      borderColor: tokens.colorBrandStroke2
    }
  },
  currentVersionCard: {
    borderColor: tokens.colorBrandStroke2,
    backgroundColor: tokens.colorBrandBackground2
  },
  versionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  versionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  versionNumber: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1
  },
  versionMetadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  metadataRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  changeDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    lineHeight: '1.4'
  },
  versionActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  historySection: {
    marginTop: '24px'
  },
  historyEvent: {
    padding: '12px 16px',
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground2,
    marginBottom: '8px'
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  eventType: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold
  },
  eventTime: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3
  },
  eventDetails: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  compareDialog: {
    minWidth: '600px'
  },
  comparisonSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  comparisonRow: {
    display: 'flex',
    gap: '16px'
  },
  comparisonColumn: {
    flex: 1,
    padding: '12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall
  },
  differenceHighlight: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    padding: '2px 4px',
    borderRadius: tokens.borderRadiusSmall
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground2
  }
});

interface DocumentHistoryPanelProps {
  documentId: string;
  documentName: string;
  onClose?: () => void;
  isVisible?: boolean;
}

export const DocumentHistoryPanel: React.FC<DocumentHistoryPanelProps> = ({
  documentId,
  documentName,
  onClose,
  isVisible = true
}) => {
  const styles = useStyles();
  
  // State
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [historyEvents, setHistoryEvents] = useState<DocumentHistoryEvent[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryEvents, setShowHistoryEvents] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<DocumentVersion | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{ v1: DocumentVersion; v2: DocumentVersion } | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isVisible && documentId) {
      loadVersionHistory();
    }
  }, [documentId, isVisible]);

  const loadVersionHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Loading version history for document ${documentId}`);
      const response = await documentVersionsApi.getDocumentHistory(documentId);
      
      setVersions(response.data.versions);
      setHistoryEvents(response.data.historyEvents);
      setCurrentVersion(response.data.currentVersion);
      
      console.log(`Loaded ${response.data.versions.length} versions and ${response.data.historyEvents.length} events`);
    } catch (err: any) {
      console.error('Failed to load version history:', err);
      setError(err.message || 'Failed to load document history');
      notificationService.error('Error', 'Failed to load document version history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVersion = async (version: DocumentVersion) => {
    try {
      console.log(`Downloading version ${version.versionNumber}`);
      const blob = await documentVersionsApi.downloadDocumentVersion(documentId, version.versionNumber);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${version.documentSnapshot.fileName}_v${version.versionNumber}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      notificationService.success('Success', `Downloaded version ${version.versionNumber}`);
    } catch (err: any) {
      console.error('Failed to download version:', err);
      notificationService.error('Download Failed', err.message || 'Failed to download document version');
    }
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    setVersionToRestore(version);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!versionToRestore) return;
    
    setRestoring(true);
    try {
      console.log(`Restoring document from version ${versionToRestore.versionNumber}`);
      await documentVersionsApi.restoreDocumentFromVersion(documentId, versionToRestore.versionNumber);
      
      notificationService.success('Success', `Document restored from version ${versionToRestore.versionNumber}`);
      setRestoreDialogOpen(false);
      setVersionToRestore(null);
      
      // Reload history to show new version created by restore
      await loadVersionHistory();
      
    } catch (err: any) {
      console.error('Failed to restore version:', err);
      notificationService.error('Restore Failed', err.message || 'Failed to restore document version');
    } finally {
      setRestoring(false);
    }
  };

  const handleCompareVersions = async (version1: DocumentVersion, version2: DocumentVersion) => {
    try {
      const comparison = await documentVersionsApi.compareVersions(documentId, version1.versionNumber, version2.versionNumber);
      setCompareVersions({ v1: comparison.version1, v2: comparison.version2 });
      setCompareDialogOpen(true);
    } catch (err: any) {
      console.error('Failed to compare versions:', err);
      notificationService.error('Comparison Failed', err.message || 'Failed to compare document versions');
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'upload':
      case 'edit':
        return <Edit20Regular />;
      case 'download':
        return <ArrowDownload20Regular />;
      case 'approve':
        return <CheckmarkCircle20Regular />;
      case 'view':
        return <Document20Regular />;
      default:
        return <Info20Regular />;
    }
  };

  const getEventTypeColor = (eventType: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (eventType) {
      case 'approve':
        return 'success';
      case 'reject':
        return 'danger';
      case 'edit':
      case 'upload':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <History20Regular />
          <Text size={600} weight="semibold">Document History</Text>
        </div>
        {onClose && (
          <Button appearance="subtle" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Text size={400} style={{ marginBottom: '16px' }}>
        {documentName}
      </Text>

      {loading && (
        <div className={styles.loadingContainer}>
          <Spinner label="Loading version history..." />
        </div>
      )}

      {error && (
        <MessageBar intent="error">
          {error}
        </MessageBar>
      )}

      {!loading && !error && (
        <>
          {versions.length === 0 ? (
            <div className={styles.emptyState}>
              <Text>No version history available for this document.</Text>
            </div>
          ) : (
            <div className={styles.versionsList}>
              {versions.map((version, index) => {
                const isCurrentVersion = version.versionNumber === currentVersion;
                
                return (
                  <Card 
                    key={version.id} 
                    className={`${styles.versionCard} ${isCurrentVersion ? styles.currentVersionCard : ''}`}
                  >
                    <div className={styles.versionHeader}>
                      <div className={styles.versionInfo}>
                        <Text className={styles.versionNumber}>
                          Version {version.versionNumber}
                        </Text>
                        {isCurrentVersion && (
                          <Badge appearance="filled" color="success">Current</Badge>
                        )}
                        <Badge 
                          appearance="outline" 
                          color={documentVersionsApi.getVersionStatusColor(version)}
                        >
                          {version.versionMetadata.changeType}
                        </Badge>
                      </div>
                      
                      <div className={styles.versionActions}>
                        <Tooltip content="Download this version" relationship="label">
                          <Button
                            appearance="subtle"
                            icon={<ArrowDownload20Regular />}
                            onClick={() => handleDownloadVersion(version)}
                            size="small"
                          />
                        </Tooltip>
                        
                        {!isCurrentVersion && (
                          <Tooltip content="Restore to this version" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<ArrowUndo20Regular />}
                              onClick={() => handleRestoreVersion(version)}
                              size="small"
                            />
                          </Tooltip>
                        )}

                        {index < versions.length - 1 && (
                          <Tooltip content="Compare with next version" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<Eye20Regular />}
                              onClick={() => handleCompareVersions(version, versions[index + 1])}
                              size="small"
                            />
                          </Tooltip>
                        )}

                        <Menu>
                          <MenuTrigger>
                            <Button
                              appearance="subtle"
                              icon={<ChevronDown20Regular />}
                              size="small"
                            />
                          </MenuTrigger>
                          <MenuPopover>
                            <MenuList>
                              <MenuItem onClick={() => handleDownloadVersion(version)}>
                                <ArrowDownload20Regular /> Download
                              </MenuItem>
                              {!isCurrentVersion && (
                                <MenuItem onClick={() => handleRestoreVersion(version)}>
                                  <ArrowUndo20Regular /> Restore
                                </MenuItem>
                              )}
                              {index < versions.length - 1 && (
                                <MenuItem onClick={() => handleCompareVersions(version, versions[index + 1])}>
                                  <Eye20Regular /> Compare
                                </MenuItem>
                              )}
                            </MenuList>
                          </MenuPopover>
                        </Menu>
                      </div>
                    </div>

                    <div className={styles.changeDescription}>
                      {documentVersionsApi.getVersionChangeDescription(version)}
                    </div>

                    <div className={styles.versionMetadata}>
                      <div className={styles.metadataRow}>
                        <Person20Regular />
                        <Text>{version.versionMetadata.createdBy}</Text>
                      </div>
                      <div className={styles.metadataRow}>
                        <Calendar20Regular />
                        <Text>{documentVersionsApi.formatVersionTimestamp(version.versionMetadata.createdAt)}</Text>
                      </div>
                      <div className={styles.metadataRow}>
                        <Document20Regular />
                        <Text>{documentVersionsApi.formatFileSize(version.documentSnapshot.fileSize)}</Text>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* History Events Section */}
          <div className={styles.historySection}>
            <Button
              appearance="outline"
              onClick={() => setShowHistoryEvents(!showHistoryEvents)}
              icon={<ChevronDown20Regular style={{ transform: showHistoryEvents ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
            >
              {showHistoryEvents ? 'Hide' : 'Show'} Detailed Activity Log ({historyEvents.length} events)
            </Button>

            {showHistoryEvents && (
              <div style={{ marginTop: '16px' }}>
                {historyEvents.map(event => (
                  <div key={event.id} className={styles.historyEvent}>
                    <div className={styles.eventHeader}>
                      <div className={styles.eventType}>
                        <Badge 
                          appearance="outline" 
                          color={getEventTypeColor(event.eventType)}
                          icon={getEventTypeIcon(event.eventType)}
                        >
                          {event.eventType}
                        </Badge>
                        <Text style={{ marginLeft: '8px' }}>
                          {event.eventDetails.action}
                        </Text>
                      </div>
                      <Text className={styles.eventTime}>
                        {documentVersionsApi.formatVersionTimestamp(event.timestamp)}
                      </Text>
                    </div>
                    
                    <div className={styles.eventDetails}>
                      by {event.userInfo.userName} ({event.userInfo.userEmail})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={(_, data) => setRestoreDialogOpen(data.open)}>
        <DialogSurface className={styles.compareDialog}>
          <DialogBody>
            <DialogTitle>Restore Document Version</DialogTitle>
            <DialogContent>
              <MessageBar intent="warning" style={{ marginBottom: '16px' }}>
                This will create a backup of the current document and restore it to the selected version. 
                This action cannot be undone automatically.
              </MessageBar>
              
              {versionToRestore && (
                <div>
                  <Text weight="semibold">Restore to Version {versionToRestore.versionNumber}</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>{documentVersionsApi.getVersionChangeDescription(versionToRestore)}</Text>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                      Created by {versionToRestore.versionMetadata.createdBy} on{' '}
                      {documentVersionsApi.formatVersionTimestamp(versionToRestore.versionMetadata.createdAt)}
                    </Text>
                  </div>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setRestoreDialogOpen(false)}
                disabled={restoring}
              >
                Cancel
              </Button>
              <Button 
                appearance="primary" 
                onClick={confirmRestore}
                disabled={restoring}
              >
                {restoring ? <Spinner size="tiny" /> : null}
                {restoring ? 'Restoring...' : 'Restore Version'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Version Comparison Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={(_, data) => setCompareDialogOpen(data.open)}>
        <DialogSurface style={{ minWidth: '800px' }}>
          <DialogBody>
            <DialogTitle>Compare Document Versions</DialogTitle>
            <DialogContent>
              {compareVersions && (
                <div className={styles.comparisonSection}>
                  <div className={styles.comparisonRow}>
                    <div className={styles.comparisonColumn}>
                      <Text weight="semibold">Version {compareVersions.v1.versionNumber}</Text>
                      <Text size={200}>{compareVersions.v1.versionMetadata.createdBy}</Text>
                      <Text size={200}>{documentVersionsApi.formatVersionTimestamp(compareVersions.v1.versionMetadata.createdAt)}</Text>
                    </div>
                    <div className={styles.comparisonColumn}>
                      <Text weight="semibold">Version {compareVersions.v2.versionNumber}</Text>
                      <Text size={200}>{compareVersions.v2.versionMetadata.createdBy}</Text>
                      <Text size={200}>{documentVersionsApi.formatVersionTimestamp(compareVersions.v2.versionMetadata.createdAt)}</Text>
                    </div>
                  </div>

                  <Divider />

                  <Text weight="semibold">Changes:</Text>
                  
                  {/* This would show actual differences - simplified for now */}
                  <div>
                    <Text size={300}>
                      {compareVersions.v1.versionMetadata.changeDescription} → {compareVersions.v2.versionMetadata.changeDescription}
                    </Text>
                  </div>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setCompareDialogOpen(false)}
              >
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
