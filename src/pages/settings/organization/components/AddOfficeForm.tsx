import React, { useState } from 'react';
import { tokens, Button, Input, Text, Field, Textarea } from '@fluentui/react-components';
import { Add24Regular, Dismiss24Regular, Checkmark24Regular } from '@fluentui/react-icons';
import styled from 'styled-components';
import { CardContainer, RowCardItemContainer, IconTitleContainer } from '../../../../app/styles/layouts';

interface AddOfficeFormProps {
  onAdd: (name: string, address: string) => void;
  onCancel: () => void;
}



const AddOfficeForm: React.FC<AddOfficeFormProps> = ({ onAdd, onCancel }) => {
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeAddress, setNewOfficeAddress] = useState('');

  const handleAdd = () => {
    if (newOfficeName.trim() && newOfficeAddress.trim()) {
      onAdd(newOfficeName, newOfficeAddress);
      setNewOfficeName('');
      setNewOfficeAddress('');
    }
  };

  return (
    <CardContainer style={{ backgroundColor: tokens.colorBrandBackground2 }}>
      <FormHeader>
        <FormTitle>
          <Add24Regular />
          <Text weight="medium">Add New Office</Text>
        </FormTitle>
        <Button
          appearance="subtle"
          icon={<Dismiss24Regular />}
          size="small"
          onClick={onCancel}
        />
      </FormHeader>
      
      <FormGrid>
        <Field label="Office Name" required>
          <Input
            value={newOfficeName}
            onChange={(e) => setNewOfficeName(e.target.value)}
            placeholder="Enter office name"
          />
        </Field>
        
        <Field label="Office Address" required>
          <Textarea
            value={newOfficeAddress}
            onChange={(e) => setNewOfficeAddress(e.target.value)}
            placeholder="Enter office address"
            rows={2}
          />
        </Field>
        
        <FormActions>
          <Button
            appearance="subtle"
            onClick={onCancel}
          >
            Cancel
          </Button>
          
          <Button
            appearance="primary"
            icon={<Checkmark24Regular />}
            onClick={handleAdd}
            disabled={!newOfficeName.trim() || !newOfficeAddress.trim()}
          >
            Add Office
          </Button>
        </FormActions>
      </FormGrid>
    </CardContainer>
  );
};

export default AddOfficeForm; 


const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FormTitle = styled(IconTitleContainer)`
  color: ${tokens.colorBrandForeground1};
`;

const FormGrid = styled(RowCardItemContainer)`
  
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;