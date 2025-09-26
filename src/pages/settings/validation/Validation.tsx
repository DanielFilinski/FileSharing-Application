import { useState, useEffect } from 'react';
import { ValidationHeader } from './components/ValidationHeader';
import { ManualValidationToggle } from './components/ManualValidationToggle';
import { ValidationTypeSelector } from './components/ValidationTypeSelector';
import { EmployeeValidators } from './components/EmployeeValidators';
import { OfficeValidators } from './components/OfficeValidators';
import { DepartmentValidators } from './components/DepartmentValidators';
import { DocumentValidators } from './components/DocumentValidators';
import { ValidationMessageBars } from './components/ValidationMessageBars';
import { EmployeeSelectionDialog } from './components/EmployeeSelectionDialog';
import { 
  Employee, 
  Department, 
  Office, 
  DocumentType,
  OfficeValidators as OfficeValidatorsType, 
  DepartmentValidators as DepartmentValidatorsType,
  DocumentValidators as DocumentValidatorsType,
  ValidationType
} from './types';
import { ContentContainer, RowCardContainer, ScreenContainer } from '@/app/styles/layouts';

const TeamsValidationSettings = () => {
  const [manualValidation, setManualValidation] = useState(false);
  const [validationType, setValidationType] = useState<ValidationType>('employee');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [officeValidators, setOfficeValidators] = useState<OfficeValidatorsType>({});
  const [departmentValidators, setDepartmentValidators] = useState<DepartmentValidatorsType>({});
  const [documentValidators, setDocumentValidators] = useState<DocumentValidatorsType>({});
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOfficeId, setCurrentOfficeId] = useState<string>('');
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');
  const [currentDocumentTypeId, setCurrentDocumentTypeId] = useState<string>('');

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

  const documentTypes: DocumentType[] = [
    { id: 'doc1', name: 'Tax Documents' },
    { id: 'doc2', name: 'Legal Contracts' },
    { id: 'doc3', name: 'Government Forms' },
  ];

  useEffect(() => {
    const initialOfficeValidators: OfficeValidatorsType = {};
    offices.forEach(office => {
      initialOfficeValidators[office.id] = [];
    });
    setOfficeValidators(initialOfficeValidators);

    const initialDepartmentValidators: DepartmentValidatorsType = {};
    departments.forEach(department => {
      initialDepartmentValidators[department.id] = [];
    });
    setDepartmentValidators(initialDepartmentValidators);

    const initialDocumentValidators: DocumentValidatorsType = {};
    documentTypes.forEach(documentType => {
      initialDocumentValidators[documentType.id] = [];
    });
    setDocumentValidators(initialDocumentValidators);
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
    } else if (validationType === 'department' && currentDepartmentId) {
      const updatedValidators = { ...departmentValidators };
      if (updatedValidators[currentDepartmentId].find((emp: Employee) => emp.id === employee.id)) {
        updatedValidators[currentDepartmentId] = updatedValidators[currentDepartmentId].filter((emp: Employee) => emp.id !== employee.id);
      } else {
        updatedValidators[currentDepartmentId] = [...updatedValidators[currentDepartmentId], employee];
      }
      setDepartmentValidators(updatedValidators);
    } else if (validationType === 'document' && currentDocumentTypeId) {
      const updatedValidators = { ...documentValidators };
      if (updatedValidators[currentDocumentTypeId].find((emp: Employee) => emp.id === employee.id)) {
        updatedValidators[currentDocumentTypeId] = updatedValidators[currentDocumentTypeId].filter((emp: Employee) => emp.id !== employee.id);
      } else {
        updatedValidators[currentDocumentTypeId] = [...updatedValidators[currentDocumentTypeId], employee];
      }
      setDocumentValidators(updatedValidators);
    }
  };

  const openEmployeeDialog = (contextId?: string) => {
    if (validationType === 'office' && contextId) {
      setCurrentOfficeId(contextId);
    } else if (validationType === 'department' && contextId) {
      setCurrentDepartmentId(contextId);
    } else if (validationType === 'document' && contextId) {
      setCurrentDocumentTypeId(contextId);
    }
    setShowEmployeeDialog(true);
  };

  const removeEmployee = (empId: string, contextId?: string) => {
    if (validationType === 'employee') {
      setSelectedEmployees(selectedEmployees.filter((emp: Employee) => emp.id !== empId));
    } else if (validationType === 'office' && contextId) {
      const updatedValidators = { ...officeValidators };
      updatedValidators[contextId] = updatedValidators[contextId].filter((emp: Employee) => emp.id !== empId);
      setOfficeValidators(updatedValidators);
    } else if (validationType === 'department' && contextId) {
      const updatedValidators = { ...departmentValidators };
      updatedValidators[contextId] = updatedValidators[contextId].filter((emp: Employee) => emp.id !== empId);
      setDepartmentValidators(updatedValidators);
    } else if (validationType === 'document' && contextId) {
      const updatedValidators = { ...documentValidators };
      updatedValidators[contextId] = updatedValidators[contextId].filter((emp: Employee) => emp.id !== empId);
      setDocumentValidators(updatedValidators);
    }
  };

  const handleAddDocumentType = () => {
    // В реальном приложении здесь был бы диалог для ввода названия
    const newId = `doc${documentTypes.length + 1}`;
    const newDocumentType: DocumentType = {
      id: newId,
      name: `New Document Type ${documentTypes.length + 1}`
    };
    
    // Добавляем новый тип документа в локальные данные (в реальном приложении это было бы API-вызов)
    documentTypes.push(newDocumentType);
    
    // Инициализируем пустой массив валидаторов для нового типа
    const updatedValidators = { ...documentValidators };
    updatedValidators[newId] = [];
    setDocumentValidators(updatedValidators);
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

            {validationType === 'department' && (
             
                <DepartmentValidators
                  departments={departments}
                  departmentValidators={departmentValidators}
                  onAddClick={openEmployeeDialog}
                  onRemoveEmployee={removeEmployee}
                />
              
            )}

            {validationType === 'document' && (
             
                <DocumentValidators
                  documentTypes={documentTypes}
                  documentValidators={documentValidators}
                  onAddClick={openEmployeeDialog}
                  onRemoveEmployee={removeEmployee}
                  onAddDocumentType={handleAddDocumentType}
                />
              
            )}

            
              {/* <ApprovalToggle
                approvalNeeded={approvalNeeded}
                onToggle={setApprovalNeeded}
              /> */}
           

            <ValidationMessageBars
              manualValidation={manualValidation}
              approvalNeeded={false}
            />
          </>
        )}

        {!manualValidation && (
          <ValidationMessageBars
            manualValidation={manualValidation}
            approvalNeeded={false}
          />
        )}

        </RowCardContainer>
        
         
      </ContentContainer>

      <EmployeeSelectionDialog
        open={showEmployeeDialog}
        onOpenChange={setShowEmployeeDialog}
        employees={filteredEmployees}
        selectedEmployees={
          validationType === 'employee' 
            ? selectedEmployees 
            : validationType === 'office' && currentOfficeId 
            ? officeValidators[currentOfficeId] || []
            : validationType === 'department' && currentDepartmentId
            ? departmentValidators[currentDepartmentId] || []
            : validationType === 'document' && currentDocumentTypeId
            ? documentValidators[currentDocumentTypeId] || []
            : []
        }
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEmployeeSelect={handleEmployeeSelect}
        getDepartmentName={getDepartmentName}
      />
    </ScreenContainer>
  );
};

export default TeamsValidationSettings;