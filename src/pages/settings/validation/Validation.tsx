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
import { SettingsHeader } from '../../../components/SettingsHeader';
import { ValidationHeader } from './components/ValidationHeader';
import { ManualValidationToggle } from './components/ManualValidationToggle';
import { ValidationTypeSelector } from './components/ValidationTypeSelector';
import { EmployeeValidators } from './components/EmployeeValidators';
import { OfficeValidators } from './components/OfficeValidators';
import { ApprovalToggle } from './components/ApprovalToggle';
import { ValidationMessageBars } from './components/ValidationMessageBars';
import { EmployeeSelectionDialog } from './components/EmployeeSelectionDialog';
import { Employee, Department, Office, OfficeValidators as OfficeValidatorsType } from './types';

// Bundle icons for better performance
const ShieldIcon = bundleIcon(Shield20Filled, Shield20Regular);
const SaveIcon = bundleIcon(Save20Filled, Save20Regular);
const PersonIcon = bundleIcon(Person20Filled, Person20Regular);
const BuildingIcon = bundleIcon(Building20Filled, Building20Regular);
const AddIcon = bundleIcon(Add20Filled, Add20Regular);
const CheckmarkCircleIcon = bundleIcon(CheckmarkCircle20Filled, CheckmarkCircle20Regular);

const TeamsValidationSettings = () => {
  const styles = useStyles();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [manualValidation, setManualValidation] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [validationType, setValidationType] = useState<'employee' | 'office'>('employee');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [officeValidators, setOfficeValidators] = useState<OfficeValidatorsType>({});
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
    const initialOfficeValidators: OfficeValidatorsType = {};
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
      if (selectedEmployees.find((emp: Employee) => emp.id === employee.id)) {
        setSelectedEmployees(selectedEmployees.filter((emp: Employee) => emp.id !== employee.id));
      } else {
        setSelectedEmployees([...selectedEmployees, employee]);
      }
    } else if (validationType === 'office' && currentOfficeId) {
      const updatedValidators = { ...officeValidators };
      if (updatedValidators[currentOfficeId].find((emp: Employee) => emp.id === employee.id)) {
        updatedValidators[currentOfficeId] = updatedValidators[currentOfficeId].filter((emp: Employee) => emp.id !== employee.id);
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
      setSelectedEmployees(selectedEmployees.filter((emp: Employee) => emp.id !== empId));
    } else if (officeId) {
      const updatedValidators = { ...officeValidators };
      updatedValidators[officeId] = updatedValidators[officeId].filter((emp: Employee) => emp.id !== empId);
      setOfficeValidators(updatedValidators);
    }
  };

  const handleSave = () => {
    console.log('Saving settings...');
  };


  return (
      <div className={styles.root}>
        <ValidationHeader onSave={handleSave} />

        <div className={styles.content}>
          <div className={styles.contentWrapper}>
            <div className={styles.section}>
              <ManualValidationToggle
                manualValidation={manualValidation}
                onToggle={setManualValidation}
              />
            </div>

            {manualValidation && (
              <>
                <div className={styles.section}>
                  <ValidationTypeSelector
                    validationType={validationType}
                    onTypeChange={setValidationType}
                  />
                </div>

                {validationType === 'employee' && (
                  <div className={styles.section}>
                    <EmployeeValidators
                      selectedEmployees={selectedEmployees}
                      onAddClick={() => openEmployeeDialog()}
                      onRemoveEmployee={removeEmployee}
                    />
                  </div>
                )}

                {validationType === 'office' && (
                  <div className={styles.section}>
                    <OfficeValidators
                      offices={offices}
                      officeValidators={officeValidators}
                      onAddClick={openEmployeeDialog}
                      onRemoveEmployee={removeEmployee}
                    />
                  </div>
                )}

                <div className={styles.section}>
                  <ApprovalToggle
                    approvalNeeded={approvalNeeded}
                    onToggle={setApprovalNeeded}
                  />
                </div>

                <ValidationMessageBars
                  manualValidation={manualValidation}
                  approvalNeeded={approvalNeeded}
                />
              </>
            )}

            {!manualValidation && (
              <ValidationMessageBars
                manualValidation={manualValidation}
                approvalNeeded={approvalNeeded}
              />
            )}
          </div>
        </div>

        <EmployeeSelectionDialog
          open={showEmployeeDialog}
          onOpenChange={setShowEmployeeDialog}
          employees={filteredEmployees}
          selectedEmployees={validationType === 'employee' ? selectedEmployees : currentOfficeId ? officeValidators[currentOfficeId] : []}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEmployeeSelect={handleEmployeeSelect}
          getDepartmentName={getDepartmentName}
        />
      </div>
  );
};

const useStyles = makeStyles({
  root: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    fontFamily: tokens.fontFamilyBase,
  },
  content: {
    flex: '1',
    overflowY: 'auto',
    marginTop: tokens.spacingVerticalL,
    '@media (max-width: 768px)': {
      marginTop: tokens.spacingVerticalM,
    },
  },
  contentWrapper: {
    maxWidth: '1000px',
    margin: '0 auto',
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    '@media (max-width: 768px)': {
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
    },
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 768px)': {
      marginBottom: tokens.spacingVerticalM,
    },
  },
  card: {
    // padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    '@media (max-width: 768px)': {
      // padding: tokens.spacingVerticalM,
    },
  },
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
  selectedEmployees: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
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
  messageBar: {
    padding: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
  },
  addValidatorButton: {
    justifyContent: 'flex-start',
  },
  removeButton: {
    padding: '0px',
    // padding: '4px',
    // minWidth: '24px',
    // minHeight: '24px',
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

export default TeamsValidationSettings;