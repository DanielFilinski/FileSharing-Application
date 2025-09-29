import React, { useEffect, useState } from 'react';
import { useTeams } from './TeamsProvider';
import { useSelectedEndUser } from '../contexts/EndUserContext';
import { EndUserSelector } from '../components/EndUser/EndUserSelector';
import { DocumentList } from '../widgets/documentList/ui/DocumentList';
import { Spinner, MessageBar, MessageBarType, Stack, Text } from '@fluentui/react';

interface TeamsTabProps {
  // Optional props for different tab configurations
  mode?: 'documents' | 'sharepoint' | 'dashboard';
}

export const TeamsTab: React.FC<TeamsTabProps> = ({ mode = 'documents' }) => {
  const { 
    isInTeams, 
    isInitialized, 
    teamsContext, 
    theme, 
    error,
    notifySuccess 
  } = useTeams();
  
  const { selectedEndUser } = useSelectedEndUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      setIsLoading(false);
      if (isInTeams) {
        notifySuccess('Document management loaded successfully');
      }
    }
  }, [isInitialized, isInTeams, notifySuccess]);

  // Loading state
  if (isLoading) {
    return (
      <div className="teams-loading" style={{ 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px'
      }}>
        <Spinner label="Loading Document Management..." size={3} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="teams-error" style={{ padding: '20px' }}>
        <MessageBar messageBarType={MessageBarType.error}>
          <Text>Error loading Teams integration: {error}</Text>
        </MessageBar>
      </div>
    );
  }

  // Browser fallback (when not in Teams)
  if (!isInTeams) {
    return (
      <div className="teams-fallback" style={{ 
        padding: '20px',
        textAlign: 'center',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <Text variant="xLarge" block style={{ marginBottom: '10px' }}>
          📱 Teams Integration Mode
        </Text>
        <Text variant="medium" block style={{ marginBottom: '15px' }}>
          This interface is optimized for Microsoft Teams.
        </Text>
        <Text variant="small" style={{ color: '#666' }}>
          You can still use all features, but some Teams-specific functionality may be limited.
        </Text>
      </div>
    );
  }

  // Teams context info (for debugging/development)
  const debugInfo = teamsContext && (
    <div className="teams-debug-info" style={{ 
      fontSize: '12px', 
      color: '#666', 
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      marginBottom: '10px'
    }}>
      <Text variant="small">
        Teams Context: Team "{teamsContext.team?.displayName}" | 
        Channel "{teamsContext.channel?.displayName}" | 
        Theme: {theme}
      </Text>
    </div>
  );

  return (
    <div className={`teams-tab teams-theme-${theme}`} style={{ 
      padding: '0', 
      height: '100vh',
      overflow: 'auto'
    }}>
      {/* Teams Header */}
      <div className="teams-header" style={{
        padding: '15px 20px',
        borderBottom: '1px solid #e1e1e1',
        backgroundColor: theme === 'dark' ? '#2b2b2b' : '#f8f9fa',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 15 }}>
            <Text variant="xLarge" style={{ 
              fontWeight: '600',
              color: theme === 'dark' ? '#fff' : '#323130'
            }}>
              📄 Document Management
            </Text>
            {teamsContext?.team?.displayName && (
              <Text variant="medium" style={{ 
                color: theme === 'dark' ? '#c8c8c8' : '#605e5c',
                fontStyle: 'italic'
              }}>
                • {teamsContext.team.displayName}
              </Text>
            )}
          </Stack>
          
          <div style={{ minWidth: '200px' }}>
            <EndUserSelector />
          </div>
        </Stack>
      </div>

      {/* Debug info in development */}
      {import.meta.env.MODE === 'development' && debugInfo}

      {/* End User Selection Message */}
      {!selectedEndUser && (
        <div style={{ padding: '20px' }}>
          <MessageBar messageBarType={MessageBarType.info}>
            <Text>Please select an End User to view and manage their documents.</Text>
          </MessageBar>
        </div>
      )}

      {/* Main Content */}
      <div className="teams-content" style={{ 
        padding: selectedEndUser ? '20px' : '0',
        minHeight: 'calc(100vh - 120px)'
      }}>
        {selectedEndUser && (
          <>
            {mode === 'documents' && (
              <div className="teams-documents-section">
                <DocumentList />
              </div>
            )}
            
            {mode === 'sharepoint' && (
              <div className="teams-sharepoint-section">
                <Text variant="large" block style={{ marginBottom: '15px' }}>
                  SharePoint Integration
                </Text>
                <Text>
                  SharePoint documents and operations will be displayed here.
                </Text>
                {/* This will integrate with SharePointIntegration component */}
              </div>
            )}
            
            {mode === 'dashboard' && (
              <div className="teams-dashboard-section">
                <Text variant="large" block style={{ marginBottom: '15px' }}>
                  Dashboard
                </Text>
                <Text>
                  Analytics and dashboard will be displayed here.
                </Text>
              </div>
            )}
          </>
        )}
      </div>

      {/* Teams Footer */}
      <div className="teams-footer" style={{
        padding: '10px 20px',
        borderTop: '1px solid #e1e1e1',
        backgroundColor: theme === 'dark' ? '#2b2b2b' : '#f8f9fa',
        textAlign: 'center'
      }}>
        <Text variant="small" style={{ color: theme === 'dark' ? '#c8c8c8' : '#605e5c' }}>
          FileSharing Application • Integrated with Microsoft Teams
        </Text>
      </div>
    </div>
  );
};

export default TeamsTab;
