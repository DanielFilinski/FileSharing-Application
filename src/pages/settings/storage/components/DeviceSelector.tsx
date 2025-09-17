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
  Desktop24Regular,
  NetworkAdapter16Regular,
} from '@fluentui/react-icons';

interface DeviceSelectorProps {
  deviceType: string;
  onDeviceTypeChange: (type: string) => void;
}

const useStyles = makeStyles({
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
    },
  },
  deviceCard: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  deviceCardSelected: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  deviceContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  deviceType,
  onDeviceTypeChange,
}) => {
  const styles = useStyles();

  return (
    <Card>
      <CardHeader>
        <Title3>Device Selection</Title3>
      </CardHeader>
      <div className={styles.deviceGrid}>
        <div
          className={`${styles.deviceCard} ${
            deviceType === 'current' ? styles.deviceCardSelected : ''
          }`}
          onClick={() => onDeviceTypeChange('current')}
        >
          <div className={styles.deviceContent}>
            <Desktop24Regular style={{ color: tokens.colorBrandForeground1 }} />
            <div className={styles.rows}>
              <Body1>Current Computer</Body1>
              <Caption1>Local storage</Caption1>
            </div>
          </div>
        </div>
        
        <div
          className={`${styles.deviceCard} ${
            deviceType === 'network' ? styles.deviceCardSelected : ''
          }`}
          onClick={() => onDeviceTypeChange('network')}
        >
          <div className={styles.deviceContent}>
            <NetworkAdapter16Regular style={{ color: tokens.colorBrandForeground1 }} />
            <div className={styles.rows}>
              <Body1>Network Device</Body1>
              <Caption1>Shared storage</Caption1>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 