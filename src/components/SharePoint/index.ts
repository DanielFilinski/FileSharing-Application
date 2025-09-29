/**
 * SharePoint Components Export
 */

export { SharePointIntegration } from './SharePointIntegration';

// Re-export SharePoint API and types for convenience
export { SharePointApiClient, sharePointApi } from '../../shared/api/sharePointApi';
export type {
  SharePointUploadData,
  SharePointDocument,
  SharePointSite,
  EndUserDocumentsResponse
} from '../../shared/api/sharePointApi';
