import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent as FluentDialogContent,
  DialogActions,
  SearchBox,
  Button,
  Avatar,
  Body1,
  Caption1,
  tokens,
} from '@fluentui/react-components';
import { CheckmarkCircleIcon } from '../icons';
import { Employee } from '../types';
import styled from 'styled-components';
import { IconTitleContainer } from '@/app/styles/layouts';

interface EmployeeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  selectedEmployees: Employee[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEmployeeSelect: (employee: Employee) => void;
  getDepartmentName: (deptId: string) => string;
}

export const EmployeeSelectionDialog = ({
  open,
  onOpenChange,
  employees,
  selectedEmployees,
  searchTerm,
  onSearchChange,
  onEmployeeSelect,
  getDepartmentName,
}: EmployeeSelectionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(event, data) => onOpenChange(data.open)}>
      <StyledDialogSurface>
        <DialogBody>
          <DialogTitle>Select Validators</DialogTitle>
          <FluentDialogContent>
            <SearchContainer>
              <SearchBox
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(_, data) => onSearchChange(data.value)}
                style={{width: '100%'}}
              />
            </SearchContainer>
            
            <EmployeeList>
              {employees.map(employee => {
                const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                
                return (
                  <EmployeeItem
                    key={employee.id}
                    $isSelected={isSelected}
                    onClick={() => onEmployeeSelect(employee)}
                  >
                    <IconTitleContainer>
                      <Avatar>{employee.avatar}</Avatar>
                      <EmployeeDetails>
                        <Body1>{employee.name}</Body1>
                        <Caption1>{getDepartmentName(employee.department)}</Caption1>
                      </EmployeeDetails>
                    </IconTitleContainer>
                    {isSelected && <CheckmarkCircleIcon color={tokens.colorBrandForeground1} />}
                  </EmployeeItem>
                );
              })}
            </EmployeeList>
          </FluentDialogContent>
          <DialogActions>
            <PrimaryButton
              appearance="primary"
              onClick={() => onOpenChange(false)}
            >
              Done
            </PrimaryButton>
          </DialogActions>
        </DialogBody>
      </StyledDialogSurface>
    </Dialog>
  );
};

const StyledDialogSurface = styled(DialogSurface)`
  width: 100%;
  max-width: 500px;
  border-radius: ${tokens.borderRadiusLarge};
  box-shadow: ${tokens.shadow16};
  
  @media (max-width: 768px) {
    max-width: 90vw;
    margin: ${tokens.spacingVerticalM};
  }
`;

const SearchContainer = styled.div`
  width: 100%;
  margin-bottom: ${tokens.spacingVerticalM};
  padding: 0;
`;

const EmployeeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalS};
  max-height: 300px;
  overflow-y: auto;
  padding: ${tokens.spacingVerticalS};
`;

const EmployeeItem = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${tokens.spacingVerticalS} ${tokens.spacingHorizontalM};
  border-radius: ${tokens.borderRadiusMedium};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isSelected ? tokens.colorBrandBackground2 : 'transparent'};
  
  &:hover {
    background-color: ${props => 
      props.$isSelected 
        ? tokens.colorBrandBackground2Hover 
        : tokens.colorNeutralBackground1Hover
    };
    transform: translateX(4px);
  }
`;

const EmployeeDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalXXS};
`;

const PrimaryButton = styled(Button)`
  background-color: ${tokens.colorBrandBackground};
  border-radius: ${tokens.borderRadiusMedium};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${tokens.colorBrandBackgroundHover};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`; 