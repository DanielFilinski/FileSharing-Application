import React, { useState, Dispatch, SetStateAction } from 'react';

interface SidebarItemProps {
  icon?: string | { text: string; className: string };
  text: string;
  isActive: boolean;
  onClick: Dispatch<SetStateAction<string>>;
  children?: React.ReactNode;
  hasIcon?: boolean;
  isSubItem?: boolean;
}

interface ActionButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success';
  onClick: () => void;
  icon?: string;
}

interface File {
  id: number;
  name: string;
  type: string;
  size: string;
  modified: string;
}

const FirmSideInterface = () => {
  const [selectedFiles, setSelectedFiles] = useState([2]); // Trial Balance.xlsx is pre-selected
  const [activeNavItem, setActiveNavItem] = useState('Storage');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);

  const files = [
    { id: 0, name: 'Book.xlsx', type: 'excel', modified: 'April 11', createdBy: 'AZMAT HUSSAIN', modifiedBy: 'AZMAT HUSSAIN' },
    { id: 1, name: 'Contract.docx', type: 'word', modified: 'April 4', createdBy: 'AZMAT HUSSAIN', modifiedBy: 'AZMAT HUSSAIN' },
    { id: 2, name: 'Trial Balance.xlsx', type: 'excel', modified: 'April 21', createdBy: 'AZMAT HUSSAIN', modifiedBy: 'AZMAT HUSSAIN' },
    { id: 3, name: 'Trial Balance1.xlsx', type: 'excel', modified: 'April 4', createdBy: 'AZMAT HUSSAIN', modifiedBy: 'AZMAT HUSSAIN' }
  ];

  const handleFileSelect = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const getFileIcon = (type: string) => {
    return type === 'excel' ? '📊' : '📄';
  };

  const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, isActive, onClick, children, hasIcon = true, isSubItem = false }) => (
    <div>
      <div 
        className={`sidebar-item ${isActive ? 'active' : ''} ${isSubItem ? 'sub-item' : ''}`}
        onClick={() => onClick(text)}
        style={{
          padding: '8px 12px',
          marginBottom: '4px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          background: isActive ? 'rgba(0, 120, 212, 0.1)' : 'transparent'
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(0, 120, 212, 0.05)';
            e.currentTarget.style.transform = 'translateX(2px)';
          }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
          }
        }}
      >
        {hasIcon && icon && (
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px',
            color: 'white',
            fontSize: '14px',
            ...(typeof icon === 'string' ? {} : { background: icon.className })
          }}>
            {typeof icon === 'string' ? icon : icon.text}
          </div>
        )}
        <span style={{ fontSize: '14px' }}>{text}</span>
      </div>
      {children}
    </div>
  );

  const ActionButton: React.FC<ActionButtonProps> = ({ children, variant = 'default', onClick, icon }) => {
    const getButtonStyles = () => {
      const baseStyles = {
        padding: '10px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: '"Segoe UI", sans-serif',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '36px',
        border: 'none',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      };

      switch (variant) {
        case 'primary':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #0078d4, #106ebe)',
            color: 'white',
          };
        case 'success':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #107c10, #0e6e0e)',
            color: 'white',
          };
        default:
          return {
            ...baseStyles,
            background: 'white',
            color: '#323130',
            border: '1px solid rgba(138, 136, 134, 0.3)',
          };
      }
    };

    return (
      <button
        style={getButtonStyles()}
        onClick={onClick}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (variant === 'primary') {
            e.currentTarget.style.background = 'linear-gradient(135deg, #106ebe, #005a9e)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 120, 212, 0.3)';
          } else if (variant === 'success') {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0e6e0e, #0c5a0c)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 124, 16, 0.3)';
          } else {
            e.currentTarget.style.background = '#f8f7f4';
            e.currentTarget.style.borderColor = '#605e5c';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (variant === 'primary') {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0078d4, #106ebe)';
          } else if (variant === 'success') {
            e.currentTarget.style.background = 'linear-gradient(135deg, #107c10, #0e6e0e)';
          } else {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = 'rgba(138, 136, 134, 0.3)';
          }
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        }}
      >
        {icon && <span>{icon}</span>}
        {children}
      </button>
    );
  };

  return (
    <div style={{
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: '#323130',
      fontSize: '14px'
    }}>
      
    </div>
  );
};

export default FirmSideInterface;