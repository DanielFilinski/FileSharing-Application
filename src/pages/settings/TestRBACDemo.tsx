import React from 'react';
import {
  makeStyles,
  tokens,
  Title2,
  Button,
  Text,
  Card,
  CardHeader,
  shorthands
} from '@fluentui/react-components';
import { 
  usePermissions,
  Permission,
  UserRole 
} from '@/shared/lib/rbac';
import { useDemoMode } from '@/shared/lib/demo';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },

  testCard: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
  },

  permissionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('16px'),
    marginBottom: '8px',
  },

  granted: {
    color: tokens.colorPaletteGreenForeground2,
  },

  denied: {
    color: tokens.colorPaletteRedForeground2,
  },

  demoButton: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
  }
});

export const TestRBACDemo: React.FC = () => {
  const styles = useStyles();
  const { 
    hasPermission, 
    hasRole, 
    userRoles 
  } = usePermissions();
  
  const { 
    isDemoMode, 
    toggleDemoMode,
    hasFullAccess 
  } = useDemoMode();

  const permissions = [
    { name: 'Organization Settings', permission: Permission.ORG_SETTINGS },
    { name: 'User Management', permission: Permission.USERS_VIEW },
    { name: 'Storage Config', permission: Permission.STORAGE_CONFIG },
    { name: 'Validation Config', permission: Permission.VALIDATION_CONFIG },
    { name: 'Approval Config', permission: Permission.APPROVAL_CONFIG },
  ];

  const roles = [
    { name: 'Organization Owner', role: UserRole.ORGANIZATION_OWNER },
    { name: 'Administrator', role: UserRole.ADMINISTRATOR },
    { name: 'Regular Employee', role: UserRole.REGULAR_EMPLOYEE },
  ];

  return (
    <div className={styles.container}>
      <Title2>RBAC & Demo Mode Test</Title2>
      
      <Card className={styles.testCard}>
        <CardHeader>
          <Text size={400} weight="semibold">Demo Mode Status</Text>
        </CardHeader>
        
        <div style={{ padding: '16px 0' }}>
          <Text>Demo Mode: {isDemoMode ? '✅ ON' : '❌ OFF'}</Text><br />
          <Text>Full Access: {hasFullAccess ? '✅ YES' : '❌ NO'}</Text><br />
          <Text>Current Roles: {userRoles.join(', ') || 'None'}</Text>
          
          <Button 
            className={isDemoMode ? styles.demoButton : undefined}
            onClick={toggleDemoMode}
            style={{ marginTop: '16px' }}
          >
            {isDemoMode ? 'Disable Demo' : 'Enable Demo'}
          </Button>
        </div>
      </Card>

      <Card className={styles.testCard}>
        <CardHeader>
          <Text size={400} weight="semibold">Permission Tests</Text>
        </CardHeader>
        
        <div style={{ padding: '16px 0' }}>
          {permissions.map((perm, index) => (
            <div key={index} className={styles.permissionItem}>
              <Text>{perm.name}</Text>
              <Text className={hasPermission(perm.permission) ? styles.granted : styles.denied}>
                {hasPermission(perm.permission) ? '✅ GRANTED' : '❌ DENIED'}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      <Card className={styles.testCard}>
        <CardHeader>
          <Text size={400} weight="semibold">Role Tests</Text>
        </CardHeader>
        
        <div style={{ padding: '16px 0' }}>
          {roles.map((roleTest, index) => (
            <div key={index} className={styles.permissionItem}>
              <Text>{roleTest.name}</Text>
              <Text className={hasRole(roleTest.role) ? styles.granted : styles.denied}>
                {hasRole(roleTest.role) ? '✅ HAS ROLE' : '❌ NO ROLE'}
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
