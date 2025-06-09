import { Switch } from '@fluentui/react-components';
import { ShieldIcon } from '../icons';
import { tokens } from '@fluentui/react-components';
import styled from 'styled-components';
import { CardHeader } from '@/components/card/card-header';
import { CardContainer } from '@/app/styles/layouts';

interface ManualValidationToggleProps {
  manualValidation: boolean;
  onToggle: (checked: boolean) => void;
}



export const ManualValidationToggle = ({ manualValidation, onToggle }: ManualValidationToggleProps) => {
  return (
    <Container>      
      <CardHeader 
        text="Manual Validation Needed" icon={<ShieldIcon />} subtitle="Enable this option if documents require manual validation before processing" />        
      <Switch 
        checked={manualValidation}
        onChange={(ev) => onToggle(ev.currentTarget.checked)}
      />      
    </Container>
  );
}; 

const Container = styled(CardContainer)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingHorizontalL};
  @media (max-width: 768px) {
    gap: ${tokens.spacingVerticalM};
    align-items: center;
  }
`;
