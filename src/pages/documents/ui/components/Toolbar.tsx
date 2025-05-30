import React from 'react';
import { makeStyles, Button, MenuButton } from '@fluentui/react-components';
import { 
  AddRegular, 
  ArrowUploadRegular, 
  Table20Regular, 
  ShareAndroid20Regular 
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  toolbar: {
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
      </div>
    </div>
  );
}; 