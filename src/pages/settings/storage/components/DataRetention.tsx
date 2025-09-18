import React from 'react';
import {
  Card,
  CardHeader,
  Title3,
  Input,
  Field,
  Select,
  Caption1,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  Clock24Regular,
} from '@fluentui/react-icons';

interface DataRetentionProps {
  retentionPeriod: string;
  retentionUnit: 'days' | 'months' | 'years';
  onRetentionPeriodChange: (period: string) => void;
  onRetentionUnitChange: (unit: 'days' | 'months' | 'years') => void;
}

const useStyles = makeStyles({
  retentionSection: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  customRetentionSection: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  retentionInfo: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorPaletteGreenBorder2}`,
    color: tokens.colorPaletteGreenForeground2,
  },
  retentionInfoContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  retentionIcon: {
    flexShrink: 0,
    fontSize: '16px',
  },
});

export const DataRetention: React.FC<DataRetentionProps> = ({
  retentionPeriod,
  retentionUnit,
  onRetentionPeriodChange,
  onRetentionUnitChange,
}) => {
  const styles = useStyles();

  return (
    <Card>
      <CardHeader>
        <Title3>Data Retention</Title3>
      </CardHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
        <div className={styles.retentionSection}>
          <Field label="Retention Period" style={{ flex: 1 }}>
            <Select
              value={retentionPeriod}
              onChange={(e) => onRetentionPeriodChange(e.target.value)}
            >
              <option value="">Select period</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">1 year</option>
              <option value="24">2 years</option>
              <option value="60">5 years</option>
              <option value="custom">Custom</option>
            </Select>
          </Field>
          
          {retentionPeriod === 'custom' && (
            <div className={styles.customRetentionSection}>
              <Input
                type="number"
                placeholder="Amount"
                style={{ width: '80px' }}
              />
              <Select
                value={retentionUnit}
                onChange={(e) => onRetentionUnitChange(e.target.value as 'days' | 'months' | 'years')}
                style={{ width: '100px' }}
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </Select>
            </div>
          )}
        </div>
        
        <div className={styles.retentionInfo}>
          <div className={styles.retentionInfoContent}>
            <Clock24Regular className={styles.retentionIcon} />
            <Caption1>
              Data will be automatically deleted after the retention period expires
            </Caption1>
          </div>
        </div>
      </div>
    </Card>
  );
}; 