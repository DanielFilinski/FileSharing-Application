import React from 'react';
import BaseDocumentsPage, { Document } from './BaseDocumentsPage';

// Специфичные документы для клиентской страницы
const clientDocuments: Document[] = [
  { key: '1', name: 'Contract Agreement.pdf', modified: '2 days ago', createdBy: 'John Smith', modifiedBy: 'Jane Doe', owner: 'me', shared: false, status: 'pending validation', lock: false, clientEmail: 'client@example.com' },
  { key: '2', name: 'Invoice 2024-001.pdf', modified: '1 week ago', createdBy: 'Alice Johnson', modifiedBy: 'Bob Wilson', owner: 'me', shared: true, status: 'validation in process', lock: false, clientEmail: 'client@example.com' },
  { key: '3', name: 'Project Requirements.docx', modified: '3 days ago', createdBy: 'Mike Brown', modifiedBy: 'Sarah Davis', owner: 'me', shared: false, status: 'pending review', lock: false, clientEmail: 'client@example.com' },
  { key: '4', name: 'Financial Report.xlsx', modified: '5 days ago', createdBy: 'Emma Wilson', modifiedBy: 'Tom Clark', owner: 'other', shared: true, status: 'Active', lock: false, clientEmail: 'client@example.com' },
];

export default function ClientSidePage() {
  return (
    <BaseDocumentsPage
      initialDocuments={clientDocuments}
      showAccessControl={false}
      customToolbarProps={{
        showBulkActions: false,
        showAdvancedFilters: false,
      }}
      customTableProps={{
        showAccessControl: false,
        showBulkSelection: false,
        showAdvancedColumns: false,
      }}
    />
  );
} 