import React from 'react';
import {
  Card,
  CardHeader,
  Title3,
  Input,
  Field,
  Button,
  Caption1,
  tokens,
  makeStyles,
  Spinner,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
} from '@fluentui/react-icons';

interface SharePointCredentialsProps {
  email: string;
  password: string;
  connectionStatus: '' | 'verifying' | 'established' | 'invalid';
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onVerify: () => void;
}

const useStyles = makeStyles({
  credentialsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  statusConnected: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorPaletteGreenForeground2,
  },
  statusError: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorPaletteRedForeground2,
  },
});

export const SharePointCredentials: React.FC<SharePointCredentialsProps> = ({
  email,
  password,
  connectionStatus,
  onEmailChange,
  onPasswordChange,
  onVerify,
}) => {
  const styles = useStyles();

  return (
    <Card>
      <CardHeader>
        <Title3>SharePoint Credentials</Title3>
      </CardHeader>
      <div className={styles.credentialsSection}>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Enter SharePoint email"
          />
        </Field>
        
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter password"
          />
        </Field>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: tokens.spacingHorizontalM }}>
          {connectionStatus === 'invalid' && (
            <div className={styles.statusError}>
              <DismissCircle24Filled />
              <Caption1>Invalid</Caption1>
            </div>
          )}
          {connectionStatus === 'established' && (
            <div className={styles.statusConnected}>
              <CheckmarkCircle24Filled />
              <Caption1>Connected</Caption1>
            </div>
          )}
          
          <Button
            appearance="primary"
            icon={connectionStatus === 'verifying' ? <Spinner size="tiny" /> : <CheckmarkCircle24Filled />}
            onClick={onVerify}
            disabled={connectionStatus === 'verifying'}
            style={{ backgroundColor: tokens.colorBrandBackground }}
          >
            {
            connectionStatus === 'verifying' ? 'Verifying...' : 
            connectionStatus === 'invalid' ? 'Verify' :
            connectionStatus === 'established' ? 'Connected' :
            'Verify'}
          </Button>
        </div>
      </div>
    </Card>
  );
}; 