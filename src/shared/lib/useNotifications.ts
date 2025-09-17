import { useState, useEffect } from 'react';
import { notificationService, type Notification } from './notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Подписываемся на изменения уведомлений
    const unsubscribe = notificationService.subscribe(setNotifications);
    
    // Устанавливаем текущие уведомления
    setNotifications(notificationService.getAll());

    // Отписываемся при размонтировании
    return unsubscribe;
  }, []);

  const addNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    options?: { duration?: number; persistent?: boolean }
  ) => {
    return notificationService.add(type, title, message, options);
  };

  const removeNotification = (id: string) => {
    notificationService.remove(id);
  };

  const clearNotifications = () => {
    notificationService.clear();
  };

  const showSuccess = (title: string, message: string) => {
    return notificationService.success(title, message);
  };

  const showError = (title: string, message: string) => {
    return notificationService.error(title, message);
  };

  const showWarning = (title: string, message: string) => {
    return notificationService.warning(title, message);
  };

  const showInfo = (title: string, message: string) => {
    return notificationService.info(title, message);
  };

  const showApiError = (error: any, title: string = 'Ошибка') => {
    return notificationService.showApiError(error, title);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showApiError,
  };
};
