import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Demo Mode Provider - временный компонент для демонстрации функционала заказчику
 * TODO: УДАЛИТЬ ЭТОТ ФАЙЛ ПЕРЕД ПРОДАКШНОМ!
 */

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  toggleDemoMode: () => {},
});

export const useDemoMode = () => useContext(DemoModeContext);

interface DemoModeProviderProps {
  children: ReactNode;
}

export const DemoModeProvider: React.FC<DemoModeProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const newValue = !prev;
      console.log(`🎭 Demo Mode ${newValue ? 'ENABLED' : 'DISABLED'}: All permissions granted for demo purposes`);
      return newValue;
    });
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};
