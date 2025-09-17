import React from 'react';
import {
  Card,
  CardHeader,
  Title3,
  Body1,
  Caption1,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  CloudAdd24Regular,
  HardDrive24Regular,
} from '@fluentui/react-icons';

interface StorageTypeSelectorProps {
  storageType: 'cloud' | 'physical';
  onStorageTypeChange: (type: 'cloud' | 'physical') => void;
}

const useStyles = makeStyles({
  storageTypeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
    },
  },
  storageTypeCard: {
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  storageTypeCardSelected: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  storageTypeContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const StorageTypeSelector: React.FC<StorageTypeSelectorProps> = ({
  storageType,
  onStorageTypeChange,
}) => {
  const styles = useStyles();

  return (
    <Card>
      <CardHeader>
        <Title3>Storage Type</Title3>
      </CardHeader>
      <div className={styles.storageTypeGrid}>
        <div
          className={`${styles.storageTypeCard} ${
            storageType === 'cloud' ? styles.storageTypeCardSelected : ''
          }`}
          onClick={() => onStorageTypeChange('cloud')}
        >
          <div className={styles.storageTypeContent}>
            <CloudAdd24Regular style={{ color: tokens.colorBrandForeground1 }} />
            <div className={styles.rows}>
              <Body1>Cloud Storage</Body1>
              <Caption1>SharePoint</Caption1>
            </div>
          </div>
        </div>
        
        <div
          className={`${styles.storageTypeCard} ${
            storageType === 'physical' ? styles.storageTypeCardSelected : ''
          }`}
          onClick={() => onStorageTypeChange('physical')}
        >
          <div className={styles.storageTypeContent}>
            <HardDrive24Regular style={{ color: tokens.colorBrandForeground1 }} />
            <div className={styles.rows}>
              <Body1>Physical Storage</Body1>
              <Caption1>Local/Network</Caption1>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 