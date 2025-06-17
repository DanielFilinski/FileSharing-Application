import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Divider,
  Button,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Text,
  shorthands,
  mergeClasses
} from '@fluentui/react-components';
import {
  NavigationRegular,
  SearchRegular,
  ChevronRightRegular,
  Dismiss24Regular,
  WeatherSunnyRegular,
  WeatherMoonFilled,
  WeatherSunnyFilled
} from '@fluentui/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_GROUPS } from './constants';
import { useTheme } from '../theme/ThemeProvider';

// Teams-compliant styles using 4px grid system
const useStyles = makeStyles({
  // Desktop navigation
  navigation: {
    width: '240px',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('16px', '12px'),
    boxSizing: 'border-box',
    '@media (max-width: 768px)': {
      display: 'none'
    }
  },

  // Mobile menu button
  mobileMenuButton: {
    display: 'none',
    position: 'fixed',
    top: '16px',
    left: '16px',
    zIndex: 1001,
    backgroundColor: '#9333EA', // Brand color
    color: tokens.colorNeutralForegroundOnBrand,
    border: 'none',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#7c3aed',
    },
    '@media (max-width: 768px)': {
      display: 'flex'
    }
  },

  // Header section
  header: {
    marginBottom: '20px'
  },

  headerTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: '12px'
  },

  // Navigation groups
  navGroup: {
    marginBottom: '24px'
  },

  groupTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },

  // Navigation items
  navItem: {
    width: '100%',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    ...shorthands.padding('8px', '12px'),
    marginBottom: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    }
  },

  navItemSelected: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    }
  },

  navItemContent: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    ...shorthands.gap('12px')
  },

  navItemText: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    flex: 1,
    textAlign: 'left' as const
  },

  // Submenu items
  subNavItem: {
    ...shorthands.padding('6px', '12px', '6px', '44px'), // Indented
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular
  },

  // Avatar for top-level items
  navAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    minWidth: '32px' // Prevent shrinking
  },

  // Mobile drawer
  mobileDrawer: {
    '@media (min-width: 769px)': {
      display: 'none'
    }
  },

  drawerContent: {
    ...shorthands.padding('0', '16px')
  },

  themeToggle: {
    marginTop: 'auto',
    marginBottom: '16px',
    width: '100%',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    ...shorthands.padding('8px', '12px'),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    }
  },

  themeToggleContent: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    ...shorthands.gap('12px')
  }
});

type NavLink = {
  name: string;
  url?: string;
  key: string;
  icon?: string;
  links?: NavLink[];
  linkName?: string;
};

interface NavigationProps {
  onNavItemSelect?: (key: string) => void;
  selectedItem?: string;
}

const Navigation: React.FC<NavigationProps> = ({ 
  onNavItemSelect,
  selectedItem 
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['dms', 'storage']);
  
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentSelected = () => {
    if (selectedItem) return selectedItem;
    
    // Determine selected item from current route
    const path = location.pathname;
    if (path.includes('/client-side')) return 'dms';
    if (path.includes('/firm-side')) return 'portal';
    if (path.includes('/settings/organization')) return 'org';
    if (path.includes('/settings/storage')) return 'storage';
    if (path.includes('/settings/validation')) return 'validation';
    if (path.includes('/settings/approval')) return 'approval';
    if (path.includes('/to-end-user')) return 'toenduser';
    if (path.includes('/from-end-user')) return 'fromenduser';
    if (path.includes('/users')) return 'users';
    if (path.includes('/employees')) return 'employees';
    return 'dms'; // Default
  };

  const handleNavigation = (link: NavLink) => {
    const { key } = link;
    
    // Call external handler if provided
    onNavItemSelect?.(key);
    
    // Close mobile menu
    setIsMobileMenuOpen(false);
    
    // Handle navigation
    switch (key) {
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
      case 'toenduser':
        navigate('/to-end-user');
        break;
      case 'fromenduser':
        navigate('/from-end-user');
        break;
      case 'users':
        navigate('/users');
        break;
      case 'employees':
        navigate('/employees');
        break;
      default:
        navigate('/');
    }
  };

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) 
        ? prev.filter(item => item !== key)
        : [...prev, key]
    );
  };

  const renderNavItem = (link: NavLink, level = 0) => {
    const currentSelected = getCurrentSelected();
    const isSelected = currentSelected === link.key;
    const isExpanded = expandedItems.includes(link.key);
    const hasChildren = link.links && link.links.length > 0;

    const itemClasses = mergeClasses(
      styles.navItem,
      level > 0 && styles.subNavItem,
      isSelected && styles.navItemSelected
    );

    return (
      <div key={link.key}>
        <Button
          className={itemClasses}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(link.key);
            }
            handleNavigation(link);
          }}
          appearance="subtle"
        >
          <div className={styles.navItemContent}>
            {level === 0 && (
              <div className={styles.navAvatar}>
                {link.name.charAt(0)}
              </div>
            )}
            <Text className={styles.navItemText}>
              {link.name}
            </Text>
            {hasChildren && (
              <ChevronRightRegular 
                style={{ 
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  fontSize: '16px'
                }}
              />
            )}
          </div>
        </Button>

        {hasChildren && isExpanded && (
          <div style={{ marginTop: '4px' }}>
            {link.links?.map((subLink: NavLink) => renderNavItem(subLink, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const NavigationContent = () => (
    <>
      <div className={styles.header}>
        <Text className={styles.headerTitle}>
          <SearchRegular />
          Select End User
        </Text>
        <Divider />
      </div>

      {NAV_GROUPS.map(group => (
        <div key={group.title} className={styles.navGroup}>
          <Text className={styles.groupTitle}>
            {group.title}
          </Text>
          {group.links.map(link => renderNavItem(link))}
        </div>
      ))}

      <Button
        className={styles.themeToggle}
        onClick={() => toggleTheme()}
        appearance="subtle"
      >
        <div className={styles.themeToggleContent}>
          {isDark ? <WeatherSunnyFilled /> : <WeatherMoonFilled />}
          <Text className={styles.navItemText}>
            {isDark ? 'Light theme' : 'Dark theme'}
          </Text>
        </div>
      </Button>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button 
        className={styles.mobileMenuButton}
        icon={<NavigationRegular />}
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Open navigation menu"
        appearance="primary"
      />

      {/* Desktop navigation */}
      <nav className={styles.navigation} role="navigation" aria-label="Main navigation">
        <NavigationContent />
      </nav>

      {/* Mobile navigation drawer */}
      <Drawer
        type="overlay"
        open={isMobileMenuOpen}
        onOpenChange={(_, data) => setIsMobileMenuOpen(data.open)}
        className={styles.mobileDrawer}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close navigation"
                icon={<Dismiss24Regular />}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            }
          >
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.drawerContent}>
            <NavigationContent />
          </div>
        </DrawerBody>
      </Drawer>
    </>
  );
};

export { Navigation };