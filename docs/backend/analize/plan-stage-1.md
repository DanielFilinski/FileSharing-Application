## Этап 1 — Базовая инфраструктура API

Статус: 100% выполнено

### Компоненты и страницы:
- **API клиент:** `/src/shared/api/client.ts`, `/src/shared/api/index.ts`
- **Аутентификация:** `/src/shared/lib/auth.ts`, `/src/shared/lib/teams/index.tsx`
- **Уведомления:** `/src/shared/lib/notifications.ts`, `/src/shared/lib/useNotifications.ts`
- **Обработка ошибок:** глобальные обработчики, retry логика
- **Все страницы:** интеграция с API клиентом и аутентификацией

- [✔] Создать базовый класс `ApiClient` с методами GET/POST/PUT/DELETE
- [✔] Реализовать обработку ошибок и статусов HTTP, retry
- [✔] Добавить загрузку файлов с прогрессом
- [✔] Настроить аутентификацию (Teams/SSO) и обновление токена
- [✔] Система уведомлений (`NotificationService` + `useNotifications`)
- [✔] Инициализировать аутентификацию при старте приложения (`authService.initialize()` + login флоу) в корневом провайдере, чтобы `apiClient.setToken(...)` срабатывал до первых запросов
- [✔] Подключить глобальные обработчики ошибок (`errorHandler.setupGlobalErrorHandling()`) один раз при старте
- [✔] Смонтировать контейнер уведомлений в корневом layout (`NotificationContainer`) и проверить подписку
- [✔] Перевести моковые хуки на `apiClient` (минимум: `src/entities/user/model/useUsers.ts`, `src/entities/storage/model/useStorageSettings.ts`)
- [✔] Настроить поведение при 401/403: вызывать `authService.login()`/редирект, согласовать с роутингом
- [✔] Добавить базовые unit-тесты для `ApiClient` и `errorHandler`
- [✔] Документировать переменные окружения (`VITE_API_BASE_URL`, `VITE_CLIENT_ID`, `VITE_API_SCOPE`, `VITE_START_LOGIN_PAGE_URL`, `VITE_API_ENDPOINT`) и порядок загрузки

### 2.1 Этап 1: Создание API клиента

#### 2.1.1 Создать базовый API клиент
```typescript
// /src/shared/api/client.ts
export class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> { return this.request<T>(endpoint, { method: 'GET' }); }
  async post<T>(endpoint: string, data: any): Promise<T> { return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  async put<T>(endpoint: string, data: any): Promise<T> { return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  async delete<T>(endpoint: string): Promise<T> { return this.request<T>(endpoint, { method: 'DELETE' }); }

  async uploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) onProgress((event.loaded / event.total) * 100);
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText)); else reject(new Error(`Upload failed: ${xhr.status}`));
      });
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.send(formData);
    });
  }
}
```

#### 2.1.2 Создать экземпляр API клиента
```typescript
// /src/shared/api/index.ts
import { ApiClient } from './client';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-function-app.azurewebsites.net/api';
export const apiClient = new ApiClient(API_BASE_URL);
```

### 2.6 Аутентификация и авторизация

#### 2.6.1 Интеграция с Microsoft Teams
```typescript
// /src/shared/lib/auth.ts
import { TeamsUserCredential } from '@microsoft/teamsfx';

export class AuthService {
  private credential: TeamsUserCredential | null = null;
  async initialize() {
    this.credential = new TeamsUserCredential({
      clientId: process.env.REACT_APP_CLIENT_ID!,
      initiateLoginEndpoint: process.env.REACT_APP_START_LOGIN_PAGE_URL!,
      apiEndpoint: process.env.REACT_APP_API_ENDPOINT!,
    });
  }
  async getToken(): Promise<string | null> {
    if (!this.credential) await this.initialize();
    const token = await this.credential?.getToken([process.env.REACT_APP_API_SCOPE!]);
    return token?.token || null;
  }
}
export const authService = new AuthService();
```

#### 2.6.2 Обновление API клиента для работы с токенами
```typescript
// /src/shared/api/client.ts (фрагмент)
import { authService } from '@/shared/lib/auth';

private async getAuthHeaders(): Promise<HeadersInit> {
  const token = await authService.getToken();
  return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) };
}
```

### 2.5 Система уведомлений
```typescript
// /src/shared/lib/notifications.ts
export interface Notification { id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; duration?: number; }
class NotificationService { /* ...см. общий план... */ }
export const notificationService = new NotificationService();
```

Источник: подробности и контекст см. в `api-integration-plan.md`.


