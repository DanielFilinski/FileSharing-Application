import { notificationService } from './notifications';
import { authService } from './auth';

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Обработка API ошибок
  async handleApiError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): Promise<void> {
    const {
      showNotification = true,
      retry = false,
      maxRetries = this.maxRetries,
      retryDelay = this.retryDelay,
    } = options;

    // Логируем ошибку
    console.error('API Error:', error);

    // Проверяем тип ошибки
    if (this.isAuthError(error)) {
      await this.handleAuthError(error);
      return;
    }

    if (this.isNetworkError(error)) {
      await this.handleNetworkError(error, { retry, maxRetries, retryDelay });
      return;
    }

    if (this.isServerError(error)) {
      await this.handleServerError(error);
      return;
    }

    // Общая обработка ошибок
    if (showNotification) {
      notificationService.showApiError(error);
    }
  }

  // Обработка ошибок аутентификации
  private async handleAuthError(_: any): Promise<void> {
    console.warn('Authentication error detected, attempting to refresh token...');
    
    try {
      // Пытаемся обновить токен
      const newToken = await authService.refreshToken();
      if (newToken) {
        notificationService.info(
          'Сессия обновлена',
          'Ваша сессия была автоматически обновлена'
        );
        return;
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
    }

    // Если обновление не удалось, пробуем интерактивный вход
    try {
      await authService.login();
      notificationService.info('Выполнен вход', 'Сессия восстановлена после 401/403');
      return;
    } catch (loginError) {
      console.error('Interactive login failed:', loginError);
    }

    // Если и логин не удался — разлогиниваем и уведомляем
    notificationService.error('Ошибка авторизации', 'Необходимо войти в систему заново');
    try {
      await authService.logout();
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    }
  }

  // Обработка сетевых ошибок
  private async handleNetworkError(
    _error: any,
    options: { retry: boolean; maxRetries: number; retryDelay: number }
  ): Promise<void> {
    if (options.retry && this.retryCount < options.maxRetries) {
      this.retryCount++;
      console.log(`Retrying request (${this.retryCount}/${options.maxRetries})...`);
      
      notificationService.info(
        'Повторная попытка',
        `Повторная попытка подключения (${this.retryCount}/${options.maxRetries})`
      );

      // Ждем перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, options.retryDelay));
      return;
    }

    this.retryCount = 0;
    notificationService.error(
      'Ошибка сети',
      'Проверьте подключение к интернету и попробуйте снова'
    );
  }

  // Обработка серверных ошибок
  private async handleServerError(_error: any): Promise<void> {
    notificationService.error(
      'Ошибка сервера',
      'Сервер временно недоступен. Попробуйте позже.'
    );
  }

  // Определение типа ошибки
  private isAuthError(error: any): boolean {
    return (
      error?.status === 401 ||
      error?.status === 403 ||
      error?.message?.includes('unauthorized') ||
      error?.message?.includes('forbidden') ||
      error?.message?.includes('token')
    );
  }

  private isNetworkError(error: any): boolean {
    return (
      !navigator.onLine ||
      error?.message?.includes('network') ||
      error?.message?.includes('fetch') ||
      error?.status === 0 ||
      error?.name === 'TypeError'
    );
  }

  private isServerError(error: any): boolean {
    return error?.status >= 500 && error?.status < 600;
  }

  // Глобальный обработчик необработанных ошибок
  setupGlobalErrorHandling(): void {
    // Обработка необработанных ошибок JavaScript
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
      notificationService.error(
        'Ошибка приложения',
        'Произошла неожиданная ошибка. Обновите страницу.'
      );
    });

    // Обработка необработанных отклонений промисов
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      notificationService.error(
        'Ошибка приложения',
        'Произошла ошибка при выполнении операции.'
      );
      event.preventDefault(); // Предотвращаем вывод в консоль браузера
    });
  }

  // Сброс счетчика повторных попыток
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  // Установка конфигурации повторных попыток
  setRetryConfig(maxRetries: number, retryDelay: number): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
}

// Экспортируем глобальный экземпляр
export const errorHandler = ErrorHandler.getInstance();
