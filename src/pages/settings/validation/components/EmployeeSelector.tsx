import React, { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import styled from 'styled-components';
import { Stack, Text } from '@fluentui/react';
import { COLORS } from '@/app/theme/color-pallete';
import { Card } from '@fluentui/react-components';
import { ButtonHover } from '@/components/button-hover';
import { ButtonAccent } from '@/components/button-accent';

interface Employee {
  id: string;
  name: string;
  department: string;
  avatar: string;
}

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: Employee[];
  onEmployeeSelect: (employee: Employee) => void;
  onEmployeeRemove: (empId: string) => void;
  onAddClick: () => void;
  getDepartmentName: (deptId: string) => string;
}

const Section = styled.div`
  margin-bottom: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const Title = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const SelectedEmployeesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const EmployeeTag = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
`;

const EmployeeAvatar = styled.span`
  margin-right: 0.375rem;
  font-size: 1.25rem;
`;

const EmployeeName = styled.span`
  margin-right: 0.25rem;
  color: #1f2937;
`;

const RemoveButton = styled.button`
  color: #6b7280;
  padding: 0.125rem;
  border-radius: 0.25rem;
  transition: all 0.2s;

  &:hover {
    color: #ef4444;
    background-color: #fee2e2;
  }
`;

const AddButton = styled.button`
  color: #9333ea;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3e8ff;
  }
`;

const AddButtonIcon = styled(Plus)`
  margin-right: 0.375rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const Modal = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  font-weight: 600;
  font-size: 1.125rem;
`;

const CloseButton = styled.button`
  color: #6b7280;

  &:hover {
    color: #374151;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #9333ea;
    box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
  }
`;

const EmployeeList = styled.div`
  max-height: 15rem;
  overflow-y: auto;
`;

const EmployeeItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0.375rem;
  background-color: ${props => props.$selected ? '#f3e8ff' : 'transparent'};

  &:hover {
    background-color: ${props => props.$selected ? '#f3e8ff' : '#f9fafb'};
  }
`;

const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const EmployeeDetails = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 0.5rem;
`;

const EmployeeNameInList = styled.span`
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
`;

const EmployeeDepartment = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

const ModalFooter = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
`;

const DoneButton = styled.button`
  background-color: #9333ea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background-color: #7e22ce;
  }
`;

const NoEmployeesText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
`;

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployees,
  onEmployeeSelect,
  onEmployeeRemove,
  onAddClick,
  getDepartmentName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Section>
      <Title>Employees Responsible for Validation</Title>
      
      <SelectedEmployeesList>
        {selectedEmployees.length > 0 ? (
          selectedEmployees.map(employee => (
            <EmployeeTag key={employee.id}>
              <EmployeeAvatar>{employee.avatar}</EmployeeAvatar>
              <EmployeeName>{employee.name}</EmployeeName>
              <RemoveButton onClick={() => onEmployeeRemove(employee.id)}>
                <X size={14} />
              </RemoveButton>
            </EmployeeTag>
          ))
        ) : (
          <NoEmployeesText>No employees selected</NoEmployeesText>
        )}
      </SelectedEmployeesList>

      <AddButton onClick={() => setShowModal(true)}>
        <AddButtonIcon size={16} />
        Add Validator
      </AddButton>

      {showModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>Select Validators</ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            
            <SearchInput
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <EmployeeList>
              {filteredEmployees.map(employee => (
                <EmployeeItem
                  key={employee.id}
                  $selected={selectedEmployees.some(emp => emp.id === employee.id)}
                  onClick={() => onEmployeeSelect(employee)}
                >
                  <EmployeeInfo>
                    <EmployeeAvatar>{employee.avatar}</EmployeeAvatar>
                    <EmployeeDetails>
                      <EmployeeNameInList>{employee.name}</EmployeeNameInList>
                      <EmployeeDepartment>
                        {getDepartmentName(employee.department)}
                      </EmployeeDepartment>
                    </EmployeeDetails>
                  </EmployeeInfo>
                </EmployeeItem>
              ))}
            </EmployeeList>
            
            <ModalFooter>
              <DoneButton onClick={() => setShowModal(false)}>
                Done
              </DoneButton>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Section>
  );
};