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

  // Add notification
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

    // Automatically remove notification after specified time
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    return id;
  }

  // Remove notification
  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Clear all notifications
  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  // Get all notifications
  getAll(): Notification[] {
    return [...this.notifications];
  }

  // Subscribe to changes
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all subscribers
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Get default duration for notification type
  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'success':
        return 3000; // 3 seconds
      case 'error':
        return 5000; // 5 seconds
      case 'warning':
        return 4000; // 4 seconds
      case 'info':
        return 3000; // 3 seconds
      default:
        return 3000;
    }
  }

  // Convenient methods for different notification types
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

  // Method for handling API errors
  showApiError(error: any, title: string = 'Error'): string {
    let message = 'An unknown error occurred';
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.details?.message) {
      message = error.details.message;
    }

    return this.error(title, message, { persistent: true });
  }

  // Method for showing successful operations
  showSuccess(title: string, message: string): string {
    return this.success(title, message);
  }
}

// Create global notification service instance
export const notificationService = new NotificationService();
