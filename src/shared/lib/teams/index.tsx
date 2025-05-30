import React, { createContext, useContext, useState } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';

interface TeamsContextType {
  context?: microsoftTeams.Context;
  initialize: () => Promise<void>;
}

const TeamsContext = createContext<TeamsContextType>({
  initialize: async () => {}
});

export const TeamsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [context, setContext] = useState<microsoftTeams.Context>();

  const initialize = async () => {
    try {
      await microsoftTeams.initialize();
      microsoftTeams.getContext((teamsContext) => {
        setContext(teamsContext);
      });
    } catch (error) {
      console.error('Error initializing Teams:', error);
    }
  };

  return (
    <TeamsContext.Provider value={{ context, initialize }}>
      {children}
    </TeamsContext.Provider>
  );
};

export const useTeamsContext = () => {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeamsContext must be used within a TeamsProvider');
  }
  return context;
}; 