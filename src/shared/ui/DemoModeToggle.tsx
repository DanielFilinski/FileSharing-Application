import React from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Switch,
  Text,
  Caption1,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Alert,
  shorthands
} from '@fluentui/react-components';
import {
  EyeRegular,
  EyeOffRegular,
  WarningRegular,
  InfoRegular
} from '@fluentui/react-icons';
import { useDemoMode } from '@/shared/lib/demo';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  toggleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('12px'),
  },

  toggleContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },

  title: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },

  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase200,
  },

  demoModeActive: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderColor: tokens.colorPaletteYellowBorder2,
    
    '& $title': {
      color: tokens.colorPaletteYellowForeground2,
    }
  },

  warningIcon: {
    color: tokens.colorPaletteRedForeground2,
  },

  demoIcon: {
    color: tokens.colorPaletteBlueForeground2,
  },

  alert: {
    marginBottom: '8px',
  },

  quickActions: {
    display: 'flex',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
    marginTop: '8px',
  },

  quickActionButton: {
    minWidth: 'auto',
    fontSize: tokens.fontSizeBase100,
    ...shorthands.padding('4px', '8px'),
  },
});

interface DemoModeToggleProps {
  showQuickActions?: boolean;
  showWarning?: boolean;
  compact?: boolean;
}

export const DemoModeToggle: React.FC<DemoModeToggleProps> = ({
  showQuickActions = false,
  showWarning = true,
  compact = false
}) => {
  const styles = useStyles();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const handleToggle = () => {
    // Показываем подтверждение для включения demo режима
    if (!isDemoMode) {
      const confirmed = window.confirm(
        'Вы уверены, что хотите включить Demo режим?\n\n' +
        'В этом режиме все ограничения доступа будут сняты для демонстрации функционала. ' +
        'Это предназначено только для презентаций и тестирования.'
      );
      
      if (confirmed) {
        toggleDemoMode();
      }
    } else {
      toggleDemoMode();
    }
  };

  const quickActions = [
    { label: 'Настройки', action: () => window.location.href = '/settings' },
    { label: 'Пользователи', action: () => window.location.href = '/settings/users' },
    { label: 'Валидация', action: () => window.location.href = '/settings/validation' },
  ];

  return (
    <div className={`${styles.container} ${isDemoMode ? styles.demoModeActive : ''}`}>
      {showWarning && isDemoMode && (
        <MessageBar intent="warning" className={styles.alert}>
          <MessageBarBody>
            <MessageBarTitle>Demo режим активен</MessageBarTitle>
            Все ограничения доступа сняты для демонстрации функционала
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.toggleSection}>
        <div className={styles.toggleContent}>
          <div className={styles.title}>
            {isDemoMode ? (
              <>
                <EyeRegular className={styles.demoIcon} />
                Demo режим
              </>
            ) : (
              <>
                <EyeOffRegular />
                Обычный режим
              </>
            )}
            {isDemoMode && (
              <WarningRegular className={styles.warningIcon} fontSize="14px" />
            )}
          </div>
          
          {!compact && (
            <Caption1 className={styles.description}>
              {isDemoMode 
                ? 'Полный доступ ко всем функциям для демонстрации'
                : 'Стандартные права доступа на основе ролей пользователя'
              }
            </Caption1>
          )}
        </div>

        <Switch
          checked={isDemoMode}
          onChange={handleToggle}
          aria-label={isDemoMode ? 'Отключить demo режим' : 'Включить demo режим'}
        />
      </div>

      {showQuickActions && isDemoMode && (
        <>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            Быстрый доступ к разделам:
          </Text>
          
          <div className={styles.quickActions}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="small"
                appearance="outline"
                className={styles.quickActionButton}
                onClick={action.action}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
