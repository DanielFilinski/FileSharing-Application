import { Layout } from '@/components/Layout';
import DmsMainScreen from '@/pages/documents/ui/DocumentsPage';
import ApprovalSettingsForm from '@/pages/settings/approval/Approval';
import OrganizationSettings from '@/pages/settings/organization/Organization';
import ValidationSettingsForm from '@/pages/settings/validation/Validation';
import { ToEndUser } from '@/app/pages/ToEndUser';
import { FromEndUser } from '@/app/pages/FromEndUser';
import { FirmUser } from '@/pages/settings/users/users-settings';
import { StorageSettings} from '@/pages/settings/storage/storage-settings';
import ClientSidePage from '@/pages/documents/ui/ClientSidePage';

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Leads } from '@/pages/leads/Leads';
import FirmSidePage from '@/pages/documents/ui/FirmSidePage';
import FirmSide2Page from '@/pages/documents/ui/FirmSide2Page';


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
        element: <ClientSidePage />,
      },
      {
        path: 'firm-side',
        element: <FirmSidePage/>,
      },
      {
        path: 'firm-side-2',
        element: <FirmSide2Page/>,
      },
      {
        path: 'favorites',
        element: <DmsMainScreen />,
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
        element: <ValidationSettingsForm />,
      },
      {
        path: 'settings/approval',
        element: <ApprovalSettingsForm />,
      },
      {
        path: 'to-end-user',
        element: <ClientSidePage />,
      },
      {
        path: 'from-end-user',
        element: <ClientSidePage />,
      },
      {
        path: 'leads',
        element: <Leads />,
      },
      {
        path: 'settings/users',
        element: <FirmUser />,
      },

    ],
  },
]);

export const Router: React.FC = () => {
  return <RouterProvider router={router} />;
}; 