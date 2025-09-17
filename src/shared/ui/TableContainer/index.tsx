import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  tableContainer: {
    overflowX: 'auto',
    '@media (max-width: 768px)': {
      fontSize: '14px'
    }
  },
  mobileHidden: {
    '@media (max-width: 768px)': {
      display: 'none'
    }
  }
});

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableContainerProps> = ({ children, className }) => {
  const styles = useStyles();
  
  return (
    <div className={`${styles.tableContainer} ${className || ''}`}>
      {children}
    </div>
  );
};

export { useStyles as useTableStyles }; 