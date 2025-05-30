import React from 'react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { TeamsProvider } from '@/shared/lib/teams';
import DocumentsPage from '@/pages/documents/ui/DocumentsPage';



export const App: React.FC = () => {
  return (
    <FluentProvider theme={webLightTheme}>
      <TeamsProvider>
        <DocumentsPage />
      </TeamsProvider>
    </FluentProvider>
  );
}; 