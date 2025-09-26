import { TeamsUserCredential } from '@microsoft/teamsfx';
import { apiClient } from '../api';
import * as microsoftTeams from '@microsoft/teams-js';

export interface AuthConfig {
  clientId: string;
  initiateLoginEndpoint: string;
  apiEndpoint: string;
  apiScope: string;
}

export interface UserInfo {
  id: string;
  displayName: string;
  email: string;
  tenantId: string;
}

export class AuthService {
  private credential: TeamsUserCredential | null = null;
  private config: AuthConfig | null = null;
  private currentUser: UserInfo | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private isInTeams: boolean = false;

  async initialize(config?: AuthConfig): Promise<void> {
    if (config) {
      this.config = config;
    } else {
      // Use values from environment variables
      this.config = {
        clientId: (import.meta as any).env?.VITE_CLIENT_ID || '17479755-e076-41c8-8cfb-08518cbcd835',
        initiateLoginEndpoint: (import.meta as any).env?.VITE_START_LOGIN_PAGE_URL || window.location.origin + '/auth-start.html',
        apiEndpoint: (import.meta as any).env?.VITE_API_ENDPOINT || '',
        apiScope: (import.meta as any).env?.VITE_API_SCOPE || 'access_as_user',
      };
    }

    if (!this.config.clientId) {
      throw new Error('Client ID is required for authentication');
    }

    // Check if the application is running in Teams
    try {
      await microsoftTeams.app.initialize();
      this.isInTeams = true;
      console.log('Running inside Teams environment');
    } catch (error) {
      this.isInTeams = false;
      console.log('Running outside Teams environment, will use browser authentication');
    }

    try {
      if (this.isInTeams) {
        this.credential = new TeamsUserCredential({
          clientId: this.config.clientId,
          initiateLoginEndpoint: this.config.initiateLoginEndpoint,
        });
        // Set up automatic token refresh only for Teams
        this.setupTokenRefresh();
      }
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
      // Don't throw error if not in Teams - just log it
      if (this.isInTeams) {
        throw error;
      }
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.isInTeams || !this.credential) {
      return null;
    }

    try {
      const token = await this.credential.getToken([this.config!.apiScope]);
      if (token?.token) {
        // Update token in API client
        apiClient.setToken(token.token);
        return token.token;
      }
      return null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async getUserInfo(): Promise<UserInfo | null> {
    if (!this.isInTeams || !this.credential) {
      return null;
    }

    try {
      const userInfo = await this.credential.getUserInfo();
      if (userInfo) {
        this.currentUser = {
          id: (userInfo as any).id || '',
          displayName: userInfo.displayName || '',
          email: userInfo.preferredUserName || '',
          tenantId: userInfo.tenantId || '',
        };
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  async login(): Promise<void> {
    if (!this.isInTeams) {
      // If not in Teams, use regular browser authentication
      await this.browserLogin();
      return;
    }

    if (!this.credential) {
      throw new Error('Authentication not initialized');
    }

    try {
      await this.credential.login([this.config!.apiScope]);
      
      // Update token in API client
      await this.getToken();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  private async browserLogin(): Promise<void> {
    // Create URL for browser authentication
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', this.config!.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', window.location.origin + '/auth-end.html');
    authUrl.searchParams.set('scope', 'User.Read openid profile email');
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('state', 'browser-auth');

    // Open authentication window
    const authWindow = window.open(authUrl.toString(), 'auth', 'width=500,height=600');
    
    if (!authWindow) {
      throw new Error('Failed to open authentication window. Please check your popup blocker settings.');
    }

    // Wait for authentication completion
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          // Check if token exists in localStorage
          const token = localStorage.getItem('access_token');
          if (token) {
            // Create mock user for demonstration
            this.currentUser = {
              id: 'browser-user',
              displayName: 'Browser User',
              email: 'user@example.com',
              tenantId: 'browser-tenant',
            };
            apiClient.setToken(token);
            resolve();
          } else {
            reject(new Error('Authentication was cancelled'));
          }
        }
      }, 1000);
    });
  }

  async logout(): Promise<void> {
    try {
      // Clear user state
      this.currentUser = null;
      apiClient.setToken(null);
      
      // Clear token refresh timer
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
        this.tokenRefreshTimer = null;
      }

      // Clear browser authentication data
      if (!this.isInTeams) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        sessionStorage.clear();
      }

      // For Teams environment, we can't force actual logout from Teams,
      // but we clear our application state
      if (this.isInTeams && this.credential) {
        // Teams credential doesn't have explicit logout, so we just clear our state
        this.credential = null;
      }

      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state to prevent stuck authentication
      this.currentUser = null;
      apiClient.setToken(null);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUser;
  }

  private setupTokenRefresh(): void {
    // Refresh token every 50 minutes (tokens usually live for 1 hour)
    const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

    this.tokenRefreshTimer = setInterval(async () => {
      try {
        await this.getToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // On token refresh error, try to re-login
        try {
          await this.login();
        } catch (loginError) {
          console.error('Failed to re-login after token refresh error:', loginError);
        }
      }
    }, REFRESH_INTERVAL);
  }

  // Method for manual token refresh
  async refreshToken(): Promise<string | null> {
    try {
      return await this.getToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }
}

// Create global authentication service instance
export const authService = new AuthService();