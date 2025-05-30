import React from 'react';
import { makeStyles, Button, MenuButton, Menu, MenuList, MenuItem, MenuPopover, MenuTrigger } from '@fluentui/react-components';
import { 
  AddRegular, 
  ArrowUploadRegular, 
  Table20Regular, 
  ShareAndroid20Regular, 
  MoreHorizontalRegular,
  QuestionCircle20Regular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 24px 8px 24px'
  }
});

export const Toolbar: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.toolbar}>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <MenuButton
          icon={<AddRegular />}
          appearance="primary"
          shape="rounded"
          style={{
            backgroundColor: '#0069E4',
            color: '#fff',
            border: 'none'
          }}
        >
          New
        </MenuButton>
        <Button
          icon={<ArrowUploadRegular />}
          iconPosition="before"
          appearance="primary"
          shape="rounded"
          style={{
            backgroundColor: '#00A254',
            color: '#fff',
            border: 'none'
          }}
        >
          Upload
        </Button>
        <Button
          icon={<Table20Regular />}
          iconPosition="before"
          appearance="secondary"
          shape="rounded"
        >
          Edit in grid view
        </Button>
        <MenuButton
          appearance="secondary"
          shape="rounded"
        >
          Open
        </MenuButton>
        <Button
          icon={<ShareAndroid20Regular />}
          iconPosition="before"
          appearance="secondary"
          shape="rounded"
        >
          Share
        </Button>
        <Button
          icon={<MoreHorizontalRegular />}
          appearance="transparent"
          shape="rounded"
          style={{
            border: 'none',
            backgroundColor: 'transparent'
          }}
        >
          
        </Button>
      </div>
      <div 
      style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '0px' }}>
        <span style={{ color: '#212121', fontSize: 16 }}>1 selected</span>
        <Menu>
          <MenuTrigger>
            <MenuButton
              appearance="secondary"
              shape="rounded"
              style={{
                minWidth: 160,
                fontWeight: 500,
                background: '#fff',
                border: '1px solid #E1E1E1',
                color: '#212121'
              }}
            >
              All Documents
            </MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>All Documents</MenuItem>
              <MenuItem>My Documents</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Button
          icon={<QuestionCircle20Regular />}
          appearance="transparent"
          shape="circular"
          style={{
            border: '1px solid #E1E1E1',
            background: '#fff',
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            padding: 0
          }}
        />
      </div>
    </div>
  );
}; 