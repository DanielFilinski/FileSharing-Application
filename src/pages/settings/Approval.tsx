import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <div className="flex flex-col bg-gray-50 min-h-screen p-6" style={{ fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.01em' }}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto w-full p-8">
        <div className="flex items-center mb-8">
          <div className="bg-purple-100 p-2 rounded-lg mr-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Approval Settings</h1>
        </div>
        
        {/* Manual Approval Toggle */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-lg mr-4 mt-1">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Manual Approval Needed</h2>
                <p className="text-sm text-gray-600">Enable this to require manual approval for documents</p>
              </div>
            </div>
            <div 
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${manualApprovalNeeded ? 'bg-purple-600 shadow-lg' : 'bg-gray-300'}`}
              onClick={toggleManualApproval}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${manualApprovalNeeded ? 'translate-x-7' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
        
        {manualApprovalNeeded && (
          <div className="space-y-8">
            {/* Department Team Leads */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-1.5 rounded-lg mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Department Team Leads</h2>
                  <p className="text-sm text-gray-600 mt-1">Select department team leads who will approve the validated documents</p>
                </div>
              </div>
              
              <div className="relative">
                <div 
                  className="border-2 border-gray-200 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-purple-300 transition-colors duration-200 bg-gray-50"
                  onClick={() => setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen)}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedDepartments.length > 0 ? 
                      selectedDepartments.map((dept, index) => (
                        <span key={index} className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-purple-200">
                          {dept}
                        </span>
                      )) : 
                      <span className="text-gray-500 font-medium">Select departments</span>
                    }
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDepartmentDropdownOpen ? 'transform rotate-180' : ''}`} />
                </div>
                
                {isDepartmentDropdownOpen && (
                  <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {departments.map((dept, index) => (
                      <div 
                        key={index} 
                        className="flex items-center p-4 hover:bg-purple-50 cursor-pointer transition-colors duration-150"
                        onClick={() => toggleDepartment(dept)}
                      >
                        <div className={`w-5 h-5 border-2 rounded-md mr-3 flex items-center justify-center transition-colors duration-200 ${selectedDepartments.includes(dept) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                          {selectedDepartments.includes(dept) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
            
            {/* Approval Flow Selection - Only shows when multiple departments selected */}
            {selectedDepartments.length > 1 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-1.5 rounded-lg mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Approval Flow</h2>
                    <p className="text-sm text-gray-600 mt-1">Choose how approvals flow between departments</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${approvalFlow === 'consecutive' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 bg-gray-50'}`}
                    onClick={() => setApprovalFlow('consecutive')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${approvalFlow === 'consecutive' ? 'border-purple-600' : 'border-gray-300'}`}>
                        {approvalFlow === 'consecutive' && (
                          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">Consecutive</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">One department approves after another</p>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${approvalFlow === 'parallel' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 bg-gray-50'}`}
                    onClick={() => setApprovalFlow('parallel')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${approvalFlow === 'parallel' ? 'border-purple-600' : 'border-gray-300'}`}>
                        {approvalFlow === 'parallel' && (
                          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">Parallel</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">All departments approve at once</p>
                  </div>
                </div>
                
                {approvalFlow === 'consecutive' && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                    <div className="text-sm">
                      <span className="text-purple-700 font-semibold flex items-center mb-3">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        Sequential approval order:
                      </span>
                      <ol className="space-y-2">
                        {selectedDepartments.map((dept, index) => (
                          <li key={index} className="flex items-center text-gray-700">
                            <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">
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
            
            {/* Employee Selection by Office */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-1.5 rounded-lg mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Employee Selection</h2>
                  <p className="text-sm text-gray-600 mt-1">Select employees based on offices for approval</p>
                </div>
              </div>
              
              {/* Office Selection */}
              <div className="mb-6">
                <div className="relative">
                  <div 
                    className="border-2 border-gray-200 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-purple-300 transition-colors duration-200 bg-gray-50"
                    onClick={() => setIsOfficesDropdownOpen(!isOfficesDropdownOpen)}
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedOffices.length > 0 ? 
                        selectedOffices.map((office, index) => (
                          <span key={index} className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-purple-200">
                            {office}
                          </span>
                        )) : 
                        <span className="text-gray-500 font-medium">Select offices</span>
                      }
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOfficesDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                  
                  {isOfficesDropdownOpen && (
                    <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {offices.map((office, index) => (
                        <div 
                          key={index} 
                          className="flex items-center p-4 hover:bg-purple-50 cursor-pointer transition-colors duration-150"
                          onClick={() => toggleOffice(office)}
                        >
                          <div className={`w-5 h-5 border-2 rounded-md mr-3 flex items-center justify-center transition-colors duration-200 ${selectedOffices.includes(office) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                            {selectedOffices.includes(office) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              </div>
              
              {/* Employee Selection by Office */}
              {selectedOffices.length > 0 && (
                <div className="space-y-4">
                  {selectedOffices.map((office) => (
                    <div key={office} className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200 overflow-hidden">
                      <div 
                        className="flex justify-between items-center p-4 cursor-pointer bg-white hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setExpandedOffice(expandedOffice === office ? null : office)}
                      >
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-1.5 rounded-lg mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900">{office}</span>
                          {(employeesBySelectedOffice[office]?.length || 0) > 0 && (
                            <span className="ml-3 bg-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                              {employeesBySelectedOffice[office]?.length || 0} selected
                            </span>
                          )}
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedOffice === office ? 'transform rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {expandedOffice === office && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <div className="grid grid-cols-1 gap-2">
                            {employeesByOffice[office].map((employee, index) => (
                              <div 
                                key={index} 
                                className="flex items-center p-3 hover:bg-purple-50 cursor-pointer rounded-lg transition-colors duration-150"
                                onClick={() => toggleEmployee(office, employee)}
                              >
                                <div className={`w-5 h-5 border-2 rounded-md mr-3 flex items-center justify-center transition-colors duration-200 ${employeesBySelectedOffice[office]?.includes(employee) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                                  {employeesBySelectedOffice[office]?.includes(employee) && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-semibold">
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
        
        {/* Save Button - Always visible regardless of manual approval setting */}
        <div className="pt-8 border-t border-gray-200 mt-8">
          <div className="flex justify-between items-center">
            <button className="text-gray-600 hover:text-gray-800 font-semibold py-3 px-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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