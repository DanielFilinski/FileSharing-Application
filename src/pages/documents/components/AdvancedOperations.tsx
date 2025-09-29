// Advanced Document Operations Components
export { PinToTopButton } from './PinToTopButton';
export { MoveToFolderDialog } from './MoveToFolderDialog';
export { TagDocumentsDialog } from './TagDocumentsDialog';
export { BulkOperationsToolbar } from './BulkOperationsToolbar';

// Re-export the main API client for convenience
export { AdvancedDocumentApiClient } from '@/shared/api/advancedDocumentApi';
export type { 
  PinDocumentRequest,
  MoveDocumentsRequest, 
  BulkOperationRequest,
  OperationResult,
  BulkOperationResponse,
  DocumentActivity 
} from '@/shared/api/advancedDocumentApi';
