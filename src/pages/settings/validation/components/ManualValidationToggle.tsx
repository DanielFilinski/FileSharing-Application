import { Card, Switch, Title3, Body1 } from '@fluentui/react-components';
import { ShieldIcon } from '../icons';
import { makeStyles, tokens } from '@fluentui/react-components';

interface ManualValidationToggleProps {
  manualValidation: boolean;
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

export const ManualValidationToggle = ({ manualValidation, onToggle }: ManualValidationToggleProps) => {
  const styles = useStyles();

  return (
    <Card>
      <div className={styles.switchCard}>
        <div className={styles.switchContent}>
          <div className={styles.switchInfo}>
            <div className={styles.iconWrapper}>
              <ShieldIcon />
            </div>
            <div>
              <Title3>Manual Validation Needed</Title3>
              <br />
              <Body1>Enable this option if documents require manual validation before processing</Body1>
            </div>
          </div>
        </div>
        <Switch 
          checked={manualValidation}
          onChange={(ev) => onToggle(ev.currentTarget.checked)}
        />
      </div>
    </Card>
  );
}; 