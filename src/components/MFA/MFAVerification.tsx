/**
 * MFA Verification Component
 * Component for verifying MFA codes during login
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  Button,
  Input,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  Field,
  Link,
} from '@fluentui/react-components';
import {
  Shield24Regular,
  LockClosed24Regular,
} from '@fluentui/react-icons';
import { MFAMethod, MFAVerificationResult } from '@/shared/lib/mfa';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    minWidth: '400px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground2,
  },
  codeInput: {
    width: '100%',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  methodSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalM,
  },
  methodButton: {
    justifyContent: 'flex-start',
  },
  attemptsRemaining: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export interface MFAVerificationProps {
  isOpen: boolean;
  method: MFAMethod;
  availableMethods?: MFAMethod[];
  onVerify: (method: MFAMethod, code: string) => Promise<MFAVerificationResult>;
  onMethodChange?: (method: MFAMethod) => void;
  onCancel?: () => void;
  onSuccess?: (sessionToken: string) => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  isOpen,
  method,
  availableMethods = ['totp'],
  onVerify,
  onMethodChange,
  onCancel,
  onSuccess,
}) => {
  const styles = useStyles();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [showMethodSelector, setShowMethodSelector] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(null);
      setAttemptsRemaining(null);
      setShowMethodSelector(false);
    }
  }, [isOpen]);

  const getMethodLabel = (method: MFAMethod): string => {
    switch (method) {
      case 'totp':
        return 'Authenticator App';
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      case 'backup_code':
        return 'Backup Code';
      default:
        return 'Unknown';
    }
  };

  const getMethodDescription = (method: MFAMethod): string => {
    switch (method) {
      case 'totp':
        return 'Enter the 6-digit code from your authenticator app';
      case 'sms':
        return 'Enter the code sent to your phone';
      case 'email':
        return 'Enter the code sent to your email';
      case 'backup_code':
        return 'Enter one of your backup codes';
      default:
        return '';
    }
  };

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter a code');
      return;
    }

    if (method === 'totp' && code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      const result = await onVerify(method, code);

      if (result.verified && result.sessionToken) {
        onSuccess?.(result.sessionToken);
      } else {
        setError(result.error || 'Invalid code');
        setAttemptsRemaining(result.attemptsRemaining ?? null);

        if (result.lockedUntil) {
          const lockDate = new Date(result.lockedUntil);
          const minutesLocked = Math.ceil((lockDate.getTime() - Date.now()) / 60000);
          setError(`Account locked. Try again in ${minutesLocked} minutes.`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMethodSelect = (newMethod: MFAMethod) => {
    setShowMethodSelector(false);
    setCode('');
    setError(null);
    onMethodChange?.(newMethod);
  };

  return (
    <Dialog open={isOpen} modalType="modal">
      <DialogSurface>
        <DialogTitle>Two-Factor Authentication</DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.container}>
              <div className={styles.header}>
                <div className={styles.iconContainer}>
                  <Shield24Regular style={{ fontSize: '32px', color: tokens.colorBrandForeground1 }} />
                </div>
                <Text size={500} weight="semibold">
                  Verify Your Identity
                </Text>
                <Text size={300} align="center">
                  {getMethodDescription(method)}
                </Text>
              </div>

              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <Text size={300} className={styles.attemptsRemaining}>
                  {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                </Text>
              )}

              {!showMethodSelector ? (
                <>
                  <Field
                    label={`${getMethodLabel(method)} Code`}
                    className={styles.codeInput}
                  >
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setError(null);
                      }}
                      placeholder={method === 'backup_code' ? 'XXXX-XXXX' : '000000'}
                      maxLength={method === 'backup_code' ? 9 : 6}
                      disabled={isVerifying}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleVerify();
                        }
                      }}
                      autoFocus
                    />
                  </Field>

                  <div className={styles.actions}>
                    <Button
                      appearance="primary"
                      onClick={handleVerify}
                      disabled={isVerifying || !code}
                      icon={isVerifying ? <Spinner size="tiny" /> : <LockClosed24Regular />}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </Button>

                    {availableMethods.length > 1 && (
                      <Link
                        onClick={() => setShowMethodSelector(true)}
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                      >
                        Use a different method
                      </Link>
                    )}

                    {onCancel && (
                      <Button
                        appearance="subtle"
                        onClick={onCancel}
                        disabled={isVerifying}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.methodSelector}>
                  <Text size={400} weight="semibold">
                    Choose verification method:
                  </Text>
                  {availableMethods.map((m) => (
                    <Button
                      key={m}
                      appearance={m === method ? 'primary' : 'subtle'}
                      className={styles.methodButton}
                      onClick={() => handleMethodSelect(m)}
                    >
                      {getMethodLabel(m)}
                    </Button>
                  ))}
                  <Button
                    appearance="subtle"
                    onClick={() => setShowMethodSelector(false)}
                  >
                    Back
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

