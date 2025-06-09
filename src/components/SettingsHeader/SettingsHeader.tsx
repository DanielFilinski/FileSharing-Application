import React from 'react';
import { Button, Title2, tokens } from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';
import { HeaderContainer } from '@/app/styles/layouts';
import styled from 'styled-components';

interface SettingsHeaderProps {
  title: string;
  icon: React.ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonIcon?: JSX.Element;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  icon,
  buttonText = "Save changes",
  onButtonClick = () => {},
  buttonIcon = <SaveRegular />,
}) => {
  return (
    <Header>
      <Menu />
      <HeaderLeft>
        <BrandIcon>{icon}</BrandIcon>
        <Title2>{title}</Title2>
      </HeaderLeft>
      {buttonText && onButtonClick && (
        <PrimaryButton 
          appearance="primary" 
          icon={buttonIcon}
          onClick={onButtonClick}
        >
          {buttonText}
        </PrimaryButton>
      )}
    </Header>
  );
};


const Header = styled(HeaderContainer)`
  border-bottom: 1px solid ${tokens.colorNeutralStroke2};
  background-color: ${tokens.colorNeutralBackground1};
  box-shadow: ${tokens.shadow2};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    gap: ${tokens.spacingVerticalM};
  }
`;

const Menu = styled.div`
  display: none;
  width: 32px;
  height: 32px;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalM};
`;

const BrandIcon = styled.div`
  color: ${tokens.colorBrandForeground1};
`;

const PrimaryButton = styled(Button)`
  background-color: ${tokens.colorBrandBackground};
  border-radius: ${tokens.borderRadiusMedium};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${tokens.colorBrandBackgroundHover};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;