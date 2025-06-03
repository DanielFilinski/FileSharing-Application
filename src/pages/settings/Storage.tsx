import React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    padding: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '24px',
  }
});

const StorageSettings: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Text className={styles.title}>Storage Settings</Text>
      {/* Add your storage settings form here */}
    </div>
  );
};

export default StorageSettings; 