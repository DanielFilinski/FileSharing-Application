import React, { useState } from 'react';
import { Divider } from '@fluentui/react-components';
import { CheckmarkCircle20Regular } from '@fluentui/react-icons';
import { SettingsHeader } from '@/components/SettingsHeader';
import { useStyles } from './styles';
import {
  ManualApprovalCard,
  DepartmentSelectionCard,
  ApprovalFlowCard,
  EmployeeSelectionCard
} from './components';

function ApprovalSettingsForm() {
  const [manualApprovalNeeded, setManualApprovalNeeded] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [approvalFlow, setApprovalFlow] = useState('parallel');
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [employeesBySelectedOffice, setEmployeesBySelectedOffice] = useState<Record<string, string[]>>({});

  const departments = ["Legal", "Finance", "HR", "IT", "Marketing", "Operations"];
  const offices = ["New York", "London", "Tokyo", "Berlin", "Sydney"];
  const employeesByOffice: Record<string, string[]> = {
    "New York": ["Alex Johnson", "Maria Garcia", "Sam Wilson"],
    "London": ["James Smith", "Emma Brown", "Olivia Davis"],
    "Tokyo": ["Takashi Yamamoto", "Yuki Tanaka", "Haruto Sato"],
    "Berlin": ["Leon Müller", "Sophie Weber", "Felix Fischer"],
    "Sydney": ["Charlotte Wilson", "Oliver Taylor", "Sophia Martin"]
  };

  const styles = useStyles();

  const toggleManualApproval = () => {
    setManualApprovalNeeded(!manualApprovalNeeded);
  };

  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter(item => item !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  const toggleOffice = (office: string) => {
    let updatedOffices: string[];
    if (selectedOffices.includes(office)) {
      updatedOffices = selectedOffices.filter(item => item !== office);
      const updatedEmployees = {...employeesBySelectedOffice};
      delete updatedEmployees[office];
      setEmployeesBySelectedOffice(updatedEmployees);
    } else {
      updatedOffices = [...selectedOffices, office];
      setEmployeesBySelectedOffice(prev => ({
        ...prev,
        [office]: []
      }));
    }
    setSelectedOffices(updatedOffices);
  };

  const toggleEmployee = (office: string, employee: string) => {
    const currentOfficeEmployees = employeesBySelectedOffice[office] || [];
    let updatedEmployees: string[];
    
    if (currentOfficeEmployees.includes(employee)) {
      updatedEmployees = currentOfficeEmployees.filter(emp => emp !== employee);
    } else {
      updatedEmployees = [...currentOfficeEmployees, employee];
    }
    
    setEmployeesBySelectedOffice({
      ...employeesBySelectedOffice,
      [office]: updatedEmployees
    });
  };

  const handleSave = () => {
    console.log('Save clicked');
  };

  return (
    <div className={styles.container}>
      <SettingsHeader
        title="Approval Settings"
        icon={<CheckmarkCircle20Regular />}
        buttonText="Save changes"
        onButtonClick={handleSave}
      />

      <Divider className={styles.headerDivider} />

      <div className={styles.content}>
        <ManualApprovalCard
          manualApprovalNeeded={manualApprovalNeeded}
          onToggle={toggleManualApproval}
        />

        {manualApprovalNeeded && (
          <>
            <DepartmentSelectionCard
              departments={departments}
              selectedDepartments={selectedDepartments}
              onDepartmentToggle={toggleDepartment}
            />

            <ApprovalFlowCard
              approvalFlow={approvalFlow}
              selectedDepartments={selectedDepartments}
              onApprovalFlowChange={setApprovalFlow}
            />

            <EmployeeSelectionCard
              offices={offices}
              employeesByOffice={employeesByOffice}
              selectedOffices={selectedOffices}
              employeesBySelectedOffice={employeesBySelectedOffice}
              onOfficeToggle={toggleOffice}
              onEmployeeToggle={toggleEmployee}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ApprovalSettingsForm;