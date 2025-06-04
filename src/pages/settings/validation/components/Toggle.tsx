import React from 'react';
import { Shield } from 'lucide-react';

interface ToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}

export const Toggle: React.FC<ToggleProps> = ({
  title,
  description,
  checked,
  onChange,
  icon = <Shield size={18} />
}) => {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">
          <span className="icon-wrapper">
            {icon}
          </span>
          <div>
            <h2 className="title-text">{title}</h2>
            <p className="subtitle">{description}</p>
          </div>
        </div>
        <div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={checked} 
              onChange={onChange} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}; 