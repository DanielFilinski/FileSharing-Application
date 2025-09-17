import { useState, useEffect } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Toolbar } from '../components/Toolbar';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentDetailsDrawer } from '../components/DocumentDetailsDrawer';
import { useFavorites } from '@/features/favorites';
import { useDocuments } from '@/entities/document';
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
  clientEmail?: string; // Email клиента, который загрузил документ
  documentType?: string; // Тип документа (tax, audit, consulting, etc.)
  documentSubtype?: string; // Подтип документа (income tax, sales tax, etc.)
  period?: string; // Период (quarter, year, specific dates)
  startDate?: string; // Начальная дата для периода
  endDate?: string; // Конечная дата для периода
  description?: string; // Описание документа
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
  
  // Определяем тип страницы на основе пути
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
    moveToFirmSide
  } = useDocuments();
  const [isGridView, setIsGridView] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<'All Documents' | 'My Documents' | 'Shared Documents' | 'Recent' | 'Favorites'>('All Documents');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddItem = (type: 'document' | 'spreadsheet' | 'presentation' | 'form') => {
    // Опционально: можно открыть модал создания; пока опускаем
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
    // Можно обновить статус документа, если потребуется отдельный флаг доступа
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
  
  // Фильтрация по статусу
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
              // маппинг id
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
            // Пытаемся скачать через blobUrl
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
    </div>
  );
} 