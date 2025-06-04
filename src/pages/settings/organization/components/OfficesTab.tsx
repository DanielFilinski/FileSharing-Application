import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { Plus, X, Building2, MapPin, Check } from 'lucide-react';

const Section = styled.div`
  margin-bottom: 2rem;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const SectionHeader = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  
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
  background-color: #F5F3FF;
  color: #8B5CF6;
  border-radius: 0.375rem;
  padding: 0.5rem;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: #8B5CF6;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #7C3AED;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #DDD6FE;
    cursor: not-allowed;
    transform: none;
  }
`;

const OfficeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OfficeItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  position: relative;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #8B5CF6;
    box-shadow: 0 1px 3px rgba(139, 92, 246, 0.1);
  }
`;

const OfficeRemove = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #6B7280;
  transition: all 0.2s ease-in-out;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;

  &:hover {
    color: #EF4444;
    background-color: #FEE2E2;
  }
`;

const OfficeContent = styled.div`
  display: flex;
  gap: 1rem;
  flex: 1;
`;

const OfficeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: #F5F3FF;
  color: #8B5CF6;
  border-radius: 0.375rem;
  padding: 0.5rem;
`;

const OfficeDetails = styled.div`
  flex: 1;
`;

const OfficeName = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const OfficeAddress = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #6B7280;
  font-size: 0.875rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  background-color: white;
  border: 2px dashed #E5E7EB;
  border-radius: 0.5rem;
  text-align: center;
  
  @media (max-width: 640px) {
    padding: 2rem 1rem;
  }
`;

const EmptyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background-color: #F5F3FF;
  color: #8B5CF6;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const EmptyDescription = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
`;

const AddOfficeForm = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const FormTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
`;

const FormClose = styled.button`
  color: #6B7280;
  transition: all 0.2s ease-in-out;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;

  &:hover {
    color: #EF4444;
    background-color: #FEE2E2;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FormGroup = styled.div<{ fullWidth?: boolean }>`
  ${(props: { fullWidth?: boolean }) => props.fullWidth && 'grid-column: span 2;'}
  
  @media (max-width: 640px) {
    grid-column: span 1;
  }
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
    border-color: #8B5CF6;
  }

  &:focus {
    outline: none;
    border-color: #8B5CF6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: #9CA3AF;
  }
  
  &:disabled {
    background-color: #F9FAFB;
    cursor: not-allowed;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  transition: all 0.2s ease-in-out;
  resize: vertical;
  background-color: white;

  &:hover {
    border-color: #8B5CF6;
  }

  &:focus {
    outline: none;
    border-color: #8B5CF6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: #9CA3AF;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  color: #6B7280;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  border-radius: 0.375rem;
  cursor: pointer;

  &:hover {
    color: #374151;
    background-color: #F3F4F6;
  }
`;

export const OfficesTab: React.FC = () => {
  const [offices, setOffices] = useState<Array<{ name: string; address: string }>>([]);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeAddress, setNewOfficeAddress] = useState('');
  const [showAddOffice, setShowAddOffice] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setter: (value: string) => void) => {
    setter(e.target.value);
  };

  const handleAddOffice = () => {
    if (newOfficeName.trim() && newOfficeAddress.trim()) {
      setOffices([...offices, { name: newOfficeName, address: newOfficeAddress }]);
      setNewOfficeName('');
      setNewOfficeAddress('');
      setShowAddOffice(false);
    }
  };

  const handleRemoveOffice = (index: number) => {
    const updatedOffices = [...offices];
    updatedOffices.splice(index, 1);
    setOffices(updatedOffices);
  };

  return (
    <Section>
      <FormHeader>
        <SectionHeader>
          <SectionIcon>
            <Building2 size={18} />
          </SectionIcon>
          Offices
        </SectionHeader>
        <AddButton onClick={() => setShowAddOffice(true)}>
          <Plus size={16} />
          Add Office
        </AddButton>
      </FormHeader>

      <OfficeList>
        {offices.length > 0 ? (
          offices.map((office, index) => (
            <OfficeItem key={index}>
              <OfficeRemove onClick={() => handleRemoveOffice(index)}>
                <X size={16} />
              </OfficeRemove>
              <OfficeContent>
                <OfficeIcon>
                  <Building2 size={16} />
                </OfficeIcon>
                <OfficeDetails>
                  <OfficeName>{office.name}</OfficeName>
                  <OfficeAddress>
                    <MapPin size={14} />
                    {office.address}
                  </OfficeAddress>
                </OfficeDetails>
              </OfficeContent>
            </OfficeItem>
          ))
        ) : (
          <EmptyState>
            <EmptyIcon>
              <Building2 size={24} />
            </EmptyIcon>
            <EmptyTitle>No offices added yet</EmptyTitle>
            <EmptyDescription>Click "Add Office" to add your first office location</EmptyDescription>
          </EmptyState>
        )}
      </OfficeList>

      {showAddOffice && (
        <AddOfficeForm>
          <FormHeader>
            <FormTitle>
              <Plus size={16} />
              Add New Office
            </FormTitle>
            <FormClose onClick={() => setShowAddOffice(false)}>
              <X size={16} />
            </FormClose>
          </FormHeader>
          <FormGrid>
            <FormGroup>
              <FormLabel>Office Name</FormLabel>
              <FormInput
                type="text"
                value={newOfficeName}
                onChange={(e) => handleInputChange(e, setNewOfficeName)}
                placeholder="Enter office name"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Office Address</FormLabel>
              <FormTextarea
                value={newOfficeAddress}
                onChange={(e) => handleInputChange(e, setNewOfficeAddress)}
                placeholder="Enter office address"
                rows={2}
              />
            </FormGroup>
            <FormActions>
              <CancelButton onClick={() => setShowAddOffice(false)}>
                Cancel
              </CancelButton>
              <AddButton
                onClick={handleAddOffice}
                disabled={!newOfficeName.trim() || !newOfficeAddress.trim()}
              >
                <Check size={16} />
                Add Office
              </AddButton>
            </FormActions>
          </FormGrid>
        </AddOfficeForm>
      )}
    </Section>
  );
}; 