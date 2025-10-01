/**
 * TOTP Setup Component
 * Component for setting up TOTP (Authenticator App) MFA
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
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
} from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Dismiss24Regular,
  Copy24Regular,
} from '@fluentui/react-icons';
import { TOTPSetupData } from '@/shared/lib/mfa';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  qrCode: {
    width: '256px',
    height: '256px',
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  manualEntry: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  codeInput: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-end',
  },
  backupCodes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
  },
  step: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
});

export interface TOTPSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete?: () => void;
  setupData: TOTPSetupData | null;
  isLoading?: boolean;
  error?: string | null;
  onVerify: (code: string) => Promise<boolean>;
}

export const TOTPSetup: React.FC<TOTPSetupProps> = ({
  isOpen,
  onClose,
  onSetupComplete,
  setupData,
  isLoading = false,
  error,
  onVerify,
}) => {
  const styles = useStyles();
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleCopySecret = () => {
    if (setupData?.manualEntryKey) {
      navigator.clipboard.writeText(setupData.manualEntryKey.replace(/\s/g, ''));
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationError(null);

      const verified = await onVerify(verificationCode);

      if (verified) {
        setIsVerified(true);
        setTimeout(() => {
          onSetupComplete?.();
          handleClose();
        }, 2000);
      } else {
        setVerificationError('Invalid code. Please try again.');
      }
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setVerificationCode('');
    setVerificationError(null);
    setIsVerified(false);
    onClose();
  };

  if (!setupData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogTitle>
          Set Up Authenticator App
        </DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.container}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              {isVerified ? (
                <MessageBar intent="success">
                  <MessageBarBody>
                    TOTP successfully configured! You can now use your authenticator app to sign in.
                  </MessageBarBody>
                </MessageBar>
              ) : (
                <>
                  {/* Step 1: Scan QR Code */}
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepContent}>
                      <Text weight="semibold" size={400}>Scan QR Code</Text>
                      <Text size={300} className="block mb-2">
                        Open your authenticator app (Google Authenticator, Microsoft Authenticator, etc.) 
                        and scan this QR code:
                      </Text>
                      <div className={styles.qrSection}>
                        <img
                          src={setupData.qrCodeUrl}
                          alt="TOTP QR Code"
                          className={styles.qrCode}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual Entry Option */}
                  <div className={styles.manualEntry}>
                    <Text weight="semibold" size={300}>Can't scan the QR code?</Text>
                    <Text size={200}>Enter this code manually in your authenticator app:</Text>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                        {setupData.manualEntryKey}
                      </Text>
                      <Button
                        icon={<Copy24Regular />}
                        size="small"
                        appearance="subtle"
                        onClick={handleCopySecret}
                        aria-label="Copy secret"
                      />
                    </div>
                  </div>

                  {/* Step 2: Verify */}
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepContent}>
                      <Text weight="semibold" size={400}>Verify Setup</Text>
                      <Text size={300} className="block mb-2">
                        Enter the 6-digit code from your authenticator app to verify:
                      </Text>
                      <div className={styles.codeInput}>
                        <Field
                          label="Verification Code"
                          validationMessage={verificationError || undefined}
                          validationState={verificationError ? 'error' : 'none'}
                          style={{ flex: 1 }}
                        >
                          <Input
                            value={verificationCode}
                            onChange={(e) => {
                              setVerificationCode(e.target.value);
                              setVerificationError(null);
                            }}
                            placeholder="000000"
                            maxLength={6}
                            disabled={isVerifying}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleVerify();
                              }
                            }}
                          />
                        </Field>
                        <Button
                          appearance="primary"
                          onClick={handleVerify}
                          disabled={isVerifying || verificationCode.length !== 6}
                          icon={isVerifying ? <Spinner size="tiny" /> : undefined}
                        >
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Backup Codes */}
                  {setupData.backupCodes && setupData.backupCodes.length > 0 && (
                    <div>
                      <Text weight="semibold" size={400} className="block mb-2">
                        Backup Codes
                      </Text>
                      <MessageBar intent="warning">
                        <MessageBarBody>
                          Save these backup codes in a safe place. You can use them to sign in 
                          if you lose access to your authenticator app.
                        </MessageBarBody>
                      </MessageBar>
                      <div className={styles.backupCodes}>
                        {setupData.backupCodes.map((code, index) => (
                          <Text key={index} size={300}>
                            {code}
                          </Text>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            {isVerified ? (
              <Button
                appearance="primary"
                icon={<Checkmark24Regular />}
                onClick={handleClose}
              >
                Done
              </Button>
            ) : (
              <Button
                icon={<Dismiss24Regular />}
                onClick={handleClose}
                disabled={isVerifying}
              >
                Cancel
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

