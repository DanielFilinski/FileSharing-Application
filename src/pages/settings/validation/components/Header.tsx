import React from 'react';
import { Shield, Save } from 'lucide-react';
import styled from 'styled-components';

interface HeaderProps {
  onSave: () => void;
}

const HeaderContainer = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderIcon = styled(Shield)`
  color: #9333ea;
  margin-right: 0.75rem;
`;

const HeaderTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
`;

const SaveButton = styled.button`
  color: white;
  background-color: #9333ea;
  padding: 0.375rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  column-gap: 0.5rem;

  &:hover {
    background-color: #7e22ce;
  }
`;

export const Header: React.FC<HeaderProps> = ({ onSave }) => {
  return (
    <HeaderContainer>
      <HeaderLeft>
        <HeaderIcon size={20} />
        <HeaderTitle>Validation Settings</HeaderTitle>
      </HeaderLeft>
      <SaveButton onClick={onSave}>
        <Save size={16} />
        Save changes
      </SaveButton>
    </HeaderContainer>
  );
}; 