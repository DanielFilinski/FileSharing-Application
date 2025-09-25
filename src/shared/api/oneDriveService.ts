import { app, authentication } from '@microsoft/teams-js';
import { DocumentMetadata } from '@/pages/documents/components/UploadForm';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

export interface OneDriveUploadResult {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  downloadUrl: string;
  createdDateTime: string;
  metadata: DocumentMetadata;
  source: 'device' | 'cloud' | 'portal';
  originalUrl?: string;
  originalFileId?: string;
}

class OneDriveService {
  private apiBaseUrl = '/api';

  /**
   * Загружает файлы с устройства в OneDrive пользователя
   */
  async uploadFromDevice(files: File[], metadata: DocumentMetadata): Promise<OneDriveUploadResult[]> {
    try {
      const token = await this.getAccessToken();
      const formData = new FormData();
      
      formData.append('uploadType', 'device');
      formData.append('metadata', JSON.stringify(metadata));
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.apiBaseUrl}/uploadToOneDrive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.results;
    } catch (error) {
      console.error('Error uploading files from device:', error);
      throw error;
    }
  }

  /**
   * Загружает файл из облака по URL в OneDrive пользователя
   */
  async uploadFromCloud(fileUrl: string, fileName: string, metadata: DocumentMetadata): Promise<OneDriveUploadResult> {
    try {
      const token = await this.getAccessToken();
      const formData = new FormData();
      
      formData.append('uploadType', 'cloud');
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('fileUrl', fileUrl);
      formData.append('fileName', fileName);

      const response = await fetch(`${this.apiBaseUrl}/uploadToOneDrive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.results[0];
    } catch (error) {
      console.error('Error uploading file from cloud:', error);
      throw error;
    }
  }

  /**
   * Загружает файл с портала Teams в OneDrive пользователя
   */
  async uploadFromPortal(fileId: string, fileName: string, metadata: DocumentMetadata): Promise<OneDriveUploadResult> {
    try {
      const token = await this.getAccessToken();
      const formData = new FormData();
      
      formData.append('uploadType', 'portal');
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('fileId', fileId);
      formData.append('fileName', fileName);

      const response = await fetch(`${this.apiBaseUrl}/uploadToOneDrive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.results[0];
    } catch (error) {
      console.error('Error uploading file from portal:', error);
      throw error;
    }
  }

  /**
   * Получает список файлов из OneDrive пользователя
   */
  async selectFilesFromCloud(): Promise<{ url: string; name: string; id: string; size?: number }[]> {
    try {
      const graphClient = await this.createGraphClient();
      
      // Получаем последние файлы из OneDrive
      const filesResponse = await graphClient
        .api('/me/drive/root/children')
        .select('id,name,size,webUrl,file,@microsoft.graph.downloadUrl')
        .filter('file ne null') // Только файлы, не папки
        .top(50)
        .orderby('lastModifiedDateTime desc')
        .get();
      
      return filesResponse.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        url: file.webUrl,
        downloadUrl: file['@microsoft.graph.downloadUrl'],
        size: file.size
      }));
    } catch (error) {
      console.error('Error getting files from OneDrive:', error);
      throw error;
    }
  }

  /**
   * Открывает файловый пикер для выбора файлов из SharePoint/Teams
   */
  async selectFilesFromPortal(): Promise<{ id: string; name: string; url?: string; driveId?: string }[]> {
    try {
      await app.initialize();
      const graphClient = await this.createGraphClient();
      
      // Получаем доступные сайты SharePoint через Teams context
      const context = await app.getContext();
      
      if (context.sharepoint?.site?.id) {
        // Если мы в контексте SharePoint/Teams, показываем файлы из текущего сайта
        const files = await graphClient
          .api(`/sites/${context.sharepoint.site.id}/drive/root/children`)
          .select('id,name,webUrl,size,file')
          .filter("file ne null")
          .top(20)
          .get();
          
        return files.value.map((file: any) => ({
          id: file.id,
          name: file.name,
          url: file.webUrl,
          driveId: context.sharepoint?.site?.id,
          size: file.size
        }));
      } else {
        // Если не в Teams context, показываем недавние файлы из всех сайтов
        const recentFiles = await graphClient
          .api('/me/drive/recent')
          .select('id,name,webUrl,size,file,remoteItem')
          .top(20)
          .get();
          
        return recentFiles.value
          .filter((file: any) => file.remoteItem) // Только файлы из SharePoint
          .map((file: any) => ({
            id: file.remoteItem.id,
            name: file.name,
            url: file.webUrl,
            driveId: file.remoteItem.parentReference?.driveId,
            size: file.size
          }));
      }
    } catch (error) {
      console.error('Error selecting files from portal:', error);
      throw error;
    }
  }

  /**
   * Получает токен доступа для API вызовов
   */
  private async getAccessToken(): Promise<string> {
    try {
      await app.initialize();
      
      const token = await authentication.getAuthToken({
        resources: ['https://graph.microsoft.com/Files.ReadWrite'],
        silent: false
      });

      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  /**
   * Проверяет, доступен ли Teams context
   */
  async isTeamsContext(): Promise<boolean> {
    try {
      await app.initialize();
      const context = await app.getContext();
      return !!context.app.host.name;
    } catch {
      return false;
    }
  }

  /**
   * Создает Graph client с аутентификацией
   */
  private async createGraphClient(): Promise<Client> {
    const token = await this.getAccessToken();
    
    // Создаем простой authentication provider
    const authProvider: AuthenticationProvider = {
      getAccessToken: () => Promise.resolve(token)
    };

    return Client.initWithMiddleware({
      authProvider
    });
  }

  // Удалено: функция getClientId не используется
}

export const oneDriveService = new OneDriveService();
