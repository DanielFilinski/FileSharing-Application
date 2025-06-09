import { Card, Title3, Body1, Subtitle1, Caption1, Badge, Button } from '@fluentui/react-components';
import { BuildingIcon, AddIcon, DismissIcon } from '../icons';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Employee, Office, OfficeValidators as OfficeValidatorsType } from '../types';

interface OfficeValidatorsProps {
  offices: Office[];
  officeValidators: OfficeValidatorsType;
  onAddClick: (officeId: string) => void;
  onRemoveEmployee: (empId: string, officeId: string) => void;
}

const useStyles = makeStyles({
  officeCard: {
    marginBottom: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
  },
  officeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: tokens.spacingVerticalS,
    },
  },
  officeTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  selectedEmployees: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  removeButton: {
    padding: '0px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    color: 'white',
    backgroundColor: 'transparent',
    zIndex: 1000,
    '&:hover': {
      color: 'white',
      backgroundColor: 'transparent',
    },
  },
});

export const OfficeValidators = ({
  offices,
  officeValidators,
  onAddClick,
  onRemoveEmployee,
}: OfficeValidatorsProps) => {
  const styles = useStyles();

  return (
    <Card>
      <Title3>Office-Specific Validators</Title3>
      <Body1>Assign validators to specific office locations</Body1>
      
      <div style={{ marginTop: tokens.spacingVerticalM }}>
        {offices.map(office => (
          <div key={office.id} className={styles.officeCard}>
            <div className={styles.officeHeader}>
              <div className={styles.officeTitle}>
                <BuildingIcon/>
                <Subtitle1>{office.name}</Subtitle1>
              </div>
              <Button
                appearance="subtle"
                icon={<AddIcon />}
                onClick={() => onAddClick(office.id)}
              >
                Add
              </Button>
            </div>

            <div className={styles.selectedEmployees}>
              {officeValidators[office.id]?.length > 0 ? (
                officeValidators[office.id].map(validator => (
                  <Badge key={validator.id} color="brand">
                    {validator.avatar} {validator.name}
                    <Button                                
                      size="small"
                      icon={<DismissIcon />}
                      onClick={() => onRemoveEmployee(validator.id, office.id)}
                      className={styles.removeButton}
                    />
                  </Badge>
                ))
              ) : (
                <Caption1>No validators assigned</Caption1>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}; 