import React, { useState, useEffect } from 'react';
import { Check, Shield } from 'lucide-react';
import styled from 'styled-components';

import { Header } from './components/Header';
import { Toggle } from './components/Toggle';
import { ValidationTypeSelector } from './components/ValidationTypeSelector';
import { EmployeeSelector } from './components/EmployeeSelector';
import { OfficeValidator } from './components/OfficeValidator';
import { Alert } from './components/Alert';



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

const ValidationSettingsForm = () => {
  const [manualValidation, setManualValidation] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [validationType, setValidationType] = useState<'employee' | 'office'>('employee');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [officeValidators, setOfficeValidators] = useState<OfficeValidators>({});
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

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

  const handleEmployeeSelect = (employee: Employee) => {
    if (validationType === 'employee') {
      if (selectedEmployees.find(emp => emp.id === employee.id)) {
        setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employee.id));
      } else {
        setSelectedEmployees([...selectedEmployees, employee]);
      }
    } else if (validationType === 'office') {
      const officeId = Object.keys(officeValidators).find(key => 
        officeValidators[key] === selectedEmployees
      );
      
      if (officeId) {
        const updatedValidators = { ...officeValidators };
        if (updatedValidators[officeId].find(emp => emp.id === employee.id)) {
          updatedValidators[officeId] = updatedValidators[officeId].filter(emp => emp.id !== employee.id);
        } else {
          updatedValidators[officeId] = [...updatedValidators[officeId], employee];
        }
        setOfficeValidators(updatedValidators);
      }
    }
  };

  const selectOfficeValidators = (officeId: string) => {
    setSelectedEmployees(officeValidators[officeId]);
    setShowEmployeeSelector(true);
  };

  const removeEmployeeFromOffice = (officeId: string, empId: string) => {
    const updatedValidators = { ...officeValidators };
    updatedValidators[officeId] = updatedValidators[officeId].filter(emp => emp.id !== empId);
    setOfficeValidators(updatedValidators);
  };

  const getDepartmentName = (deptId: string) => {
    const department = departments.find(dept => dept.id === deptId);
    return department ? department.name : '';
  };

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving settings...');
  };

  return (
    <Container>
      <Header onSave={handleSave} />

      <Content>
        <ContentWrapper>
          <Toggle
            title="Manual Validation Needed"
            description="Enable this option if documents require manual validation before processing"
            checked={manualValidation}
            onChange={() => setManualValidation(!manualValidation)}
            icon={<Shield size={18} />}
          />

          {manualValidation && (
            <>
              <ValidationTypeSelector
                selectedType={validationType}
                onTypeChange={setValidationType}
              />

              {validationType === 'employee' && (
                <EmployeeSelector
                  employees={employees}
                  selectedEmployees={selectedEmployees}
                  onEmployeeSelect={handleEmployeeSelect}
                  onEmployeeRemove={(empId) => setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== empId))}
                  onAddClick={() => setShowEmployeeSelector(true)}
                  getDepartmentName={getDepartmentName}
                />
              )}

              {validationType === 'office' && (
                <Section>
                  <TitleText>Office-Specific Validators</TitleText>
                  <Subtitle>Assign validators to specific office locations</Subtitle>
                  
                  <SpaceY>
                    {offices.map(office => (
                      <OfficeValidator
                        key={office.id}
                        office={office}
                        validators={officeValidators[office.id] || []}
                        onAddValidator={selectOfficeValidators}
                        onRemoveValidator={removeEmployeeFromOffice}
                      />
                    ))}
                  </SpaceY>
                </Section>
              )}

              <Toggle
                title="Approval Needed"
                description="Enable this option if documents require approval after validation"
                checked={approvalNeeded}
                onChange={() => setApprovalNeeded(!approvalNeeded)}
                icon={<Check size={18} />}
              />

              {approvalNeeded && (
                <Alert
                  type="purple"
                  message="Approval settings will be fetched from document approval configuration. Documents will follow the complete validation and approval workflow."
                />
              )}

              {!approvalNeeded && manualValidation && (
                <Alert
                  type="blue"
                  message="Documents will be automatically approved after successful validation by the assigned validators."
                />
              )}
            </>
          )}

          {!manualValidation && (
            <Alert
              type="success"
              title="Automatic Document Processing Enabled"
              message="Documents will be automatically validated and processed without manual intervention."
            />
          )}
        </ContentWrapper>
      </Content>
    </Container>
  );
};

export default ValidationSettingsForm;

const Container = styled.div`
  display: flex;
  flex-direction: column;
 
  height: 100%;
  width: 100%;
  background-color: #f9fafb;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.01em;
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  width: 1000px;
  margin: 0 auto;
  padding: 1.5rem 0;
`;

const ContentWrapper = styled.div`
  max-width: 48rem;
  margin: 0 auto;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const TitleText = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const SpaceY = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;