import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TeamsProvider } from '@/shared/lib/teams';
import { ThemeProvider } from './app/theme/ThemeProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <TeamsProvider>
        <RouterProvider router={router} />
      </TeamsProvider>
    </ThemeProvider>
  </React.StrictMode>
);

export {};