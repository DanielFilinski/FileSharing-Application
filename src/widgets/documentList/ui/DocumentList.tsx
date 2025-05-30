import React from 'react';
import { Card, CardHeader, CardPreview, CardFooter, Text, Button } from '@fluentui/react-components';
import { Document } from '@/entities/document';
import { useDocumentApproval } from '@/features/documentApproval';

interface DocumentListProps {
  documents: Document[];
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  return (
    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
};

const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
  const { approve, reject } = useDocumentApproval(document.id);

  return (
    <Card>
      <CardHeader>
        <Text weight="semibold">{document.title}</Text>
      </CardHeader>
      <CardPreview>
        <div style={{ padding: '16px' }}>
          <Text>{document.content}</Text>
        </div>
      </CardPreview>
      <CardFooter>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={approve}>Утвердить</Button>
          <Button onClick={reject}>Отклонить</Button>
        </div>
      </CardFooter>
    </Card>
  );
}; 