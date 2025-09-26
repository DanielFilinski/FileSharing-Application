import { ToggleButton } from '@fluentui/react-components';
import { PersonIcon, BuildingIcon, OrganizationIcon, DocumentIcon } from '../icons';
import { tokens } from '@fluentui/react-components';
import styled from 'styled-components';
import { CardHeader } from '@/components/card/card-header';
import { CardContainer } from '@/app/styles/layouts';
import { ValidationType } from '../types';

interface ValidationTypeSelectorProps {
  validationType: ValidationType;
  onTypeChange: (type: ValidationType) => void;
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
        <TypeButton
          checked={validationType === 'department'}
          onClick={() => onTypeChange('department')}
          icon={<OrganizationIcon />}
        >
          Department
        </TypeButton>
        <TypeButton
          checked={validationType === 'document'}
          onClick={() => onTypeChange('document')}
          icon={<DocumentIcon />}
        >
          By Document
        </TypeButton>
      </TypeSelector>
    </CardContainer>
  );
};

const TypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${tokens.spacingHorizontalM};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const TypeButton = styled(ToggleButton)`
  justify-content: center;
  
`;