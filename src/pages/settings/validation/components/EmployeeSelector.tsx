import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';

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
    <div className="section">
      <h2 className="title-text">Employees Responsible for Validation</h2>
      
      {/* Selected Employees List */}
      <div className="selected-employees-list">
        {selectedEmployees.length > 0 ? (
          selectedEmployees.map(employee => (
            <div key={employee.id} className="employee-tag">
              <span className="employee-tag-avatar">{employee.avatar}</span>
              <span className="employee-tag-name">{employee.name}</span>
              <button 
                onClick={() => onEmployeeRemove(employee.id)}
                className="employee-tag-remove"
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <p className="no-employees-text">No employees selected</p>
        )}
      </div>

      {/* Add Employee Button */}
      <button 
        onClick={() => setShowSelector(true)}
        className="add-button"
      >
        <Plus size={16} className="add-button-icon" />
        Add Validator
      </button>

      {/* Employee Selector Popup */}
      {showSelector && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Select Validators</h3>
              <button onClick={() => setShowSelector(false)} className="modal-close">
                <X size={18} />
              </button>
            </div>
            
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            {/* Employee List */}
            <div className="employee-list">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(employee => {
                  const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                  return (
                    <div 
                      key={employee.id} 
                      className={`employee-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onEmployeeSelect(employee);
                        setShowSelector(false);
                      }}
                    >
                      <div className="employee-info">
                        <span className="employee-avatar">{employee.avatar}</span>
                        <div className="employee-details">
                          <p className="employee-name">{employee.name}</p>
                          <p className="employee-department">{getDepartmentName(employee.department)}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} className="selected-icon" />
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="no-results-text">No employees found</p>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowSelector(false)}
                className="done-button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 