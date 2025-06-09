import { Card, Title3, Body1, Badge, Button } from '@fluentui/react-components';
import { AddIcon, DismissIcon } from '../icons';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Employee } from '../types';

interface EmployeeValidatorsProps {
  selectedEmployees: Employee[];
  onAddClick: () => void;
  onRemoveEmployee: (empId: string) => void;
}

const useStyles = makeStyles({
  selectedEmployees: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  addValidatorButton: {
    justifyContent: 'flex-start',
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

export const EmployeeValidators = ({ 
  selectedEmployees, 
  onAddClick, 
  onRemoveEmployee 
}: EmployeeValidatorsProps) => {
  const styles = useStyles();

  return (
    <Card>
      <Title3>Employees Responsible for Validation</Title3>
      
      <div className={styles.selectedEmployees}>
        {selectedEmployees.length > 0 ? (
          selectedEmployees.map(employee => (
            <Badge key={employee.id} color="brand">
              {employee.avatar} {employee.name}
              <Button
                size="small"
                icon={<DismissIcon />}
                onClick={() => onRemoveEmployee(employee.id)}
                appearance="subtle"
                className={styles.removeButton}
              />
            </Badge>
          ))
        ) : (
          <Body1>No employees selected</Body1>
        )}
      </div>

      <Button
        appearance="subtle"
        icon={<AddIcon />}
        onClick={onAddClick}
        className={styles.addValidatorButton}
      >
        Add Validator
      </Button>
    </Card>
  );
}; 