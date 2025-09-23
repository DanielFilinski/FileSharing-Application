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

  // Handle API errors
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

    // Log error
    console.error('API Error:', error);

    // Check error type
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

    // General error handling
    if (showNotification) {
      notificationService.showApiError(error);
    }
  }

  // Handle authentication errors
  private async handleAuthError(_: any): Promise<void> {
    console.warn('Authentication error detected, attempting to refresh token...');
    
    try {
      // Try to refresh token
      const newToken = await authService.refreshToken();
      if (newToken) {
        notificationService.info(
          'Session Updated',
          'Your session has been automatically refreshed'
        );
        return;
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
    }

    // If refresh failed, try interactive login
    try {
      await authService.login();
      notificationService.info('Logged In', 'Session restored after 401/403');
      return;
    } catch (loginError) {
      console.error('Interactive login failed:', loginError);
    }

    // If login also failed - logout and notify
    notificationService.error('Authorization Error', 'Please log in again');
    try {
      await authService.logout();
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    }
  }

  // Handle network errors
  private async handleNetworkError(
    _error: any,
    options: { retry: boolean; maxRetries: number; retryDelay: number }
  ): Promise<void> {
    if (options.retry && this.retryCount < options.maxRetries) {
      this.retryCount++;
      console.log(`Retrying request (${this.retryCount}/${options.maxRetries})...`);
      
      notificationService.info(
        'Retry Attempt',
        `Retrying connection (${this.retryCount}/${options.maxRetries})`
      );

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, options.retryDelay));
      return;
    }

    this.retryCount = 0;
    notificationService.error(
      'Network Error',
      'Check your internet connection and try again'
    );
  }

  // Handle server errors
  private async handleServerError(_error: any): Promise<void> {
    notificationService.error(
      'Server Error',
      'Server is temporarily unavailable. Please try again later.'
    );
  }

  // Determine error type
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

  // Global unhandled error handler
  setupGlobalErrorHandling(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
      notificationService.error(
        'Application Error',
        'An unexpected error occurred. Please refresh the page.'
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      notificationService.error(
        'Application Error',
        'An error occurred while performing the operation.'
      );
      event.preventDefault(); // Prevent browser console output
    });
  }

  // Reset retry counter
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  // Set retry configuration
  setRetryConfig(maxRetries: number, retryDelay: number): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
}

// Export global instance
export const errorHandler = ErrorHandler.getInstance();
