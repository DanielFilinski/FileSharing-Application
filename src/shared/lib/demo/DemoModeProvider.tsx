import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Permission, UserRole } from '../rbac/types';

/**
 * Demo Mode Provider - временный компонент для демонстрации функционала заказчику
 * Предоставляет полные права доступа для демонстрации всех возможностей системы
 * TODO: УДАЛИТЬ ЭТОТ ФАЙЛ ПЕРЕД ПРОДАКШНОМ!
 */

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  hasFullAccess: boolean;
  getDemoPermissions: () => Permission[];
  getDemoRoles: () => UserRole[];
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  hasFullAccess: false,
  getDemoPermissions: () => [],
  getDemoRoles: () => [],
});

export const useDemoMode = () => useContext(DemoModeContext);

interface DemoModeProviderProps {
  children: ReactNode;
}

export const DemoModeProvider: React.FC<DemoModeProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Проверяем localStorage при инициализации
    return localStorage.getItem('demo-mode-enabled') === 'true';
  });

  // Все возможные разрешения для demo режима
  const getAllPermissions = (): Permission[] => {
    return Object.values(Permission);
  };

  // Все роли для demo режима  
  const getAllRoles = (): UserRole[] => {
    return [
      UserRole.ORGANIZATION_OWNER,
      UserRole.ADMINISTRATOR,
      UserRole.TECHNICAL_SUPPORT
    ];
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const newValue = !prev;
      
      // Сохраняем состояние в localStorage
      localStorage.setItem('demo-mode-enabled', newValue.toString());
      
      // Логируем изменения для отладки
      if (newValue) {
        console.log(`🎭 DEMO MODE ENABLED: All permissions granted for demonstration purposes`);
        console.log(`📋 Available permissions:`, getAllPermissions());
        console.log(`👑 Available roles:`, getAllRoles());
      } else {
        console.log(`🎭 Demo Mode disabled: Normal RBAC permissions restored`);
      }
      
      return newValue;
    });
  };

  // Visual demo mode indicators removed per user request  
  // Demo mode works silently in the background without visual notifications

  const contextValue: DemoModeContextType = {
    isDemoMode,
    toggleDemoMode,
    hasFullAccess: isDemoMode,
    getDemoPermissions: getAllPermissions,
    getDemoRoles: getAllRoles,
  };

  return (
    <DemoModeContext.Provider value={contextValue}>
      {children}
    </DemoModeContext.Provider>
  );
};
