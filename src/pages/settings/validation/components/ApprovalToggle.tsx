import { Card, Switch, Title3, Body1 } from '@fluentui/react-components';
import { CheckmarkCircleIcon } from '../icons';
import { makeStyles, tokens } from '@fluentui/react-components';

interface ApprovalToggleProps {
  approvalNeeded: boolean;
  onToggle: (checked: boolean) => void;
}

const useStyles = makeStyles({
  switchCard: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: tokens.spacingVerticalM,
      alignItems: 'stretch',
    },
  },
  switchContent: {
    flex: '1',
  },
  switchInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
  },
  iconWrapper: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
  },
});

export const ApprovalToggle = ({ approvalNeeded, onToggle }: ApprovalToggleProps) => {
  const styles = useStyles();

  return (
    <Card>
      <div className={styles.switchCard}>
        <div className={styles.switchContent}>
          <div className={styles.switchInfo}>
            <div className={styles.iconWrapper}>
              <CheckmarkCircleIcon />
            </div>
            <div>
              <Title3>Approval Needed</Title3>
              <br />
              <Body1>Enable this option if documents require approval after validation</Body1>
            </div>
          </div>
        </div>
        <Switch 
          checked={approvalNeeded}
          onChange={(ev) => onToggle(ev.currentTarget.checked)}
        />
      </div>
    </Card>
  );
}; 