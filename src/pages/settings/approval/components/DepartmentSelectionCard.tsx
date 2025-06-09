import React from 'react';
import { Dropdown, Option, Text } from '@fluentui/react-components';
import { People20Regular } from '@fluentui/react-icons';
import { CardHeader } from './CardHeader';
import { CardContainer } from '../../../../app/styles/layouts';
import styled from 'styled-components';
import { tokens } from '@fluentui/react-components';

interface DepartmentSelectionCardProps {
  departments: string[];
  selectedDepartments: string[];
  onDepartmentToggle: (dept: string) => void;
}


export const DepartmentSelectionCard: React.FC<DepartmentSelectionCardProps> = ({
  departments,
  selectedDepartments,
  onDepartmentToggle,
}) => {
  return (
    <Container>
      <CardHeader
        icon={<People20Regular />}
        title="Department Selection"
        description="Choose which departments need to approve documents"
      />
      
      <DropdownWrapper>
        <StyledDropdown
          placeholder="Select departments"
          multiselect
          value={selectedDepartments.join(', ')}
          aria-label="Select departments for approval"
        >
          {departments.map((dept) => (
            <Option
              key={dept}
              text={dept}
              onClick={() => onDepartmentToggle(dept)}
            >
              <OptionContent>
                <Text>{dept}</Text>
              </OptionContent>
            </Option>
          ))}
        </StyledDropdown>
      </DropdownWrapper>
    </Container>
  );
}; 

const Container = styled(CardContainer)`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalM};
`;

const DropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalM};
`;

const StyledDropdown = styled(Dropdown)`
  width: 100%;
  min-width: 200px;
`;

const OptionContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalS};
  width: 100%;
`;

