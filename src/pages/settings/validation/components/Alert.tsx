import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import styled, { css } from 'styled-components';

interface AlertProps {
  type: 'purple' | 'blue' | 'success';
  title?: string;
  message: string;
  icon?: React.ReactNode;
}

const getAlertStyles = (type: AlertProps['type']) => {
  const styles = {
    purple: {
      background: '#F3E8FF',
      color: '#6B21A8',
      iconColor: '#6B21A8'
    },
    blue: {
      background: '#E0F2FE',
      color: '#0369A1',
      iconColor: '#0369A1'
    },
    success: {
      background: '#DCFCE7',
      color: '#166534',
      iconColor: '#166534'
    }
  };
  return styles[type];
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  icon
}) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return <Check size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <AlertContainer>     
      <AlertContent $type={type}>
        <IconWrapper $type={type}>
          {getIcon()}
        </IconWrapper>
        <div>
          {title && <Title>{title}</Title>}
          <Message $hasTitle={!!title}>{message}</Message>
        </div>
      </AlertContent>
    </AlertContainer>
  );
}; 

const AlertContainer = styled.div`
  width: 100%;
`;

const AlertContent = styled.div<{ $type: AlertProps['type'] }>`
  display: flex;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ $type }) => getAlertStyles($type).background};
  color: ${({ $type }) => getAlertStyles($type).color};
  transition: all 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const IconWrapper = styled.div<{ $type: AlertProps['type'] }>`
  display: flex;
  align-items: center;
  margin-right: 12px;
  color: ${({ $type }) => getAlertStyles($type).iconColor};
`;

const Title = styled.h3`
  font-weight: 600;
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
`;

const Message = styled.p<{ $hasTitle?: boolean }>`
  margin: ${({ $hasTitle }) => ($hasTitle ? '4px 0 0' : '0')};
  font-size: ${({ $hasTitle }) => ($hasTitle ? '14px' : '15px')};
  line-height: 1.5;
  opacity: 0.9;
`;