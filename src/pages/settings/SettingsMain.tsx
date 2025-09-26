import React from 'react';
import {
  makeStyles,
  tokens,
  Title2,
  Card,
  CardHeader,
  CardFooter,
  Button,
  Text,
  Caption1,
  shorthands
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Organization24Regular,
  Storage24Regular,
  People24Regular,
  Shield24Regular,
  CheckmarkCircle24Regular,
  EyeRegular,
  LockClosedRegular,
  ChevronRightRegular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { 
  usePermissions,
  Permission,
  SettingsGuard 
} from '@/shared/lib/rbac';
import { useDemoMode } from '@/shared/lib/demo';
import { DemoModeToggle } from '@/shared/ui/DemoModeToggle';
import { ScreenContainer } from '@/app/styles/layouts';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },

  headerContent: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },

  title: {
    color: tokens.colorNeutralForeground1,
  },

  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    ...shorthands.gap('24px'),
  },

  settingCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    
    '&:hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    }
  },

  disabledCard: {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: tokens.colorNeutralBackground3,
    
    '&:hover': {
      boxShadow: 'none',
      transform: 'none',
    }
  },

  cardIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },

  disabledIcon: {
    color: tokens.colorNeutralForeground3,
  },

  cardContent: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px',
  },

  cardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },

  chevron: {
    color: tokens.colorNeutralForeground3,
    fontSize: '16px',
  },

  accessStatus: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },

  accessGranted: {
    color: tokens.colorPaletteGreenForeground2,
  },

  accessDenied: {
    color: tokens.colorPaletteRedForeground2,
  },

  demoToggleSection: {
    marginBottom: '24px',
  },

  '@media (max-width: 768px)': {
    cardsGrid: {
      gridTemplateColumns: '1fr',
    },
  }
});

interface SettingCardData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  route: string;
  permission: Permission;
}

export const SettingsMain: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { isDemoMode } = useDemoMode();
  
  // Debug: логируем состояние demo режима (можно убрать после тестирования)
  // React.useEffect(() => {
  //   console.log('🎭 SettingsMain - Demo Mode:', isDemoMode);
  //   console.log('📋 Permission checks:');
  //   console.log('- ORG_SETTINGS:', hasPermission(Permission.ORG_SETTINGS));
  //   console.log('- USERS_VIEW:', hasPermission(Permission.USERS_VIEW));
  //   console.log('- STORAGE_CONFIG:', hasPermission(Permission.STORAGE_CONFIG));
  //   console.log('- VALIDATION_CONFIG:', hasPermission(Permission.VALIDATION_CONFIG));
  //   console.log('- APPROVAL_CONFIG:', hasPermission(Permission.APPROVAL_CONFIG));
  // }, [isDemoMode, hasPermission]);

  const settingsCards: SettingCardData[] = [
    {
      id: 'organization',
      title: 'Organization Settings',
      description: 'General settings, offices and organizational structure',
      icon: <Organization24Regular className={styles.cardIcon} />,
      route: '/settings/organization',
      permission: Permission.ORG_SETTINGS,
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Users, roles and access permissions',
      icon: <People24Regular className={styles.cardIcon} />,
      route: '/settings/users',
      permission: Permission.USERS_VIEW,
    },
    {
      id: 'storage',
      title: 'Storage Settings',
      description: 'Document storage system configuration',
      icon: <Storage24Regular className={styles.cardIcon} />,
      route: '/settings/storage',
      permission: Permission.STORAGE_CONFIG,
    },
    {
      id: 'validation',
      title: 'Validation Settings',
      description: 'Document validation rules and processes',
      icon: <Shield24Regular className={styles.cardIcon} />,
      route: '/settings/validation',
      permission: Permission.VALIDATION_CONFIG,
    },
    {
      id: 'approval',
      title: 'Approval Settings',
      description: 'Document approval and signing processes',
      icon: <CheckmarkCircle24Regular className={styles.cardIcon} />,
      route: '/settings/approval',
      permission: Permission.APPROVAL_CONFIG,
    },
  ];

  const handleCardClick = (card: SettingCardData) => {
    const hasAccess = hasPermission(card.permission);
    
    if (hasAccess) {
      navigate(card.route);
    }
  };

  const renderSettingCard = (card: SettingCardData) => {
    const hasAccess = hasPermission(card.permission);
    
    return (
      <Card
        key={card.id}
        className={`${styles.settingCard} ${!hasAccess ? styles.disabledCard : ''}`}
        onClick={() => handleCardClick(card)}
      >
        <CardHeader>
          <div className={styles.cardContent}>
            <div className={!hasAccess ? styles.disabledIcon : ''}>
              {card.icon}
            </div>
            
            <div className={styles.cardText}>
              <div className={styles.cardTitle}>
                {card.title}
              </div>
              <Caption1 className={styles.cardDescription}>
                {card.description}
              </Caption1>
              
              <div className={styles.accessStatus}>
                {hasAccess ? (
                  <>
                    <EyeRegular fontSize="12px" />
                    <Text className={styles.accessGranted}>Available</Text>
                  </>
                ) : (
                  <>
                    <LockClosedRegular fontSize="12px" />
                    <Text className={styles.accessDenied}>Restricted</Text>
                  </>
                )}
              </div>
            </div>
            
            {hasAccess && (
              <ChevronRightRegular className={styles.chevron} />
            )}
          </div>
        </CardHeader>
      </Card>
    );
  };

  return (
    <SettingsGuard
      fallback={
        <ScreenContainer>
          <div style={{ 
            padding: '48px 24px', 
            textAlign: 'center',
            color: tokens.colorNeutralForeground2
          }}>
            <h2>Settings Access Restricted</h2>
            <p>You don't have permission to access the settings section</p>
          </div>
        </ScreenContainer>
      }
    >
      <ScreenContainer>
        
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <Settings24Regular fontSize="32px" />
              <Title2 className={styles.title}>System Settings</Title2>
            </div>
          </div>

          <div className={styles.demoToggleSection}>
            <DemoModeToggle 
              showQuickActions={true}
              showWarning={false}
            />
          </div>

          <div className={styles.cardsGrid}>
            {settingsCards.map(renderSettingCard)}
          </div>
        </div>
      </ScreenContainer>
    </SettingsGuard>
  );
};
