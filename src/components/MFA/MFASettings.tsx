/**
 * MFA Settings Component
 * Main component for managing MFA settings
 */

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Title3,
  Text,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  Badge,
  Switch,
} from '@fluentui/react-components';
import {
  ShieldCheckmark24Regular,
  Add24Regular,
  Delete24Regular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';
import { useMFA } from '@/shared/hooks/useMFA';
import { TOTPSetup } from './TOTPSetup';
import { BackupCodesDialog } from './BackupCodesDialog';
import { MFAMethod } from '@/shared/lib/mfa';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  methodCard: {
    padding: tokens.spacingVerticalL,
  },
  methodHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  methodInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  methodActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  statusBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  enabledMethods: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

export interface MFASettingsProps {
  userId: string;
  userEmail: string;
}

export const MFASettings: React.FC<MFASettingsProps> = ({ userId, userEmail }) => {
  const styles = useStyles();
  const {
    settings,
    isLoading,
    error,
    totpSetupData,
    isSettingUpTOTP,
    backupCodes,
    loadSettings,
    setupTOTP,
    verifyTOTPSetup,
    generateBackupCodes,
    disableMethod,
    setPrimaryMethod,
    isMFAEnabled,
    hasMethod,
    clearError,
  } = useMFA({ userId });

  const [isTOTPDialogOpen, setIsTOTPDialogOpen] = useState(false);
  const [isBackupCodesDialogOpen, setIsBackupCodesDialogOpen] = useState(false);

  const handleSetupTOTP = async () => {
    try {
      await setupTOTP(userEmail);
      setIsTOTPDialogOpen(true);
    } catch (err) {
      console.error('Failed to setup TOTP:', err);
    }
  };

  const handleTOTPVerify = async (code: string): Promise<boolean> => {
    return await verifyTOTPSetup(code);
  };

  const handleDisableMethod = async (method: MFAMethod) => {
    if (confirm(`Are you sure you want to disable ${getMethodLabel(method)}?`)) {
      await disableMethod(method);
    }
  };

  const handleGenerateBackupCodes = async () => {
    try {
      await generateBackupCodes();
      setIsBackupCodesDialogOpen(true);
    } catch (err) {
      console.error('Failed to generate backup codes:', err);
    }
  };

  const getMethodLabel = (method: MFAMethod): string => {
    switch (method) {
      case 'totp':
        return 'Authenticator App';
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      case 'backup_code':
        return 'Backup Codes';
      default:
        return 'Unknown';
    }
  };

  const getMethodDescription = (method: MFAMethod): string => {
    switch (method) {
      case 'totp':
        return 'Use an authenticator app like Google Authenticator or Microsoft Authenticator';
      case 'sms':
        return 'Receive verification codes via SMS';
      case 'email':
        return 'Receive verification codes via email';
      case 'backup_code':
        return 'Use backup codes when you can\'t access your primary method';
      default:
        return '';
    }
  };

  if (isLoading && !settings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
        <Spinner label="Loading MFA settings..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <Card className={styles.methodCard}>
        <CardHeader
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
              <ShieldCheckmark24Regular />
              <Title3>Two-Factor Authentication</Title3>
              {isMFAEnabled && (
                <Badge color="success" appearance="filled" className={styles.statusBadge}>
                  Enabled
                </Badge>
              )}
            </div>
          }
          description={
            <Text size={300}>
              Add an extra layer of security to your account by requiring a second verification method.
            </Text>
          }
        />
      </Card>

      {error && (
        <MessageBar intent="error" onDismiss={clearError}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {/* MFA Status */}
      {!isMFAEnabled && (
        <MessageBar intent="warning">
          <MessageBarBody>
            Two-factor authentication is not enabled. We recommend enabling it to improve your account security.
          </MessageBarBody>
        </MessageBar>
      )}

      {/* TOTP Method */}
      <Card className={styles.methodCard}>
        <div className={styles.methodHeader}>
          <div className={styles.methodInfo}>
            <Text size={400} weight="semibold">
              Authenticator App (TOTP)
            </Text>
            <Text size={300}>
              {getMethodDescription('totp')}
            </Text>
          </div>
          <div className={styles.methodActions}>
            {hasMethod('totp') ? (
              <>
                <Badge color="success" appearance="filled">
                  <CheckmarkCircle24Regular /> Enabled
                </Badge>
                <Button
                  icon={<Delete24Regular />}
                  appearance="subtle"
                  onClick={() => handleDisableMethod('totp')}
                >
                  Disable
                </Button>
              </>
            ) : (
              <Button
                icon={<Add24Regular />}
                appearance="primary"
                onClick={handleSetupTOTP}
                disabled={isSettingUpTOTP}
              >
                {isSettingUpTOTP ? 'Setting up...' : 'Set Up'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* SMS Method (Coming Soon) */}
      <Card className={styles.methodCard}>
        <div className={styles.methodHeader}>
          <div className={styles.methodInfo}>
            <Text size={400} weight="semibold">
              SMS Verification
            </Text>
            <Text size={300}>
              {getMethodDescription('sms')}
            </Text>
          </div>
          <Badge appearance="outline">Coming Soon</Badge>
        </div>
      </Card>

      {/* Email Method (Coming Soon) */}
      <Card className={styles.methodCard}>
        <div className={styles.methodHeader}>
          <div className={styles.methodInfo}>
            <Text size={400} weight="semibold">
              Email Verification
            </Text>
            <Text size={300}>
              {getMethodDescription('email')}
            </Text>
          </div>
          <Badge appearance="outline">Coming Soon</Badge>
        </div>
      </Card>

      {/* Backup Codes */}
      {isMFAEnabled && (
        <Card className={styles.methodCard}>
          <div className={styles.methodHeader}>
            <div className={styles.methodInfo}>
              <Text size={400} weight="semibold">
                Backup Codes
              </Text>
              <Text size={300}>
                {getMethodDescription('backup_code')}
              </Text>
            </div>
            <Button
              appearance="secondary"
              onClick={handleGenerateBackupCodes}
              disabled={isLoading}
            >
              Generate Codes
            </Button>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <TOTPSetup
        isOpen={isTOTPDialogOpen}
        onClose={() => setIsTOTPDialogOpen(false)}
        onSetupComplete={() => {
          loadSettings();
        }}
        setupData={totpSetupData}
        isLoading={isSettingUpTOTP}
        error={error}
        onVerify={handleTOTPVerify}
      />

      <BackupCodesDialog
        isOpen={isBackupCodesDialogOpen}
        onClose={() => setIsBackupCodesDialogOpen(false)}
        backupCodes={backupCodes}
      />
    </div>
  );
};

