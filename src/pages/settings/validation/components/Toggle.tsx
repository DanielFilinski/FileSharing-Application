import React from 'react';
import { Shield } from 'lucide-react';
import styled from 'styled-components';
import AccentIcon from '@/components/accent-icon';
import Switch from '@/components/switch';

interface ToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}

export const Toggle: React.FC<ToggleProps> = ({
  title,
  description,
  checked,
  onChange,
  icon = <Shield size={18} />
}) => {
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <AccentIcon icon={icon}/>          
          <div>
            <TitleText>{title}</TitleText>
            <Subtitle>{description}</Subtitle>
          </div>
        </SectionTitle>
        <div>
          <Switch checked={checked} onChange={onChange} />
        </div>
      </SectionHeader>
    </Section>
  );
}; 


const Section = styled.div`
  margin-bottom: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;


const TitleText = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
`;

const Subtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
`;



