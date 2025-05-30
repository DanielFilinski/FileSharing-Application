import React from 'react';
import { makeStyles, tokens, Text, Divider } from '@fluentui/react-components';
import { Navigation } from './components/Navigation';
import { Toolbar } from './components/Toolbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { DocumentsTable } from './components/DocumentsTable';

const useStyles = makeStyles({
  root: {
    padding: '0px 0px 0px 0px',
    height: '100vh',
    display: 'flex'
  },
  content: {
    flex: 1,
    background: tokens.colorNeutralBackground2
  },
  header: {
    padding: '0 24px',
    height: '48px',
    display: 'flex',
    alignItems: 'center'
  },
  title: {
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    fontSize: '20px'
  }
});

export default function DmsMainScreen() {
  const styles = useStyles();
  
  return (
    <div className={styles.root}>
      <Navigation />
      <div className={styles.content}>
        <div className={styles.header}>
          <Text className={styles.title}>DMS</Text>
        </div>
        <Divider />
        <Toolbar />
        <Divider />
        <Breadcrumbs />
        <DocumentsTable />
      </div>
    </div>
  );
} 