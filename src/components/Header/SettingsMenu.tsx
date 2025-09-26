import React from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Button
} from '@fluentui/react-components';
import {
  SettingsRegular,
  OrganizationRegular,
  CloudRegular,
  ShieldTaskRegular,
  PeopleRegular,
  DocumentRegular,
  BuildingRegular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

interface SettingsMenuProps {
  trigger: React.ReactElement;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ trigger }) => {
  const navigate = useNavigate();

  const handleNavigateToSettings = (path: string) => {
    navigate(path);
  };

  return (
    <Menu>
      <MenuTrigger>
        {trigger}
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem onClick={() => handleNavigateToSettings('/settings/organization')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <OrganizationRegular />
              Organization Settings
            </div>
          </MenuItem>
          
          <MenuItem onClick={() => handleNavigateToSettings('/settings/users')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PeopleRegular />
              User Management
            </div>
          </MenuItem>
          
          <MenuDivider />
          
          <MenuItem onClick={() => handleNavigateToSettings('/settings/storage')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudRegular />
              Storage Settings
            </div>
          </MenuItem>
          
          <MenuItem onClick={() => handleNavigateToSettings('/settings/validation')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DocumentRegular />
              Validation Settings
            </div>
          </MenuItem>
          
          <MenuItem onClick={() => handleNavigateToSettings('/settings/approval')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldTaskRegular />
              Approval Settings
            </div>
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export { SettingsMenu };
