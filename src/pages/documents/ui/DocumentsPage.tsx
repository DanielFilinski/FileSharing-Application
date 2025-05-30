import React from 'react';
import { Title1 } from '@fluentui/react-components';

import { useTeamsContext } from '@/shared/lib/teams';
import { Document } from '@/entities/document';
import { DocumentList } from '@/widgets/documentList';

export const DocumentsPage: React.FC = () => {
  const { context } = useTeamsContext();

  // Здесь будет загрузка документов
  const documents: Document[] = [
    {
      id: '1',
      title: 'Тестовый документ',
      content: 'Содержание документа',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: 'user1'
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title1>Документы</Title1>
      <DocumentList documents={documents} />
    </div>
  );
}; 