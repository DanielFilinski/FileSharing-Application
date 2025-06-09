import React, { useState, useEffect } from 'react';
import { ValidationHeader } from './components/ValidationHeader';
import { ManualValidationToggle } from './components/ManualValidationToggle';
import { ValidationTypeSelector } from './components/ValidationTypeSelector';
import { EmployeeValidators } from './components/EmployeeValidators';
import { OfficeValidators } from './components/OfficeValidators';
import { ApprovalToggle } from './components/ApprovalToggle';
import { ValidationMessageBars } from './components/ValidationMessageBars';
import { EmployeeSelectionDialog } from './components/EmployeeSelectionDialog';
import { Employee, Department, Office, OfficeValidators as OfficeValidatorsType } from './types';
import { ContentContainer, RowCardContainer, ScreenContainer } from '@/app/styles/layouts';

const TeamsValidationSettings = () => {
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
    <ScreenContainer>
      <ValidationHeader onSave={handleSave} />

      <ContentContainer>
        <RowCardContainer>

        <ManualValidationToggle
            manualValidation={manualValidation}
            onToggle={setManualValidation}
          />
        

        {manualValidation && (
          <>
           
              <ValidationTypeSelector
                validationType={validationType}
                onTypeChange={setValidationType}
              />
           

            {validationType === 'employee' && (
             
                <EmployeeValidators
                  selectedEmployees={selectedEmployees}
                  onAddClick={() => openEmployeeDialog()}
                  onRemoveEmployee={removeEmployee}
                />
             
            )}

            {validationType === 'office' && (
             
                <OfficeValidators
                  offices={offices}
                  officeValidators={officeValidators}
                  onAddClick={openEmployeeDialog}
                  onRemoveEmployee={removeEmployee}
                />
              
            )}

            
              <ApprovalToggle
                approvalNeeded={approvalNeeded}
                onToggle={setApprovalNeeded}
              />
           

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

        </RowCardContainer>
        
         
      </ContentContainer>

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
    </ScreenContainer>
  );
};

export default TeamsValidationSettings;