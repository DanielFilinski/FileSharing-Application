/**
 * SharePoint Integration Page
 * Main page for SharePoint document management
 */

import React from 'react';
import { 
  makeStyles, 
  tokens,
  Text
} from '@fluentui/react-components';
import { SharePointIntegration } from '../../components/SharePoint/SharePointIntegration';
import { Layout } from '../../components/Layout';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  
  header: {
    marginBottom: '24px'
  },
  
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px'
  },
  
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5'
  }
});

export const SharePointPage: React.FC = () => {
  const styles = useStyles();

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Text className={styles.title}>SharePoint Integration</Text>
          <Text className={styles.description}>
            Manage documents in SharePoint with organized folder structure for each End User. 
            Upload, organize, and collaborate on documents with proper access control and workflow integration.
          </Text>
        </div>
        
        <SharePointIntegration />
      </div>
    </Layout>
  );
};
