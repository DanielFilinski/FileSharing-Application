import React from 'react';
import {
  Dropdown,
  Option,
  Field,
  Label,
  makeStyles,
  tokens,
  Badge
} from '@fluentui/react-components';
import { 
  UserRole, 
  ROLE_DEFINITIONS, 
  getRoleDisplayName, 
  getRoleIcon 
} from '@/shared/lib/rbac';
import { RoleSelectorProps } from '../model/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  selectedRoles: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  roleOption: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  roleIcon: {
    fontSize: '16px',
  },
  roleInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  roleName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  roleDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRoles,
  availableRoles,
  onRoleChange,
  disabled = false,
  multiple = true,
}) => {
  const styles = useStyles();

  const handleSelectionChange = (event: any, data: any) => {
    if (multiple) {
      const newRoles = data.selectedOptions;
      onRoleChange(newRoles);
    } else {
      const role = data.selectedOptions[0];
      onRoleChange(role ? [role] : []);
    }
  };

  const renderRoleOption = (role: UserRole) => {
    const roleData = ROLE_DEFINITIONS[role];
    
    return (
      <div className={styles.roleOption}>
        <span className={styles.roleIcon}>{getRoleIcon(role)}</span>
        <div className={styles.roleInfo}>
          <span className={styles.roleName}>{getRoleDisplayName(role)}</span>
          <span className={styles.roleDescription}>
            {roleData?.description || ''}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Field>
        <Label>Роли пользователя</Label>
        <Dropdown
          multiselect={multiple}
          value={selectedRoles.map(role => getRoleDisplayName(role)).join(', ')}
          selectedOptions={selectedRoles}
          onSelectionChange={handleSelectionChange}
          disabled={disabled}
          placeholder="Выберите роли..."
        >
          {availableRoles.map((role) => (
            <Option key={role} value={role}>
              {renderRoleOption(role)}
            </Option>
          ))}
        </Dropdown>
      </Field>

      {selectedRoles.length > 0 && (
        <div className={styles.selectedRoles}>
          {selectedRoles.map((role) => (
            <Badge
              key={role}
              appearance="outline"
              color="brand"
            >
              {getRoleIcon(role)} {getRoleDisplayName(role)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
