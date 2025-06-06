import React, { useState } from 'react';
import { 
  makeStyles, 
  tokens, 
  Divider, 
  Table, 
  TableHeader, 
  TableRow, 
  TableHeaderCell, 
  TableBody, 
  TableCell, 
  Checkbox,
  Button,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  Breadcrumb,
  BreadcrumbItem,
  Text,
  shorthands
} from '@fluentui/react-components';
import { 
  AddRegular, 
  ArrowUploadRegular, 
  Table20Regular, 
  ShareAndroid20Regular, 
  MoreHorizontalRegular,
  QuestionCircle20Regular,
  Document20Regular, 
  DocumentBulletList20Regular,
  ChevronRightRegular
} from '@fluentui/react-icons';

// Mock data
const BREADCRUMB_ITEMS = [
  { key: 'home', text: 'Home' },
  { key: 'documents', text: 'Documents' },
  { key: 'current', text: 'My Files' }
];

const TABLE_COLUMNS = [
  { key: 'name', name: 'Name' },
  { key: 'modified', name: 'Modified' },
  { key: 'createdBy', name: 'Created by' },
  { key: 'modifiedBy', name: 'Modified by' }
];

const TABLE_ITEMS = [
  { key: '1', name: 'Project Proposal.docx', modified: '2 days ago', createdBy: 'John Smith', modifiedBy: 'Jane Doe' },
  { key: '2', name: 'Meeting Notes.docx', modified: '1 week ago', createdBy: 'Alice Johnson', modifiedBy: 'Bob Wilson' },
  { key: '3', name: 'Budget Report.xlsx', modified: '3 days ago', createdBy: 'Mike Brown', modifiedBy: 'Sarah Davis' },
  { key: '4', name: 'Team Guidelines.pdf', modified: '5 days ago', createdBy: 'Emma Wilson', modifiedBy: 'Tom Clark' },
  { key: '5', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' }
];


// Breadcrumbs Component
const Breadcrumbs: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.breadcrumbContainer}>
      <Breadcrumb>
        {BREADCRUMB_ITEMS.map((item, index) => (
          <React.Fragment key={item.key}>
            <BreadcrumbItem>
              <Text size={300}>{item.text}</Text>
            </BreadcrumbItem>
            {index < BREADCRUMB_ITEMS.length - 1 && (
              <ChevronRightRegular fontSize={16} />
            )}
          </React.Fragment>
        ))}
      </Breadcrumb>
    </div>
  );
};

// Toolbar Component
const Toolbar: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <MenuButton
          icon={<AddRegular />}
          appearance="primary"
          shape="rounded"
          className={styles.primaryButton}
        >
          New
        </MenuButton>
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
        />
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

// Documents Table Component
const DocumentsTable: React.FC = () => {
  const styles = useStyles();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(TABLE_ITEMS.map(item => item.key)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemKey: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemKey);
    } else {
      newSelected.delete(itemKey);
    }
    setSelectedItems(newSelected);
  };

  const isAllSelected = selectedItems.size === TABLE_ITEMS.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < TABLE_ITEMS.length;

  return (
    <div className={styles.tableContainer}>
      <Table className={styles.table}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>
              <div className={styles.cellContent}>
                <input 
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <Document20Regular />
                <Text weight="semibold">Name</Text>
              </div>
            </TableHeaderCell>
            {TABLE_COLUMNS.slice(1).map(column => (
              <TableHeaderCell key={column.key}>
                <Text weight="semibold">{column.name}</Text>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {TABLE_ITEMS.map(item => (
            <TableRow key={item.key}>
              <TableCell>
                <div className={styles.cellContent}>
                  <input 
                    type="checkbox"
                    checked={selectedItems.has(item.key)}
                    onChange={(e) => handleSelectItem(item.key, e.target.checked)}
                  />
                  <DocumentBulletList20Regular />
                  <Text>{item.name}</Text>
                </div>
              </TableCell>
              <TableCell>
                <Text>{item.modified}</Text>
              </TableCell>
              <TableCell>
                <Text>{item.createdBy}</Text>
              </TableCell>
              <TableCell>
                <Text>{item.modifiedBy}</Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Main Documents Page Component
export default function DocumentsPage() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Toolbar />
        {/* <Divider /> */}
        <Breadcrumbs />
        <DocumentsTable />
      </div>
    </div>
  );
}


const useStyles = makeStyles({
  root: {
    padding: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden'
  },
  // Toolbar styles
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '48px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '8px',
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
      justifyContent: 'center'
    }
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    '@media (max-width: 768px)': {
      justifyContent: 'space-between',
      width: '100%'
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
    }
  },
  uploadButton: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    border: 'none',
    ':hover': {
      backgroundColor: tokens.colorPaletteGreenBackground2
    }
  },
  // Breadcrumb styles
  breadcrumbContainer: {
    padding: '4px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '@media (max-width: 768px)': {
      padding: '4px 16px'
    }
  },
  // Table styles
  tableContainer: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1
  },
  table: {
    width: '100%',
    minWidth: '550px',
    '& .fui-TableHeader': {
      backgroundColor: tokens.colorNeutralBackground2,
      position: 'sticky',
      top: 0,
      zIndex: 1
    },
    '& .fui-TableHeaderCell': {
      color: tokens.colorNeutralForeground2,
      fontWeight: tokens.fontWeightSemibold,
      fontSize: tokens.fontSizeBase200,
      padding: '12px 16px',
      height: '44px'
    },
    '& .fui-TableRow': {
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      height: '48px',
      ':hover': {
        backgroundColor: tokens.colorSubtleBackgroundHover
      }
    },
    '& .fui-TableCell': {
      padding: '12px 16px',
      fontSize: tokens.fontSizeBase300,
      color: tokens.colorNeutralForeground1
    }
  },
  cellContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '& input[type="checkbox"]': {
      width: '16px',
      height: '16px',
      cursor: 'pointer',
      accentColor: '#9333EA'
    }
  },
  selectedText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium
  },
  menuButton: {
    minWidth: '160px',
    fontWeight: tokens.fontWeightMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground1,
    '@media (max-width: 768px)': {
      minWidth: '120px'
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
