import React, { useState, useEffect } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Card,
  CardHeader,
  CardPreview,
  Button,
  Switch,
  Text,
  Title1,
  Title2,
  Title3,
  Subtitle1,
  Body1,
  Caption1,
  Avatar,
  AvatarGroup,
  SearchBox,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Checkbox,
  tokens,
  makeStyles,
  shorthands,
  mergeClasses,
  Badge,
  Divider,
  Textarea,
  Field,
  Label,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  ToggleButton,
  RadioGroup,
  Radio
} from '@fluentui/react-components';
import {
  Shield20Regular,
  Shield20Filled,
  Save20Regular,
  Save20Filled,
  Person20Regular,
  Person20Filled,
  Building20Regular,
  Building20Filled,
  Add20Regular,
  Add20Filled,
  Dismiss20Regular,
  Search20Regular,
  CheckmarkCircle20Regular,
  CheckmarkCircle20Filled,
  Info20Regular,
  Warning20Regular,
  bundleIcon
} from '@fluentui/react-icons';

// Bundle icons for better performance
const ShieldIcon = bundleIcon(Shield20Filled, Shield20Regular);
const SaveIcon = bundleIcon(Save20Filled, Save20Regular);
const PersonIcon = bundleIcon(Person20Filled, Person20Regular);
const BuildingIcon = bundleIcon(Building20Filled, Building20Regular);
const AddIcon = bundleIcon(Add20Filled, Add20Regular);
const CheckmarkCircleIcon = bundleIcon(CheckmarkCircle20Filled, CheckmarkCircle20Regular);

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    fontFamily: tokens.fontFamilyBase,
  },
  header: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalXL),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '@media (max-width: 768px)': {
      ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
      flexDirection: 'column',
      ...shorthands.gap(tokens.spacingVerticalM),
    },
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  brandIcon: {
    color: tokens.colorBrandForeground1,
  },
  content: {
    flex: '1',
    overflowY: 'auto',
    ...shorthands.padding(tokens.spacingVerticalL, 0),
    '@media (max-width: 768px)': {
      ...shorthands.padding(tokens.spacingVerticalM, 0),
    },
  },
  contentWrapper: {
    maxWidth: '768px',
    ...shorthands.margin(0, 'auto'),
    ...shorthands.padding(0, tokens.spacingHorizontalXL),
    '@media (max-width: 768px)': {
      ...shorthands.padding(0, tokens.spacingHorizontalM),
    },
  },
  section: {
    ...shorthands.margin(0, 0, tokens.spacingVerticalL, 0),
  },
  card: {
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  switchCard: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...shorthands.gap(tokens.spacingHorizontalL),
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      ...shorthands.gap(tokens.spacingVerticalM),
      alignItems: 'stretch',
    },
  },
  switchContent: {
    flex: '1',
  },
  switchInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  iconWrapper: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    ...shorthands.padding(tokens.spacingVerticalXS),
    borderRadius: tokens.borderRadiusSmall,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
  },
  typeSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalM,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  typeButton: {
    minHeight: '60px',
    justifyContent: 'flex-start',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
  },
  selectedEmployees: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginBottom: tokens.spacingVerticalM,
  },
  employeeList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    maxHeight: '300px',
    overflowY: 'auto',
  },
  employeeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  employeeSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    flex: '1',
  },
  employeeDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  officeCard: {
    ...shorthands.margin(0, 0, tokens.spacingVerticalM, 0),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  officeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      ...shorthands.gap(tokens.spacingVerticalS),
    },
  },
  officeTitle: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  dialogContent: {
    width: '100%',
    maxWidth: '500px',
    '@media (max-width: 768px)': {
      maxWidth: '90vw',
      ...shorthands.margin(tokens.spacingVerticalM),
    },
  },
  searchContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
  primaryButton: {
    backgroundColor: tokens.colorBrandBackground,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  messageBar: {
    marginBottom: tokens.spacingVerticalM,
  },
  responsive: {
    '@media (max-width: 550px)': {
      fontSize: tokens.fontSizeBase200,
      ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    },
  },
});

interface Employee {
  id: string;
  name: string;
  department: string;
  avatar: string;
}

interface Department {
  id: string;
  name: string;
}

interface Office {
  id: string;
  name: string;
}

interface OfficeValidators {
  [key: string]: Employee[];
}

const TeamsValidationSettings = () => {
  const styles = useStyles();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [manualValidation, setManualValidation] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [validationType, setValidationType] = useState<'employee' | 'office'>('employee');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [officeValidators, setOfficeValidators] = useState<OfficeValidators>({});
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOfficeId, setCurrentOfficeId] = useState<string>('');

  // Mock data
  const departments: Department[] = [
    { id: 'dept1', name: 'Legal Department' },
    { id: 'dept2', name: 'Finance Department' },
    { id: 'dept3', name: 'Operations' },
  ];

  const employees: Employee[] = [
    { id: 'emp1', name: 'John Doe', department: 'dept1', avatar: '👨🏻‍💼' },
    { id: 'emp2', name: 'Jane Smith', department: 'dept1', avatar: '👩🏼‍💼' },
    { id: 'emp3', name: 'Alice Johnson', department: 'dept2', avatar: '👩🏾‍💼' },
    { id: 'emp4', name: 'Bob Williams', department: 'dept2', avatar: '👨🏽‍💼' },
    { id: 'emp5', name: 'Charlie Brown', department: 'dept3', avatar: '👨🏻‍💼' },
    { id: 'emp6', name: 'Diana Prince', department: 'dept3', avatar: '👩🏻‍💼' },
  ];

  const offices: Office[] = [
    { id: 'off1', name: 'Headquarters' },
    { id: 'off2', name: 'Regional Office' },
    { id: 'off3', name: 'Satellite Office' },
  ];

  useEffect(() => {
    const initialOfficeValidators: OfficeValidators = {};
    offices.forEach(office => {
      initialOfficeValidators[office.id] = [];
    });
    setOfficeValidators(initialOfficeValidators);
  }, []);

  const getDepartmentName = (deptId: string) => {
    const department = departments.find(dept => dept.id === deptId);
    return department ? department.name : '';
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeSelect = (employee: Employee) => {
    if (validationType === 'employee') {
      if (selectedEmployees.find(emp => emp.id === employee.id)) {
        setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employee.id));
      } else {
        setSelectedEmployees([...selectedEmployees, employee]);
      }
    } else if (validationType === 'office' && currentOfficeId) {
      const updatedValidators = { ...officeValidators };
      if (updatedValidators[currentOfficeId].find(emp => emp.id === employee.id)) {
        updatedValidators[currentOfficeId] = updatedValidators[currentOfficeId].filter(emp => emp.id !== employee.id);
      } else {
        updatedValidators[currentOfficeId] = [...updatedValidators[currentOfficeId], employee];
      }
      setOfficeValidators(updatedValidators);
    }
  };

  const openEmployeeDialog = (officeId?: string) => {
    if (officeId) {
      setCurrentOfficeId(officeId);
    }
    setShowEmployeeDialog(true);
  };

  const removeEmployee = (empId: string, officeId?: string) => {
    if (validationType === 'employee') {
      setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== empId));
    } else if (officeId) {
      const updatedValidators = { ...officeValidators };
      updatedValidators[officeId] = updatedValidators[officeId].filter(emp => emp.id !== empId);
      setOfficeValidators(updatedValidators);
    }
  };

  const handleSave = () => {
    console.log('Saving settings...');
  };

  const theme = isDarkMode ? webDarkTheme : webLightTheme;

  return (
    
      <div className={styles.root}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <ShieldIcon className={styles.brandIcon} />
            <Title2>Validation Settings</Title2>
          </div>
          <Button 
            appearance="primary" 
            icon={<SaveIcon />}
            onClick={handleSave}
            className={styles.primaryButton}
          >
            Save changes
          </Button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.contentWrapper}>
            
            {/* Manual Validation Toggle */}
            <div className={styles.section}>
              <Card className={styles.card}>
                <div className={styles.switchCard}>
                  <div className={styles.switchContent}>
                    <div className={styles.switchInfo}>
                      <div className={styles.iconWrapper}>
                        <ShieldIcon />
                      </div>
                      <div>
                        <Title3>Manual Validation Needed</Title3>
                        <Body1>Enable this option if documents require manual validation before processing</Body1>
                      </div>
                    </div>
                  </div>
                  <Switch 
                    checked={manualValidation}
                    onChange={(ev) => setManualValidation(ev.currentTarget.checked)}
                  />
                </div>
              </Card>
            </div>

            {manualValidation && (
              <>
                {/* Validation Type Selector */}
                <div className={styles.section}>
                  <Card className={styles.card}>
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
                        onClick={() => setValidationType('employee')}
                        icon={<PersonIcon />}
                        className={styles.typeButton}
                      >
                        Employees
                      </ToggleButton>
                      <ToggleButton
                        checked={validationType === 'office'}
                        onClick={() => setValidationType('office')}
                        icon={<BuildingIcon />}
                        className={styles.typeButton}
                      >
                        By Office
                      </ToggleButton>
                    </div>
                  </Card>
                </div>

                {/* Employee Validators */}
                {validationType === 'employee' && (
                  <div className={styles.section}>
                    <Card className={styles.card}>
                      <Title3>Employees Responsible for Validation</Title3>
                      
                      <div className={styles.selectedEmployees}>
                        {selectedEmployees.length > 0 ? (
                          selectedEmployees.map(employee => (
                            <Badge key={employee.id} color="brand">
                              {employee.avatar} {employee.name}
                              <Button
                                size="small"
                                icon={<Dismiss20Regular />}
                                onClick={() => removeEmployee(employee.id)}
                                appearance="subtle"
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
                        onClick={() => openEmployeeDialog()}
                      >
                        Add Validator
                      </Button>
                    </Card>
                  </div>
                )}

                {/* Office Validators */}
                {validationType === 'office' && (
                  <div className={styles.section}>
                    <Card className={styles.card}>
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
                                onClick={() => openEmployeeDialog(office.id)}
                              >
                                Add Validator
                              </Button>
                            </div>

                            <div className={styles.selectedEmployees}>
                              {officeValidators[office.id]?.length > 0 ? (
                                officeValidators[office.id].map(validator => (
                                  <Badge key={validator.id} color="brand">
                                    {validator.avatar} {validator.name}
                                    <Button
                                      size="small"
                                      icon={<Dismiss20Regular />}
                                      onClick={() => removeEmployee(validator.id, office.id)}
                                      appearance="subtle"
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
                  </div>
                )}

                {/* Approval Toggle */}
                <div className={styles.section}>
                  <Card className={styles.card}>
                    <div className={styles.switchCard}>
                      <div className={styles.switchContent}>
                        <div className={styles.switchInfo}>
                          <div className={styles.iconWrapper}>
                            <CheckmarkCircleIcon />
                          </div>
                          <div>
                            <Title3>Approval Needed</Title3>
                            <Body1>Enable this option if documents require approval after validation</Body1>
                          </div>
                        </div>
                      </div>
                      <Switch 
                        checked={approvalNeeded}
                        onChange={(ev) => setApprovalNeeded(ev.currentTarget.checked)}
                      />
                    </div>
                  </Card>
                </div>

                {/* Message Bars */}
                {approvalNeeded && (
                  <MessageBar intent="info" className={styles.messageBar}>
                    <MessageBarBody>
                      <MessageBarTitle>Approval Configuration</MessageBarTitle>
                      Approval settings will be fetched from document approval configuration. Documents will follow the complete validation and approval workflow.
                    </MessageBarBody>
                  </MessageBar>
                )}

                {!approvalNeeded && manualValidation && (
                  <MessageBar intent="success" className={styles.messageBar}>
                    <MessageBarBody>
                      Documents will be automatically approved after successful validation by the assigned validators.
                    </MessageBarBody>
                  </MessageBar>
                )}
              </>
            )}

            {/* Automatic Processing Message */}
            {!manualValidation && (
              <MessageBar intent="success" className={styles.messageBar}>
                <MessageBarBody>
                  <MessageBarTitle>Automatic Document Processing Enabled</MessageBarTitle>
                  Documents will be automatically validated and processed without manual intervention.
                </MessageBarBody>
              </MessageBar>
            )}

          </div>
        </div>

        {/* Employee Selection Dialog */}
        <Dialog 
          open={showEmployeeDialog} 
          onOpenChange={(event, data) => setShowEmployeeDialog(data.open)}
        >
          <DialogSurface className={styles.dialogContent}>
            <DialogBody>
              <DialogTitle>Select Validators</DialogTitle>
              <DialogContent>
                <div className={styles.searchContainer}>
                  <SearchBox
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(_, data) => setSearchTerm(data.value)}
                  />
                </div>
                
                <div className={styles.employeeList}>
                  {filteredEmployees.map(employee => {
                    const isSelected = validationType === 'employee' 
                      ? selectedEmployees.some(emp => emp.id === employee.id)
                      : currentOfficeId ? officeValidators[currentOfficeId]?.some(emp => emp.id === employee.id) : false;
                    
                    return (
                      <div
                        key={employee.id}
                        className={mergeClasses(
                          styles.employeeItem,
                          isSelected && styles.employeeSelected
                        )}
                        onClick={() => handleEmployeeSelect(employee)}
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
                  onClick={() => setShowEmployeeDialog(false)}
                  className={styles.primaryButton}
                >
                  Done
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

      </div>
  );
};

export default TeamsValidationSettings;