import React, { useState, useEffect } from 'react';
import { Settings, Check, Save, Shield, Users, Briefcase, FileText, Building2, ChevronDown, X, Plus, AlertCircle } from 'lucide-react';

const ValidationSettingsForm = () => {
  const [manualValidation, setManualValidation] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [validationType, setValidationType] = useState('employee'); // 'employee', 'office'
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [officeValidators, setOfficeValidators] = useState({});
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
    const initialOfficeValidators = {};
    offices.forEach(office => {
      initialOfficeValidators[office.id] = [];
    });
    setOfficeValidators(initialOfficeValidators);
  }, []);

  const handleEmployeeSelect = (employee) => {
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

  const selectOfficeValidators = (officeId) => {
    setSelectedEmployees(officeValidators[officeId]);
    setShowEmployeeSelector(true);
  };

  const removeEmployeeFromOffice = (officeId, empId) => {
    const updatedValidators = { ...officeValidators };
    updatedValidators[officeId] = updatedValidators[officeId].filter(emp => emp.id !== empId);
    setOfficeValidators(updatedValidators);
  };

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentName = (deptId) => {
    const department = departments.find(dept => dept.id === deptId);
    return department ? department.name : '';
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50" style={{ fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.01em' }}>
      {/* Header */}
      <div className="py-4 px-6 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center">
          <Shield className="text-purple-600 mr-3" size={20} />
          <h1 className="text-xl font-semibold text-gray-900">Validation Settings</h1>
        </div>
        <button className="text-white bg-purple-600 hover:bg-purple-700 py-1.5 px-4 rounded-md text-sm font-medium flex items-center transition-colors duration-200">
          <Save size={16} className="mr-1.5" />
          Save changes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* Main Validation Toggle */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-700 p-1 rounded-md mr-3 mt-1">
                  <Shield size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Manual Validation Needed</h2>
                  <p className="text-gray-500 text-sm mt-1">Enable this option if documents require manual validation before processing</p>
                </div>
              </div>
              <div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={manualValidation} 
                    onChange={() => setManualValidation(!manualValidation)} 
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${manualValidation ? 'bg-purple-600' : 'bg-gray-300'}`}>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${manualValidation ? 'transform translate-x-5' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {manualValidation && (
            <>
              {/* Validation Type Selection */}
              <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-700 p-1 rounded-md mr-2">
                    <Users size={16} />
                  </span>
                  Validation Assignment
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`border rounded-lg px-3 py-2 flex items-center justify-center cursor-pointer transition-colors ${validationType === 'employee' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setValidationType('employee')}
                  >
                    <Users size={14} className={`mr-1.5 ${validationType === 'employee' ? 'text-purple-600' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${validationType === 'employee' ? 'text-purple-700' : 'text-gray-700'}`}>Employees</span>
                  </div>
                  <div 
                    className={`border rounded-lg px-3 py-2 flex items-center justify-center cursor-pointer transition-colors ${validationType === 'office' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setValidationType('office')}
                  >
                    <Building2 size={14} className={`mr-1.5 ${validationType === 'office' ? 'text-purple-600' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${validationType === 'office' ? 'text-purple-700' : 'text-gray-700'}`}>By Office</span>
                  </div>
                </div>
              </div>

              {/* Validation Setup - Employees */}
              {validationType === 'employee' && (
                <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-md font-semibold text-gray-800 mb-4">Employees Responsible for Validation</h2>
                  
                  {/* Selected Employees List */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployees.length > 0 ? (
                        selectedEmployees.map(employee => (
                          <div key={employee.id} className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                            <span className="mr-1.5">{employee.avatar}</span>
                            <span className="mr-1">{employee.name}</span>
                            <button 
                              onClick={() => setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employee.id))}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">No employees selected</p>
                      )}
                    </div>
                  </div>

                  {/* Add Employee Button */}
                  <button 
                    onClick={() => setShowEmployeeSelector(true)}
                    className="text-purple-600 hover:bg-purple-50 py-1.5 px-3 rounded-md text-sm font-medium flex items-center transition-colors duration-200"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add Validator
                  </button>

                  {/* Employee Selector Popup */}
                  {showEmployeeSelector && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-lg">Select Validators</h3>
                          <button onClick={() => setShowEmployeeSelector(false)} className="text-gray-500 hover:text-gray-700">
                            <X size={18} />
                          </button>
                        </div>
                        
                        {/* Search */}
                        <div className="mb-4">
                          <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                        
                        {/* Employee List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(employee => {
                              const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                              return (
                                <div 
                                  key={employee.id} 
                                  className={`flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer rounded-md ${isSelected ? 'bg-purple-50' : ''}`}
                                  onClick={() => handleEmployeeSelect(employee)}
                                >
                                  <div className="flex items-center">
                                    <span className="mr-2 text-lg">{employee.avatar}</span>
                                    <div>
                                      <p className="font-medium text-gray-800">{employee.name}</p>
                                      <p className="text-xs text-gray-500">{getDepartmentName(employee.department)}</p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check size={16} className="text-purple-600" />
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center py-4 text-gray-500">No employees found</p>
                          )}
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => setShowEmployeeSelector(false)}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium"
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
                <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-md font-semibold text-gray-800 mb-4">Office-Specific Validators</h2>
                  <p className="text-sm text-gray-500 mb-4">Assign validators to specific office locations</p>
                  
                  <div className="space-y-4">
                    {offices.map(office => (
                      <div key={office.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium flex items-center">
                            <Building2 size={16} className="text-purple-600 mr-1.5" />
                            {office.name}
                          </h3>
                          <button 
                            onClick={() => selectOfficeValidators(office.id)}
                            className="text-purple-600 hover:bg-purple-50 py-1 px-2 rounded-md text-sm flex items-center transition-colors duration-200"
                          >
                            <Plus size={14} className="mr-1" />
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {officeValidators[office.id]?.length > 0 ? (
                            officeValidators[office.id].map(employee => (
                              <div key={employee.id} className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                                <span className="mr-1.5">{employee.avatar}</span>
                                <span className="mr-1">{employee.name}</span>
                                <button 
                                  onClick={() => removeEmployeeFromOffice(office.id, employee.id)}
                                  className="text-gray-500 hover:text-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm italic">No validators assigned</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Toggle */}
              <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-start">
                    <span className="bg-purple-100 text-purple-700 p-1 rounded-md mr-3 mt-1">
                      <Check size={18} />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Approval Needed</h2>
                      <p className="text-gray-500 text-sm mt-1">Enable this option if documents require approval after validation</p>
                    </div>
                  </div>
                  <div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={approvalNeeded} 
                        onChange={() => setApprovalNeeded(!approvalNeeded)} 
                        className="sr-only"
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${approvalNeeded ? 'bg-purple-600' : 'bg-gray-300'}`}>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${approvalNeeded ? 'transform translate-x-5' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
                {approvalNeeded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm bg-purple-50 rounded-md p-3 text-purple-800 flex items-start">
                      <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-purple-700" />
                      <p>Approval settings will be fetched from document approval configuration. Documents will follow the complete validation and approval workflow.</p>
                    </div>
                  </div>
                )}
                {!approvalNeeded && manualValidation && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm bg-blue-50 rounded-md p-3 text-blue-800 flex items-start">
                      <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-blue-700" />
                      <p>Documents will be automatically approved after successful validation by the assigned validators.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!manualValidation && (
            <div className="my-6 bg-green-50 rounded-lg p-5 border border-green-200 text-green-800">
              <div className="flex items-start">
                <div className="mr-3 mt-1 flex-shrink-0 bg-green-100 text-green-600 rounded-md p-1.5">
                  <Check size={16} />
                </div>
                <div>
                  <h3 className="font-medium">Automatic Document Processing Enabled</h3>
                  <p className="text-sm mt-1">Documents will be automatically validated and processed without manual intervention.</p>
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