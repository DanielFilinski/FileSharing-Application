import { MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components';
import { tokens } from '@fluentui/react-components';
import styled from 'styled-components';
import { MarginBottom } from '../../../../app/styles/layouts';

interface ValidationMessageBarsProps {
  manualValidation: boolean;
  approvalNeeded: boolean;
}


export const ValidationMessageBars = ({ manualValidation, approvalNeeded }: ValidationMessageBarsProps) => {
  if (!manualValidation) {
    return (
      <MarginBottom>
        <StyledMessageBar intent="success">
          <StyledMessageBarBody>
            <MessageBarTitle>Automatic Document Processing Enabled</MessageBarTitle>
            Documents will be automatically validated and processed without manual intervention.
          </StyledMessageBarBody>
        </StyledMessageBar>
      </MarginBottom>
    );
  }

  if (approvalNeeded) {
    return (
      <MarginBottom>
        <StyledMessageBar intent="info">
          <StyledMessageBarBody>
            <MessageBarTitle>Approval Configuration</MessageBarTitle>
            Approval settings will be fetched from document approval configuration. Documents will follow the complete validation and approval workflow.
          </StyledMessageBarBody>
        </StyledMessageBar>
      </MarginBottom>
    );
  }

  return (
    <MarginBottom>
      <StyledMessageBar intent="success">
        <StyledMessageBarBody>
          Documents will be automatically approved after successful validation by the assigned validators.
        </StyledMessageBarBody>
      </StyledMessageBar>
    </MarginBottom>
  );
}; 


const StyledMessageBar = styled(MessageBar)`
  padding: ${tokens.spacingHorizontalL};
`;

const StyledMessageBarBody = styled(MessageBarBody)`
  white-space: pre-wrap;
  word-break: break-word;
`;
