import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  shorthands
} from '@fluentui/react-components';
import {
  WarningRegular,
  EyeRegular,
  DismissRegular
} from '@fluentui/react-icons';
import { useDemoMode } from '@/shared/lib/demo';

const useStyles = makeStyles({
  banner: {
    position: 'sticky',
    top: '52px', // Под header
    zIndex: 99,
    width: '100%',
    ...shorthands.margin('0'),
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderBottom: `2px solid ${tokens.colorPaletteYellowBorder2}`,
    borderRadius: '0',
    
    '& .fui-MessageBar__body': {
      alignItems: 'center',
      ...shorthands.gap('12px'),
    }
  },

  content: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },

  icon: {
    color: tokens.colorPaletteYellowForeground2,
    fontSize: '18px',
  },

  title: {
    color: tokens.colorPaletteYellowForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },

  description: {
    color: tokens.colorPaletteYellowForeground1,
  },

  dismissButton: {
    minWidth: 'auto',
    color: tokens.colorPaletteYellowForeground2,
    
    '&:hover': {
      backgroundColor: tokens.colorPaletteYellowBackground3,
      color: tokens.colorPaletteYellowForeground2,
    }
  },

  '@media (max-width: 768px)': {
    banner: {
      top: '48px', // Под мобильный header
    },
    
    content: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      ...shorthands.gap('4px'),
    },
  }
});

interface DemoModeBannerProps {
  showDismiss?: boolean;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ 
  showDismiss = true 
}) => {
  const styles = useStyles();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  const handleDismiss = () => {
    const confirmed = window.confirm(
      'Вы хотите отключить Demo режим?\n\nВсе ограничения доступа будут восстановлены согласно вашей роли.'
    );
    
    if (confirmed) {
      toggleDemoMode();
    }
  };

  return (
    <MessageBar 
      intent="warning" 
      className={styles.banner}
    >
      <MessageBarBody>
        <div className={styles.content}>
          <EyeRegular className={styles.icon} />
          <div>
            <Text className={styles.title}>
              Demo режим активен
            </Text>
            <Text size={200} className={styles.description}>
              Все функции доступны для демонстрации. Ограничения доступа отключены.
            </Text>
          </div>
        </div>
      </MessageBarBody>
      
      {showDismiss && (
        <MessageBarActions
          containerAction={
            <Button
              appearance="transparent"
              icon={<DismissRegular />}
              aria-label="Отключить demo режим"
              size="small"
              className={styles.dismissButton}
              onClick={handleDismiss}
            />
          }
        />
      )}
    </MessageBar>
  );
};