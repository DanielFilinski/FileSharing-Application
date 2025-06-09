import { ToggleButton } from '@fluentui/react-components';
import { PersonIcon, BuildingIcon } from '../icons';
import { tokens } from '@fluentui/react-components';
import styled from 'styled-components';
import { CardHeader } from '@/components/card/card-header';
import { CardContainer } from '@/app/styles/layouts';

interface ValidationTypeSelectorProps {
  validationType: 'employee' | 'office';
  onTypeChange: (type: 'employee' | 'office') => void;
}


export const ValidationTypeSelector = ({ validationType, onTypeChange }: ValidationTypeSelectorProps) => {
  return (
    <CardContainer>
      <CardHeader 
        text="Validation Assignment" 
        icon={<PersonIcon />} 
      />     
      
      <TypeSelector>
        <TypeButton
          checked={validationType === 'employee'}
          onClick={() => onTypeChange('employee')}
          icon={<PersonIcon />}
        >
          Employees
        </TypeButton>
        <TypeButton
          checked={validationType === 'office'}
          onClick={() => onTypeChange('office')}
          icon={<BuildingIcon />}
        >
          By Office
        </TypeButton>
      </TypeSelector>
    </CardContainer>
  );
};

const TypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${tokens.spacingHorizontalM};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TypeButton = styled(ToggleButton)`
  justify-content: center;
  
`;