import { apiClient } from '../api';
import { notificationService } from './notifications';
import { errorHandler } from './errorHandler';

// Примеры использования API клиента

export class ApiExamples {
  // Получение профиля пользователя
  static async getUserProfile() {
    try {
      const response = await apiClient.get('/getUserProfile');
      notificationService.success('Профиль загружен', 'Данные пользователя успешно получены');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // Загрузка файла
  static async uploadFile(file: File, onProgress?: (progress: number) => void) {
    try {
      const response = await apiClient.uploadFile('/uploadFile', file, onProgress);
      notificationService.success('Файл загружен', `Файл ${file.name} успешно загружен`);
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // Проверка здоровья API
  static async checkHealth() {
    try {
      const response = await apiClient.get('/healthCheck');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: false });
      throw error;
    }
  }

  // Пример POST запроса
  static async createDocument(documentData: any) {
    try {
      const response = await apiClient.post('/documents', documentData);
      notificationService.success('Документ создан', 'Новый документ успешно создан');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // Пример PUT запроса
  static async updateDocument(id: string, documentData: any) {
    try {
      const response = await apiClient.put(`/documents/${id}`, documentData);
      notificationService.success('Документ обновлен', 'Документ успешно обновлен');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }

  // Пример DELETE запроса
  static async deleteDocument(id: string) {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      notificationService.success('Документ удален', 'Документ успешно удален');
      return response.data;
    } catch (error) {
      await errorHandler.handleApiError(error, { showNotification: true });
      throw error;
    }
  }
}

// Пример использования в React компоненте
export const useApiExamples = () => {
  const uploadFileWithProgress = async (file: File) => {
    try {
      const result = await ApiExamples.uploadFile(file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
        // Здесь можно обновить UI с прогрессом
      });
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadFileWithProgress(file);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  return {
    getUserProfile: ApiExamples.getUserProfile,
    uploadFile: uploadFileWithProgress,
    checkHealth: ApiExamples.checkHealth,
    createDocument: ApiExamples.createDocument,
    updateDocument: ApiExamples.updateDocument,
    deleteDocument: ApiExamples.deleteDocument,
    handleFileUpload,
  };
};
