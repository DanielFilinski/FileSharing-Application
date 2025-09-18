import { useCallback, useState } from 'react';
import { documentsApi, type Document, type DocumentFilters, type DocumentMetadata, type UpdateDocumentRequest, type CreateDocumentRequest } from '@/entities/document/api/documentsApi';
import { useNotifications } from '@/shared/lib/useNotifications';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [history, setHistory] = useState<Record<string, Array<{ ts: string; action: string; by?: string }>>>({});
  const { showError, showSuccess, showInfo } = useNotifications();

  const fetchDocuments = useCallback(async (newFilters?: DocumentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentsApi.getDocuments(newFilters ?? filters);
      setDocuments(data);
      if (newFilters) setFilters(newFilters);
    } catch (e: any) {
      setError(e?.message || 'Failed to load documents');
      showError('Загрузка документов', e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  const createDocument = useCallback(async (data: CreateDocumentRequest) => {
    const optimistic: Document = { id: `tmp_${Date.now()}`, name: data.name || 'New document', status: 'pending validation' } as Document;
    setDocuments(prev => [optimistic, ...prev]);
    try {
      const created = await documentsApi.createDocument(data);
      setDocuments(prev => [created, ...prev.filter(d => d.id !== optimistic.id)]);
      showSuccess('Документ создан', created.name);
      return created;
    } catch (e) {
      setDocuments(prev => prev.filter(d => d.id !== optimistic.id));
      throw e;
    }
  }, [showSuccess]);

  const updateDocument = useCallback(async (id: string, updates: UpdateDocumentRequest) => {
    const prevDocs = documents;
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } as Document : d));
    try {
      const updated = await documentsApi.updateDocument(id, updates);
      setDocuments(prev => prev.map(d => d.id === id ? updated : d));
      if (updates.status === 'Locked' || updates.status === 'Active') {
        showInfo('Статус документа', updates.status === 'Locked' ? 'Документ заблокирован' : 'Документ разблокирован');
      }
      setHistory(prev => ({
        ...prev,
        [id]: [
          { ts: new Date().toISOString(), action: `update: ${Object.keys(updates).join(', ')}` },
          ...(prev[id] || [])
        ]
      }));
      return updated;
    } catch (e) {
      setDocuments(prevDocs);
      throw e;
    }
  }, [documents]);

  const deleteDocument = useCallback(async (id: string) => {
    const prevDocs = documents;
    setDocuments(prev => prev.filter(d => d.id !== id));
    try {
      await documentsApi.deleteDocument(id);
      setHistory(prev => ({
        ...prev,
        [id]: [ { ts: new Date().toISOString(), action: 'delete' }, ...(prev[id] || []) ]
      }));
    } catch (e) {
      setDocuments(prevDocs);
      throw e;
    }
  }, [documents]);

  const lockDocument = useCallback(async (id: string) => {
    return updateDocument(id, { status: 'Locked', lock: true });
  }, [updateDocument]);

  const unlockDocument = useCallback(async (id: string) => {
    return updateDocument(id, { status: 'Active', lock: false });
  }, [updateDocument]);

  const moveToClientSide = useCallback(async (id: string) => {
    return updateDocument(id, { owner: 'other' });
  }, [updateDocument]);

  const moveToFirmSide = useCallback(async (id: string) => {
    return updateDocument(id, { owner: 'me' });
  }, [updateDocument]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    const prevDocs = documents;
    setDocuments(prev => prev.filter(d => !ids.includes(d.id)));
    try {
      await documentsApi.bulkDelete(ids);
    } catch (e) {
      setDocuments(prevDocs);
      throw e;
    }
  }, [documents]);

  const bulkMove = useCallback(async (ids: string[], targetSide: 'client' | 'firm') => {
    const updates = targetSide === 'client' ? { owner: 'other' } : { owner: 'me' };
    const prevDocs = documents;
    setDocuments(prev => prev.map(d => ids.includes(d.id) ? { ...d, ...updates } as Document : d));
    try {
      await documentsApi.bulkMove(ids, targetSide);
    } catch (e) {
      setDocuments(prevDocs);
      throw e;
    }
  }, [documents]);

  const uploadFiles = useCallback(async (files: File[], metadata?: DocumentMetadata, onProgress?: (p: number) => void) => {
    const results: Document[] = [];
    for (const file of files) {
      // добавляем временный документ в список
      const tmp: Document = {
        id: `upload_${file.name}_${Date.now()}`,
        name: file.name,
        status: 'pending validation',
      } as Document;
      setDocuments(prev => [tmp, ...prev]);
      try {
        const created = await documentsApi.uploadFile(file, metadata, onProgress);
        setDocuments(prev => [created, ...prev.filter(d => d.id !== tmp.id)]);
        setHistory(prev => ({
          ...prev,
          [created.id]: [ { ts: new Date().toISOString(), action: 'upload' }, ...(prev[created.id] || []) ]
        }));
        results.push(created);
      } catch (e) {
        setDocuments(prev => prev.filter(d => d.id === tmp.id ? { ...tmp, status: 'Access Closed' } : d));
        throw e;
      }
    }
    return results;
  }, []);

  return {
    documents,
    loading,
    error,
    filters,
    history,
    setFilters,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    lockDocument,
    unlockDocument,
    moveToClientSide,
    moveToFirmSide,
    bulkDelete,
    bulkMove,
    uploadFiles,
  };
};


