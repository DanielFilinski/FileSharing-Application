import React, { useState } from 'react';
import { Dropdown, Option, Text, Subtitle2, Checkbox, Avatar, Badge } from '@fluentui/react-components';
import { Building20Regular, BuildingRegular, ChevronDownRegular } from '@fluentui/react-icons';
import { CardContainer, CardItemContainer, RowCardItemContainer } from '@/app/styles/layouts';
import styled from 'styled-components';
import { tokens } from '@fluentui/react-components';
import { CardHeader } from '@/components/card/card-header';



interface EmployeeSelectionCardProps {
  offices: string[];
  employeesByOffice: Record<string, string[]>;
  selectedOffices: string[];
  employeesBySelectedOffice: Record<string, string[]>;
  onOfficeToggle: (office: string) => void;
  onEmployeeToggle: (office: string, employee: string) => void;
}

export const EmployeeSelectionCard: React.FC<EmployeeSelectionCardProps> = ({
  offices,
  employeesByOffice,
  selectedOffices,
  employeesBySelectedOffice,
  onOfficeToggle,
  onEmployeeToggle,
}) => {
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

  return (
    <Container>
      <CardHeader
        icon={<Building20Regular />}
        text="Employee Selection"
        subtitle="Select employees based on offices for approval"
      />
      
      <DropdownWrapper>
        <StyledDropdown
          placeholder="Select offices"
          multiselect
          value={selectedOffices.join(', ')}
          aria-label="Select offices for employee selection"
        >
          {offices.map((office) => (
            <Option
              key={office}
              text={office}
              onClick={() => onOfficeToggle(office)}
            >
              <OptionContent>
                <Text>{office}</Text>
              </OptionContent>
            </Option>
          ))}
        </StyledDropdown>
      </DropdownWrapper>
      
      {selectedOffices.length > 0 && (
        <RowCardItemContainer>
          {selectedOffices.map((office) => (
            <EmployeeCard key={office}>
              <EmployeeHeader
                onClick={() => setExpandedOffice(expandedOffice === office ? null : office)}
              >
                <EmployeeHeaderContent>
                  <EmployeeIcon />
                  <Subtitle2>{office}</Subtitle2>
                  {(employeesBySelectedOffice[office]?.length || 0) > 0 && (
                    <Badge appearance="filled" size="small">
                      {employeesBySelectedOffice[office]?.length || 0} selected
                    </Badge>
                  )}
                </EmployeeHeaderContent>
                <Chevron expanded={expandedOffice === office} />
              </EmployeeHeader>
              
              {expandedOffice === office && (
                <EmployeeList>
                  {employeesByOffice[office].map((employee, index) => (
                    <EmployeeItem
                      key={index}
                      onClick={() => onEmployeeToggle(office, employee)}
                    >
                      <Checkbox 
                        checked={employeesBySelectedOffice[office]?.includes(employee) || false}
                        aria-label={`Select ${employee}`}
                      />
                      <EmployeeAvatar
                        name={employee}
                        size={32}
                      />
                      <Text>{employee}</Text>
                    </EmployeeItem>
                  ))}
                </EmployeeList>
              )}
            </EmployeeCard>
          ))}
        </RowCardItemContainer>
      )}
    </Container>
  );
}; 

const Container = styled(CardContainer)`
  display: flex;
  flex-direction: column;
`;

const DropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledDropdown = styled(Dropdown)`
  width: 100%;
  min-width: 200px;
`;

const OptionContent = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;


const EmployeeCard = styled(CardItemContainer)`
  background-color: ${tokens.colorNeutralBackground2};
`;

const EmployeeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  &:hover {
    background-color: ${tokens.colorNeutralBackground2Hover};
  }

  @media (max-width: 767px) {
  }
`;

const EmployeeHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalM};
`;

const EmployeeIcon = styled(BuildingRegular)`
  font-size: 16px;
  color: ${tokens.colorNeutralForeground2};
`;

const Chevron = styled(ChevronDownRegular)<{ expanded?: boolean }>`
  font-size: 16px;
  color: ${tokens.colorNeutralForeground3};
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'none'};
`;

const EmployeeList = styled.div`
  padding: 0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM};
  border-top: 1px solid ${tokens.colorNeutralStroke2};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingHorizontalS};
`;

const EmployeeItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalM};
  cursor: pointer;
  padding: ${tokens.spacingVerticalS};
  border-radius: ${tokens.borderRadiusSmall};

  &:hover {
    background-color: ${tokens.colorNeutralBackground1Hover};
  }
`;

const EmployeeAvatar = styled(Avatar)`
  flex-shrink: 0;
`;
