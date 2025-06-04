import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { Building2, Users } from 'lucide-react';

export const GeneralTab: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    setter(e.target.value);
  };

  return (
    <>
      <Section>
        <SectionHeader>
          <SectionIcon>
            <Building2 size={18} />
          </SectionIcon>
          Company Information
        </SectionHeader>
        <FormGrid>
          <FormGroup>
            <FormLabel>Company Name</FormLabel>
            <FormInput
              type="text"
              value={companyName}
              onChange={(e) => handleInputChange(e, setCompanyName)}
              placeholder="Enter company name"
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Company Contact</FormLabel>
            <FormInput
              type="text"
              value={companyContact}
              onChange={(e) => handleInputChange(e, setCompanyContact)}
              placeholder="Enter company contact number"
            />
          </FormGroup>
          <FormGroup fullWidth>
            <FormLabel>Company Email</FormLabel>
            <FormInput
              type="email"
              value={companyEmail}
              onChange={(e) => handleInputChange(e, setCompanyEmail)}
              placeholder="Enter company email"
            />
          </FormGroup>
        </FormGrid>
      </Section>

      <Section>
        <SectionHeader>
          <SectionIcon>
            <Users size={18} />
          </SectionIcon>
          Owner Information
        </SectionHeader>
        <FormGrid>
          <FormGroup>
            <FormLabel>Owner Full Name</FormLabel>
            <FormInput
              type="text"
              value={ownerName}
              onChange={(e) => handleInputChange(e, setOwnerName)}
              placeholder="Enter owner's full name"
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Owner Contact</FormLabel>
            <FormInput
              type="text"
              value={ownerContact}
              onChange={(e) => handleInputChange(e, setOwnerContact)}
              placeholder="Enter owner's contact number"
            />
          </FormGroup>
          <FormGroup fullWidth>
            <FormLabel>Owner Email</FormLabel>
            <FormInput
              type="email"
              value={ownerEmail}
              onChange={(e) => handleInputChange(e, setOwnerEmail)}
              placeholder="Enter owner's email"
            />
          </FormGroup>
        </FormGrid>
      </Section>
    </>
  );
};

const Section = styled.div`
  margin-bottom: 2rem;
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SectionHeader = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  
  @media (max-width: 640px) {
    font-size: 1.125rem;
  }
`;

const SectionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: #f3e8ff;
  color: #9333ea;
  border-radius: 0.375rem;
  padding: 0.5rem;
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (max-width: 640px) {
    gap: 1rem;
  }
`;

const FormGroup = styled.div<{ fullWidth?: boolean }>`
  width: 100%;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  transition: all 0.2s ease-in-out;
  background-color: white;

  &:hover {
    border-color: #9333ea;
  }

  &:focus {
    outline: none;
    border-color: #9333ea;
    box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1);
  }

  &::placeholder {
    color: #6B7280;
  }
  
  &:disabled {
    background-color: #F9FAFB;
    cursor: not-allowed;
  }
`;
