import React from 'react';
import styled from 'styled-components';
import {
  Button,
  Text,
  tokens,
} from '@fluentui/react-components';
import {
  Building24Regular,
  Location24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';

interface OfficeItemProps {
  name: string;
  address: string;
  onRemove: () => void;
}


const OfficeItem: React.FC<OfficeItemProps> = ({ name, address, onRemove }) => {
  return (
    <OfficeItemContainer>
      <RemoveButton
        appearance="subtle"
        icon={<Delete24Regular />}
        size="small"
        onClick={onRemove}
      />
      
      <OfficeContent>
        <OfficeIcon>
          <Building24Regular />
        </OfficeIcon>
        
        <OfficeDetails>
          <OfficeName weight="medium">
            {name}
          </OfficeName>
          <OfficeAddress>
            <Location24Regular fontSize="14" />
            <Text size={200}>{address}</Text>
          </OfficeAddress>
        </OfficeDetails>
      </OfficeContent>
    </OfficeItemContainer>
  );
};

export default OfficeItem; 



const OfficeItemContainer = styled.div`
  padding: ${tokens.spacingVerticalM};
  border: 1px solid ${tokens.colorNeutralStroke2};
  border-radius: ${tokens.borderRadiusSmall};
  background-color: ${tokens.colorNeutralBackground1};
  position: relative;
  transition: border-color 0.2s ease;

  &:hover {
    border: 1px solid ${tokens.colorBrandStroke1};
    box-shadow: 0 1px 3px ${tokens.colorBrandBackground}1A;
  }
`;

const OfficeContent = styled.div`
  display: flex;
  gap: ${tokens.spacingHorizontalM};
  align-items: flex-start;
`;

const OfficeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: ${tokens.colorBrandBackground2};
  color: ${tokens.colorBrandForeground1};
  border-radius: ${tokens.borderRadiusSmall};
  flex-shrink: 0;
`;

const OfficeDetails = styled.div`
  flex: 1;
`;

const OfficeName = styled(Text)`
  font-weight: ${tokens.fontWeightMedium};
  margin-bottom: ${tokens.spacingVerticalXXS};
`;

const OfficeAddress = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalXXS};
  color: ${tokens.colorNeutralForeground2};
`;

const RemoveButton = styled(Button)`
  position: absolute;
  top: ${tokens.spacingVerticalS};
  right: ${tokens.spacingHorizontalS};
  width: 24px;
  height: 24px;
  min-width: 24px;
`;