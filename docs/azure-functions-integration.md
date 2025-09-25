# Azure Functions Integration for Document Operations

## Overview

This document describes the implementation of real Azure Functions integration for document creation and opening operations, replacing the previous demonstration code with fully functional backend services.

## Architecture

### Azure Functions Implemented

#### 1. Create New Document (`/api/documents/create`)
- **Function**: `createNewDocument.ts`
- **Method**: POST
- **Purpose**: Creates new documents from templates with metadata
- **Features**:
  - Template-based document creation
  - Multiple document types (document, spreadsheet, presentation, form)
  - Metadata support for document classification
  - User authentication and authorization
  - Document locking and permissions management

#### 2. Open Document (`/api/documents/open`)
- **Function**: `openDocument.ts`
- **Method**: POST
- **Purpose**: Opens existing documents for viewing or editing
- **Features**:
  - Local and online editor support
  - Document locking mechanism
  - Permission validation
  - Editor URL generation
  - Session tracking

#### 3. Unlock Document (`/api/documents/unlock`)
- **Function**: `unlockDocument.ts`
- **Method**: POST
- **Purpose**: Unlocks documents after editing sessions
- **Features**:
  - Automatic session cleanup
  - Force unlock for administrators
  - Permission validation
  - Audit trail

### Frontend Services

#### DocumentsService (`src/shared/api/documentsService.ts`)
- **Purpose**: Main service class for document operations
- **Methods**:
  - `createDocument()` - Create new documents
  - `openDocument()` - Open documents for editing/viewing
  - `unlockDocument()` - Unlock documents
  - `openMultipleDocuments()` - Bulk document opening
  - `cleanupEditingSessions()` - Automatic cleanup

#### Document Cleanup Hook (`src/shared/hooks/useDocumentCleanup.ts`)
- **Purpose**: Automatic session management and cleanup
- **Features**:
  - Browser close/refresh detection
  - Tab visibility monitoring
  - Network disconnection handling
  - Periodic cleanup
  - Memory leak prevention

## Integration Points

### Toolbar Component Updates
- Real API calls instead of demonstration code
- Error handling with user-friendly messages
- Progress indicators and loading states
- Bulk operations support
- Session tracking integration

### BaseDocumentsPage Updates
- Document operation handlers
- Session cleanup integration
- Error handling and user feedback
- State management integration

## Configuration

### Environment Variables Required
```env
# Azure Functions Configuration
API_BASE_URL=https://your-function-app.azurewebsites.net/api
EDITOR_BASE_URL=https://office.com/editor

# Azure Storage
AZURE_STORAGE_ACCOUNT=your-storage-account
AZURE_STORAGE_KEY=your-storage-key

# Cosmos DB
COSMOS_DB_ENDPOINT=https://your-cosmosdb.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmosdb-key

# Microsoft 365 Integration
M365_AUTHORITY_HOST=https://login.microsoftonline.com
M365_TENANT_ID=your-tenant-id
M365_CLIENT_ID=your-client-id
M365_CLIENT_SECRET=your-client-secret
```

## Document Types and Templates

### Supported Document Types
1. **Document** (.docx)
   - Blank Document
   - Business Letter
   - Report
   - Memo

2. **Spreadsheet** (.xlsx)
   - Blank Spreadsheet
   - Budget Tracker
   - Invoice
   - Timesheet

3. **Presentation** (.pptx)
   - Blank Presentation
   - Business Pitch
   - Quarterly Review
   - Training

4. **Form** (.html)
   - Blank Form
   - Survey
   - Application
   - Feedback

## Security Features

### Authentication
- Microsoft 365 On-Behalf-Of flow
- JWT token validation
- User context extraction

### Authorization
- Document-level permissions (owners, editors, viewers)
- Operation-based access control
- Tenant isolation

### Document Locking
- Edit conflict prevention
- Session-based locking
- Force unlock capabilities
- Lock timeout handling

## Error Handling

### Client-Side Error Handling
- Network connectivity issues
- Permission denied scenarios
- Document locked by other users
- Service unavailable conditions

### Server-Side Error Handling
- Input validation with Zod schemas
- Database operation errors
- Authentication failures
- Storage service errors

## Session Management

### Automatic Cleanup Triggers
- Browser/tab close detection
- Page visibility changes
- Network disconnections
- Periodic cleanup intervals
- Application focus loss

### Manual Cleanup
- Explicit unlock operations
- Force unlock for administrators
- Bulk cleanup operations

## Usage Examples

### Creating a New Document
```javascript
const response = await documentsService.createDocument({
  name: 'Annual Report 2024',
  type: 'document',
  template: 'report',
  description: 'Company annual report',
  metadata: {
    documentType: 'financial',
    period: 'Annual 2024'
  },
  openMode: 'online'
});
```

### Opening an Existing Document
```javascript
const response = await documentsService.openDocument({
  documentId: 'doc-12345',
  mode: 'online',
  action: 'edit'
});
```

### Bulk Document Operations
```javascript
const responses = await documentsService.openMultipleDocuments(
  ['doc-1', 'doc-2', 'doc-3'],
  'online',
  'edit'
);
```

## Monitoring and Logging

### Azure Functions Logging
- Request/response logging
- User action tracking
- Error logging with context
- Performance metrics

### Client-Side Monitoring
- User interaction tracking
- Error reporting
- Performance monitoring
- Session analytics

## Future Enhancements

### Planned Features
- Real-time collaboration indicators
- Document version history
- Advanced template management
- Custom editor integrations
- Enhanced security features

### Scalability Considerations
- Caching strategies
- Database optimization
- CDN integration for static assets
- Load balancing for high availability

## Troubleshooting

### Common Issues
1. **Document Won't Open**
   - Check user permissions
   - Verify document exists
   - Check network connectivity

2. **Lock Conflicts**
   - Use force unlock if authorized
   - Check lock timeout settings
   - Verify user session validity

3. **Template Loading Errors**
   - Verify template availability
   - Check storage service connection
   - Review template configuration

### Debug Information
- Enable detailed logging in development
- Use browser developer tools for network inspection
- Check Azure Function logs for server-side issues

## API Reference

### Create Document Endpoint
```
POST /api/documents/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "type": "document|spreadsheet|presentation|form",
  "template": "string",
  "description": "string",
  "metadata": { ... },
  "openMode": "local|online"
}
```

### Open Document Endpoint
```
POST /api/documents/open
Authorization: Bearer {token}
Content-Type: application/json

{
  "documentId": "string",
  "mode": "local|online",
  "action": "view|edit"
}
```

### Unlock Document Endpoint
```
POST /api/documents/unlock
Authorization: Bearer {token}
Content-Type: application/json

{
  "documentId": "string",
  "force": false
}
```

## Conclusion

The Azure Functions integration provides a robust, scalable foundation for document operations with proper security, session management, and error handling. The implementation follows Microsoft Azure best practices and provides seamless integration with Office 365 services.
