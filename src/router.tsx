import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DmsMainScreen from './pages/documents/ui/DocumentsPage';
import FirmSideInterface from './pages/main/MainScreen';
import ApprovalSettingsForm from './pages/settings/Approval';
import OrganizationSettings from './pages/settings/Organization';
import StorageSettings from './pages/settings/Storage';
import ValidationSettings from './pages/settings/Validation';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DmsMainScreen />,
    children: [
      {
        path: 'client-side',
        element: <DmsMainScreen />,
      },
      {
        path: 'firm-side',
        element: <FirmSideInterface />,
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