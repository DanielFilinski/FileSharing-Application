/**
 * E2EEStatus Component
 * Displays encryption status indicator for chat
 */

import React from 'react';
import {
  Badge,
  Tooltip,
  makeStyles,
  tokens,
  Text,
  Spinner,
} from '@fluentui/react-components';
import {
  LockClosed16Regular,
  LockOpen16Regular,
  Warning16Regular,
} from '@fluentui/react-icons';
import { E2EEStatus as E2EEStatusType } from '@/shared/lib/encryption';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  icon: {
    fontSize: '16px',
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
  },
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxWidth: '300px',
  },
});

export interface E2EEStatusProps {
  status: E2EEStatusType | null;
  isInitializing?: boolean;
  error?: string | null;
  className?: string;
  onClick?: () => void;
}

export const E2EEStatus: React.FC<E2EEStatusProps> = ({
  status,
  isInitializing,
  error,
  className = '',
  onClick,
}) => {
  const styles = useStyles();

  // Determine display state
  const getStatusDisplay = () => {
    if (isInitializing) {
      return {
        icon: <Spinner size="extra-tiny" className={styles.icon} />,
        label: 'Initializing...',
        color: 'warning' as const,
        tooltipContent: 'Initializing end-to-end encryption...',
      };
    }

    if (error) {
      return {
        icon: <Warning16Regular className={styles.icon} />,
        label: 'Encryption Error',
        color: 'danger' as const,
        tooltipContent: `Encryption error: ${error}`,
      };
    }

    if (status?.enabled) {
      return {
        icon: <LockClosed16Regular className={styles.icon} />,
        label: 'Encrypted',
        color: 'success' as const,
        tooltipContent: (
          <div className={styles.tooltipContent}>
            <Text weight="semibold">End-to-End Encrypted</Text>
            <Text size={200}>
              Messages are encrypted on your device and can only be read by participants in
              this chat.
            </Text>
            {status.sessionKeyId && (
              <Text size={100} style={{ fontFamily: 'monospace', opacity: 0.7 }}>
                Key ID: {status.sessionKeyId.substring(0, 8)}...
              </Text>
            )}
            {status.nextKeyRotation && (
              <Text size={200}>
                Next key rotation:{' '}
                {new Date(status.nextKeyRotation).toLocaleDateString()}
              </Text>
            )}
          </div>
        ),
      };
    }

    return {
      icon: <LockOpen16Regular className={styles.icon} />,
      label: 'Not Encrypted',
      color: 'subtle' as const,
      tooltipContent: 'Messages are not encrypted. Click to enable end-to-end encryption.',
    };
  };

  const display = getStatusDisplay();

  const handleClick = () => {
    if (onClick && !isInitializing) {
      onClick();
    }
  };

  return (
    <Tooltip
      content={display.tooltipContent}
      relationship="description"
      positioning="below-start"
    >
      <div
        className={`${styles.container} ${className}`}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Encryption status: ${display.label}`}
      >
        {display.icon}
        <Badge color={display.color} size="small" appearance="filled">
          {display.label}
        </Badge>
      </div>
    </Tooltip>
  );
};

