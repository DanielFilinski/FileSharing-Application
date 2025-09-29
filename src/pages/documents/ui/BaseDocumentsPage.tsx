import { useState, useEffect } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Toolbar } from '../components/Toolbar';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentDetailsDrawer } from '../components/DocumentDetailsDrawer';
import { DocumentHistoryPanel } from '../../../components/DocumentHistory';
import { SignatureWidget } from '../../../components/DigitalSignature';
import { ChatWidget } from '../../../components/Chat';
import { useFavorites } from '@/features/favorites';
import { useDocuments } from '@/entities/document';
import { DocumentsService } from '@/shared/api/documentsService';
import { apiClient } from '@/shared/api';
import { AdvancedDocumentApiClient } from '@/shared/api/advancedDocumentApi';
import { notificationService } from '@/shared/lib/notifications';
import { useDocumentCleanup } from '@/shared/hooks/useDocumentCleanup';
import { useLocation } from 'react-router-dom';


const useStyles = makeStyles({
  root: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase,
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    display: 'flex',
    height: '100vh',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
    minHeight: 0
  }
});

export interface Document {
  key: string;
  name: string;
  modified: string;
  createdBy: string;
  modifiedBy: string;
  owner: 'me' | 'other';
  shared: boolean;
  status: 'Active' | 'pending validation' | 'validation in process' | 'pending review' | 'Locked' | 'Access Closed';
  lock: boolean;
  clientEmail?: string; // Client email who uploaded the document
  documentType?: string; // Document type (tax, audit, consulting, etc.)
  documentSubtype?: string; // Document subtype (income tax, sales tax, etc.)
  period?: string; // Period (quarter, year, specific dates)
  startDate?: string; // Start date for period
  endDate?: string; // End date for period
  description?: string; // Document description
}

export interface BaseDocumentsPageProps {
  initialDocuments?: Document[];
  showAccessControl?: boolean;
  customToolbarProps?: any;
  customTableProps?: any;
}

export default function BaseDocumentsPage({
  initialDocuments = [],
  showAccessControl = false,
  customToolbarProps = {},
  customTableProps = {}
}: BaseDocumentsPageProps) {
  const styles = useStyles();
  const location = useLocation();
  const { getFavorites } = useFavorites();
  const documentsService = new DocumentsService(apiClient);
  const { addOpenDocument, removeOpenDocument, cleanupDocuments } = useDocumentCleanup();
  
  // Determine page type based on path
  const getPageType = (): 'firm' | 'client' => {
    if (location.pathname.includes('/client') || 
        location.pathname.includes('/client-side') || 
        location.pathname.includes('/to-end-user') || 
        location.pathname.includes('/from-end-user')) {
      return 'client';
    }
    return 'firm';
  };
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const {
    documents,
    fetchDocuments,
    uploadFiles,
    lockDocument,
    unlockDocument,
    moveToClientSide,
    moveToFirmSide,
    deleteDocument,
    updateDocument,
    bulkDelete,
    createDocument
  } = useDocuments();
  const [isGridView, setIsGridView] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<'All Documents' | 'My Documents' | 'Shared Documents' | 'Recent' | 'Favorites'>('All Documents');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [historyDocumentId, setHistoryDocumentId] = useState<string>('');
  const [historyDocumentName, setHistoryDocumentName] = useState<string>('');
  
  // State for signature widget
  const [isSignatureWidgetOpen, setIsSignatureWidgetOpen] = useState(false);
  const [signatureDocumentId, setSignatureDocumentId] = useState<string>('');
  const [signatureDocumentName, setSignatureDocumentName] = useState<string>('');

  // State for chat widget
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);
  const [chatDocumentId, setChatDocumentId] = useState<string>('');
  const [chatDocumentName, setChatDocumentName] = useState<string>('');

  const handleAddItem = (type: 'document' | 'spreadsheet' | 'presentation' | 'form') => {
    // Optionally: can open creation modal; skipping for now
  };

  const handleFilterChange = (filter: 'All Documents' | 'My Documents' | 'Shared Documents' | 'Recent' | 'Favorites') => {
    setDocumentFilter(filter);
    setSelectedItems(new Set());
    const owner = filter === 'My Documents' ? 'me' : filter === 'Shared Documents' ? 'other' : 'all';
    fetchDocuments({ ...{}, owner });
  };

  const handleUploadFiles = (files: FileList, metadata?: {
    documentType: string;
    documentSubtype: string;
    period: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) => {
    uploadFiles(Array.from(files), metadata);
  };

  const handleCloseAccess = (documentKey: string) => {
    // Can update document status if separate access flag is needed
  };

  const handleToggleLock = (documentKey: string) => {
    const doc = documents.find(d => (d.id === documentKey || (d as any).key === documentKey));
    if (!doc) return;
    if ((doc as any).lock || doc.status === 'Locked') {
      unlockDocument(doc.id);
    } else {
      lockDocument(doc.id);
    }
  };

  const handleRowClick = (doc: Document) => {
    setSelectedDoc(doc);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    // setSelectedDoc(null);
  };

  // Handle document operations from toolbar
  const handleDocumentOperation = async (operation: string, documentIds: string[], data?: any) => {
    try {
      switch (operation) {
        case 'delete':
          if (documentIds.length === 1) {
            await deleteDocument(documentIds[0]);
          } else {
            await AdvancedDocumentApiClient.bulkOperation(documentIds, 'delete');
            notificationService.success('Success', `${documentIds.length} documents deleted`);
          }
          setSelectedItems(new Set());
          break;
          
        case 'rename':
          if (documentIds.length === 1 && data?.newName) {
            await updateDocument(documentIds[0], { name: data.newName });
          }
          break;
          
        case 'pin':
          for (const documentId of documentIds) {
            await AdvancedDocumentApiClient.pinDocument(documentId, true);
          }
          notificationService.success('Success', `${documentIds.length} document(s) pinned to top`);
          break;
          
        case 'unpin':
          for (const documentId of documentIds) {
            await AdvancedDocumentApiClient.pinDocument(documentId, false);
          }
          notificationService.success('Success', `${documentIds.length} document(s) unpinned`);
          break;
          
        case 'move':
          if (data?.targetFolder) {
            const result = await AdvancedDocumentApiClient.moveDocuments(documentIds, data.targetFolder, 'move');
            const { successMessages, errorMessages } = AdvancedDocumentApiClient.formatOperationResults(result.results);
            
            if (successMessages.length > 0) {
              notificationService.success('Move Complete', successMessages.join(', '));
            }
            if (errorMessages.length > 0) {
              notificationService.error('Move Errors', errorMessages.join(', '));
            }
          }
          break;
          
        case 'copy':
          if (data?.targetFolder) {
            const result = await AdvancedDocumentApiClient.moveDocuments(documentIds, data.targetFolder, 'copy');
            const { successMessages, errorMessages } = AdvancedDocumentApiClient.formatOperationResults(result.results);
            
            if (successMessages.length > 0) {
              notificationService.success('Copy Complete', successMessages.join(', '));
            }
            if (errorMessages.length > 0) {
              notificationService.error('Copy Errors', errorMessages.join(', '));
            }
          }
          break;
          
        case 'archive':
          const archiveResult = await AdvancedDocumentApiClient.bulkOperation(documentIds, 'archive');
          notificationService.success('Archive Complete', 
            `${archiveResult.summary.successful} documents archived successfully`);
          break;
          
        case 'restore':
          const restoreResult = await AdvancedDocumentApiClient.bulkOperation(documentIds, 'restore');
          notificationService.success('Restore Complete', 
            `${restoreResult.summary.successful} documents restored successfully`);
          break;
          
        case 'tag':
          if (data?.tags && data.tags.length > 0) {
            const tagResult = await AdvancedDocumentApiClient.bulkOperation(documentIds, 'tag', { tags: data.tags });
            notificationService.success('Tag Complete', 
              `${tagResult.summary.successful} documents tagged with: ${data.tags.join(', ')}`);
          }
          break;
          
        case 'download':
          // Implementation for download operation
          console.log('Downloading documents:', documentIds);
          notificationService.info('Download', 'Download functionality coming soon');
          break;
          
        case 'print':
          // Implementation for print operation
          console.log('Printing documents:', documentIds);
          notificationService.info('Print', 'Print functionality coming soon');
          break;
          
        case 'share':
          // Implementation for share operation
          console.log('Sharing documents:', documentIds, 'with:', data);
          notificationService.info('Share', 'Advanced sharing functionality coming soon');
          break;
          
        case 'create':
          // Implementation for document creation using Azure Functions
          if (data.document) {
            // Document was already created by the Azure Function
            // Just update local state and track for cleanup
            addOpenDocument(data.document.id);
            console.log('Document created successfully:', data.document.name);
          } else {
            // Fallback: create using local API
            const documentData = {
              name: data.name,
              status: 'Active' as const,
              documentType: data.metadata?.documentType,
              documentSubtype: data.metadata?.documentSubtype,
              period: data.metadata?.period,
              description: data.description
            };
            const newDoc = await createDocument(documentData);
            if (newDoc?.id) {
              addOpenDocument(newDoc.id);
            }
          }
          break;
      }
      
      // Refresh documents after operation (except create which is handled separately)
      if (operation !== 'create' && operation !== 'download' && operation !== 'print') {
        try {
          // Simple refresh by re-calling the documents service
          window.location.reload(); // Simple refresh for now - can be improved with state management
        } catch (refreshError) {
          console.error('Error refreshing documents after operation:', refreshError);
        }
      }
      
      // Clear selection after most operations
      if (['delete', 'pin', 'unpin', 'move', 'copy', 'archive', 'restore', 'tag'].includes(operation)) {
        setSelectedItems(new Set());
      }
      
    } catch (error) {
      console.error(`Error during ${operation}:`, error);
      notificationService.error('Operation Failed', `Failed to ${operation} documents: ${error.message}`);
      throw error;
    }
  };

  // Get selected documents objects
  const getSelectedDocuments = () => {
    return filteredDocuments.filter(doc => selectedItems.has(doc.key));
  };

  // Handle document opening with tracking
  const handleDocumentOpen = async (documentId: string, mode: 'local' | 'online') => {
    try {
      // Use the documents service to open the document
      const response = await documentsService.openDocument({
        documentId,
        mode,
        action: 'edit'
      });

      // Track opened document for cleanup
      addOpenDocument(documentId);
      
      // Open in appropriate editor
      if (mode === 'local') {
        window.open(response.access.downloadUrl, '_blank');
      } else {
        window.open(response.access.editorUrl, '_blank');
      }

      return response;
    } catch (error) {
      console.error('Error opening document:', error);
      throw error;
    }
  };

  // Handle document close/unlock
  const handleDocumentClose = async (documentId: string) => {
    try {
      await documentsService.unlockDocument({ documentId });
      removeOpenDocument(documentId);
    } catch (error) {
      console.error('Error closing document:', error);
      // Don't throw - closing should be best effort
    }
  };

  let filteredDocuments = documents.map(d => ({
    key: (d as any).key ?? d.id,
    name: d.name,
    modified: (d as any).modified ?? '',
    createdBy: (d as any).createdBy ?? '',
    modifiedBy: (d as any).modifiedBy ?? '',
    owner: ((d as any).owner ?? 'me') as any,
    shared: Boolean((d as any).shared),
    status: (d.status as any) ?? 'Active',
    lock: Boolean((d as any).lock),
    clientEmail: (d as any).clientEmail,
    documentType: (d as any).documentType,
    documentSubtype: (d as any).documentSubtype,
    period: (d as any).period,
    startDate: (d as any).startDate,
    endDate: (d as any).endDate,
    description: (d as any).description,
  } as Document));
  if (documentFilter === 'My Documents') filteredDocuments = filteredDocuments.filter(d => d.owner === 'me');
  if (documentFilter === 'Shared Documents') filteredDocuments = filteredDocuments.filter(d => d.shared);
  if (documentFilter === 'Recent') filteredDocuments = filteredDocuments.slice(-3);
  if (documentFilter === 'Favorites') {
    const favoriteKeys = getFavorites();
    filteredDocuments = filteredDocuments.filter(d => favoriteKeys.includes(d.key));
  }
  
  // Filter by status
  if (statusFilter !== 'All') {
    filteredDocuments = filteredDocuments.filter(d => d.status === statusFilter);
  }

  useEffect(() => {
    if (location.pathname === '/favorites') {
      setDocumentFilter('Favorites');
    } else {
      setDocumentFilter('All Documents');
    }
    fetchDocuments();
  }, [location.pathname]);

  return (
    <div className={styles.root} style={isDrawerOpen ? { marginRight: 400 } : {}}>
      <div className={styles.content}>
        <Toolbar 
          selectedCount={selectedItems.size} 
          onAddItem={handleAddItem} 
          isGridView={isGridView} 
          setIsGridView={setIsGridView} 
          documentFilter={documentFilter} 
          onFilterChange={handleFilterChange} 
          onUploadFiles={handleUploadFiles}
          pageType={getPageType()}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedDocuments={getSelectedDocuments()}
          onDocumentOperation={handleDocumentOperation}
          onRefresh={fetchDocuments}
          onDocumentOpen={handleDocumentOpen}
          onDocumentClose={handleDocumentClose}
          {...customToolbarProps}
        />
        <Breadcrumbs /> 
        <DocumentsTable 
          items={filteredDocuments} 
          selectedItems={selectedItems} 
          setSelectedItems={setSelectedItems} 
          isGridView={isGridView}
          showAccessControl={showAccessControl}
          onCloseAccess={handleCloseAccess}
          onToggleLock={handleToggleLock}
          onDelete={(key) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (doc) {
              // id mapping
              // @ts-ignore
              import('@/entities/document').then(({ documentsApi }) => documentsApi.deleteDocument(doc.id)).catch(() => {});
            }
          }}
          onMoveToClient={(key) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (doc) moveToClientSide(doc.id);
          }}
          onMoveToFirm={(key) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (doc) moveToFirmSide(doc.id);
          }}
          onPreview={(key) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (!doc) return;
            // @ts-ignore
            import('@/entities/document').then(({ documentsApi }) => documentsApi.previewFile(doc.id)).then(url => {
              if (url) window.open(url, '_blank');
            }).catch(() => {});
          }}
          onDownload={(key) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (!doc) return;
            // Try to download through blobUrl
            const url = (doc as any).blobUrl;
            if (url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = doc.name;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }
          }}
          onSignDocument={(key, docName) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (doc) {
              setSignatureDocumentId(doc.id);
              setSignatureDocumentName(docName || doc.name);
              setIsSignatureWidgetOpen(true);
              console.log('Signing document:', docName || doc.name);
            }
          }}
          onViewHistory={(key) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (doc) {
              setHistoryDocumentId(doc.id);
              setHistoryDocumentName(doc.name);
              setIsHistoryPanelOpen(true);
              console.log('Viewing history for document:', doc.name);
            }
          }}
          onOpenChat={(key, docName) => {
            const doc = documents.find(d => d.id === key || (d as any).key === key);
            if (doc) {
              setChatDocumentId(doc.id);
              setChatDocumentName(docName || doc.name);
              setIsChatWidgetOpen(true);
              console.log('Opening chat for document:', docName || doc.name);
            }
          }}
          pageType={getPageType()}
          onRowClick={handleRowClick}
          {...customTableProps}
        />
      </div>
      <DocumentDetailsDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        selectedDoc={selectedDoc}
        onClose={handleDrawerClose}
      />

      {/* Document History Panel */}
      {isHistoryPanelOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '600px',
          height: '100vh',
          backgroundColor: tokens.colorNeutralBackground1,
          boxShadow: tokens.shadow64,
          zIndex: 1000,
          borderLeft: `1px solid ${tokens.colorNeutralStroke2}`
        }}>
          <DocumentHistoryPanel
            documentId={historyDocumentId}
            documentName={historyDocumentName}
            isVisible={isHistoryPanelOpen}
            onClose={() => {
              setIsHistoryPanelOpen(false);
              setHistoryDocumentId('');
              setHistoryDocumentName('');
            }}
          />
        </div>
      )}

      {/* Signature Widget - displayed as dialog */}
      {isSignatureWidgetOpen && (
        <SignatureWidget
          documentId={signatureDocumentId}
          documentName={signatureDocumentName}
          onSignatureRequestCreated={(signatureRequest) => {
            console.log('Signature request created:', signatureRequest);
            notificationService.success(
              'Document sent for signature',
              `Signature request created for document "${signatureDocumentName}"`
            );
            setIsSignatureWidgetOpen(false);
            // Optionally: refresh documents to show signature status
            fetchDocuments();
          }}
          onClose={() => {
            setIsSignatureWidgetOpen(false);
            setSignatureDocumentId('');
            setSignatureDocumentName('');
          }}
          trigger={<div style={{ display: 'none' }} />} // Hidden trigger since we manage state manually
        />
      )}

      {/* Chat Widget */}
      <ChatWidget
        isOpen={isChatWidgetOpen}
        onClose={() => {
          setIsChatWidgetOpen(false);
          setChatDocumentId('');
          setChatDocumentName('');
        }}
        documentId={chatDocumentId}
        documentName={chatDocumentName}
        onFragmentCreate={(fragment) => {
          console.log('Fragment created:', fragment);
          notificationService.success(
            'Fragment Created',
            `Fragment created for document "${chatDocumentName}"`
          );
          // TODO: Handle fragment highlighting in document viewer
        }}
        onFragmentHighlight={(fragment) => {
          console.log('Fragment highlighted:', fragment);
          // TODO: Scroll to and highlight fragment in document viewer
          // This would require integration with document viewer component
        }}
      />
    </div>
  );
} 