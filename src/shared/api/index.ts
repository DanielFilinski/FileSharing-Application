import { ApiClient } from './client';
import { errorHandler } from '../lib/errorHandler';

// Базовый URL для API - берем из переменных окружения или используем локальный
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     'https://your-function-app.azurewebsites.net/api' ||
                     'http://localhost:7071/api';

// Создаем экземпляр API клиента
export const apiClient = new ApiClient(API_BASE_URL);

// Обновляем API клиент для интеграции с обработчиком ошибок
const originalRequest = apiClient['request'].bind(apiClient);
apiClient['request'] = async function<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  retryCount: number = 0
): Promise<any> {
  try {
    return await originalRequest<T>(endpoint, options, retryCount);
  } catch (error) {
    await errorHandler.handleApiError(error, {
      showNotification: true,
      retry: true,
      maxRetries: 3,
      retryDelay: 1000,
    });
    throw error;
  }
};

// Экспортируем типы для использования в других модулях
export type { ApiResponse, ApiError } from './client';
export { ApiClient };
