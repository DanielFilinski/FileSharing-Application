import { Body1, Badge, Button, Divider } from '@fluentui/react-components';
import { AddIcon, DismissIcon, OrganizationIcon } from '../icons';
import { Department, Employee, DepartmentValidators as DepartmentValidatorsType } from '../types';
import styled from 'styled-components';
import { CardContainer } from '@/app/styles/layouts';
import { tokens } from '@fluentui/react-components';
import { CardHeader } from '@/components/card/card-header';

interface DepartmentValidatorsProps {
  departments: Department[];
  departmentValidators: DepartmentValidatorsType;
  onAddClick: (departmentId: string) => void;
  onRemoveEmployee: (empId: string, departmentId: string) => void;
}

export const DepartmentValidators = ({ 
  departments,
  departmentValidators, 
  onAddClick, 
  onRemoveEmployee 
}: DepartmentValidatorsProps) => {
  return (
    <CardContainer>
      <CardHeader 
        text="Department Responsible for Validation"
        icon={<OrganizationIcon />}
      />
      
      <DepartmentsContainer>
        {departments.map(department => (
          <DepartmentSection key={department.id}>
            <DepartmentHeader>
              <Body1 weight="semibold">{department.name}</Body1>
            </DepartmentHeader>
            
            <SelectedEmployeesContainer>
              {departmentValidators[department.id]?.length > 0 ? (
                departmentValidators[department.id].map((employee: Employee) => (
                  <Badge key={employee.id} color="brand">
                    {employee.avatar} {employee.name}
                    <RemoveButton
                      size="small"
                      icon={<DismissIcon />}
                      onClick={() => onRemoveEmployee(employee.id, department.id)}
                      appearance="subtle"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </Badge>
                ))
              ) : (
                <Body1 style={{ color: tokens.colorNeutralForeground3 }}>No validators assigned</Body1>
              )}
            </SelectedEmployeesContainer>

            <AddValidatorButton
              appearance="subtle"
              icon={<AddIcon />}
              onClick={() => onAddClick(department.id)}
            >
              Add
            </AddValidatorButton>
          </DepartmentSection>
        ))}
      </DepartmentsContainer>
    </CardContainer>
  );
}; 

const DepartmentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalM};
`;

const DepartmentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalS};
  padding-bottom: ${tokens.spacingVerticalS};
  
  &:not(:last-child) {
    border-bottom: 1px solid ${tokens.colorNeutralStroke2};
  }
`;

const DepartmentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalS};
`;

const SelectedEmployeesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingHorizontalS};
`;

const AddValidatorButton = styled(Button)`
  justify-content: flex-start;
  align-self: flex-start;
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
