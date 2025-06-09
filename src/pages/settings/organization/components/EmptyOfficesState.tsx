import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
} from '@fluentui/react-components';
import {
  Building24Regular,
} from '@fluentui/react-icons';

const EmptyOfficesState: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Building24Regular />
      </div>
      <Text size={400} weight="medium" style={{ marginBottom: '8px' }}>
        No offices added yet
      </Text>
      <Text size={300}>
        Click "Add Office" to add your first office location
      </Text>
    </div>
  );
};

const useStyles = makeStyles({
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    textAlign: 'center',
    '@media (max-width: 640px)': {
      padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalM}`,
    },
  },
  emptyIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
  },
});

export default EmptyOfficesState; 