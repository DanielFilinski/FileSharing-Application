import React from 'react';
import { useApp } from '@/shared/lib/AppProvider';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const Logo = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
`;

const LoginButton = styled.button`
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
  min-width: 200px;
  justify-content: center;

  &:hover {
    background: #106ebe;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 120, 212, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const MicrosoftIcon = styled.div`
  width: 20px;
  height: 20px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
`;

export const LoginScreen: React.FC = () => {
  const { handleLogin } = useApp();
  const [isLoading, setIsLoading] = React.useState(false);

  const onLoginClick = async () => {
    setIsLoading(true);
    try {
      await handleLogin();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>📁</Logo>
        <Title>File Sharing</Title>
        <Subtitle>
          Войдите с помощью учётной записи Microsoft для доступа к приложению
        </Subtitle>
        <LoginButton onClick={onLoginClick} disabled={isLoading}>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <MicrosoftIcon />
          )}
          {isLoading ? 'Вход...' : 'Войти с помощью учётной записи Microsoft'}
        </LoginButton>
      </LoginCard>
    </LoginContainer>
  );
};
