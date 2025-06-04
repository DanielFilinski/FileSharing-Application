import React from 'react';
import { Shield, Save } from 'lucide-react';

interface HeaderProps {
  onSave: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSave }) => {
  return (
    <div className="header">
      <div className="header-left">
        <Shield className="header-icon" size={20} />
        <h1 className="header-title">Validation Settings</h1>
      </div>
      <button className="save-button" onClick={onSave}>
        <Save size={16} className="mr-1.5" />
        Save changes
      </button>
    </div>
  );
}; 