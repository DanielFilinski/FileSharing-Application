import React, { useState, useEffect, CSSProperties } from 'react';
import { Settings, Check, Save, Shield, Users, Briefcase, FileText, Building2, ChevronDown, X, Plus, AlertCircle } from 'lucide-react';

interface OfficeValidators {
  [key: string]: Array<{
    id: string;
    name: string;
    department: string;
    avatar: string;
  }>;
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: '#ef4444',
    fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
    letterSpacing: '-0.01em'
  },
  header: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center'
  },
  headerIcon: {
    color: '#9333ea',
    marginRight: '0.75rem'
  },
  headerText: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827'
  },
  saveButton: {
    color: 'white',
    backgroundColor: '#9333ea',
    padding: '0.375rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s'
  },
  saveButtonHover: {
    backgroundColor: '#7e22ce'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem'
  },
  contentWrapper: {
    maxWidth: '48rem',
    margin: '0 auto'
  },
  card: {
    marginBottom: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    padding: '1.5rem',
    border: '1px solid #e5e7eb'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'flex-start'
  },
  iconWrapper: {
    backgroundColor: '#f3e8ff',
    color: '#7e22ce',
    padding: '0.25rem',
    borderRadius: '0.375rem',
    marginRight: '0.75rem',
    marginTop: '0.25rem'
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#1f2937'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '0.25rem'
  },
  toggle: {
    position: 'relative',
    width: '2.75rem',
    height: '1.5rem',
    borderRadius: '9999px',
    transition: 'background-color 0.2s'
  },
  toggleOn: {
    backgroundColor: '#9333ea'
  },
  toggleOff: {
    backgroundColor: '#d1d5db'
  },
  toggleHandle: {
    position: 'absolute',
    left: '0.25rem',
    top: '0.25rem',
    backgroundColor: 'white',
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    transition: 'transform 0.2s'
  },
  toggleHandleOn: {
    transform: 'translateX(1.25rem)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem'
  },
  gridItem: {
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  gridItemSelected: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
    color: '#7e22ce'
  },
  gridItemHover: {
    borderColor: '#d1d5db'
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: '9999px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.875rem'
  },
  addButton: {
    color: '#9333ea',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s'
  },
  addButtonHover: {
    backgroundColor: '#faf5ff'
  },
  modal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '28rem',
    padding: '1.5rem'
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    outline: 'none'
  },
  searchInputFocus: {
    borderColor: '#9333ea',
    boxShadow: '0 0 0 2px rgba(147, 51, 234, 0.2)'
  },
  employeeList: {
    maxHeight: '15rem',
    overflowY: 'auto'
  },
  employeeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem',
    cursor: 'pointer',
    borderRadius: '0.375rem'
  },
  employeeItemHover: {
    backgroundColor: '#f9fafb'
  },
  employeeItemSelected: {
    backgroundColor: '#faf5ff'
  },
  alert: {
    fontSize: '0.875rem',
    backgroundColor: '#faf5ff',
    borderRadius: '0.375rem',
    padding: '0.75rem',
    color: '#7e22ce',
    display: 'flex',
    alignItems: 'flex-start'
  },
  successAlert: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534'
  }
};

const ValidationSettingsForm = () => {
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
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Shield style={styles.headerIcon} size={20} />
          <h1 style={styles.headerText}>Validation Settings</h1>
        </div>
        <button style={styles.saveButton}>
          <Save size={16} style={{ marginRight: '0.375rem' }} />
          Save changes
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.contentWrapper}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span style={styles.iconWrapper}>
                  <Shield size={18} />
                </span>
                <div>
                  <h2 style={styles.title}>Manual Validation Needed</h2>
                  <p style={styles.subtitle}>Enable this option if documents require manual validation before processing</p>
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
                  <div style={{
                    ...styles.toggle,
                    ...(manualValidation ? styles.toggleOn : styles.toggleOff)
                  }}>
                    <div style={{
                      ...styles.toggleHandle,
                      ...(manualValidation ? styles.toggleHandleOn : {})
                    }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {manualValidation && (
            <>
              {/* Validation Type Selection */}
              <div style={styles.card}>
                <h2 style={styles.title}>Validation Assignment</h2>
                <div style={styles.grid}>
                  <div 
                    style={{
                      ...styles.gridItem,
                      ...(validationType === 'employee' ? styles.gridItemSelected : styles.gridItemHover)
                    }}
                    onClick={() => setValidationType('employee')}
                  >
                    <span style={styles.tag}>Employees</span>
                  </div>
                  <div 
                    style={{
                      ...styles.gridItem,
                      ...(validationType === 'office' ? styles.gridItemSelected : styles.gridItemHover)
                    }}
                    onClick={() => setValidationType('office')}
                  >
                    <span style={styles.tag}>By Office</span>
                  </div>
                </div>
              </div>

              {/* Validation Setup - Employees */}
              {validationType === 'employee' && (
                <div style={styles.card}>
                  <h2 style={styles.title}>Employees Responsible for Validation</h2>
                  
                  {/* Selected Employees List */}
                  <div style={styles.tag}>
                    {selectedEmployees.length > 0 ? (
                      selectedEmployees.map(employee => (
                        <div key={employee.id} style={styles.employeeItem}>
                          <div style={styles.employeeItemHover}>
                            <span style={styles.tag}>{employee.avatar}</span>
                            <span style={styles.tag}>{employee.name}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employee.id));
                              }}
                              style={styles.tag}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={styles.tag}>No employees selected</p>
                    )}
                  </div>

                  {/* Add Employee Button */}
                  <button 
                    onClick={() => setShowEmployeeSelector(true)}
                    style={styles.addButton}
                  >
                    <Plus size={16} style={{ marginRight: '0.375rem' }} />
                    Add Validator
                  </button>

                  {/* Employee Selector Popup */}
                  {showEmployeeSelector && (
                    <div style={styles.modal}>
                      <div style={styles.modalContent}>
                        <div style={styles.cardHeader}>
                          <h3 style={styles.title}>Select Validators</h3>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setShowEmployeeSelector(false);
                          }} style={styles.tag}>
                            <X size={18} />
                          </button>
                        </div>
                        
                        {/* Search */}
                        <div style={styles.tag}>
                          <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                          />
                        </div>
                        
                        {/* Employee List */}
                        <div style={styles.employeeList}>
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(employee => {
                              const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                              return (
                                <div 
                                  key={employee.id} 
                                  style={{
                                    ...styles.employeeItem,
                                    ...(isSelected ? styles.employeeItemSelected : styles.employeeItemHover)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmployeeSelect(employee);
                                  }}
                                >
                                  <div style={styles.employeeItemHover}>
                                    <span style={styles.tag}>{employee.avatar}</span>
                                    <div>
                                      <p style={styles.tag}>{employee.name}</p>
                                      <p style={styles.tag}>{getDepartmentName(employee.department)}</p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check size={16} style={styles.tag} />
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p style={styles.tag}>No employees found</p>
                          )}
                        </div>
                        
                        <div style={styles.tag}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmployeeSelector(false);
                            }}
                            style={styles.addButton}
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
                <div style={styles.card}>
                  <h2 style={styles.title}>Office-Specific Validators</h2>
                  <p style={styles.subtitle}>Assign validators to specific office locations</p>
                  
                  <div style={styles.tag}>
                    {offices.map(office => (
                      <div key={office.id} style={styles.tag}>
                        <div style={styles.cardHeader}>
                          <h3 style={styles.title}>
                            <Building2 size={16} style={styles.tag} />
                            {office.name}
                          </h3>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              selectOfficeValidators(office.id);
                            }}
                            style={styles.addButton}
                          >
                            <Plus size={14} style={styles.tag} />
                            Add
                          </button>
                        </div>
                        <div style={styles.tag}>
                          {officeValidators[office.id]?.length > 0 ? (
                            officeValidators[office.id].map(employee => (
                              <div key={employee.id} style={styles.employeeItem}>
                                <div style={styles.employeeItemHover}>
                                  <span style={styles.tag}>{employee.avatar}</span>
                                  <span style={styles.tag}>{employee.name}</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeEmployeeFromOffice(office.id, employee.id);
                                    }}
                                    style={styles.tag}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p style={styles.tag}>No validators assigned</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Toggle */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitle}>
                    <span style={styles.iconWrapper}>
                      <Check size={18} />
                    </span>
                    <div>
                      <h2 style={styles.title}>Approval Needed</h2>
                      <p style={styles.subtitle}>Enable this option if documents require approval after validation</p>
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
                      <div style={{
                        ...styles.toggle,
                        ...(approvalNeeded ? styles.toggleOn : styles.toggleOff)
                      }}>
                        <div style={{
                          ...styles.toggleHandle,
                          ...(approvalNeeded ? styles.toggleHandleOn : {})
                        }}></div>
                      </div>
                    </label>
                  </div>
                </div>
                {approvalNeeded && (
                  <div style={styles.alert}>
                    <AlertCircle size={16} style={styles.tag} />
                    <p style={styles.tag}>Approval settings will be fetched from document approval configuration. Documents will follow the complete validation and approval workflow.</p>
                  </div>
                )}
                {!approvalNeeded && manualValidation && (
                  <div style={styles.alert}>
                    <AlertCircle size={16} style={styles.tag} />
                    <p style={styles.tag}>Documents will be automatically approved after successful validation by the assigned validators.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {!manualValidation && (
            <div style={styles.card}>
              <div style={styles.employeeItem}>
                <div style={styles.employeeItemHover}>
                  <div style={styles.tag}>
                    <Check size={16} />
                  </div>
                  <div>
                    <h3 style={styles.title}>Automatic Document Processing Enabled</h3>
                    <p style={styles.tag}>Documents will be automatically validated and processed without manual intervention.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationSettingsForm;