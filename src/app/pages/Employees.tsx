import React from 'react';
import { makeStyles, tokens, Text } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100vh'
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '16px'
  }
});

export const Employees: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Text className={styles.title}>Employees</Text>
      {/* Add your content here */}
    </div>
  );
}; 