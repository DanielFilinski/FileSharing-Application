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
      // Используем значения из переменных окружения
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

    // Проверяем, запущено ли приложение в Teams
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
        // Настраиваем автоматическое обновление токена только для Teams
        this.setupTokenRefresh();
      }
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
      // Не выбрасываем ошибку, если не в Teams - просто логируем
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
        // Обновляем токен в API клиенте
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
      // Если не в Teams, используем обычную аутентификацию через браузер
      await this.browserLogin();
      return;
    }

    if (!this.credential) {
      throw new Error('Authentication not initialized');
    }

    try {
      await this.credential.login([this.config!.apiScope]);
      
      // Обновляем токен в API клиенте
      await this.getToken();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  private async browserLogin(): Promise<void> {
    // Создаем URL для аутентификации через браузер
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', this.config!.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', window.location.origin + '/auth-end.html');
    authUrl.searchParams.set('scope', 'User.Read openid profile email');
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('state', 'browser-auth');

    // Открываем окно аутентификации
    const authWindow = window.open(authUrl.toString(), 'auth', 'width=500,height=600');
    
    if (!authWindow) {
      throw new Error('Не удалось открыть окно аутентификации. Проверьте настройки блокировщика всплывающих окон.');
    }

    // Ждем завершения аутентификации
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          // Проверяем, есть ли токен в localStorage
          const token = localStorage.getItem('access_token');
          if (token) {
            // Создаем фиктивного пользователя для демонстрации
            this.currentUser = {
              id: 'browser-user',
              displayName: 'Пользователь браузера',
              email: 'user@example.com',
              tenantId: 'browser-tenant',
            };
            apiClient.setToken(token);
            resolve();
          } else {
            reject(new Error('Аутентификация была отменена'));
          }
        }
      }, 1000);
    });
  }

  async logout(): Promise<void> {
    if (!this.credential) {
      return;
    }

    try {
      // TeamsUserCredential не имеет метода logout, просто очищаем состояние
      this.currentUser = null;
      apiClient.setToken(null);
      
      // Очищаем таймер обновления токена
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
        this.tokenRefreshTimer = null;
      }
    } catch (error) {
      console.error('Logout failed:', error);
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
    // Обновляем токен каждые 50 минут (токены обычно живут 1 час)
    const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 минут

    this.tokenRefreshTimer = setInterval(async () => {
      try {
        await this.getToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // При ошибке обновления токена пытаемся перелогиниться
        try {
          await this.login();
        } catch (loginError) {
          console.error('Failed to re-login after token refresh error:', loginError);
        }
      }
    }, REFRESH_INTERVAL);
  }

  // Метод для ручного обновления токена
  async refreshToken(): Promise<string | null> {
    try {
      return await this.getToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }
}

// Создаем глобальный экземпляр сервиса аутентификации
export const authService = new AuthService();
