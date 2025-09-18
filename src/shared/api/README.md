# API Integration

## Обзор

Реализована базовая инфраструктура API для интеграции с Azure Functions и Microsoft Teams.

## Компоненты

### 1. ApiClient (`client.ts`)
Базовый класс для HTTP запросов с поддержкой:
- GET, POST, PUT, DELETE методов
- Автоматической обработки ошибок
- Retry логики
- Загрузки файлов с прогрессом
- Авторизации через токены

### 2. Аутентификация (`auth.ts`)
Сервис для работы с Microsoft Teams аутентификацией:
- Инициализация TeamsUserCredential
- Получение и обновление токенов
- Автоматическое обновление токенов
- Управление сессией пользователя

### 3. Уведомления (`notifications.ts`)
Система уведомлений для пользователя:
- Различные типы уведомлений (success, error, warning, info)
- Автоматическое исчезновение
- Подписка на изменения
- Интеграция с API ошибками

### 4. Обработка ошибок (`errorHandler.ts`)
Глобальный обработчик ошибок:
- Классификация ошибок (auth, network, server)
- Автоматическое обновление токенов
- Retry логика для сетевых ошибок
- Глобальные обработчики необработанных ошибок

## Использование

### Базовое использование API клиента

```typescript
import { apiClient } from '@/shared/api';

// GET запрос
const response = await apiClient.get('/endpoint');

// POST запрос
const response = await apiClient.post('/endpoint', { data: 'value' });

// Загрузка файла
const response = await apiClient.uploadFile('/upload', file, (progress) => {
  console.log(`Progress: ${progress}%`);
});
```

### Использование аутентификации

```typescript
import { authService } from '@/shared/lib/auth';

// Инициализация
await authService.initialize();

// Получение информации о пользователе
const user = await authService.getUserInfo();

// Выход
await authService.logout();
```

### Использование уведомлений

```typescript
import { useNotifications } from '@/shared/lib/useNotifications';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  const handleAction = async () => {
    try {
      await someApiCall();
      showSuccess('Успех', 'Операция выполнена успешно');
    } catch (error) {
      showError('Ошибка', 'Произошла ошибка при выполнении операции');
    }
  };
};
```

### Использование AppProvider

```typescript
import { AppProvider } from '@/shared/lib/AppProvider';

const App = () => {
  return (
    <AppProvider>
      <YourApp />
    </AppProvider>
  );
};
```

## Azure Functions

### Существующие функции:
- `getUserProfile` - получение профиля пользователя
- `healthCheck` - проверка здоровья API
- `uploadFile` - загрузка файлов

### Добавление новых функций:

1. Создайте файл в `api/src/functions/`
2. Используйте шаблон:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function myFunction(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Ваша логика здесь
  return {
    status: 200,
    body: JSON.stringify({ message: "Success" }),
  };
}

app.http("myFunction", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: myFunction,
});
```

## Переменные окружения

Создайте файл `.env` с следующими переменными:

```env
VITE_API_BASE_URL=https://your-function-app.azurewebsites.net/api
VITE_CLIENT_ID=your-client-id-here
VITE_START_LOGIN_PAGE_URL=https://your-app-domain.com/auth-start.html
VITE_API_SCOPE=api://your-client-id-here/access_as_user
```

## Лучшие практики

1. **Обработка ошибок**: Всегда используйте try-catch для API вызовов
2. **Уведомления**: Используйте систему уведомлений для обратной связи с пользователем
3. **Токены**: Не храните токены в localStorage, используйте сервис аутентификации
4. **Retry**: Настройте retry логику для критичных операций
5. **Прогресс**: Используйте callback для отображения прогресса загрузки файлов

## Примеры

Смотрите `api-example.ts` для полных примеров использования всех компонентов.
