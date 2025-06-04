import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface AlertProps {
  type: 'purple' | 'blue' | 'success';
  title?: string;
  message: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  icon
}) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return <Check size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getClassName = () => {
    switch (type) {
      case 'purple':
        return 'alert-purple';
      case 'blue':
        return 'alert-blue';
      case 'success':
        return 'alert-success';
      default:
        return '';
    }
  };

  const getIconClassName = () => {
    switch (type) {
      case 'success':
        return 'alert-success-icon';
      default:
        return 'alert-icon';
    }
  };

  return (
    <div className="alert">
      <div className={getClassName()} style={{ display: 'flex' }}>
        <div className={getIconClassName()}>
          {getIcon()}
        </div>
        <div>
          {title && <h3 className="font-medium">{title}</h3>}
          <p className={title ? "text-sm mt-1" : ""}>{message}</p>
        </div>
      </div>
    </div>
  );
}; 