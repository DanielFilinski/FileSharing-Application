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
      {/* Browser Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2d3142 0%, #4a4a5a 100%)',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ff5f57', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#28ca42', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '24px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#323130',
            padding: '8px 20px',
            borderRadius: '12px 12px 0 0',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            🛍️ MS Teams App Store
            <span style={{ cursor: 'pointer', opacity: '0.6', fontSize: '16px' }}>×</span>
          </div>
          <div style={{ color: '#ccc', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>+</div>
        </div>
        <div style={{ flex: 1, marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['‹', '›', '↻', '🏠'].map((symbol, i) => (
              <button key={i} style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '6px',
                color: '#ccc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {symbol}
              </button>
            ))}
          </div>
          <input 
            type="text" 
            value="localhost:3000/#" 
            readOnly
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#ccc',
              fontSize: '13px',
              minWidth: '320px',
              backdropFilter: 'blur(10px)'
            }}
          />
        </div>
      </div>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: '1px' }}>
        {/* Sidebar */}
        <div style={{
          width: '280px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          boxShadow: '2px 0 16px rgba(0, 0, 0, 0.05)',
          borderRadius: '0 16px 0 0'
        }}>
          <div style={{
            padding: '0 20px 20px',
            borderBottom: '1px solid rgba(237, 235, 233, 0.6)',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#323130', 
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #0078d4, #106ebe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Select End User
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 40px',
                  border: '1px solid rgba(138, 136, 134, 0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: '"Segoe UI", sans-serif',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  color: '#323130',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0078d4';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0, 120, 212, 0.2)';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(138, 136, 134, 0.3)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                }}
              />
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#605e5c',
                pointerEvents: 'none',
                fontSize: '16px'
              }}>
                🔍
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
            <div style={{ marginBottom: '16px' }}>
              <SidebarItem
                icon="📁"
                text="Storage"
                isActive={activeNavItem === 'Storage'}
                onClick={setActiveNavItem}
              >
                {null}
              </SidebarItem>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <SidebarItem
                icon={{ text: 'F', className: 'icon-f' }}
                text="Firm Side"
                isActive={activeNavItem === 'Firm Side'}
                onClick={setActiveNavItem}
              >
                {null}
              </SidebarItem>
              <SidebarItem
                icon={{ text: 'C', className: 'icon-c' }}
                text="Client Side"
                isActive={activeNavItem === 'Client Side'}
                onClick={setActiveNavItem}
              >
                <SidebarItem 
                  text="To End User" 
                  onClick={setActiveNavItem} 
                  hasIcon={false} 
                  isSubItem={true}
                  isActive={false}
                  icon=""
                >
                  {null}
                </SidebarItem>
                <SidebarItem 
                  text="From End User" 
                  onClick={setActiveNavItem} 
                  hasIcon={false} 
                  isSubItem={true}
                  isActive={false}
                  icon=""
                >
                  {null}
                </SidebarItem>
              </SidebarItem>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                padding: '8px 16px 12px', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#8a8886',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Settings
              </div>
              <SidebarItem
                icon={{ text: 'O', className: 'icon-o' }}
                text="Organization"
                isActive={activeNavItem === 'Organization'}
                onClick={setActiveNavItem}
              >
                {null}
              </SidebarItem>
              <SidebarItem
                icon={{ text: 'S', className: 'icon-s' }}
                text="Storage"
                isActive={activeNavItem === 'Storage Settings'}
                onClick={setActiveNavItem}
              >
                <SidebarItem 
                  text="Users" 
                  icon={{ text: 'U', className: 'icon-u' }}
                  onClick={setActiveNavItem}
                  isSubItem={true}
                  isActive={activeNavItem === 'Users'}
                >
                  {null}
                </SidebarItem>
                <SidebarItem 
                  text="Employees" 
                  icon={{ text: 'E', className: 'icon-e' }}
                  onClick={setActiveNavItem}
                  isSubItem={true}
                  isActive={activeNavItem === 'Employees'}
                >
                  {null}
                </SidebarItem>
              </SidebarItem>
              <SidebarItem
                icon={{ text: 'C', className: 'icon-clients' }}
                text="Clients"
                isActive={activeNavItem === 'Clients'}
                onClick={setActiveNavItem}
              >
                {null}
              </SidebarItem>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px 0 0 0',
          boxShadow: '-2px 0 16px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            padding: '24px 32px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9))',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px 0 0 0'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#323130', 
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #0078d4, #106ebe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Firm Side
            </div>
            <div style={{
              fontSize: '13px',
              color: '#605e5c',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '400'
            }}>
              <a href="#" style={{ color: '#0078d4', textDecoration: 'none' }}>Firm Side</a>
              <span style={{ color: '#c8c6c4' }}>›</span>
              <a href="#" style={{ color: '#0078d4', textDecoration: 'none' }}>To End User</a>
              <span style={{ color: '#c8c6c4' }}>›</span>
              <a href="#" style={{ color: '#0078d4', textDecoration: 'none' }}>Tax</a>
              <span style={{ color: '#c8c6c4' }}>›</span>
              <span>IRS Tax Form</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <ActionButton variant="primary" icon="+" onClick={() => {}}>
                  New ▼
                </ActionButton>
                <ActionButton variant="success" icon="📤" onClick={() => {}}>
                  Upload
                </ActionButton>
                <ActionButton icon="📋" onClick={() => {}}>
                  Edit in grid view
                </ActionButton>
                <ActionButton onClick={() => {}}>
                  Open ▼
                </ActionButton>
                <ActionButton icon="🔗" onClick={() => {}}>
                  Share
                </ActionButton>
                <ActionButton onClick={() => {}}>
                  ⋯
                </ActionButton>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                fontSize: '13px', 
                color: '#605e5c' 
              }}>
                <span style={{ 
                  color: '#323130', 
                  fontWeight: '600',
                  padding: '6px 12px',
                  background: 'rgba(0, 120, 212, 0.1)',
                  borderRadius: '16px',
                  fontSize: '12px'
                }}>
                  {selectedFiles.length} selected
                </span>
                <span>All Documents ▼</span>
                <span style={{ cursor: 'pointer' }}>❓</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              border: '1px solid rgba(225, 223, 221, 0.6)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 140px 160px 160px',
                gap: '16px',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, rgba(248, 247, 244, 0.8), rgba(243, 242, 241, 0.8))',
                backdropFilter: 'blur(10px)',
                fontSize: '12px',
                fontWeight: '600',
                color: '#323130',
                borderBottom: '1px solid rgba(225, 223, 221, 0.6)'
              }}>
                <div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Name
                  <span style={{ fontSize: '10px', color: '#8a8886' }}>▼</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Modified
                  <span style={{ fontSize: '10px', color: '#8a8886' }}>▼</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Created By
                  <span style={{ fontSize: '10px', color: '#8a8886' }}>▼</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Modified By
                  <span style={{ fontSize: '10px', color: '#8a8886' }}>▼</span>
                </div>
              </div>

              {files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 140px 160px 160px',
                    gap: '16px',
                    padding: '16px 24px',
                    borderBottom: file.id === files.length - 1 ? 'none' : '1px solid rgba(243, 242, 241, 0.6)',
                    alignItems: 'center',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: hoveredFile === file.id ? 'rgba(0, 120, 212, 0.03)' : 'transparent'
                  }}
                  onMouseEnter={() => setHoveredFile(file.id)}
                  onMouseLeave={() => setHoveredFile(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleFileSelect(file.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#0078d4',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' }}>
                    <div style={{ fontSize: '20px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
                      {getFileIcon(file.type)}
                    </div>
                    {file.name}
                  </div>
                  <div style={{ color: '#605e5c', fontSize: '13px' }}>{file.modified}</div>
                  <div style={{ color: '#605e5c', fontSize: '13px', fontWeight: '400' }}>{file.createdBy}</div>
                  <div style={{ color: '#605e5c', fontSize: '13px', fontWeight: '400' }}>{file.modifiedBy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .icon-f { background: linear-gradient(135deg, #0078d4, #106ebe); }
        .icon-c { background: linear-gradient(135deg, #8764b8, #7c5aa0); }
        .icon-o { background: linear-gradient(135deg, #ca5010, #b8490f); }
        .icon-s { background: linear-gradient(135deg, #038387, #027478); }
        .icon-u { background: linear-gradient(135deg, #8764b8, #7c5aa0); }
        .icon-e { background: linear-gradient(135deg, #486991, #3f5a7a); }
        .icon-clients { background: linear-gradient(135deg, #004578, #003c6b); }
      `}</style>
    </div>
  );
};

export default FirmSideInterface;