/**
 * Backup Codes Dialog Component
 * Component for displaying and managing backup codes
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
  Text,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Copy24Regular,
  Print24Regular,
  Download24Regular,
  Checkmark24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { BackupCodesResult } from '@/shared/lib/mfa';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  codesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
});

export interface BackupCodesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  backupCodes: BackupCodesResult | null;
}

export const BackupCodesDialog: React.FC<BackupCodesDialogProps> = ({
  isOpen,
  onClose,
  backupCodes,
}) => {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!backupCodes?.codes) return;

    const codesText = backupCodes.codes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handlePrint = () => {
    if (!backupCodes?.codes) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Backup Codes - FileSharing</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #0078d4;
              padding-bottom: 10px;
            }
            .warning {
              background-color: #fff4ce;
              border-left: 4px solid #ffaa44;
              padding: 15px;
              margin: 20px 0;
            }
            .codes {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 30px 0;
            }
            .code {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              padding: 15px;
              background-color: #f5f5f5;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .footer {
              margin-top: 40px;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>FileSharing Backup Codes</h1>
          <div class="warning">
            <strong>⚠️ Important:</strong> Store these codes in a safe place. 
            Each code can only be used once. If you lose access to your authenticator app, 
            you can use these codes to sign in.
          </div>
          <div class="codes">
            ${backupCodes.codes.map(code => `<div class="code">${code}</div>`).join('')}
          </div>
          <div class="footer">
            <p>Generated: ${new Date(backupCodes.createdAt).toLocaleString()}</p>
            <p>User ID: ${backupCodes.userId}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    if (!backupCodes?.codes) return;

    const content = [
      'FileSharing Backup Codes',
      '========================',
      '',
      '⚠️ IMPORTANT: Store these codes in a safe place!',
      'Each code can only be used once.',
      '',
      'Codes:',
      '------',
      ...backupCodes.codes,
      '',
      `Generated: ${new Date(backupCodes.createdAt).toLocaleString()}`,
      `User ID: ${backupCodes.userId}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!backupCodes) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogTitle>Your Backup Codes</DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.container}>
              <MessageBar intent="warning">
                <MessageBarBody>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Warning24Regular />
                    <div>
                      <Text weight="semibold" className="block">
                        Save these codes now!
                      </Text>
                      <Text size={300}>
                        These codes will not be shown again. Each code can only be used once. 
                        Store them in a safe place where you can access them if you lose your 
                        authenticator device.
                      </Text>
                    </div>
                  </div>
                </MessageBarBody>
              </MessageBar>

              <div className={styles.codesGrid}>
                {backupCodes.codes.map((code, index) => (
                  <div key={index} className={styles.code}>
                    {code}
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <Button
                  icon={copied ? <Checkmark24Regular /> : <Copy24Regular />}
                  appearance="secondary"
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : 'Copy All'}
                </Button>
                <Button
                  icon={<Print24Regular />}
                  appearance="secondary"
                  onClick={handlePrint}
                >
                  Print
                </Button>
                <Button
                  icon={<Download24Regular />}
                  appearance="secondary"
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </div>

              <Text size={300} style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                Generated: {new Date(backupCodes.createdAt).toLocaleString()}
              </Text>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={onClose}>
              I've Saved My Codes
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

