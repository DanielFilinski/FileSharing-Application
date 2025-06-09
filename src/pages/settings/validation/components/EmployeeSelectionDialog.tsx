import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  SearchBox,
  Button,
  Avatar,
  Body1,
  Caption1,
  makeStyles,
  tokens,
  mergeClasses,
} from '@fluentui/react-components';
import { CheckmarkCircleIcon } from '../icons';
import { Employee } from '../types';

interface EmployeeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  selectedEmployees: Employee[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEmployeeSelect: (employee: Employee) => void;
  getDepartmentName: (deptId: string) => string;
}

const useStyles = makeStyles({
  dialogContent: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow16,
    '@media (max-width: 768px)': {
      maxWidth: '90vw',
      margin: tokens.spacingVerticalM,
    },
  },
  searchContainer: {
    width: '100%',
    marginBottom: tokens.spacingVerticalM,
    padding: `0 ${tokens.spacingHorizontalM}`,
  },
  employeeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '300px',
    overflowY: 'auto',
    padding: tokens.spacingVerticalS,
  },
  employeeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      transform: 'translateX(4px)',
    },
  },
  employeeSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flex: '1',
  },
  employeeDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  primaryButton: {
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
});

export const EmployeeSelectionDialog = ({
  open,
  onOpenChange,
  employees,
  selectedEmployees,
  searchTerm,
  onSearchChange,
  onEmployeeSelect,
  getDepartmentName,
}: EmployeeSelectionDialogProps) => {
  const styles = useStyles();

  return (
    <Dialog open={open} onOpenChange={(event, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogContent}>
        <DialogBody>
          <DialogTitle>Select Validators</DialogTitle>
          <DialogContent>
            <div className={styles.searchContainer}>
              <SearchBox
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(_, data) => onSearchChange(data.value)}
              />
            </div>
            
            <div className={styles.employeeList}>
              {employees.map(employee => {
                const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                
                return (
                  <div
                    key={employee.id}
                    className={mergeClasses(
                      styles.employeeItem,
                      isSelected && styles.employeeSelected
                    )}
                    onClick={() => onEmployeeSelect(employee)}
                  >
                    <div className={styles.employeeInfo}>
                      <Avatar>{employee.avatar}</Avatar>
                      <div className={styles.employeeDetails}>
                        <Body1>{employee.name}</Body1>
                        <Caption1>{getDepartmentName(employee.department)}</Caption1>
                      </div>
                    </div>
                    {isSelected && <CheckmarkCircleIcon color={tokens.colorBrandForeground1} />}
                  </div>
                );
              })}
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="primary"
              onClick={() => onOpenChange(false)}
              className={styles.primaryButton}
            >
              Done
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 