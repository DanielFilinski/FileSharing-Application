import React from 'react';
import { Building2, Plus, X } from 'lucide-react';
import styled from 'styled-components';

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
  onRemoveValidator: (officeId: string, empId: string) => void;
}

const OfficeSection = styled.div`
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const OfficeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const OfficeTitle = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
`;

const OfficeIcon = styled(Building2)`
  color: #9333ea;
  margin-right: 0.375rem;
`;

const AddButton = styled.button`
  color: #9333ea;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3e8ff;
  }
`;

const AddButtonIcon = styled(Plus)`
  margin-right: 0.375rem;
`;

const ValidatorsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ValidatorTag = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
`;

const ValidatorAvatar = styled.span`
  margin-right: 0.375rem;
  font-size: 1.25rem;
`;

const ValidatorName = styled.span`
  margin-right: 0.25rem;
  color: #1f2937;
`;

const RemoveButton = styled.button`
  color: #6b7280;
  padding: 0.125rem;
  border-radius: 0.25rem;
  transition: all 0.2s;

  &:hover {
    color: #ef4444;
    background-color: #fee2e2;
  }
`;

const NoValidatorsText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
`;

export const OfficeValidator: React.FC<OfficeValidatorProps> = ({
  office,
  validators,
  onAddValidator,
  onRemoveValidator
}) => {
  return (
    <OfficeSection>
      <OfficeHeader>
        <OfficeTitle>
          <OfficeIcon size={16} />
          {office.name}
        </OfficeTitle>
        <AddButton onClick={() => onAddValidator(office.id)}>
          <AddButtonIcon size={16} />
          Add Validator
        </AddButton>
      </OfficeHeader>

      <ValidatorsList>
        {validators.length > 0 ? (
          validators.map(validator => (
            <ValidatorTag key={validator.id}>
              <ValidatorAvatar>{validator.avatar}</ValidatorAvatar>
              <ValidatorName>{validator.name}</ValidatorName>
              <RemoveButton onClick={() => onRemoveValidator(office.id, validator.id)}>
                <X size={14} />
              </RemoveButton>
            </ValidatorTag>
          ))
        ) : (
          <NoValidatorsText>No validators assigned</NoValidatorsText>
        )}
      </ValidatorsList>
    </OfficeSection>
  );
};