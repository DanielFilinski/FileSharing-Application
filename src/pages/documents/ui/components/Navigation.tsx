import React from 'react';
import { makeStyles, tokens, Divider } from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';
import { NAV_GROUPS } from '../../constants';
import { useNavigate, useLocation } from 'react-router-dom';

const useStyles = makeStyles({
  nav: {
    width: '220px',
    height: '100vh',
    boxSizing: 'border-box',
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '0px 8px 0px 8px',
  },
  navItem: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    }
  },
  selected: {
    backgroundColor: tokens.colorNeutralBackground3,
  }
});

type NavLink = {
  name: string;
  url: string;
  key: string;
  icon?: string;
  links?: NavLink[];
};

interface NavigationProps {
  onNavItemSelect: (key: string) => void;
  selectedItem: string;
}

const Navigation: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const renderNavLink = (link: NavLink, level = 0): JSX.Element => {
    const isSelected = location.pathname.includes(link.key);
    
    const handleClick = () => {
      switch (link.key) {
        case 'dms':
          navigate('/client-side');
          break;
        case 'portal':
          navigate('/firm-side');
          break;
        case 'org':
          navigate('/settings/organization');
          break;
        case 'storage':
          navigate('/settings/storage');
          break;
        case 'validation':
          navigate('/settings/validation');
          break;
        case 'approval':
          navigate('/settings/approval');
          break;
        default:
          navigate('/');
      }
    };
    
    return (
      <div key={link.key}>
        <div 
          className={`${styles.navItem} ${isSelected ? styles.selected : ''}`}
          style={{ display: 'flex', alignItems: 'center', margin: '4px 0', padding: '8px', borderRadius: '4px' }}
          onClick={handleClick}
        >
          {level === 0 && (
            <div style={{
              width: 32, height: 32, borderRadius: 6, background: '#E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, fontWeight: 600, color: '#374151'
            }}>
              {link.name[0]}
            </div>
          )}
          <span style={{ fontWeight: level === 0 ? 600 : 400, paddingLeft: level > 0 ? 40 : 0 }}>{link.name}</span>
        </div>
        {link.links && (
          <div style={{ marginLeft: 0 }}>
            {link.links.map(child => renderNavLink(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.nav}>
      <div style={{ fontWeight: 600, fontSize: 18, margin: '16px 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Select End User <SearchRegular />
      </div>
      <div>
        <Divider />
      </div>
      
      {NAV_GROUPS.map(group => (
        <div key={group.title} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, margin: '16px 0 10px 0px', color: '#111827' }}>{group.title}</div>
          {group.links.map(link => renderNavLink(link))}
          <div style={{ borderBottom: '1px solid #E5E7EB', margin: '12px 0' }} />
        </div>
      ))}
    </div>
  );
};

export { Navigation }; 