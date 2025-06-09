import { MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components';
import { makeStyles, tokens } from '@fluentui/react-components';

interface ValidationMessageBarsProps {
  manualValidation: boolean;
  approvalNeeded: boolean;
}

const useStyles = makeStyles({
  messageBar: {
    padding: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
  },
});

export const ValidationMessageBars = ({ manualValidation, approvalNeeded }: ValidationMessageBarsProps) => {
  const styles = useStyles();

  if (!manualValidation) {
    return (
      <MessageBar intent="success" className={styles.messageBar}>
        <MessageBarBody style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <MessageBarTitle>Automatic Document Processing Enabled</MessageBarTitle>
          Documents will be automatically validated and processed without manual intervention.
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (approvalNeeded) {
    return (
      <MessageBar intent="info" className={styles.messageBar}>
        <MessageBarBody style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <MessageBarTitle>Approval Configuration</MessageBarTitle>
          Approval settings will be fetched from document approval configuration. Documents will follow the complete validation and approval workflow.
        </MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <MessageBar intent="success" className={styles.messageBar}>
      <MessageBarBody style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        Documents will be automatically approved after successful validation by the assigned validators.
      </MessageBarBody>
    </MessageBar>
  );
}; 