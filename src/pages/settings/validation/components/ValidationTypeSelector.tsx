import React from 'react';
import { Users, Building2 } from 'lucide-react';

interface ValidationTypeSelectorProps {
  selectedType: 'employee' | 'office';
  onTypeChange: (type: 'employee' | 'office') => void;
}

export const ValidationTypeSelector: React.FC<ValidationTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <div className="section">
      <h2 className="title-text">Validation Assignment</h2>
      <div className="validation-type-grid">
        <div 
          className={`validation-type-option ${selectedType === 'employee' ? 'active' : ''}`}
          onClick={() => onTypeChange('employee')}
        >
          <Users size={14} className="mr-1.5" />
          <span>Employees</span>
        </div>
        <div 
          className={`validation-type-option ${selectedType === 'office' ? 'active' : ''}`}
          onClick={() => onTypeChange('office')}
        >
          <Building2 size={14} className="mr-1.5" />
          <span>By Office</span>
        </div>
      </div>
    </div>
  );
}; 