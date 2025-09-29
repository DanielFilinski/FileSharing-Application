import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';

export interface TeamsContextType {
  teamsContext: microsoftTeams.app.Context | null;
  isInTeams: boolean;
  teamId: string | null;
  channelId: string | null;
  userId: string | null;
  tenantId: string | null;
  theme: string;
  isInitialized: boolean;
  error: string | null;
  
  // Methods
  initialize: () => Promise<void>;
  notifySuccess: (message?: string) => void;
  notifyFailure: (message: string) => void;
  shareToChannel: (documentId: string, message?: string) => Promise<void>;
  openInNewTab: (url: string) => void;
}

const TeamsContext = createContext<TeamsContextType | null>(null);

export const TeamsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teamsContext, setTeamsContext] = useState<microsoftTeams.app.Context | null>(null);
  const [isInTeams, setIsInTeams] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [theme, setTheme] = useState('default');
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    try {
      console.log('Initializing Teams SDK...');
      
      // Initialize Teams SDK
      await microsoftTeams.app.initialize();
      
      console.log('Teams SDK initialized successfully');
      setIsInTeams(true);

      // Get Teams context
      const context = await microsoftTeams.app.getContext();
      setTeamsContext(context);
      
      console.log('Teams context retrieved:', {
        teamId: context.team?.internalId,
        channelId: context.channel?.id,
        userId: context.user?.id,
        tenantId: context.user?.tenant?.id,
        theme: context.app.theme
      });
      
      // Set theme based on Teams theme
      const currentTheme = context.app.theme || 'default';
      setTheme(currentTheme);
      
      // Listen for theme changes
      microsoftTeams.app.registerOnThemeChangeHandler((newTheme: string) => {
        console.log('Teams theme changed to:', newTheme);
        setTheme(newTheme);
      });

      // Notify Teams that tab is loaded
      microsoftTeams.app.notifyAppLoaded();
      
      setIsInitialized(true);
      setError(null);

    } catch (error) {
      console.log('Not running in Teams environment:', error);
      setIsInTeams(false);
      setIsInitialized(true);
      // Don't set this as error since browser mode is valid
    }
  };

  const notifySuccess = (message?: string) => {
    if (isInTeams) {
      microsoftTeams.app.notifySuccess();
      console.log('Teams success notification:', message);
    }
  };

  const notifyFailure = (message: string) => {
    if (isInTeams) {
      microsoftTeams.app.notifyFailure({
        reason: microsoftTeams.app.FailedReason.Other,
        message
      });
      console.error('Teams failure notification:', message);
    }
  };

  const shareToChannel = async (documentId: string, message?: string) => {
    if (!isInTeams || !teamsContext?.team?.internalId || !teamsContext?.channel?.id) {
      throw new Error('Not in Teams channel context or missing team/channel info');
    }

    try {
      // This would integrate with our SharePoint API
      const shareData = {
        documentId,
        teamId: teamsContext.team.internalId,
        channelId: teamsContext.channel.id,
        message: message || 'Document shared for review'
      };

      console.log('Sharing document to Teams channel:', shareData);
      
      // For now, we'll show a success message
      // Later this will call our Azure Function
      notifySuccess('Document shared to channel');

    } catch (error) {
      console.error('Failed to share to Teams channel:', error);
      notifyFailure('Failed to share document to channel');
      throw error;
    }
  };

  const openInNewTab = (url: string) => {
    if (isInTeams) {
      microsoftTeams.app.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Auto-initialize when provider mounts
  useEffect(() => {
    initialize();
  }, []);

  const value: TeamsContextType = {
    teamsContext,
    isInTeams,
    teamId: teamsContext?.team?.internalId || null,
    channelId: teamsContext?.channel?.id || null,
    userId: teamsContext?.user?.id || null,
    tenantId: teamsContext?.user?.tenant?.id || null,
    theme,
    isInitialized,
    error,
    initialize,
    notifySuccess,
    notifyFailure,
    shareToChannel,
    openInNewTab
  };

  return (
    <TeamsContext.Provider value={value}>
      <div className={`teams-app teams-theme-${theme}`} data-teams-context={isInTeams}>
        {children}
      </div>
    </TeamsContext.Provider>
  );
};

export const useTeams = () => {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeams must be used within TeamsProvider');
  }
  return context;
};

export const useTeamsOptional = () => {
  const context = useContext(TeamsContext);
  return context;
};
