import React, { createContext, useContext, useEffect, useState } from 'react';
import { TeamsProvider } from './teams';
import { authService } from './auth';
import { errorHandler } from './errorHandler';
import { notificationService } from './notifications';
import { RBACProvider } from './rbac';
import { NotificationContainer } from '../ui/NotificationContainer';
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
      // Set up global error handling
      errorHandler.setupGlobalErrorHandling();

      // Initialize authentication
      await authService.initialize();

      // Check authentication status
      const user = await authService.getUserInfo();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        notificationService.success(
          'Welcome',
          `You are logged in as ${user.displayName}`
        );
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true); // Mark as initialized anyway
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
          'Welcome',
          `You are logged in as ${user.displayName}`
        );
      } else {
        // If getUserInfo didn't return a user, but login was successful
        // (e.g., for browser authentication)
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setCurrentUser(currentUser);
          setIsAuthenticated(true);
          notificationService.success(
            'Welcome',
            `You are logged in as ${currentUser.displayName}`
          );
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      notificationService.error('Login Error', 'Failed to log into the system');
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

  // Show login screen if not authenticated
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
        <RBACProvider authService={authService}>
          {children}
          <NotificationContainer />
        </RBACProvider>
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