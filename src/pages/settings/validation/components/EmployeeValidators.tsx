import { Body1, Badge, Button } from '@fluentui/react-components';
import { AddIcon, DismissIcon } from '../icons';
import { Employee } from '../types';
import styled from 'styled-components';
import { CardContainer } from '@/app/styles/layouts';
import { tokens } from '@fluentui/react-components';
import { CardHeader } from '@/components/card/card-header';



interface EmployeeValidatorsProps {
  selectedEmployees: Employee[];
  onAddClick: () => void;
  onRemoveEmployee: (empId: string) => void;
}

export const EmployeeValidators = ({ 
  selectedEmployees, 
  onAddClick, 
  onRemoveEmployee 
}: EmployeeValidatorsProps) => {
  return (
    <CardContainer>
      <CardHeader 
        text="Employees Responsible for Validation"
      />
      
      <SelectedEmployeesContainer>
        {selectedEmployees.length > 0 ? (
          selectedEmployees.map(employee => (
            <Badge key={employee.id} color="brand">
              {employee.avatar} {employee.name}
              <RemoveButton
                size="small"
                icon={<DismissIcon />}
                onClick={() => onRemoveEmployee(employee.id)}
                appearance="subtle"
                style={{ backgroundColor: 'transparent' }}
              />
            </Badge>
          ))
        ) : (
          <Body1>No employees selected</Body1>
        )}
      </SelectedEmployeesContainer>

      <AddValidatorButton
        appearance="subtle"
        icon={<AddIcon />}
        onClick={onAddClick}
      >
        Add Validator
      </AddValidatorButton>
    </CardContainer>
  );
}; 

const SelectedEmployeesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingHorizontalS};
`;

const AddValidatorButton = styled(Button)`
  justify-content: flex-start;
`;

const RemoveButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: white;
  background-color: transparent;
  z-index: 1000;
  &:hover {
    color: white;
    background-color: transparent;
  }
`;
