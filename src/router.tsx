import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DmsMainScreen from './pages/documents/ui/DocumentsPage';
import ApprovalSettingsForm from './pages/settings/Approval';
import OrganizationSettings from './pages/settings/Organization';
import StorageSettings from './pages/settings/Storage';
import ValidationSettings from './pages/settings/Validation';
import { Layout } from './components/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <DmsMainScreen />,
      },
      {
        path: 'client-side',
        element: <DmsMainScreen />,
      },
      {
        path: 'firm-side',
        element: <DmsMainScreen/>,
      },
      {
        path: 'settings/organization',
        element: <OrganizationSettings />,
      },
      {
        path: 'settings/storage',
        element: <StorageSettings />,
      },
      {
        path: 'settings/validation',
        element: <ValidationSettings />,
      },
      {
        path: 'settings/approval',
        element: <ApprovalSettingsForm />,
      },
    ],
  },
]);

export const Router: React.FC = () => {
  return <RouterProvider router={router} />;
}; 