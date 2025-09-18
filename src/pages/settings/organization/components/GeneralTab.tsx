import React, { useState } from 'react';
import {
  tokens,
  Input,
  Text,
  Card,
  Field,
  Title3,
} from '@fluentui/react-components';
import {
  Building24Regular,
  People24Regular,
} from '@fluentui/react-icons';
import styled from 'styled-components';
import { CardContainer, RowCardContainer } from '@/app/styles/layouts';
import AccentIcon from '@/components/icon/accent-icon';
import { CardTitle } from '@/components/card/card-title';
import { CardHeader } from '@/components/card/card-header';



const GeneralTab: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  return (
    <RowCardContainer>    
      <>
        <CardContainer>
        <CardHeader
          text="Company Information"
          icon={<Building24Regular />}
        />
          
          <FormGrid>
            <FullWidth>
              <Field label="Company Name" required>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </Field>
            </FullWidth>
            <FullWidth>  
              <Field label="Company Contact" required>
                <Input
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder="Enter company contact number"
                />
              </Field>
            </FullWidth>    
            <FullWidth>
              <Field label="Company Email" required>
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Enter company email"
                />
              </Field>
            </FullWidth>
          </FormGrid>
        </CardContainer>
      </>
      <>
        <CardContainer>
          <CardHeader
            text="Owner Information"
            icon={<People24Regular />}
          />        
          
          <FormGrid>
            <FullWidth>
              <Field label="Owner Full Name" required>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Enter owner's full name"
                />
              </Field>
            </FullWidth>
            <FullWidth>  
              <Field label="Owner Contact" required>
                <Input
                  value={ownerContact}
                  onChange={(e) => setOwnerContact(e.target.value)}
                  placeholder="Enter owner's contact number"
                />
              </Field>
            </FullWidth>
            <FullWidth>
              <Field label="Owner Email" required>
                <Input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Enter owner's email"
                />
              </Field>
            </FullWidth>
          </FormGrid>
        </CardContainer>
      </>
    </RowCardContainer>
  );
};

const SectionCard = styled(Card)`
  padding: ${tokens.spacingVerticalL};
  @media (max-width: 768px) {
    padding: ${tokens.spacingVerticalM};
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalM};
  margin-bottom: ${tokens.spacingVerticalL};
`;

const SectionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: ${tokens.colorBrandBackground2};
  color: ${tokens.colorBrandForeground1};
  border-radius: ${tokens.borderRadiusSmall};
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalL};
  @media (max-width: 640px) {
    gap: ${tokens.spacingVerticalM};
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;
export default GeneralTab; 