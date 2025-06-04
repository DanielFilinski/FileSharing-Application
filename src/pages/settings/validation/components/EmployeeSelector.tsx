import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
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
  onEmployeeRemove: (employeeId: string) => void;
  onAddClick: () => void;
  getDepartmentName: (deptId: string) => string;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployees,
  onEmployeeSelect,
  onEmployeeRemove,
  getDepartmentName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Section>
      <TitleText>
        <Text variant="xLarge">Employees Responsible for Validation</Text>
      </TitleText>
      
      <SelectedEmployeesList>
        {selectedEmployees.length > 0 ? (
          selectedEmployees.map(employee => (
            <EmployeeTag key={employee.id}>
              <EmployeeTagAvatar>
                <Text>{employee.avatar}</Text>
              </EmployeeTagAvatar>
              <EmployeeTagName>
                <Text>{employee.name}</Text>
              </EmployeeTagName>
              <EmployeeTagRemove onClick={() => onEmployeeRemove(employee.id)}>
                <X size={14} />
              </EmployeeTagRemove>
            </EmployeeTag>
          ))
        ) : (
          <NoEmployeesText>
            <Text>No employees selected</Text>
          </NoEmployeesText>
        )}
      </SelectedEmployeesList>

      <ButtonHover text="Add Validator" onClick={() => setShowSelector(true)}/>

      {showSelector && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>
                <Text variant="large">Select Validators</Text>
              </ModalTitle>
              <ModalClose onClick={() => setShowSelector(false)}>
                <X size={18} />
              </ModalClose>
            </ModalHeader>
            
            <SearchInput
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <EmployeeList>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(employee => {
                  const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                  return (
                    <EmployeeItem 
                      key={employee.id}
                      isSelected={isSelected}
                      onClick={() => {
                        onEmployeeSelect(employee);
                        setShowSelector(false);
                      }}
                    >
                      <EmployeeInfo>
                        <EmployeeAvatar>
                          <Text>{employee.avatar}</Text>
                        </EmployeeAvatar>
                        <EmployeeDetails>
                          <EmployeeName>
                            <Text variant="medium">{employee.name}</Text>
                          </EmployeeName>
                          <EmployeeDepartment>
                            <Text variant="small">{getDepartmentName(employee.department)}</Text>
                          </EmployeeDepartment>
                        </EmployeeDetails>
                      </EmployeeInfo>
                      {isSelected && <SelectedIcon size={16} />}
                    </EmployeeItem>
                  );
                })
              ) : (
                <NoResultsText>
                  <Text>No employees found</Text>
                </NoResultsText>
              )}
            </EmployeeList>
            
            <ModalFooter>
              <ButtonAccent text="Done" onClick={() => setShowSelector(false)}/>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Section>
  );
}; 

const Section = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
`;

const TitleText = styled.h2`  
  margin-bottom: 1rem;
  color: ${COLORS.purple1};
`;

const SelectedEmployeesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const EmployeeTag = styled.div`
  display: flex;
  align-items: center;
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 20px;
  gap: 8px;
`;

const EmployeeTagAvatar = styled.span`
  font-size: 14px;
`;

const EmployeeTagName = styled.span`
  font-size: 14px;
`;

const EmployeeTagRemove = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const NoEmployeesText = styled.p`
  color: #666;
  font-style: italic;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #0056b3;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const SearchInput = styled.input`  
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 16px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const EmployeeList = styled.div`
  overflow-y: auto;
  padding: 0 16px;
`;

const EmployeeItem = styled.div<{ isSelected?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  background: ${props => props.isSelected ? '#f0f7ff' : 'transparent'};
  
  &:hover {
    background: ${props => props.isSelected ? '#f0f7ff' : '#f5f5f5'};
  }
`;

const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EmployeeAvatar = styled.span`
  font-size: 16px;
`;

const EmployeeDetails = styled.div``;

const EmployeeName = styled.p`
  margin: 0;
  font-weight: 500;
`;

const EmployeeDepartment = styled.p`
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
`;

const SelectedIcon = styled(Check)`
  color: #007bff;
`;

const NoResultsText = styled.p`
  text-align: center;
  color: #666;
  padding: 16px;
`;

const ModalFooter = styled.div`
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
`;

const DoneButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #0056b3;
  }
`;