import { apiClient } from './apiClient';

export interface ShareDocumentToTeamsRequest {
  documentId: string;
  teamId: string;
  channelId: string;
  message?: string;
  endUserId?: string;
}

export interface TeamsContextRequest {
  teamId: string;
  channelId?: string;
}

export interface SendTeamsNotificationRequest {
  activityType: 'documentShared' | 'documentUploaded' | 'approvalNeeded';
  documentId: string;
  documentName: string;
  recipientUserId: string;
  templateParameters?: Record<string, any>;
}

export interface TeamsContextResponse {
  success: boolean;
  teamsContext: {
    team?: {
      id: string;
      displayName: string;
      description?: string;
      webUrl: string;
    };
    channel?: {
      id: string;
      displayName: string;
      description?: string;
      webUrl: string;
    };
    sharePointSite?: {
      id: string;
      displayName: string;
      webUrl: string;
    };
  };
  timestamp: string;
}

export class TeamsApiClient {
  /**
   * Share a document to a Teams channel with an adaptive card
   */
  static async shareDocumentToChannel(request: ShareDocumentToTeamsRequest): Promise<any> {
    try {
      const response = await apiClient.post('/teams/share-document', request);
      console.log('Document shared to Teams channel successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to share document to Teams channel:', error);
      throw error;
    }
  }

  /**
   * Get Teams context information (team, channel, SharePoint site)
   */
  static async getTeamsContext(request: TeamsContextRequest): Promise<TeamsContextResponse> {
    try {
      const params = new URLSearchParams();
      params.append('teamId', request.teamId);
      if (request.channelId) {
        params.append('channelId', request.channelId);
      }

      const response = await apiClient.get(`/teams/context?${params.toString()}`);
      console.log('Teams context retrieved successfully:', response);
      return response as TeamsContextResponse;
    } catch (error) {
      console.error('Failed to get Teams context:', error);
      throw error;
    }
  }

  /**
   * Send a Teams activity feed notification
   */
  static async sendNotification(request: SendTeamsNotificationRequest): Promise<any> {
    try {
      const response = await apiClient.post('/teams/notify', request);
      console.log('Teams notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
      throw error;
    }
  }

  /**
   * Helper method to determine if we're running in Teams context
   */
  static isInTeamsContext(): boolean {
    try {
      // Check for Teams-specific URL parameters or context
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      // Teams URLs typically have these characteristics
      const teamsIndicators = [
        urlParams.has('theme'), // Teams passes theme parameter
        hash.includes('/teams/'), // Our Teams routes
        window.location.hostname.includes('teams.microsoft.com'),
        // Check for Teams-specific global objects
        typeof (window as any).microsoftTeams !== 'undefined'
      ];

      return teamsIndicators.some(indicator => indicator);
    } catch (error) {
      console.warn('Error checking Teams context:', error);
      return false;
    }
  }

  /**
   * Helper method to extract Teams parameters from URL
   */
  static getTeamsParametersFromUrl(): {
    teamId?: string;
    channelId?: string;
    theme?: string;
    locale?: string;
  } {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      return {
        teamId: urlParams.get('teamId') || undefined,
        channelId: urlParams.get('channelId') || undefined, 
        theme: urlParams.get('theme') || undefined,
        locale: urlParams.get('locale') || undefined
      };
    } catch (error) {
      console.warn('Error extracting Teams parameters from URL:', error);
      return {};
    }
  }

  /**
   * Create a Teams deep link for document sharing
   */
  static createDocumentDeepLink(documentId: string, documentName: string): string {
    const baseUrl = window.location.origin;
    const documentUrl = `${baseUrl}/index.html#/documents/${documentId}`;
    
    // Create Teams deep link for sharing
    const deepLink = `https://teams.microsoft.com/l/entity/YOUR_APP_ID/documents?webUrl=${encodeURIComponent(documentUrl)}&label=${encodeURIComponent(documentName)}`;
    
    return deepLink;
  }

  /**
   * Create a Teams meeting link with document agenda
   */
  static createMeetingWithDocument(documentId: string, documentName: string, subject?: string): string {
    const baseUrl = window.location.origin;
    const documentUrl = `${baseUrl}/index.html#/documents/${documentId}`;
    
    const meetingSubject = subject || `Document Review: ${documentName}`;
    const meetingContent = `Review document: ${documentUrl}`;
    
    const meetingUrl = `https://teams.microsoft.com/l/meeting/new?subject=${encodeURIComponent(meetingSubject)}&content=${encodeURIComponent(meetingContent)}`;
    
    return meetingUrl;
  }

  /**
   * Create a Teams chat deep link with document context
   */
  static createChatWithDocument(documentId: string, documentName: string, userEmails?: string[]): string {
    const baseUrl = window.location.origin;
    const documentUrl = `${baseUrl}/index.html#/documents/${documentId}`;
    
    const users = userEmails ? userEmails.join(',') : '';
    const message = `Let's discuss this document: ${documentUrl}`;
    const topicName = `Document: ${documentName}`;
    
    const chatUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(users)}&topicName=${encodeURIComponent(topicName)}&message=${encodeURIComponent(message)}`;
    
    return chatUrl;
  }
}

export default TeamsApiClient;
