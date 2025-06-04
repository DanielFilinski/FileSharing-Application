import React from 'react';
import { Building2, Plus, X } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  department: string;
  avatar: string;
}

interface Office {
  id: string;
  name: string;
}

interface OfficeValidatorProps {
  office: Office;
  validators: Employee[];
  onAddValidator: (officeId: string) => void;
  onRemoveValidator: (officeId: string, employeeId: string) => void;
}

export const OfficeValidator: React.FC<OfficeValidatorProps> = ({
  office,
  validators,
  onAddValidator,
  onRemoveValidator
}) => {
  return (
    <div className="office-section">
      <div className="office-header">
        <h3 className="office-title">
          <Building2 size={16} className="office-icon" />
          {office.name}
        </h3>
        <button 
          onClick={() => onAddValidator(office.id)}
          className="add-button"
        >
          <Plus size={14} className="mr-1" />
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {validators.length > 0 ? (
          validators.map(employee => (
            <div key={employee.id} className="employee-tag">
              <span className="employee-tag-avatar">{employee.avatar}</span>
              <span className="employee-tag-name">{employee.name}</span>
              <button 
                onClick={() => onRemoveValidator(office.id, employee.id)}
                className="employee-tag-remove"
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
  );
}; 