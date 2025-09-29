import React, { useEffect, useState } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { useTeams } from './TeamsProvider';
import { 
  Stack, 
  Text, 
  PrimaryButton, 
  Checkbox, 
  MessageBar, 
  MessageBarType,
  Spinner
} from '@fluentui/react';

export const TeamsTabConfig: React.FC = () => {
  const { initialize, isInTeams, theme } = useTeams();
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState({
    enableNotifications: true,
    enableDocumentSharing: true,
    enableApprovalWorkflows: true,
    enableSharePointIntegration: true
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupConfig = async () => {
      try {
        await initialize();
        
        if (!isInTeams) {
          setError('This configuration is only available within Microsoft Teams');
          setIsLoading(false);
          return;
        }

        // Set up tab configuration handler
        microsoftTeams.pages.config.registerOnSaveHandler((saveEvent) => {
          try {
            // Determine content URL based on configuration
            const baseUrl = window.location.origin;
            let contentUrl = `${baseUrl}/index.html#/teams/tab`;
            let entityId = 'filesharing-documents';
            
            // Add configuration parameters to URL
            const params = new URLSearchParams();
            if (config.enableNotifications) params.set('notifications', 'true');
            if (config.enableDocumentSharing) params.set('sharing', 'true');
            if (config.enableApprovalWorkflows) params.set('approvals', 'true');
            if (config.enableSharePointIntegration) params.set('sharepoint', 'true');
            
            if (params.toString()) {
              contentUrl += `?${params.toString()}`;
            }

            // Configure the tab
            microsoftTeams.pages.config.setConfig({
              entityId,
              contentUrl,
              websiteUrl: `${baseUrl}/index.html#/`,
              suggestedDisplayName: 'Document Management',
              removeUrl: `${baseUrl}/index.html#/teams/remove`
            }).then(() => {
              console.log('Teams tab configuration saved successfully');
              saveEvent.notifySuccess();
            }).catch((configError) => {
              console.error('Failed to save Teams tab configuration:', configError);
              saveEvent.notifyFailure(configError.message || 'Failed to save configuration');
            });

          } catch (saveError) {
            console.error('Error in save handler:', saveError);
            saveEvent.notifyFailure('An error occurred while saving the configuration');
          }
        });

        // Enable save button
        microsoftTeams.pages.config.setValidityState(true);
        
        setIsLoading(false);
      } catch (initError) {
        console.error('Failed to initialize Teams configuration:', initError);
        setError('Failed to initialize Teams configuration');
        setIsLoading(false);
      }
    };

    setupConfig();
  }, [initialize, isInTeams, config]);

  const handleConfigChange = (key: keyof typeof config, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Update validity state when config changes
    microsoftTeams.pages.config.setValidityState(true);
  };

  if (isLoading) {
    return (
      <div className="teams-config-loading" style={{ 
        padding: '40px',
        textAlign: 'center' 
      }}>
        <Spinner label="Loading configuration..." size={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="teams-config-error" style={{ padding: '20px' }}>
        <MessageBar messageBarType={MessageBarType.error}>
          <Text>{error}</Text>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className={`teams-config teams-theme-${theme}`} style={{ 
      padding: '30px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <Stack tokens={{ childrenGap: 20 }}>
        <div className="config-header">
          <Text variant="xxLarge" style={{ 
            fontWeight: '600',
            marginBottom: '10px',
            display: 'block'
          }}>
            📄 Configure Document Management
          </Text>
          <Text variant="medium" style={{ 
            color: '#605e5c',
            lineHeight: '1.4'
          }}>
            This tab will provide your team with access to the document management system. 
            Configure the features you want to enable for this team.
          </Text>
        </div>

        {/* Configuration Options */}
        <div className="config-options" style={{
          border: '1px solid #e1e1e1',
          borderRadius: '4px',
          padding: '20px'
        }}>
          <Text variant="large" style={{ 
            fontWeight: '600',
            marginBottom: '15px',
            display: 'block'
          }}>
            Feature Configuration
          </Text>

          <Stack tokens={{ childrenGap: 15 }}>
            <Checkbox
              label="Enable document notifications"
              checked={config.enableNotifications}
              onChange={(_, checked) => handleConfigChange('enableNotifications', checked || false)}
              styles={{
                text: { fontSize: '14px' },
                label: { alignItems: 'flex-start', marginTop: '2px' }
              }}
            />
            <Text variant="small" style={{ 
              color: '#605e5c', 
              marginLeft: '28px',
              marginTop: '-10px',
              display: 'block'
            }}>
              Receive Teams notifications when documents are uploaded, shared, or require approval
            </Text>

            <Checkbox
              label="Enable document sharing to channels"
              checked={config.enableDocumentSharing}
              onChange={(_, checked) => handleConfigChange('enableDocumentSharing', checked || false)}
              styles={{
                text: { fontSize: '14px' },
                label: { alignItems: 'flex-start', marginTop: '2px' }
              }}
            />
            <Text variant="small" style={{ 
              color: '#605e5c', 
              marginLeft: '28px',
              marginTop: '-10px',
              display: 'block'
            }}>
              Allow team members to share documents directly to Teams channels
            </Text>

            <Checkbox
              label="Enable approval workflows"
              checked={config.enableApprovalWorkflows}
              onChange={(_, checked) => handleConfigChange('enableApprovalWorkflows', checked || false)}
              styles={{
                text: { fontSize: '14px' },
                label: { alignItems: 'flex-start', marginTop: '2px' }
              }}
            />
            <Text variant="small" style={{ 
              color: '#605e5c', 
              marginLeft: '28px',
              marginTop: '-10px',
              display: 'block'
            }}>
              Use Teams for document approval processes and workflow notifications
            </Text>

            <Checkbox
              label="Enable SharePoint integration"
              checked={config.enableSharePointIntegration}
              onChange={(_, checked) => handleConfigChange('enableSharePointIntegration', checked || false)}
              styles={{
                text: { fontSize: '14px' },
                label: { alignItems: 'flex-start', marginTop: '2px' }
              }}
            />
            <Text variant="small" style={{ 
              color: '#605e5c', 
              marginLeft: '28px',
              marginTop: '-10px',
              display: 'block'
            }}>
              Connect with your team's SharePoint site for document storage and collaboration
            </Text>
          </Stack>
        </div>

        {/* Information */}
        <MessageBar messageBarType={MessageBarType.info}>
          <Text>
            Click "Save" to complete the configuration. You can modify these settings later 
            by re-configuring the tab.
          </Text>
        </MessageBar>
      </Stack>
    </div>
  );
};

export default TeamsTabConfig;
