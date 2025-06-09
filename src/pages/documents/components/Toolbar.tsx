import React, { useState, useEffect } from 'react';
import { 
  makeStyles, 
  tokens, 
  Button,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  Text
} from '@fluentui/react-components';
import { 
  AddRegular, 
  ArrowUploadRegular, 
  Table20Regular, 
  ShareAndroid20Regular, 
  MoreHorizontalRegular,
  QuestionCircle20Regular
} from '@fluentui/react-icons';

export const Toolbar: React.FC = () => {
  const styles = useStyles();
  const [visibleButtons, setVisibleButtons] = useState<boolean>(true);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setVisibleButtons(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderMainButtons = () => (
    <>
      <Button
        icon={<ArrowUploadRegular />}
        iconPosition="before"
        appearance="primary"
        shape="rounded"
        className={styles.uploadButton}
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
      <Menu>
        <MenuTrigger>
          <MenuButton
            appearance="secondary"
            shape="rounded"
          >
            Open
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => { console.log('Open from device') }}>Open from device</MenuItem>
            <MenuItem onClick={() => { console.log('Open from URL') }}>Open from URL</MenuItem>
            <MenuItem onClick={() => { console.log('Open recent') }}>Open recent</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Button
        icon={<ShareAndroid20Regular />}
        iconPosition="before"
        appearance="secondary"
        shape="rounded"
      >
        Share
      </Button>
    </>
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <Menu>
          <MenuTrigger>
            <MenuButton
              icon={<AddRegular />}
              appearance="primary"
              shape="rounded"
              className={styles.primaryButton}
            >
              New
            </MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={() => { console.log('Document') }}>Document</MenuItem>
              <MenuItem onClick={() => { console.log('Spreadsheet') }}>Spreadsheet</MenuItem>
              <MenuItem onClick={() => { console.log('Presentation') }}>Presentation</MenuItem>
              <MenuItem onClick={() => { console.log('Form') }}>Form</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        {visibleButtons ? renderMainButtons() : (
          <Menu>
            <MenuTrigger>
              <MenuButton
                icon={<MoreHorizontalRegular />}
                appearance="secondary"
                shape="rounded"
              >
                More
              </MenuButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {renderMainButtons()}
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
      </div>
      
      <div className={styles.toolbarRight}>
        <Text className={styles.selectedText}>1 selected</Text>
        <Menu>
          <MenuTrigger>
            <MenuButton
              appearance="secondary"
              shape="rounded"
              className={styles.menuButton}
            >
              All Documents
            </MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>All Documents</MenuItem>
              <MenuItem>My Documents</MenuItem>
              <MenuItem>Shared Documents</MenuItem>
              <MenuItem>Recent</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Button
          icon={<QuestionCircle20Regular />}
          appearance="transparent"
          shape="circular"
          className={styles.helpButton}
        />
      </div>
    </div>
  );
}; 

const useStyles = makeStyles({
    toolbar: {
      display: 'flex',
      position: 'static',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 24px',
      backgroundColor: tokens.colorNeutralBackground1,
      minHeight: '48px',
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'stretch',
        padding: '8px 16px'
      }
    },
    toolbarLeft: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap',
      '@media (max-width: 768px)': {
        justifyContent: 'center',
        width: '100%'
      }
    },
    toolbarRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      '@media (max-width: 768px)': {
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 0'
      }
    },
    primaryButton: {
      backgroundColor: '#9333EA',
      color: tokens.colorNeutralForegroundOnBrand,
      border: 'none',
      ':hover': {
        backgroundColor: '#7C2EC8'
      },
      ':active': {
        backgroundColor: '#6B2AAE'
      },
      '@media (max-width: 768px)': {
        // width: '100%'
      }
    },
    uploadButton: {
      backgroundColor: tokens.colorPaletteGreenBackground3,
      color: tokens.colorNeutralForegroundOnBrand,
      border: 'none',
      ':hover': {
        backgroundColor: tokens.colorPaletteGreenBackground2
      },
      '@media (max-width: 768px)': {
        width: '100%'
      }
    },
    selectedText: {
      color: tokens.colorNeutralForeground2,
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightMedium
    },
    menuButton: {
      // minWidth: '160px',
      fontWeight: tokens.fontWeightMedium,
      backgroundColor: tokens.colorNeutralBackground1,
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      color: tokens.colorNeutralForeground1,
      '@media (max-width: 768px)': {
        // minWidth: '120px',
        // width: '100%'
      }
    },
    helpButton: {
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1,
      width: '32px',
      height: '32px',
      minWidth: '32px',
      minHeight: '32px',
      padding: 0
    }
  });
  