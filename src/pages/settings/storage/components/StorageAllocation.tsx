import React from 'react';
import {
  Card,
  CardHeader,
  Title3,
  Input,
  Field,
  Select,
  Body1,
  Caption1,
  tokens,
  makeStyles,
} from '@fluentui/react-components';

interface StorageAllocationProps {
  storageAmount: string;
  storageUnit: 'MB' | 'GB';
  onStorageAmountChange: (amount: string) => void;
  onStorageUnitChange: (unit: 'MB' | 'GB') => void;
  onStorageAllocation: () => void;
}

const useStyles = makeStyles({
  storageAllocationSection: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  storageDistribution: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
  },
  distributionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
    },
  },
  distributionCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

export const StorageAllocation: React.FC<StorageAllocationProps> = ({
  storageAmount,
  storageUnit,
  onStorageAmountChange,
  onStorageUnitChange,
  onStorageAllocation,
}) => {
  const styles = useStyles();

  return (
    <Card>
      <CardHeader>
        <Title3>Storage Allocation</Title3>
      </CardHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
        <div className={styles.storageAllocationSection}>
          <Field label="Amount per Client" style={{ flex: 1 }}>
            <Input
              type="number"
              value={storageAmount}
              onChange={(e) => onStorageAmountChange(e.target.value)}
              onBlur={onStorageAllocation}
              placeholder="Enter amount"
            />
          </Field>
          <Field label="Unit" style={{ width: '100px' }}>
            <Select
              value={storageUnit}
              onChange={(e) => onStorageUnitChange(e.target.value as 'MB' | 'GB')}
            >
              <option value="MB">MB</option>
              <option value="GB">GB</option>
            </Select>
          </Field>
        </div>
        
        <div className={styles.storageDistribution}>
          <Body1 style={{ marginBottom: tokens.spacingVerticalM }}>
            Distribution
          </Body1>
          <div className={styles.distributionGrid}>
            <div className={styles.distributionCard}>
              <Body1>DMS</Body1>
              <Caption1 style={{ marginBottom: tokens.spacingVerticalXS }}>Internal only</Caption1>
              <Body1 style={{ color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightMedium }}>
                {storageAmount ? `${Math.floor(parseInt(storageAmount) / 2)} ${storageUnit}` : '-- GB'}
              </Body1>
            </div>
            <div className={styles.distributionCard}>
              <Body1>Portal</Body1>
              <Caption1 style={{ marginBottom: tokens.spacingVerticalXS }}>Client access</Caption1>
              <Body1 style={{ color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightMedium }}>
                {storageAmount ? `${Math.floor(parseInt(storageAmount) / 2)} ${storageUnit}` : '-- GB'}
              </Body1>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 