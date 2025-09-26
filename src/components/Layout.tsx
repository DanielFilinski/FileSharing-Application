import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '../app/navigation/Navigation';
import { Header } from './Header';
import { COMPANY_CONFIG } from '@/config/company';

export const Layout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header companyName={COMPANY_CONFIG.name} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Navigation />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}; 