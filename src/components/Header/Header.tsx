import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Title2,
  Caption1,
  shorthands
} from '@fluentui/react-components';
import { 
  ChevronDownRegular, 
  SignOutRegular,
  SettingsRegular,
  EyeRegular,
  EyeOffRegular
} from '@fluentui/react-icons';
import { useApp } from '@/shared/lib/AppProvider';
import { UserAvatar } from '@/entities/user/ui/UserAvatar';
import { COMPANY_CONFIG } from '@/config/company';
import { SettingsMenu } from './SettingsMenu';
import { useDemoMode } from '@/shared/lib/demo';

const useStyles = makeStyles({
  header: {
    height: '52px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0', '24px'),
    position: 'sticky' as const,
    top: '0',
    zIndex: 100,
    width: '100%',
    boxSizing: 'border-box'
  },

  leftSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px')
  },

  companyName: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    letterSpacing: '0.5px'
  },

  rightSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px')
  },

  userProfile: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '16px'),
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'transparent',
    border: 'none',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    }
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    ...shorthands.gap('2px')
  },

  userName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase300
  },

  userEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase200
  },

  menuItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px')
  },

  '@media (max-width: 768px)': {
    header: {
      ...shorthands.padding('0', '16px'),
      height: '48px'
    },
    
    companyName: {
      fontSize: tokens.fontSizeBase400
    },

    userInfo: {
      display: 'none'
    }
  }
});

interface HeaderProps {
  companyName?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  companyName = COMPANY_CONFIG.name 
}) => {
  const styles = useStyles();
  const { currentUser, handleLogout: appLogout } = useApp();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const handleLogout = async () => {
    try {
      await appLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleToggleDemo = () => {
    if (!isDemoMode) {
      const confirmed = window.confirm(
        'Включить Demo режим?\n\nВсе ограничения доступа будут сняты для демонстрации функционала.'
      );
      if (confirmed) {
        toggleDemoMode();
      }
    } else {
      toggleDemoMode();
    }
  };



  const getUserDisplayName = () => {
    if (!currentUser) return 'User';
    return currentUser.displayName || `${currentUser.givenName || ''} ${currentUser.surname || ''}`.trim() || currentUser.mail || 'User';
  };

  const getUserEmail = () => {
    if (!currentUser) return '';
    return currentUser.mail || currentUser.userPrincipalName || '';
  };

  const mockUser = {
    id: 1,
    firstName: currentUser?.givenName || 'John',
    lastName: currentUser?.surname || 'Doe'
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Title2 className={styles.companyName}>
          {companyName}
        </Title2>
      </div>

      <div className={styles.rightSection}>
        {currentUser && (
          <Menu>
            <MenuTrigger>
              <Button 
                className={styles.userProfile}
                appearance="subtle"
                aria-label="User profile menu"
              >
                <UserAvatar user={mockUser} size={32} />
                <div className={styles.userInfo}>
                  <Text className={styles.userName}>
                    {getUserDisplayName()}
                  </Text>
                  <Caption1 className={styles.userEmail}>
                    {getUserEmail()}
                  </Caption1>
                </div>
                <ChevronDownRegular fontSize="16px" />
              </Button>
            </MenuTrigger>

            <MenuPopover>
              <MenuList>
                <SettingsMenu
                  trigger={
                    <MenuItem>
                      <div className={styles.menuItem}>
                        <SettingsRegular />
                        Settings
                      </div>
                    </MenuItem>
                  }
                />
                <MenuItem onClick={handleToggleDemo}>
                  <div className={styles.menuItem}>
                    {isDemoMode ? <EyeOffRegular /> : <EyeRegular />}
                    {isDemoMode ? 'Отключить Demo' : 'Включить Demo'}
                  </div>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <div className={styles.menuItem}>
                    <SignOutRegular />
                    Sign out
                  </div>
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
      </div>
    </header>
  );
};

export { Header };
