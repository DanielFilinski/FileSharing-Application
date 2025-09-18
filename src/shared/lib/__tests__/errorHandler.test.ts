// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../errorHandler';
import { notificationService } from '../notifications';
import { authService } from '../auth';

vi.mock('../notifications', () => {
  return {
    notificationService: {
      info: vi.fn(),
      error: vi.fn(),
      showApiError: vi.fn(),
    },
  };
});

vi.mock('../auth', () => {
  return {
    authService: {
      refreshToken: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    },
  };
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles auth error by refreshing token', async () => {
    (authService.refreshToken as any).mockResolvedValue('token');
    await errorHandler.handleApiError({ status: 401 });
    expect(notificationService.info).toHaveBeenCalled();
  });

  it('calls login if refresh fails', async () => {
    (authService.refreshToken as any).mockResolvedValue(null);
    (authService.login as any).mockResolvedValue(undefined);
    await errorHandler.handleApiError({ status: 403 });
    expect(authService.login).toHaveBeenCalled();
  });

  it('retries network errors with info notification', async () => {
    await errorHandler.handleApiError(new TypeError('network'), { retry: true, maxRetries: 1, retryDelay: 1 });
    expect(notificationService.info).toHaveBeenCalled();
  });

  it('shows server error notification', async () => {
    await errorHandler.handleApiError({ status: 500 });
    expect(notificationService.error).toHaveBeenCalled();
  });
});


