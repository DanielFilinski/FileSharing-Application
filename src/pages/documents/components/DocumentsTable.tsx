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
  { key: '5', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  { key: '6', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  { key: '7', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '8', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '9', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '10', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '11', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '12', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '13', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '14', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '15', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '16', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '17', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '18', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '19', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '20', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '21', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '22', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '23', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '24', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '25', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
  // { key: '26', name: 'Design Mockups.pptx', modified: '1 day ago', createdBy: 'Lisa Anderson', modifiedBy: 'David Lee' },
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
    <div style={{position: 'relative', height: '100%'}}>
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

    </div>
   
  );
}; 

const useStyles = makeStyles({
    tableContainer: {
      flex: 1,
      overflowX: 'auto', // <-- Здесь
      overflowY: 'hidden',
      backgroundColor: tokens.colorNeutralBackground1,
      position: 'absolute',
      top: '0px',
      left: 0,
      right: 0,
      bottom: 0,
      // width: '100%',     
      '&::-webkit-scrollbar': {
        height: '4px',
        width: '4px'
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: tokens.colorNeutralStroke2,
        borderRadius: '4px'
      }
    },
    table: {
      width: '100%',
      minWidth: '550px',
      tableLayout: 'fixed',
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
        height: '44px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
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
        color: tokens.colorNeutralForeground1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
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