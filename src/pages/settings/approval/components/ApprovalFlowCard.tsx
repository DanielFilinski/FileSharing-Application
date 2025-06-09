import React from 'react';
import { RadioGroup, Radio, Text, Subtitle2, Body1, Caption1 } from '@fluentui/react-components';
import { FlashRegular } from '@fluentui/react-icons';

import { CardContainer, RowCardItemContainer, TextRowsContainer } from '@/app/styles/layouts';
import styled from 'styled-components';
import { tokens } from '@fluentui/react-components';
import { CardHeader } from '@/components/card/card-header';



interface ApprovalFlowCardProps {
  approvalFlow: string;
  selectedDepartments: string[];
  onApprovalFlowChange: (flow: string) => void;
}

export const ApprovalFlowCard: React.FC<ApprovalFlowCardProps> = ({
  approvalFlow,
  selectedDepartments,
  onApprovalFlowChange,
}) => {
  if (selectedDepartments.length <= 1) {
    return null;
  }

  return (
    <Container>
      <CardHeader
        icon={<FlashRegular />}
        text="Approval Flow"
        subtitle="Choose how approvals flow between departments"
      />
      
      <RadioGroup
        value={approvalFlow}
        onChange={(_, data) => onApprovalFlowChange(data.value)}
        aria-label="Select approval flow type"
      >
        <RowCardItemContainer style={{ width: '100%' }}>
<RadioOption 
          selected={approvalFlow === 'parallel'}
          onClick={() => onApprovalFlowChange('parallel')}
        >
          <Radio value="parallel" />
          <TextRowsContainer style={{ gap: 0 }}>
            <Subtitle2>Parallel</Subtitle2>
            <Body1>All departments approve at once</Body1>
          </TextRowsContainer>
        </RadioOption>
        
        <RadioOption 
          selected={approvalFlow === 'consecutive'}
          onClick={() => onApprovalFlowChange('consecutive')}
        >
          <Radio value="consecutive" />
          <TextRowsContainer style={{ gap: 0 }}>
            <Subtitle2>Consecutive</Subtitle2>
            <Body1>One department approves after another</Body1>
          </TextRowsContainer>
        </RadioOption>

        </RowCardItemContainer>        
      </RadioGroup>
      
      {approvalFlow === 'consecutive' && (
        <SequentialSection>
          <SequentialTitle weight="semibold">
            Sequential approval order:
          </SequentialTitle>
          
          <SequentialList>
            {selectedDepartments.map((dept, index) => (
              <SequentialItem key={index}>
                <SequentialNumber>
                  {index + 1}
                </SequentialNumber>
                <Text>{dept}</Text>
              </SequentialItem>
            ))}
          </SequentialList>
          
          <Hint>
            💡 Drag departments to reorder
          </Hint>
        </SequentialSection>
      )}
    </Container>
  );
}; 


const Container = styled(CardContainer)`
  display: flex;
  flex-direction: column;
`;

const RadioOption = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  gap: ${tokens.spacingHorizontalM};
  padding: ${tokens.spacingVerticalM};
  border-radius: ${tokens.borderRadiusMedium};
  border: 2px solid ${props => props.selected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1};
  background-color: ${props => props.selected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.selected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1Hover};
    border: 2px solid ${props => props.selected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1Hover};
  }

  @media (max-width: 767px) {
    padding: ${tokens.spacingVerticalS};
  }
`;

const SequentialSection = styled.div`
  padding: ${tokens.spacingVerticalM};
  background-color: ${tokens.colorNeutralBackground2};
  border-radius: ${tokens.borderRadiusMedium};
  border: 1px solid ${tokens.colorNeutralStroke2};
`;

const SequentialTitle = styled(Text)`
  color: ${tokens.colorBrandForeground1};
`;

const SequentialList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingHorizontalS};
  margin-bottom: ${tokens.spacingVerticalM};
  margin-top: ${tokens.spacingVerticalS};
`;

const SequentialItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalM};
`;

const SequentialNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${tokens.colorBrandBackground};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${tokens.fontSizeBase200};
  font-weight: ${tokens.fontWeightSemibold};
  flex-shrink: 0;
`;

const Hint = styled(Caption1)`
  color: ${tokens.colorNeutralForeground3};
  font-style: italic;
`;