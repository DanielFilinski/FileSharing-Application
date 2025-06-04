import React from 'react';
import styled from 'styled-components';

interface ToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}

const Section = styled.div`
  margin-bottom: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: flex-start;
`;

const IconWrapper = styled.div`
  background-color: #f3e8ff;
  color: #7e22ce;
  padding: 0.25rem;
  border-radius: 0.375rem;
  margin-right: 0.75rem;
  margin-top: 0.25rem;
`;

const TitleText = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 2.75rem;
  height: 1.5rem;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const ToggleSlider = styled.span<{ $checked: boolean }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.$checked ? '#9333ea' : '#d1d5db'};
  transition: .4s;
  border-radius: 1.5rem;

  &:before {
    position: absolute;
    content: "";
    height: 1rem;
    width: 1rem;
    left: 0.25rem;
    bottom: 0.25rem;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
    transform: ${props => props.$checked ? 'translateX(1.25rem)' : 'none'};
  }
`;

export const Toggle: React.FC<ToggleProps> = ({
  title,
  description,
  checked,
  onChange,
  icon
}) => {
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <IconWrapper>
            {icon}
          </IconWrapper>
          <div>
            <TitleText>{title}</TitleText>
            <Subtitle>{description}</Subtitle>
          </div>
        </SectionTitle>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
          />
          <ToggleSlider $checked={checked} />
        </ToggleSwitch>
      </SectionHeader>
    </Section>
  );
};



