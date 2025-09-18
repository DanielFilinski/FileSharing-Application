export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Document {
  id: string;
  title: string;
  content: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  approverId?: string;
} 