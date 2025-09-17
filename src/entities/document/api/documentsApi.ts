import { apiClient, type ApiResponse } from '@/shared/api';

export type DocumentStatus = 'Active' | 'pending validation' | 'validation in process' | 'pending review' | 'Locked' | 'Access Closed';

export interface Document {
  id: string;
  partitionKey?: string;
  name: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  blobUrl?: string;
  createdBy?: string;
  modifiedBy?: string;
  modified?: string;
  owner?: 'me' | 'other';
  shared?: boolean;
  status: DocumentStatus;
  lock?: boolean;
  clientEmail?: string;
  documentType?: string;
  documentSubtype?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface DocumentFilters {
  status?: string;
  documentType?: string;
  clientEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  owner?: 'me' | 'other' | 'all';
  shared?: boolean;
  favorites?: boolean;
}

export interface CreateDocumentRequest extends Partial<Document> {}
export interface UpdateDocumentRequest extends Partial<Document> {}

export interface DocumentMetadata {
  documentType: string;
  documentSubtype: string;
  period: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

const mapServerDocToClient = (d: any): Document => {
  return {
    id: d.id ?? d.key ?? crypto.randomUUID(),
    partitionKey: d.partitionKey,
    name: d.name ?? d.fileName ?? 'document',
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    blobUrl: d.blobUrl,
    createdBy: d.metadata?.createdBy ?? d.createdBy,
    modifiedBy: d.metadata?.modifiedBy ?? d.modifiedBy,
    modified: d.metadata?.modifiedAt ?? d.modified,
    owner: d.owner,
    shared: d.shared,
    status: (d.status as DocumentStatus) ?? 'Active',
    lock: d.metadata?.isLocked ?? d.lock ?? false,
    clientEmail: d.clientEmail,
    documentType: d.documentType ?? d.category,
    documentSubtype: d.documentSubtype,
    period: d.period,
    startDate: d.startDate,
    endDate: d.endDate,
    description: d.description,
  };
};

export const documentsApi = {
  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.owner && filters.owner !== 'all') params.set('owner', filters.owner);
    if (typeof filters?.shared === 'boolean') params.set('shared', String(filters.shared));
    if (filters?.documentType) params.set('documentType', filters.documentType);
    if (filters?.clientEmail) params.set('clientEmail', filters.clientEmail);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.favorites) params.set('favorites', 'true');
    const res = await apiClient.get<any[]>(`/documents${params.toString() ? `?${params.toString()}` : ''}`);
    return (res.data || []).map(mapServerDocToClient);
  },

  async getDocument(id: string, partitionKey?: string): Promise<Document> {
    const res = await apiClient.get<any>(`/documents/${id}${partitionKey ? `?pk=${encodeURIComponent(partitionKey)}` : ''}`);
    return mapServerDocToClient(res.data);
  },

  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const res = await apiClient.post<any>('/documents', data);
    return mapServerDocToClient(res.data);
  },

  async updateDocument(id: string, data: UpdateDocumentRequest & { partitionKey?: string }): Promise<Document> {
    const res = await apiClient.put<any>(`/documents/${id}`, data);
    return mapServerDocToClient(res.data);
  },

  async deleteDocument(id: string, partitionKey?: string): Promise<void> {
    await apiClient.delete<void>(`/documents/${id}${partitionKey ? `?pk=${encodeURIComponent(partitionKey)}` : ''}`);
  },

  async uploadFile(file: File, metadata?: DocumentMetadata, onProgress?: (p: number) => void): Promise<Document> {
    const res: ApiResponse<any> = await apiClient.uploadFile(`/uploadFile`, file, onProgress);
    const created: CreateDocumentRequest = {
      name: res.data?.file?.name ?? file.name,
      fileName: res.data?.file?.name ?? file.name,
      fileSize: res.data?.file?.size ?? file.size,
      mimeType: res.data?.file?.type ?? file.type,
      status: 'pending validation',
      documentType: metadata?.documentType,
      documentSubtype: metadata?.documentSubtype,
      period: metadata?.period,
      startDate: metadata?.startDate,
      endDate: metadata?.endDate,
      description: metadata?.description,
    };
    try {
      const doc = await this.createDocument(created);
      return doc;
    } catch {
      return mapServerDocToClient(created);
    }
  },

  async downloadFile(id: string): Promise<Blob> {
    // Заглушка: в бэкенде нет эндпоинта, можно расширить позже
    throw new Error('downloadFile endpoint is not implemented on server');
  },

  async previewFile(id: string): Promise<string> {
    // Возвращаем URL для предпросмотра, если есть blobUrl
    const doc = await this.getDocument(id);
    if (doc.blobUrl) return doc.blobUrl;
    throw new Error('No preview available');
  },

  async lockDocument(id: string, partitionKey?: string): Promise<Document> {
    // Оптимистично обновляем через update
    return this.updateDocument(id, { partitionKey, status: 'Locked', lock: true });
  },

  async unlockDocument(id: string, partitionKey?: string): Promise<Document> {
    return this.updateDocument(id, { partitionKey, status: 'Active', lock: false });
  },

  async moveToClientSide(id: string, partitionKey?: string): Promise<Document> {
    return this.updateDocument(id, { partitionKey, owner: 'other' });
  },

  async moveToFirmSide(id: string, partitionKey?: string): Promise<Document> {
    return this.updateDocument(id, { partitionKey, owner: 'me' });
  },

  async bulkDelete(ids: string[], partitionKey?: string): Promise<void> {
    await Promise.all(ids.map(id => this.deleteDocument(id, partitionKey)));
  },

  async bulkMove(ids: string[], targetSide: 'client' | 'firm', partitionKey?: string): Promise<void> {
    await Promise.all(
      ids.map(id => targetSide === 'client' ? this.moveToClientSide(id, partitionKey) : this.moveToFirmSide(id, partitionKey))
    );
  },
};


