import React, { createContext, useContext, useEffect, useState } from 'react';
import { TeamsProvider } from './teams';
import { authService } from './auth';
import { errorHandler } from './errorHandler';
import { notificationService } from './notifications';
import NotificationContainer from '../ui/NotificationContainer';
import { LoginScreen } from '../../components/LoginScreen';

interface AppContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  currentUser: any;
  initialize: () => Promise<void>;
  handleLogin: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  isInitialized: false,
  isAuthenticated: false,
  currentUser: null,
  initialize: async () => {},
  handleLogin: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const initialize = async () => {
    try {
      // Настраиваем глобальную обработку ошибок
      errorHandler.setupGlobalErrorHandling();

      // Инициализируем аутентификацию
      await authService.initialize();

      // Проверяем статус аутентификации
      const user = await authService.getUserInfo();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        notificationService.success(
          'Добро пожаловать',
          `Вы вошли как ${user.displayName}`
        );
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true); // Все равно помечаем как инициализированное
    }
  };

  const handleLogin = async () => {
    try {
      await authService.login();
      const user = await authService.getUserInfo();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        notificationService.success(
          'Добро пожаловать',
          `Вы вошли как ${user.displayName}`
        );
      } else {
        // Если getUserInfo не вернул пользователя, но login прошел успешно
        // (например, для браузерной аутентификации)
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setCurrentUser(currentUser);
          setIsAuthenticated(true);
          notificationService.success(
            'Добро пожаловать',
            `Вы вошли как ${currentUser.displayName}`
          );
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      notificationService.error('Ошибка входа', 'Не удалось войти в систему');
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const contextValue: AppContextType = {
    isInitialized,
    isAuthenticated,
    currentUser,
    initialize,
    handleLogin,
  };

  // Показываем экран входа если не аутентифицированы
  if (isInitialized && !isAuthenticated) {
    return (
      <AppContext.Provider value={contextValue}>
        <TeamsProvider>
          <LoginScreen />
          <NotificationContainer />
        </TeamsProvider>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <TeamsProvider>
        {children}
        <NotificationContainer />
      </TeamsProvider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
