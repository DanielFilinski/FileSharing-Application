import { Card, ToggleButton, Title3 } from '@fluentui/react-components';
import { PersonIcon, BuildingIcon } from '../icons';
import { makeStyles, tokens } from '@fluentui/react-components';

interface ValidationTypeSelectorProps {
  validationType: 'employee' | 'office';
  onTypeChange: (type: 'employee' | 'office') => void;
}

const useStyles = makeStyles({
  switchInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
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
  typeSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  typeButton: {
    minHeight: '50px',
    justifyContent: 'center',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
});

export const ValidationTypeSelector = ({ validationType, onTypeChange }: ValidationTypeSelectorProps) => {
  const styles = useStyles();

  return (
    <Card>
      <div className={styles.switchInfo}>
        <div className={styles.iconWrapper}>
          <PersonIcon />
        </div>
        <div>
          <Title3>Validation Assignment</Title3>
        </div>
      </div>
      
      <div className={styles.typeSelector}>
        <ToggleButton
          checked={validationType === 'employee'}
          onClick={() => onTypeChange('employee')}
          icon={<PersonIcon />}
          className={styles.typeButton}
        >
          Employees
        </ToggleButton>
        <ToggleButton
          checked={validationType === 'office'}
          onClick={() => onTypeChange('office')}
          icon={<BuildingIcon />}
          className={styles.typeButton}
        >
          By Office
        </ToggleButton>
      </div>
    </Card>
  );
}; 