import { Layout } from '@/components/Layout';
import DmsMainScreen from '@/pages/documents/ui/DocumentsPage';
import ApprovalSettingsForm from '@/pages/settings/approval/Approval';
import OrganizationSettings from '@/pages/settings/organization/Organization';
import StorageSettings from '@/pages/settings/storage/Storage';
import ValidationSettingsForm from '@/pages/settings/validation/Validation';
import { ToEndUser } from '@/app/pages/ToEndUser';
import { FromEndUser } from '@/app/pages/FromEndUser';
import { Users } from '@/app/pages/Users';
import { Employees } from '@/app/pages/Employees';
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';


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
        element: <ValidationSettingsForm />,
      },
      {
        path: 'settings/approval',
        element: <ApprovalSettingsForm />,
      },
      {
        path: 'to-end-user',
        element: <ToEndUser />,
      },
      {
        path: 'from-end-user',
        element: <FromEndUser />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'employees',
        element: <Employees />,
      },
    ],
  },
]);

export const Router: React.FC = () => {
  return <RouterProvider router={router} />;
}; 