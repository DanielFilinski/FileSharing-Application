import React, { useState } from 'react';
import { Plus, X, Settings, Building2, MapPin, Save, Check, User, Users } from 'lucide-react';
import styled from 'styled-components';
import { GeneralTab } from './components/GeneralTab';
import { OfficesTab } from './components/OfficesTab';

const OrganizationSettings: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState('general');

  return (
    <Container>
      <OrganizationContainer>
        <div>
        <Header>
          <HeaderTitle>
            <HeaderIcon size={20} />
            <HeaderHeading>Organization Settings</HeaderHeading>
          </HeaderTitle>
          <SaveButton>
            <Save size={16} />
            Save changes
          </SaveButton>
        </Header>

        <TabNavigation>
          <TabList>
            <TabButton 
              onClick={() => setActiveTabId('general')}
              active={activeTabId === 'general'}
            >
              General
            </TabButton>
            <TabButton 
              onClick={() => setActiveTabId('offices')}
              active={activeTabId === 'offices'}
            >
              Offices
            </TabButton>
          </TabList>
        </TabNavigation>
        </div>

        

        <Content>
          <ContentContainer>
            {activeTabId === 'general' && <GeneralTab />}
            {activeTabId === 'offices' && <OfficesTab />}
          </ContentContainer>
        </Content>
      </OrganizationContainer>
    </Container>
  );
};

const Container = styled.div` 
  min-height: 100vh;
  background-color: #F9FAFB;
`;

const OrganizationContainer = styled.div`
  // max-width: 1200px;
  margin: 0 auto;
  // padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  // margin-bottom: 2rem;
  padding: 1rem;
  background-color: white;
  // border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #E5E7EB;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderIcon = styled(Settings)`
  color: #9333ea;
`;

const HeaderHeading = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  
  @media (max-width: 640px) {
    font-size: 1.25rem;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: #9333ea;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #7e22ce;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TabNavigation = styled.div`
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 2rem;
  background-color: white;
  // border-radius: 0.5rem 0.5rem 0 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TabList = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0 1rem;
  
  @media (max-width: 640px) {
    gap: 0.5rem;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 0.75rem 1rem;
  font-weight: 500;
  color: ${props => props.active ? '#9333ea' : '#6B7280'};
  border-bottom: 2px solid ${props => props.active ? '#9333ea' : 'transparent'};
  transition: all 0.2s ease-in-out;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  cursor: pointer;
  position: relative;

  &:hover {
    color: #9333ea;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #9333ea;
    transform: scaleX(${props => props.active ? 1 : 0});
    transition: transform 0.2s ease-in-out;
  }

  &:hover::after {
    transform: scaleX(1);
  }
`;

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  // background-color: white;
  // border-radius: 0 0 0.5rem 0.5rem;
  // box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ContentContainer = styled.div`
  // padding: 2rem;
  
  @media (max-width: 768px) {
    // padding: 1rem;
  }
`;

export default OrganizationSettings;