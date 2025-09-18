export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
  persistent?: boolean;
}

export interface NotificationOptions {
  duration?: number;
  persistent?: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private nextId = 1;

  // Добавить уведомление
  add(
    type: NotificationType,
    title: string,
    message: string,
    options: NotificationOptions = {}
  ): string {
    const id = `notification-${this.nextId++}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration: options.duration ?? this.getDefaultDuration(type),
      timestamp: Date.now(),
      persistent: options.persistent ?? false,
    };

    this.notifications.push(notification);
    this.notifyListeners();

    // Автоматически удаляем уведомление через указанное время
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    return id;
  }

  // Удалить уведомление
  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Очистить все уведомления
  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  // Получить все уведомления
  getAll(): Notification[] {
    return [...this.notifications];
  }

  // Подписаться на изменения
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    
    // Возвращаем функцию для отписки
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Уведомить всех подписчиков
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Получить время по умолчанию для типа уведомления
  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'success':
        return 3000; // 3 секунды
      case 'error':
        return 5000; // 5 секунд
      case 'warning':
        return 4000; // 4 секунды
      case 'info':
        return 3000; // 3 секунды
      default:
        return 3000;
    }
  }

  // Удобные методы для разных типов уведомлений
  success(title: string, message: string, options?: NotificationOptions): string {
    return this.add('success', title, message, options);
  }

  error(title: string, message: string, options?: NotificationOptions): string {
    return this.add('error', title, message, options);
  }

  warning(title: string, message: string, options?: NotificationOptions): string {
    return this.add('warning', title, message, options);
  }

  info(title: string, message: string, options?: NotificationOptions): string {
    return this.add('info', title, message, options);
  }

  // Метод для обработки API ошибок
  showApiError(error: any, title: string = 'Ошибка'): string {
    let message = 'Произошла неизвестная ошибка';
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.details?.message) {
      message = error.details.message;
    }

    return this.error(title, message, { persistent: true });
  }

  // Метод для показа успешных операций
  showSuccess(title: string, message: string): string {
    return this.success(title, message);
  }
}

// Создаем глобальный экземпляр сервиса уведомлений
export const notificationService = new NotificationService();
