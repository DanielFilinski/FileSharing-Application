# 🚀 Teams Integration Architecture Plan

*Comprehensive architectural plan for Microsoft Teams Integration*

---

## 📊 **CURRENT STATE ANALYSIS**

### ✅ **EXISTING TEAMS FOUNDATION:**
- **TeamsUserCredential** authentication already implemented
- **Teams Environment Detection** in `auth.ts` 
- **Azure AD Integration** with client ID: `17479755-e076-41c8-8cfb-08518cbcd835`
- **On-Behalf-Of Authentication** pattern established
- **Multi-tenant CosmosDB** architecture ready

### 🎯 **INTEGRATION GOALS:**
1. **Teams Tab Application** - document management within Teams
2. **Teams Chat Integration** - document discussions and notifications  
3. **Teams SSO** - seamless authentication experience
4. **Document Workflow in Teams** - approvals, sharing, collaboration
5. **End User Context** preservation in Teams environment

---

## 🏗️ **ARCHITECTURAL COMPONENTS**

### **1. Teams Application Manifest**
```json
{
  "manifestVersion": "1.17",
  "version": "1.0.0",
  "id": "17479755-e076-41c8-8cfb-08518cbcd835",
  "packageName": "com.filesharing.teams",
  "developer": {
    "name": "File Sharing Application",
    "websiteUrl": "https://filesharing-app.azurewebsites.net",
    "privacyUrl": "https://filesharing-app.azurewebsites.net/privacy",
    "termsOfUseUrl": "https://filesharing-app.azurewebsites.net/terms"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "name": {
    "short": "File Sharing",
    "full": "File Sharing Application"
  },
  "description": {
    "short": "Document management and sharing within Teams",
    "full": "Complete document lifecycle management integrated with Microsoft Teams and SharePoint"
  },
  "accentColor": "#FFFFFF",
  "staticTabs": [
    {
      "entityId": "documents-tab",
      "name": "Documents", 
      "contentUrl": "https://filesharing-app.azurewebsites.net/teams/tab",
      "websiteUrl": "https://filesharing-app.azurewebsites.net",
      "scopes": ["personal", "groupchat", "team"]
    }
  ],
  "configurableTabs": [
    {
      "configurationUrl": "https://filesharing-app.azurewebsites.net/teams/config",
      "canUpdateConfiguration": true,
      "scopes": ["team", "groupchat"]
    }
  ],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": [
    "filesharing-app.azurewebsites.net",
    "*.azurewebsites.net"
  ],
  "webApplicationInfo": {
    "id": "17479755-e076-41c8-8cfb-08518cbcd835",
    "resource": "https://filesharing-app.azurewebsites.net"
  }
}
```

### **2. Teams Context Integration**
```typescript
// src/teams/TeamsProvider.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';

interface TeamsContextType {
  teamsContext: microsoftTeams.app.Context | null;
  isInTeams: boolean;
  teamId: string | null;
  channelId: string | null;
  userId: string | null;
  tenantId: string | null;
  theme: string;
  initialize: () => Promise<void>;
  notifySuccess: (message: string) => void;
  notifyFailure: (message: string) => void;
}

const TeamsContext = createContext<TeamsContextType | null>(null);

export const TeamsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teamsContext, setTeamsContext] = useState<microsoftTeams.app.Context | null>(null);
  const [isInTeams, setIsInTeams] = useState(false);
  const [theme, setTheme] = useState('default');

  const initialize = async () => {
    try {
      // Initialize Teams SDK
      await microsoftTeams.app.initialize();
      setIsInTeams(true);

      // Get Teams context
      const context = await microsoftTeams.app.getContext();
      setTeamsContext(context);
      
      // Set theme based on Teams theme
      setTheme(context.app.theme || 'default');
      
      // Listen for theme changes
      microsoftTeams.app.registerOnThemeChangeHandler((newTheme: string) => {
        setTheme(newTheme);
      });

      console.log('Teams context initialized:', context);
    } catch (error) {
      console.log('Not running in Teams, using browser mode');
      setIsInTeams(false);
    }
  };

  const notifySuccess = (message: string) => {
    if (isInTeams) {
      microsoftTeams.app.notifySuccess();
    }
  };

  const notifyFailure = (message: string) => {
    if (isInTeams) {
      microsoftTeams.app.notifyFailure({
        reason: microsoftTeams.app.FailedReason.Other,
        message
      });
    }
  };

  const value: TeamsContextType = {
    teamsContext,
    isInTeams,
    teamId: teamsContext?.team?.internalId || null,
    channelId: teamsContext?.channel?.id || null,
    userId: teamsContext?.user?.id || null,
    tenantId: teamsContext?.user?.tenant?.id || null,
    theme,
    initialize,
    notifySuccess,
    notifyFailure
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
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
```

### **3. Teams Tab Configuration**
```typescript
// src/teams/TeamsTabConfig.tsx
import React, { useEffect } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { useTeams } from './TeamsProvider';

export const TeamsTabConfig: React.FC = () => {
  const { initialize } = useTeams();

  useEffect(() => {
    const setupConfig = async () => {
      await initialize();
      
      // Set up tab configuration
      microsoftTeams.pages.config.registerOnSaveHandler((saveEvent) => {
        microsoftTeams.pages.config.setConfig({
          entityId: 'filesharing-documents',
          contentUrl: `${window.location.origin}/teams/tab`,
          websiteUrl: `${window.location.origin}`,
          suggestedDisplayName: 'Document Management',
        }).then(() => {
          saveEvent.notifySuccess();
        }).catch((error) => {
          saveEvent.notifyFailure(error.message);
        });
      });

      microsoftTeams.pages.config.setValidityState(true);
    };

    setupConfig();
  }, [initialize]);

  return (
    <div className="teams-config-container">
      <h2>Configure Document Management</h2>
      <p>This tab will provide access to your organization's document management system.</p>
      <div className="config-options">
        <label>
          <input type="checkbox" defaultChecked /> Enable document notifications
        </label>
        <label>
          <input type="checkbox" defaultChecked /> Allow document sharing
        </label>
        <label>
          <input type="checkbox" defaultChecked /> Enable approval workflows
        </label>
      </div>
    </div>
  );
};
```

### **4. Teams Document Operations**
```typescript
// src/teams/TeamsDocumentOperations.tsx
import React from 'react';
import { useTeams } from './TeamsProvider';
import { useSelectedEndUser } from '../contexts/EndUserContext';
import { SharePointApiClient } from '../shared/api/sharePointApi';
import * as microsoftTeams from '@microsoft/teams-js';

export const TeamsDocumentOperations: React.FC = () => {
  const { teamsContext, isInTeams, notifySuccess, notifyFailure } = useTeams();
  const { selectedEndUser } = useSelectedEndUser();

  const handleShareToChannel = async (documentId: string) => {
    try {
      if (!isInTeams || !teamsContext?.channel?.id) {
        throw new Error('Not in Teams channel context');
      }

      // Get document info
      const document = await SharePointApiClient.getDocument(documentId);
      
      // Create adaptive card for document sharing
      const adaptiveCard = {
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
          {
            type: 'Container',
            items: [
              {
                type: 'TextBlock',
                text: `Document Shared: ${document.name}`,
                weight: 'Bolder',
                size: 'Medium'
              },
              {
                type: 'TextBlock',
                text: `Shared by: ${document.sharedBy}`,
                isSubtle: true
              },
              {
                type: 'TextBlock',
                text: document.description || 'No description available',
                wrap: true
              }
            ]
          }
        ],
        actions: [
          {
            type: 'Action.OpenUrl',
            title: 'Open Document',
            url: document.webUrl
          },
          {
            type: 'Action.OpenUrl',
            title: 'Open in SharePoint',
            url: document.sharePointUrl
          }
        ]
      };

      // Send adaptive card to Teams channel
      await microsoftTeams.app.openUrl(`https://teams.microsoft.com/l/card/${btoa(JSON.stringify(adaptiveCard))}`);
      
      notifySuccess('Document shared to channel');
    } catch (error) {
      console.error('Failed to share document:', error);
      notifyFailure('Failed to share document to channel');
    }
  };

  const handleCreateTeamsChat = async (documentId: string) => {
    try {
      if (!isInTeams) {
        throw new Error('Not in Teams context');
      }

      const document = await SharePointApiClient.getDocument(documentId);
      
      // Open Teams chat with document context
      const chatDeepLink = `https://teams.microsoft.com/l/chat/0/0?users=${selectedEndUser?.email}&topicName=Document: ${document.name}&message=Let's discuss this document: ${document.webUrl}`;
      
      await microsoftTeams.app.openUrl(chatDeepLink);
      
      notifySuccess('Teams chat opened');
    } catch (error) {
      console.error('Failed to create Teams chat:', error);
      notifyFailure('Failed to create Teams chat');
    }
  };

  const handleScheduleTeamsMeeting = async (documentId: string) => {
    try {
      if (!isInTeams) {
        throw new Error('Not in Teams context');
      }

      const document = await SharePointApiClient.getDocument(documentId);
      
      // Create Teams meeting with document agenda
      const meetingUrl = `https://teams.microsoft.com/l/meeting/new?subject=Document Review: ${encodeURIComponent(document.name)}&content=${encodeURIComponent(`Review document: ${document.webUrl}`)}`;
      
      await microsoftTeams.app.openUrl(meetingUrl);
      
      notifySuccess('Teams meeting scheduled');
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      notifyFailure('Failed to schedule Teams meeting');
    }
  };

  return (
    <div className="teams-operations">
      {/* Document operations specific to Teams context */}
    </div>
  );
};
```

---

## 🔧 **BACKEND INTEGRATION**

### **1. Teams-specific Azure Functions**
```typescript
// api/src/functions/teamsOperations.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';
import { Client } from '@microsoft/microsoft-graph-client';
import { getContainer } from '../shared/db/cosmos';
import config from '../config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// POST /api/teams/share-document - Share document to Teams channel
app.http('shareDocumentToTeams', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'teams/share-document',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
      if (!accessToken) {
        return {
          status: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No access token provided' })
        };
      }

      const { documentId, teamId, channelId, message } = await req.json();

      // Create OBO credential for Graph API
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      // Get Graph client
      const graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await oboCredential.getToken(['https://graph.microsoft.com/.default']);
            return tokenResponse?.token || '';
          }
        }
      });

      // Get document from CosmosDB
      const documentsContainer = getContainer('documents');
      const { resource: document } = await documentsContainer.item(documentId).read();

      if (!document) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document not found' })
        };
      }

      // Create adaptive card
      const adaptiveCard = {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.2',
          body: [
            {
              type: 'Container',
              items: [
                {
                  type: 'TextBlock',
                  text: `Document: ${document.name}`,
                  weight: 'Bolder',
                  size: 'Medium'
                },
                {
                  type: 'TextBlock',
                  text: message || 'Document shared for review',
                  wrap: true
                }
              ]
            }
          ],
          actions: [
            {
              type: 'Action.OpenUrl',
              title: 'Open Document',
              url: document.webUrl || document.sharePointUrl
            }
          ]
        }
      };

      // Send message to Teams channel
      await graphClient
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post({
          body: {
            content: message || 'Document shared',
            contentType: 'text'
          },
          attachments: [adaptiveCard]
        });

      // Log activity
      const activitiesContainer = getContainer('activities');
      await activitiesContainer.items.create({
        id: `teams-share-${Date.now()}`,
        partitionKey: document.partitionKey,
        type: 'teams-share',
        documentId,
        teamId,
        channelId,
        userId: document.createdBy,
        timestamp: new Date().toISOString(),
        action: 'shared-to-teams',
        details: { message }
      });

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Document shared to Teams channel successfully'
        })
      };

    } catch (error: any) {
      ctx.error('Teams share error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
});

// GET /api/teams/context - Get Teams context information
app.http('getTeamsContext', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'teams/context',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
      if (!accessToken) {
        return {
          status: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No access token provided' })
        };
      }

      const teamId = req.query.get('teamId');
      const channelId = req.query.get('channelId');

      // Create OBO credential for Graph API
      const oboCredential = new OnBehalfOfUserCredential(accessToken, {
        authorityHost: config.authorityHost,
        clientId: config.clientId,
        tenantId: config.tenantId,
        clientSecret: config.clientSecret
      });

      // Get Graph client
      const graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await oboCredential.getToken(['https://graph.microsoft.com/.default']);
            return tokenResponse?.token || '';
          }
        }
      });

      const teamsInfo: any = {};

      if (teamId) {
        // Get team information
        const team = await graphClient.api(`/teams/${teamId}`).get();
        teamsInfo.team = team;

        if (channelId) {
          // Get channel information
          const channel = await graphClient.api(`/teams/${teamId}/channels/${channelId}`).get();
          teamsInfo.channel = channel;
        }

        // Get SharePoint site associated with the team
        const site = await graphClient.api(`/groups/${teamId}/sites/root`).get();
        teamsInfo.sharePointSite = site;
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(teamsInfo)
      };

    } catch (error: any) {
      ctx.error('Teams context error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
});
```

### **2. Teams Notifications System**
```typescript
// api/src/functions/teamsNotifications.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Client } from '@microsoft/microsoft-graph-client';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';

// POST /api/teams/notify - Send notification to Teams user/channel
app.http('sendTeamsNotification', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'teams/notify',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Implementation for Teams notifications
    // - Document approval needed
    // - Document uploaded 
    // - Document shared
    // - Deadline reminders
  }
});
```

---

## 📱 **FRONTEND INTEGRATION**

### **1. Teams Tab Component**
```typescript
// src/teams/TeamsTab.tsx
import React, { useEffect } from 'react';
import { useTeams } from './TeamsProvider';
import { useAuth } from '../shared/lib/auth';
import { DocumentList } from '../pages/documents/DocumentList';
import { EndUserSelector } from '../components/EndUser/EndUserSelector';
import { TeamsDocumentOperations } from './TeamsDocumentOperations';

export const TeamsTab: React.FC = () => {
  const { initialize, isInTeams, teamsContext, theme } = useTeams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInTeams) {
    return (
      <div className="teams-fallback">
        <p>This app is optimized for Microsoft Teams.</p>
        <a href="/" target="_blank">Open in browser</a>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="teams-auth">
        <p>Please authenticate to access your documents.</p>
      </div>
    );
  }

  return (
    <div className={`teams-tab teams-theme-${theme}`}>
      <div className="teams-header">
        <h1>Document Management</h1>
        <EndUserSelector />
      </div>
      
      <div className="teams-content">
        <DocumentList />
        <TeamsDocumentOperations />
      </div>
    </div>
  );
};
```

### **2. Teams-specific Routing**
```typescript
// src/app/navigation/teamsRouter.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TeamsTab } from '../teams/TeamsTab';
import { TeamsTabConfig } from '../teams/TeamsTabConfig';

const teamsRouter = createBrowserRouter([
  {
    path: '/teams/tab',
    element: <TeamsTab />
  },
  {
    path: '/teams/config',
    element: <TeamsTabConfig />
  }
]);

export const TeamsRouter: React.FC = () => {
  return <RouterProvider router={teamsRouter} />;
};
```

---

## 🔒 **SECURITY & PERMISSIONS**

### **Azure AD App Registration Updates:**
```json
{
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
          "type": "Scope"
        },
        {
          "id": "df021288-bdef-4463-88db-98f22de89214",
          "type": "Role"
        },
        {
          "id": "b340eb25-3456-403f-be2f-af7a0d370277",
          "type": "Scope"
        }
      ]
    }
  ],
  "oauth2AllowImplicitFlow": false,
  "oauth2AllowIdTokenImplicitFlow": true,
  "oauth2Permissions": [
    {
      "id": "access_as_user",
      "type": "User",
      "userConsentDisplayName": "Access File Sharing App",
      "userConsentDescription": "Allow Teams to access your File Sharing data on your behalf.",
      "value": "access_as_user"
    }
  ]
}
```

---

## 📋 **IMPLEMENTATION PHASES**

### **Phase 1: Teams Tab Foundation (Week 1)**
- ✅ Teams app manifest creation
- ✅ TeamsProvider and context setup  
- ✅ Basic Teams tab functionality
- ✅ Teams authentication integration

### **Phase 2: Document Operations (Week 2)**
- 🔄 Teams-specific document operations
- 🔄 Share to channel functionality
- 🔄 Teams chat integration
- 🔄 Teams notifications

### **Phase 3: Advanced Features (Week 3)**
- 🔄 Adaptive cards for documents
- 🔄 Teams meeting integration
- 🔄 Approval workflows in Teams
- 🔄 Co-authoring features

### **Phase 4: Polish & Testing (Week 4)**
- 🔄 Teams theme integration
- 🔄 Performance optimization
- 🔄 End-to-end testing
- 🔄 Teams app store preparation

---

## 🎯 **SUCCESS METRICS**

### **Week 1 Goals:**
- [ ] Teams app successfully sideloaded
- [ ] Basic tab renders in Teams
- [ ] SSO authentication works
- [ ] Document list displays correctly

### **Final Success Criteria:**
- [ ] Full document lifecycle in Teams
- [ ] Seamless Teams-SharePoint integration
- [ ] Teams notifications working
- [ ] Performance benchmarks met
- [ ] User adoption > 80%

---

*Architecture Plan Status: Ready for Implementation*  
*Next Step: Begin Teams App Manifest Creation* 🚀
