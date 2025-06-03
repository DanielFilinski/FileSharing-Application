import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { TeamsProvider } from '@/shared/lib/teams';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <TeamsProvider>
        <RouterProvider router={router} />
      </TeamsProvider>
    </FluentProvider>
  </React.StrictMode>
);

export {};