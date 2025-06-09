import React, { useState } from 'react';
import { 
  makeStyles, 
  tokens, 
  Table, 
  TableHeader, 
  TableRow, 
  TableHeaderCell, 
  TableBody, 
  TableCell, 
  Text 
} from '@fluentui/react-components';
import { Document20Regular, DocumentBulletList20Regular } from '@fluentui/react-icons';

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



export const DocumentsTable: React.FC = () => {
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

const useStyles = makeStyles({
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
    }
  });