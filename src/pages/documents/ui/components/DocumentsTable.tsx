import React from 'react';
import { makeStyles, tokens, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Checkbox } from '@fluentui/react-components';
import { Document20Regular, DocumentBulletList20Regular } from '@fluentui/react-icons';
import { TABLE_COLUMNS, TABLE_ITEMS } from '../../../../app/navigation/constants';

const useStyles = makeStyles({
  table: {
    padding: '0px 0px 10px 0px',
    flex: 1,
    '& .fui-TableHeader': {
      backgroundColor: tokens.colorNeutralBackground1,
      '& .fui-TableHeaderCell': {
        color: tokens.colorNeutralForeground1
      }
    },
    '& .fui-TableRow': {
      borderBottom: 'none',
      height: '46px'
    }
  }
});

export const DocumentsTable: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.table}>
      <Table>
        <TableHeader>
          <TableRow>
            {TABLE_COLUMNS.slice(1).map(column => (
              <TableHeaderCell key={column.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {column.key === 'column2' ? 
                    <><Checkbox /> <Document20Regular/></> : 
                    <></>
                  }
                  {column.name}
                </div>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {TABLE_ITEMS.map(item => (
            <TableRow key={item.key}>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Checkbox /> 
                  <DocumentBulletList20Regular/> 
                  {item.name}
                </div>
              </TableCell>
              <TableCell>{item.modified}</TableCell>
              <TableCell>{item.createdBy}</TableCell>
              <TableCell>{item.modifiedBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 