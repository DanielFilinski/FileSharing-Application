import { Switch } from '@fluentui/react-components';
import { CheckmarkCircleIcon } from '../icons';
import styled from 'styled-components';
import { CardContainer } from '@/app/styles/layouts';
import { CardHeader } from '@/components/card/card-header';

interface ApprovalToggleProps {
  approvalNeeded: boolean;
  onToggle: (checked: boolean) => void;
}

export const ApprovalToggle = ({ approvalNeeded, onToggle }: ApprovalToggleProps) => {
  return (
    <Container>
      <CardHeader 
        text="Approval Needed"
        icon={<CheckmarkCircleIcon />}
        subtitle="Enable this option if documents require approval after validation"
      />     
        
      <Switch 
        checked={approvalNeeded}
        onChange={(ev) => onToggle(ev.currentTarget.checked)}
      />      
    </Container>
  );
};

const Container = styled(CardContainer)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;