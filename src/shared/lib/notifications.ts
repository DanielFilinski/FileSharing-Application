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
  
  // Global flag to temporarily disable error notifications
  private errorNotificationsEnabled = true;
  
  // Map to track recent error messages and prevent duplicates
  private recentErrors = new Map<string, number>();
  private errorDebounceTime = 3000; // 3 seconds debounce for same error messages

  // Add notification
  add(
    type: NotificationType,
    title: string,
    message: string,
    options: NotificationOptions = {}
  ): string {
    // Periodically clean up old error entries
    if (Math.random() < 0.1) { // 10% chance to cleanup on each notification
      this.cleanupOldErrors();
    }

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
    // Check if error notifications are disabled
    if (!this.errorNotificationsEnabled) {
      console.warn('Error notification blocked (notifications disabled):', { title, message });
      return '';
    }

    // Check for duplicate error messages
    const errorKey = `${title}:${message}`;
    const now = Date.now();
    const lastOccurrence = this.recentErrors.get(errorKey);
    
    if (lastOccurrence && now - lastOccurrence < this.errorDebounceTime) {
      console.warn('Duplicate error notification blocked:', { title, message });
      return '';
    }
    
    // Update recent errors map
    this.recentErrors.set(errorKey, now);
    
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
    // Check if error notifications are disabled
    if (!this.errorNotificationsEnabled) {
      console.warn('API error notification blocked (notifications disabled):', { title, error });
      return '';
    }

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

  // Methods for managing error notifications
  enableErrorNotifications(): void {
    this.errorNotificationsEnabled = true;
  }

  disableErrorNotifications(): void {
    this.errorNotificationsEnabled = false;
  }

  setErrorNotificationsEnabled(enabled: boolean): void {
    this.errorNotificationsEnabled = enabled;
  }

  isErrorNotificationsEnabled(): boolean {
    return this.errorNotificationsEnabled;
  }

  // Clear recent errors cache
  clearRecentErrors(): void {
    this.recentErrors.clear();
  }

  // Internal method to cleanup old error entries
  private cleanupOldErrors(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.recentErrors.entries()) {
      if (now - timestamp > this.errorDebounceTime) {
        this.recentErrors.delete(key);
      }
    }
  }

  // Method to temporarily disable error notifications with auto re-enable
  temporarilyDisableErrorNotifications(duration: number = 30000): void {
    this.disableErrorNotifications();
    console.log(`Error notifications disabled for ${duration}ms`);
    
    setTimeout(() => {
      this.enableErrorNotifications();
      this.clearRecentErrors();
      console.log('Error notifications re-enabled');
    }, duration);
  }
}

// Create global notification service instance
export const notificationService = new NotificationService();

// Convenience exports for quick access to error notification controls
export const disableErrorNotifications = () => notificationService.disableErrorNotifications();
export const enableErrorNotifications = () => notificationService.enableErrorNotifications();
export const temporarilyDisableErrorNotifications = (duration?: number) => 
  notificationService.temporarilyDisableErrorNotifications(duration);

// For development - expose notification controls to window object for easy console access
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).notificationControls = {
    disable: disableErrorNotifications,
    enable: enableErrorNotifications,
    temporaryDisable: temporarilyDisableErrorNotifications,
    service: notificationService,
    clearAll: () => notificationService.clear(),
    clearRecentErrors: () => notificationService.clearRecentErrors()
  };
  console.log('🔧 Notification controls available at: window.notificationControls');
}
