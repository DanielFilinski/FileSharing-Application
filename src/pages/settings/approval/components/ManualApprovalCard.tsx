import React from 'react';
import { Card, Switch } from '@fluentui/react-components';
import { CheckmarkCircle20Regular } from '@fluentui/react-icons';
import { useStyles } from '../styles';
import { CardHeader } from './CardHeader';

interface ManualApprovalCardProps {
  manualApprovalNeeded: boolean;
  onToggle: () => void;
}

export const ManualApprovalCard: React.FC<ManualApprovalCardProps> = ({
  manualApprovalNeeded,
  onToggle,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <div className={styles.cardContent} style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <CardHeader
          icon={<CheckmarkCircle20Regular />}
          title="Manual Approval Needed"
          description="Enable this to require manual approval for documents"
        />
        <Switch 
          checked={manualApprovalNeeded} 
          onChange={onToggle}
          aria-label="Toggle manual approval"
        />
      </div>
    </Card>
  );
}; 