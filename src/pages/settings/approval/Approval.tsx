import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './Approval.css';

interface Employee {
  name: string;
  office: string;
  department: string;
}

function ApprovalSettingsForm() {
  const [manualApprovalNeeded, setManualApprovalNeeded] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [approvalFlow, setApprovalFlow] = useState('parallel');
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [isOfficesDropdownOpen, setIsOfficesDropdownOpen] = useState(false);
  const [employeesBySelectedOffice, setEmployeesBySelectedOffice] = useState<Record<string, string[]>>({});
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

  // Sample data
  const departments = ["Legal", "Finance", "HR", "IT", "Marketing", "Operations"];
  const offices = ["New York", "London", "Tokyo", "Berlin", "Sydney"];
  const employeesByOffice: Record<string, string[]> = {
    "New York": ["Alex Johnson", "Maria Garcia", "Sam Wilson"],
    "London": ["James Smith", "Emma Brown", "Olivia Davis"],
    "Tokyo": ["Takashi Yamamoto", "Yuki Tanaka", "Haruto Sato"],
    "Berlin": ["Leon Müller", "Sophie Weber", "Felix Fischer"],
    "Sydney": ["Charlotte Wilson", "Oliver Taylor", "Sophia Martin"]
  };

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
      // Remove employees from this office
      const updatedEmployees = {...employeesBySelectedOffice};
      delete updatedEmployees[office];
      setEmployeesBySelectedOffice(updatedEmployees);
    } else {
      updatedOffices = [...selectedOffices, office];
      // Initialize empty employees array for this office
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

  return (
    <div className="approval-container">
      <div className="approval-card">
        <div className="header">
          <div className="icon-container">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="title">Approval Settings</h1>
        </div>
        
        <div className="content-container">
          <div className="toggle-section">
            <div className="toggle-header">
              <div className="toggle-content">
                <div className="icon-container">
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="toggle-text">
                  <h2 className="toggle-title">Manual Approval Needed</h2>
                  <p className="toggle-description">Enable this to require manual approval for documents</p>
                </div>
              </div>
              <div 
                className={`toggle-switch ${manualApprovalNeeded ? 'active' : 'inactive'}`}
                onClick={toggleManualApproval}
              >
                <div className={`toggle-button ${manualApprovalNeeded ? 'active' : ''}`} />
              </div>
            </div>
          </div>
        
        {manualApprovalNeeded && (
          <div className="space-y-8">
            <div className="section">
              <div className="header">
                <div className="icon-container">
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="toggle-title">Department Team Leads</h2>
                  <p className="toggle-description">Select department team leads who will approve the validated documents</p>
                </div>
              </div>
              
              <div className="dropdown">
                <div 
                  className="dropdown-trigger"
                  onClick={() => setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen)}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedDepartments.length > 0 ? 
                      selectedDepartments.map((dept, index) => (
                        <span key={index} className="tag">
                          {dept}
                        </span>
                      )) : 
                      <span className="text-gray-500 font-medium">Select departments</span>
                    }
                  </div>
                  <ChevronDown className={`icon ${isDepartmentDropdownOpen ? 'transform rotate-180' : ''}`} />
                </div>
                
                {isDepartmentDropdownOpen && (
                  <div className="dropdown-content">
                    {departments.map((dept, index) => (
                      <div 
                        key={index} 
                        className="dropdown-item"
                        onClick={() => toggleDepartment(dept)}
                      >
                        <div className={`checkbox ${selectedDepartments.includes(dept) ? 'checked' : ''}`}>
                          {selectedDepartments.includes(dept) && (
                            <svg className="checkbox-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-gray-700">{dept}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {selectedDepartments.length > 1 && (
              <div className="section">
                <div className="header">
                  <div className="icon-container">
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="toggle-title">Approval Flow</h2>
                    <p className="toggle-description">Choose how approvals flow between departments</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div 
                    className={`flow-option ${approvalFlow === 'consecutive' ? 'selected' : ''}`}
                    onClick={() => setApprovalFlow('consecutive')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`radio ${approvalFlow === 'consecutive' ? 'selected' : ''}`}>
                        {approvalFlow === 'consecutive' && (
                          <div className="radio-dot"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">Consecutive</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">One department approves after another</p>
                  </div>
                  
                  <div 
                    className={`flow-option ${approvalFlow === 'parallel' ? 'selected' : ''}`}
                    onClick={() => setApprovalFlow('parallel')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`radio ${approvalFlow === 'parallel' ? 'selected' : ''}`}>
                        {approvalFlow === 'parallel' && (
                          <div className="radio-dot"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">Parallel</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">All departments approve at once</p>
                  </div>
                </div>
                
                {approvalFlow === 'consecutive' && (
                  <div className="toggle-section">
                    <div className="text-sm">
                      <span className="text-purple-700 font-semibold flex items-center mb-3">
                        <svg className="icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        Sequential approval order:
                      </span>
                      <ol className="space-y-2">
                        {selectedDepartments.map((dept, index) => (
                          <li key={index} className="flex items-center text-gray-700">
                            <span className="tag">
                              {index + 1}
                            </span>
                            {dept}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-3 text-gray-600 text-xs font-medium">💡 Drag departments to reorder</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="section">
              <div className="header">
                <div className="icon-container">
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="toggle-title">Employee Selection</h2>
                  <p className="toggle-description">Select employees based on offices for approval</p>
                </div>
              </div>
              
              <div className="dropdown">
                <div 
                  className="dropdown-trigger"
                  onClick={() => setIsOfficesDropdownOpen(!isOfficesDropdownOpen)}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedOffices.length > 0 ? 
                      selectedOffices.map((office, index) => (
                        <span key={index} className="tag">
                          {office}
                        </span>
                      )) : 
                      <span className="text-gray-500 font-medium">Select offices</span>
                    }
                  </div>
                  <ChevronDown className={`icon ${isOfficesDropdownOpen ? 'transform rotate-180' : ''}`} />
                </div>
                
                {isOfficesDropdownOpen && (
                  <div className="dropdown-content">
                    {offices.map((office, index) => (
                      <div 
                        key={index} 
                        className="dropdown-item"
                        onClick={() => toggleOffice(office)}
                      >
                        <div className={`checkbox ${selectedOffices.includes(office) ? 'checked' : ''}`}>
                          {selectedOffices.includes(office) && (
                            <svg className="checkbox-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-gray-700">{office}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedOffices.length > 0 && (
                <div className="space-y-4">
                  {selectedOffices.map((office) => (
                    <div key={office} className="employee-card">
                      <div 
                        className="employee-header"
                        onClick={() => setExpandedOffice(expandedOffice === office ? null : office)}
                      >
                        <div className="flex items-center">
                          <div className="icon-container">
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900">{office}</span>
                          {(employeesBySelectedOffice[office]?.length || 0) > 0 && (
                            <span className="employee-count">
                              {employeesBySelectedOffice[office]?.length || 0} selected
                            </span>
                          )}
                        </div>
                        <ChevronDown 
                          className={`icon ${expandedOffice === office ? 'transform rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {expandedOffice === office && (
                        <div className="employee-content">
                          <div className="grid grid-cols-1 gap-2">
                            {employeesByOffice[office].map((employee, index) => (
                              <div 
                                key={index} 
                                className="employee-item"
                                onClick={() => toggleEmployee(office, employee)}
                              >
                                <div className={`checkbox ${employeesBySelectedOffice[office]?.includes(employee) ? 'checked' : ''}`}>
                                  {employeesBySelectedOffice[office]?.includes(employee) && (
                                    <svg className="checkbox-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <div className="avatar">
                                    {employee.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span className="font-medium text-gray-700">{employee}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="actions">
          <button className="button button-secondary">
            Cancel
          </button>
          <button className="button button-primary">
            <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Save Settings
          </button>
        </div>

        </div>
       
      </div>
    </div>
  );
}

export default ApprovalSettingsForm;