import React from 'react';
import { 
  PermissionGate, 
  Permission 
} from '@/shared/lib/rbac';
import { ScreenContainer } from '@/app/styles/layouts';
import { tokens } from '@fluentui/react-components';
import { UserManagementWidget } from '@/widgets/userManagement';

export const UsersSettings = () => {
  return (
    <PermissionGate 
      permissions={[Permission.USERS_VIEW]}
      fallback={
        <ScreenContainer>
          <div style={{ 
            padding: '48px 24px', 
            textAlign: 'center',
            color: tokens.colorNeutralForeground2
          }}>
            <h2>Access Denied</h2>
            <p>You don't have permission to manage users</p>
          </div>
        </ScreenContainer>
      }
    >
      <ScreenContainer>
        <UserManagementWidget />
      </ScreenContainer>
    </PermissionGate>
  );
};

// Альтернативный экспорт для совместимости с существующими импортами
export const FirmUser = UsersSettings;