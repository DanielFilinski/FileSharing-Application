import React from 'react';
import { Switch } from '@fluentui/react-components';
import { CheckmarkCircle20Regular } from '@fluentui/react-icons';
import { CardContainer } from '../../../../app/styles/layouts';
import styled from 'styled-components';
import { CardHeader } from '@/components/card/card-header';


interface ManualApprovalCardProps {
  manualApprovalNeeded: boolean;
  onToggle: () => void;
}

export const ManualApprovalCard: React.FC<ManualApprovalCardProps> = ({
  manualApprovalNeeded,
  onToggle,
}) => {
  return (    
      <Container>
        <CardHeader
          icon={<CheckmarkCircle20Regular />}
          text="Manual Approval Needed"
          subtitle="Enable this to require manual approval for documents"
        />
        <Switch 
          checked={manualApprovalNeeded} 
          onChange={onToggle}
          aria-label="Toggle manual approval"
        />
      </Container>
  );
}; 


const Container = styled(CardContainer)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;