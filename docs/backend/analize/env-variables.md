## Переменные окружения и порядок загрузки

Обязательно задать следующие переменные для фронтенда:

- VITE_API_BASE_URL: базовый URL Azure Functions API, напр. `https://<func-app>.azurewebsites.net/api`
- VITE_CLIENT_ID: Azure AD App (Client) ID вашей Teams/SPA регистрации
- VITE_API_SCOPE: полная аудитория/Scope для получения токена, напр. `api://<appId>/.default` или `api://<appId>/access_as_user`
- VITE_START_LOGIN_PAGE_URL: публичный URL страницы старта логина (из TeamsFx), напр. `https://<host>/public/auth-start.html`
- VITE_API_ENDPOINT: ресурсный endpoint API для TeamsFx, напр. `https://<func-app>.azurewebsites.net`

Порядок загрузки:
1. Vite читает `import.meta.env.*` на этапе сборки/запуска.
2. `AppProvider` при монтировании вызывает `errorHandler.setupGlobalErrorHandling()` и `authService.initialize()`.
3. `authService.initialize()` читает `VITE_CLIENT_ID`, `VITE_START_LOGIN_PAGE_URL`, `VITE_API_ENDPOINT`, `VITE_API_SCOPE` и создает `TeamsUserCredential`.
4. Полученный токен помещается в `apiClient.setToken(...)` до первых API вызовов.
5. `apiClient` использует `VITE_API_BASE_URL` из `src/shared/api/index.ts`.

Локальная разработка:
- Создайте `.localConfigs` с парами ключ-значение (используется скриптом `env-cmd`).
- Пример `.localConfigs`:

```ini
VITE_API_BASE_URL=http://localhost:7071/api
VITE_CLIENT_ID=<guid>
VITE_API_SCOPE=api://<appId>/.default
VITE_START_LOGIN_PAGE_URL=https://localhost:5173/public/auth-start.html
VITE_API_ENDPOINT=http://localhost:7071
```

Проверка:
- На старте в консоли не должно быть ошибок инициализации TeamsFX.
- Первый запрос через `apiClient` должен идти уже с Bearer-токеном.


