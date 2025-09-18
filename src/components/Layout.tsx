import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '../app/navigation/Navigation';

export const Layout: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}; 