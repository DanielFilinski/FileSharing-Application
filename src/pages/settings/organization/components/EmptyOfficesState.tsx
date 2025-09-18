import React from 'react';
import styled from 'styled-components';
import { Body1, Subtitle2, Text, tokens } from '@fluentui/react-components';
import { Building24Regular } from '@fluentui/react-icons';
import AccentIcon from '@/components/icon/accent-icon';


const EmptyOfficesState: React.FC = () => {
  return (
    <EmptyStateContainer>
      <AccentIcon icon={<StyledBuildingIcon />} />
      <Subtitle2>
        No offices added yet
      </Subtitle2>
      <Body1>
        Click "Add Office" to add your first office location
      </Body1>
    </EmptyStateContainer>
  );
};

export default EmptyOfficesState; 


const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalM};
  background-color: ${tokens.colorNeutralBackground1};
  border: 2px dashed ${tokens.colorNeutralStroke2};
  border-radius: ${tokens.borderRadiusSmall};
  text-align: center;

  @media (max-width: 640px) {
    padding: ${tokens.spacingVerticalXL} ${tokens.spacingHorizontalM};
  }
`;

const EmptyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: ${tokens.colorBrandBackground2};
  color: ${tokens.colorBrandForeground1};
  border-radius: ${tokens.borderRadiusMedium};
  margin-bottom: ${tokens.spacingVerticalM};
`;

const StyledBuildingIcon = styled(Building24Regular)`
  width: 32px;
  height: 32px;
`;