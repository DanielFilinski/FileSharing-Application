import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Toolbar } from '../components/Toolbar';
import { DocumentsTable } from '../components/DocumentsTable';

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
  }
});

export default function DocumentsPage() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Toolbar />
        <Breadcrumbs />
        <DocumentsTable />
      </div>
    </div>
  );
}
