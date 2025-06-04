import React from 'react';
import { Users, Building2 } from 'lucide-react';
import styled from 'styled-components';

interface ValidationTypeSelectorProps {
  selectedType: 'employee' | 'office';
  onTypeChange: (type: 'employee' | 'office') => void;
}

const Section = styled.div`
  margin-bottom: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const IconWrapper = styled.div`
  background-color: #f3e8ff;
  color: #7e22ce;
  padding: 0.25rem;
  border-radius: 0.375rem;
`;

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ValidationTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

const ValidationTypeOption = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${props => props.$isActive ? '#9333ea' : '#e5e7eb'};
  background-color: ${props => props.$isActive ? '#f3e8ff' : 'transparent'};
  color: ${props => props.$isActive ? '#7e22ce' : '#374151'};

  &:hover {
    border-color: ${props => props.$isActive ? '#9333ea' : '#d1d5db'};
  }

  svg {
    margin-right: 0.5rem;
  }
`;

export const ValidationTypeSelector: React.FC<ValidationTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <Section>
      <Header>
        <IconWrapper>
          <Users size={16} />
        </IconWrapper>
        <Title>Validation Assignment</Title>
      </Header>
      <ValidationTypeGrid>
        <ValidationTypeOption
          $isActive={selectedType === 'employee'}
          onClick={() => onTypeChange('employee')}
        >
          <Users size={14} />
          <span>Employees</span>
        </ValidationTypeOption>
        <ValidationTypeOption
          $isActive={selectedType === 'office'}
          onClick={() => onTypeChange('office')}
        >
          <Building2 size={14} />
          <span>By Office</span>
        </ValidationTypeOption>
      </ValidationTypeGrid>
    </Section>
  );
};