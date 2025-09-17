import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Avatar,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Text,
} from '@fluentui/react-components';
import {
  SearchRegular,
  AlertRegular,
  SettingsRegular,
  QuestionCircleRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  topNav: {
    background: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: tokens.shadow4,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    paddingLeft: '40px',
    width: '300px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: tokens.colorNeutralForeground3,
    zIndex: 1,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navIcon: {
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  notificationBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${tokens.colorBrandForeground1}, ${tokens.colorBrandForeground2})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorBrandBackground,
    fontWeight: '600',
    fontSize: '14px',
  },
});

export const TopNavigation: React.FC = () => {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <nav className={styles.topNav}>
      <div className={styles.navLeft}>
        <div className={styles.logo}>ClientPortal</div>
        <div className={styles.searchContainer}>
          <SearchRegular className={styles.searchIcon} />
          <Input
            className={styles.searchInput}
            placeholder="Search documents, clients, tasks..."
            value={searchTerm}
            onChange={handleSearchChange}
            appearance="outline"
          />
        </div>
      </div>
      <div className={styles.navRight}>
        <div className={styles.navIcon}>
          <AlertRegular />
          <div className={styles.notificationBadge}>3</div>
        </div>
        <div className={styles.navIcon}>
          <SettingsRegular />
        </div>
        <div className={styles.navIcon}>
          <QuestionCircleRegular />
        </div>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>JD</div>
          <Text>John Doe</Text>
        </div>
      </div>
    </nav>
  );
}; 