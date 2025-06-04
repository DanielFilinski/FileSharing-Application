import React from 'react';
import { Users, Building2 } from 'lucide-react';
import styled from 'styled-components';
import AccentIcon from '@/components/accent-icon';
import { COLORS } from '@/app/theme/color-pallete';

interface ValidationTypeSelectorProps {
  selectedType: 'employee' | 'office';
  onTypeChange: (type: 'employee' | 'office') => void;
}

export const ValidationTypeSelector: React.FC<ValidationTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <Section>
      <Header>
        <AccentIcon icon={<Users size={18} />} />
        <Title>Validation Assignment</Title>
      </Header>

      <ValidationTypeGrid>
        <ValidationTypeOption 
          isActive={selectedType === 'employee'}
          onClick={() => onTypeChange('employee')}
        >
          <Users size={14} />
          <span>Employees</span>
        </ValidationTypeOption>
        <ValidationTypeOption 
          isActive={selectedType === 'office'}
          onClick={() => onTypeChange('office')}
        >
          <Building2 size={14} />
          <span>By Office</span>
        </ValidationTypeOption>
      </ValidationTypeGrid>
    </Section>
  );
}; 


const Section = styled.div`
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const ValidationTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const ValidationTypeOption = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isActive ? COLORS.purple4 : '#f5f5f5'};
  border: 1px solid ${props => props.isActive ? COLORS.purple2 : '#e0e0e0'};
  color: ${props => props.isActive ? COLORS.purple2 : '#666'};

  &:hover {
    background: ${props => props.isActive ? COLORS.purple4  : '#f0f0f0'};
  }

  svg {
    margin-right: 0.5rem;
  }
`;