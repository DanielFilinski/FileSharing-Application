import React, { useState, useEffect } from 'react';
import { Settings, Check, Save, Shield, Users, Briefcase, FileText, Building2, ChevronDown, X, Plus, AlertCircle } from 'lucide-react';
import './Validation.css';
import { makeStyles, Text } from '@fluentui/react-components';

interface OfficeValidators {
  [key: string]: Array<{
    id: string;
    name: string;
    department: string;
    avatar: string;
  }>;
}

const useStyles = makeStyles({
  container: {
    padding: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '24px',
  }
});

const ValidationSettings: React.FC = () => {
  const styles = useStyles();
  const [manualValidation, setManualValidation] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [validationType, setValidationType] = useState('employee'); // 'employee', 'office'
  const [selectedEmployees, setSelectedEmployees] = useState<Array<{id: string; name: string; department: string; avatar: string}>>([]);
  const [officeValidators, setOfficeValidators] = useState<OfficeValidators>({});
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const departments = [
    { id: 'dept1', name: 'Legal Department' },
    { id: 'dept2', name: 'Finance Department' },
    { id: 'dept3', name: 'Operations' },
  ];

  const employees = [
    { id: 'emp1', name: 'John Doe', department: 'dept1', avatar: '👨🏻‍💼' },
    { id: 'emp2', name: 'Jane Smith', department: 'dept1', avatar: '👩🏼‍💼' },
    { id: 'emp3', name: 'Alice Johnson', department: 'dept2', avatar: '👩🏾‍💼' },
    { id: 'emp4', name: 'Bob Williams', department: 'dept2', avatar: '👨🏽‍💼' },
    { id: 'emp5', name: 'Charlie Brown', department: 'dept3', avatar: '👨🏻‍💼' },
    { id: 'emp6', name: 'Diana Prince', department: 'dept3', avatar: '👩🏻‍💼' },
  ];

  const offices = [
    { id: 'off1', name: 'Headquarters' },
    { id: 'off2', name: 'Regional Office' },
    { id: 'off3', name: 'Satellite Office' },
  ];

  useEffect(() => {
    // Initialize office validators
    const initialOfficeValidators: OfficeValidators = {};
    offices.forEach(office => {
      initialOfficeValidators[office.id] = [];
    });
    setOfficeValidators(initialOfficeValidators);
  }, []);

  const handleEmployeeSelect = (employee: {id: string; name: string; department: string; avatar: string}) => {
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

    setShowEmployeeSelector(false);
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

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentName = (deptId: string) => {
    const department = departments.find(dept => dept.id === deptId);
    return department ? department.name : '';
  };

  return (
    <div className={styles.container}>
      <Text className={styles.title}>Validation Settings</Text>
      <div className="container">
        <div className="header">
          <div className="headerTitle">
            <Shield className="headerIcon" size={20} />
            <h1 className="headerText">Validation Settings</h1>
          </div>
          <button className="saveButton">
            <Save size={16} style={{ marginRight: '0.375rem' }} />
            Save changes
          </button>
        </div>

        <div className="content">
          <div className="contentWrapper">
            <div className="card">
              <div className="cardHeader">
                <div className="cardTitle">
                  <span className="iconWrapper">
                    <Shield size={18} />
                  </span>
                  <div>
                    <h2 className="title">Manual Validation Needed</h2>
                    <p className="subtitle">Enable this option if documents require manual validation before processing</p>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={manualValidation} 
                      onChange={() => setManualValidation(!manualValidation)} 
                      style={{ display: 'none' }}
                    />
                    <div className={`toggle ${manualValidation ? 'toggleOn' : 'toggleOff'}`}>
                      <div className={`toggleHandle ${manualValidation ? 'toggleHandleOn' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {manualValidation && (
              <>
                {/* Validation Type Selection */}
                <div className="card">
                  <h2 className="title">Validation Assignment</h2>
                  <div className="grid">
                    <div 
                      className={`gridItem ${validationType === 'employee' ? 'gridItemSelected' : ''}`}
                      onClick={() => setValidationType('employee')}
                    >
                      <span className="tag">Employees</span>
                    </div>
                    <div 
                      className={`gridItem ${validationType === 'office' ? 'gridItemSelected' : ''}`}
                      onClick={() => setValidationType('office')}
                    >
                      <span className="tag">By Office</span>
                    </div>
                  </div>
                </div>

                {/* Validation Setup - Employees */}
                {validationType === 'employee' && (
                  <div className="card">
                    <h2 className="title">Employees Responsible for Validation</h2>
                    
                    {/* Selected Employees List */}
                    <div className="tag">
                      {selectedEmployees.length > 0 ? (
                        selectedEmployees.map(employee => (
                          <div key={employee.id} className="employeeItem">
                            <div>
                              <span className="tag">{employee.avatar}</span>
                              <span className="tag">{employee.name}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employee.id));
                                }}
                                className="tag"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="tag">No employees selected</p>
                      )}
                    </div>

                    {/* Add Employee Button */}
                    <button 
                      onClick={() => setShowEmployeeSelector(true)}
                      className="addButton"
                    >
                      <Plus size={16} style={{ marginRight: '0.375rem' }} />
                      Add Validator
                    </button>

                    {/* Employee Selector Popup */}
                    {showEmployeeSelector && (
                      <div className="modal">
                        <div className="modalContent">
                          <div className="cardHeader">
                            <h3 className="title">Select Validators</h3>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setShowEmployeeSelector(false);
                            }} className="tag">
                              <X size={18} />
                            </button>
                          </div>
                          
                          {/* Search */}
                          <div className="tag">
                            <input
                              type="text"
                              placeholder="Search employees..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="searchInput"
                            />
                          </div>
                          
                          {/* Employee List */}
                          <div className="employeeList">
                            {filteredEmployees.length > 0 ? (
                              filteredEmployees.map(employee => {
                                const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                                return (
                                  <div 
                                    key={employee.id} 
                                    className={`employeeItem ${isSelected ? 'employeeItemSelected' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmployeeSelect(employee);
                                    }}
                                  >
                                    <div>
                                      <span className="tag">{employee.avatar}</span>
                                      <div>
                                        <p className="tag">{employee.name}</p>
                                        <p className="tag">{getDepartmentName(employee.department)}</p>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <Check size={16} className="tag" />
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="tag">No employees found</p>
                            )}
                          </div>
                          
                          <div className="tag">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmployeeSelector(false);
                              }}
                              className="addButton"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Setup - By Office */}
                {validationType === 'office' && (
                  <div className="card">
                    <h2 className="title">Office-Specific Validators</h2>
                    <p className="subtitle">Assign validators to specific office locations</p>
                    
                    <div className="tag">
                      {offices.map(office => (
                        <div key={office.id} className="tag">
                          <div className="cardHeader">
                            <h3 className="title">
                              <Building2 size={16} className="tag" />
                              {office.name}
                            </h3>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                selectOfficeValidators(office.id);
                              }}
                              className="addButton"
                            >
                              <Plus size={14} className="tag" />
                              Add
                            </button>
                          </div>
                          <div className="tag">
                            {officeValidators[office.id]?.length > 0 ? (
                              officeValidators[office.id].map(employee => (
                                <div key={employee.id} className="employeeItem">
                                  <div>
                                    <span className="tag">{employee.avatar}</span>
                                    <span className="tag">{employee.name}</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeEmployeeFromOffice(office.id, employee.id);
                                      }}
                                      className="tag"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="tag">No validators assigned</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Toggle */}
                <div className="card">
                  <div className="cardHeader">
                    <div className="cardTitle">
                      <span className="iconWrapper">
                        <Check size={18} />
                      </span>
                      <div>
                        <h2 className="title">Approval Needed</h2>
                        <p className="subtitle">Enable this option if documents require approval after validation</p>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={approvalNeeded} 
                          onChange={() => setApprovalNeeded(!approvalNeeded)} 
                          style={{ display: 'none' }}
                        />
                        <div className={`toggle ${approvalNeeded ? 'toggleOn' : 'toggleOff'}`}>
                          <div className={`toggleHandle ${approvalNeeded ? 'toggleHandleOn' : ''}`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {approvalNeeded && (
                    <div className="alert">
                      <AlertCircle size={16} className="tag" />
                      <p className="tag">Approval settings will be fetched from document approval configuration. Documents will follow the complete validation and approval workflow.</p>
                    </div>
                  )}
                  {!approvalNeeded && manualValidation && (
                    <div className="alert">
                      <AlertCircle size={16} className="tag" />
                      <p className="tag">Documents will be automatically approved after successful validation by the assigned validators.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {!manualValidation && (
              <div className="card">
                <div className="employeeItem">
                  <div>
                    <div className="tag">
                      <Check size={16} />
                    </div>
                    <div>
                      <h3 className="title">Automatic Document Processing Enabled</h3>
                      <p className="tag">Documents will be automatically validated and processed without manual intervention.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationSettings;