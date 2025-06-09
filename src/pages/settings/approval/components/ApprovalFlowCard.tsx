import React from 'react';
import { Card, RadioGroup, Radio, Text, Subtitle2, Body1, Caption1 } from '@fluentui/react-components';
import { FlashRegular } from '@fluentui/react-icons';
import { useStyles } from '../styles';
import { CardHeader } from './CardHeader';

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
  const styles = useStyles();

  if (selectedDepartments.length <= 1) {
    return null;
  }

  return (
    <Card className={styles.card}>
      <div className={styles.cardContent}>
        <CardHeader
          icon={<FlashRegular />}
          title="Approval Flow"
          description="Choose how approvals flow between departments"
        />
        
        <RadioGroup
          value={approvalFlow}
          onChange={(_, data) => onApprovalFlowChange(data.value)}
          className={styles.radioGroup}
          aria-label="Select approval flow type"
        >
          <div 
            className={`${styles.radioOption} ${approvalFlow === 'parallel' ? styles.radioOptionSelected : ''}`}
            onClick={() => onApprovalFlowChange('parallel')}
          >
            <Radio value="parallel" />
            <div className={styles.textContainer}>
              <Subtitle2>Parallel</Subtitle2>
              <Body1>All departments approve at once</Body1>
            </div>
          </div>
          
          <div 
            className={`${styles.radioOption} ${approvalFlow === 'consecutive' ? styles.radioOptionSelected : ''}`}
            onClick={() => onApprovalFlowChange('consecutive')}
          >
            <Radio value="consecutive" />
            <div className={styles.textContainer}>
              <Subtitle2>Consecutive</Subtitle2>
              <Body1>One department approves after another</Body1>
            </div>
          </div>
        </RadioGroup>
        
        {approvalFlow === 'consecutive' && (
          <div className={styles.sequentialSection}>
            <Text weight="semibold" className={styles.sequentialTitle}>
              Sequential approval order:
            </Text>
            
            <div className={styles.sequentialList}>
              {selectedDepartments.map((dept, index) => (
                <div key={index} className={styles.sequentialItem}>
                  <div className={styles.sequentialNumber}>
                    {index + 1}
                  </div>
                  <Text>{dept}</Text>
                </div>
              ))}
            </div>
            
            <Caption1 className={styles.hint}>
              💡 Drag departments to reorder
            </Caption1>
          </div>
        )}
      </div>
    </Card>
  );
}; 