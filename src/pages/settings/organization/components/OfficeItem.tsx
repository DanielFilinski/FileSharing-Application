import React from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Text,
} from '@fluentui/react-components';
import {
  Building24Regular,
  Location24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';

interface OfficeItemProps {
  name: string;
  address: string;
  onRemove: () => void;
}

const OfficeItem: React.FC<OfficeItemProps> = ({ name, address, onRemove }) => {
  const styles = useStyles();

  return (
    <div className={styles.officeItem}>
      <Button
        appearance="subtle"
        icon={<Delete24Regular />}
        size="small"
        className={styles.removeButton}
        onClick={onRemove}
      />
      
      <div className={styles.officeContent}>
        <div className={styles.officeIcon}>
          <Building24Regular />
        </div>
        
        <div className={styles.officeDetails}>
          <Text className={styles.officeName} weight="medium">
            {name}
          </Text>
          <div className={styles.officeAddress}>
            <Location24Regular fontSize="14" />
            <Text size={200}>{address}</Text>
          </div>
        </div>
      </div>
    </div>
  );
};

const useStyles = makeStyles({
  officeItem: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'relative',
    transition: 'border-color 0.2s ease',
    
    '&:hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      boxShadow: `0 1px 3px ${tokens.colorBrandBackground}1A`,
    },
  },
  officeContent: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start',
  },
  officeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusSmall,
    flexShrink: 0,
  },
  officeDetails: {
    flex: 1,
  },
  officeName: {
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingVerticalXXS,
  },
  officeAddress: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground2,
  },
  removeButton: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    width: '24px',
    height: '24px',
    minWidth: '24px',
  },
});

export default OfficeItem; 