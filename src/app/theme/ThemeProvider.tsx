import React, { createContext, useContext, useState } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme, makeStyles } from '@fluentui/react-components';
import { darkTheme, lightTheme } from './theme';
// import * as microsoftTeams from '@microsoft/teams-js';





type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

//   useEffect(() => {
//     microsoftTeams.initialize(); // Инициализация Teams SDK
//     const updateTheme = () => {
//         microsoftTeams.getContext((context) => {
//             setTheme(context.theme || 'default');
//         });
//     };
//     updateTheme(); // Получение темы при монтировании компонента
//     microsoftTeams.registerOnThemeChangeHandler((newTheme) => {
//         setTheme(newTheme);
//     });
//     return () => {
//         microsoftTeams.removeEventHandlers();
//     };
// }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <FluentProvider theme={isDark ? darkTheme : lightTheme}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  );
}; 