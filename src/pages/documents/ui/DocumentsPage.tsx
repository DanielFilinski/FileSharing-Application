import BaseDocumentsPage, { Document } from './BaseDocumentsPage';

// Специфичные документы для обычной страницы
const userDocuments: Document[] = [
  { key: '1', name: 'Personal Notes.docx', modified: '2 days ago', createdBy: 'John Smith', modifiedBy: 'Jane Doe', owner: 'me', shared: false, status: 'Active', lock: false, clientEmail: 'john.smith@company.com' },
  { key: '2', name: 'Meeting Notes.docx', modified: '1 week ago', createdBy: 'Alice Johnson', modifiedBy: 'Bob Wilson', owner: 'me', shared: true, status: 'pending validation', lock: false, clientEmail: 'alice.johnson@client.com' },
  { key: '3', name: 'Personal Budget.xlsx', modified: '3 days ago', createdBy: 'Mike Brown', modifiedBy: 'Sarah Davis', owner: 'me', shared: false, status: 'validation in process', lock: false, clientEmail: 'mike.brown@enterprise.com' },
];

export default function DocumentsPage() {
  return (
    <BaseDocumentsPage 
      initialDocuments={userDocuments}
      showAccessControl={false}
    />
  );
}
