import React from 'react';
import { Button, Title2, makeStyles, tokens } from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';

interface SettingsHeaderProps {
  title: string;
  icon: React.ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonIcon?: JSX.Element;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  icon,
  buttonText = "Save changes",
  onButtonClick = () => {},
  buttonIcon = <SaveRegular />,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.header}>
      <div className={styles.menu}></div>
      <div className={styles.headerLeft}>
        <div className={styles.brandIcon}>{icon}</div>
        <Title2>{title}</Title2>
      </div>
      {buttonText && onButtonClick && (
        <Button 
          appearance="primary" 
          icon={buttonIcon}
          onClick={onButtonClick}
          className={styles.primaryButton}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
}; 

const useStyles = makeStyles({
  header: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '@media (max-width: 768px)': {
      // padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
      gap: tokens.spacingVerticalM,
    },
  },
  menu: {
    display: 'none',
    width: '32px',
    height: '32px',
    '@media (max-width: 768px)': {
      display: 'flex',
    },
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  brandIcon: {
    color: tokens.colorBrandForeground1,
  },
  sequentialNumber: {
    color: tokens.colorNeutralForeground2,
  },
  primaryButton: {
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
});
