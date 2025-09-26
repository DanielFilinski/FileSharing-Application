import { Body1, Badge, Button } from '@fluentui/react-components';
import { AddIcon, DismissIcon, DocumentIcon } from '../icons';
import { DocumentType, Employee, DocumentValidators as DocumentValidatorsType } from '../types';
import styled from 'styled-components';
import { CardContainer } from '@/app/styles/layouts';
import { tokens } from '@fluentui/react-components';
import { CardHeader } from '@/components/card/card-header';

interface DocumentValidatorsProps {
  documentTypes: DocumentType[];
  documentValidators: DocumentValidatorsType;
  onAddClick: (documentTypeId: string) => void;
  onRemoveEmployee: (empId: string, documentTypeId: string) => void;
  onAddDocumentType: () => void;
}

export const DocumentValidators = ({ 
  documentTypes,
  documentValidators, 
  onAddClick, 
  onRemoveEmployee,
  onAddDocumentType
}: DocumentValidatorsProps) => {
  return (
    <CardContainer>
      <CardHeader 
        text="Document Type Validators"
        icon={<DocumentIcon />}
      />
      
      <DocumentTypesContainer>
        {documentTypes.map(documentType => (
          <DocumentTypeSection key={documentType.id}>
            <DocumentTypeHeader>
              <DocumentTypeInfo>
                <DocumentIcon />
                <Body1 weight="semibold">{documentType.name}</Body1>
              </DocumentTypeInfo>
            </DocumentTypeHeader>
            
            <SelectedEmployeesContainer>
              {documentValidators[documentType.id]?.length > 0 ? (
                documentValidators[documentType.id].map((employee: Employee) => (
                  <Badge key={employee.id} color="brand">
                    {employee.avatar} {employee.name}
                    <RemoveButton
                      size="small"
                      icon={<DismissIcon />}
                      onClick={() => onRemoveEmployee(employee.id, documentType.id)}
                      appearance="subtle"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </Badge>
                ))
              ) : (
                <Body1 style={{ color: tokens.colorNeutralForeground3 }}>No validators assigned</Body1>
              )}
            </SelectedEmployeesContainer>

            <AddValidatorButton
              appearance="subtle"
              icon={<AddIcon />}
              onClick={() => onAddClick(documentType.id)}
            >
              Add
            </AddValidatorButton>
          </DocumentTypeSection>
        ))}
        
        <AddDocumentTypeButton
          appearance="subtle"
          icon={<AddIcon />}
          onClick={onAddDocumentType}
          style={{ color: tokens.colorBrandForeground1 }}
        >
          Add Document Type
        </AddDocumentTypeButton>
      </DocumentTypesContainer>
    </CardContainer>
  );
}; 

const DocumentTypesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalM};
`;

const DocumentTypeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalS};
  padding-bottom: ${tokens.spacingVerticalS};
  
  &:not(:last-child) {
    border-bottom: 1px solid ${tokens.colorNeutralStroke2};
  }
`;

const DocumentTypeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DocumentTypeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalS};
`;

const SelectedEmployeesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingHorizontalS};
`;

const AddValidatorButton = styled(Button)`
  justify-content: flex-start;
  align-self: flex-start;
`;

const AddDocumentTypeButton = styled(Button)`
  justify-content: flex-start;
  align-self: flex-start;
  border-top: 1px solid ${tokens.colorNeutralStroke2};
  padding-top: ${tokens.spacingVerticalM};
  margin-top: ${tokens.spacingVerticalS};
`;

const RemoveButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: white;
  background-color: transparent;
  z-index: 1000;
  &:hover {
    color: white;
    background-color: transparent;
  }
`;
