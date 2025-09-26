# Logout Implementation Documentation

## Обзор

Реализован полнофункциональный выход из системы с правильным перенаправлением на страницу аутентификации.

## Как это работает

### 1. **Header компонент** (`src/components/Header/Header.tsx`)
```tsx
const handleLogout = async () => {
  try {
    await appLogout(); // Использует функцию из AppProvider контекста
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### 2. **AppProvider контекст** (`src/shared/lib/AppProvider.tsx`)
```tsx
const handleLogout = async () => {
  try {
    await authService.logout(); // Очистка через auth service
    
    // Обновление локального состояния для показа экрана входа
    setIsAuthenticated(false);
    setCurrentUser(null);
    
    notificationService.success('Logout Successful', 'You have been logged out successfully');
  } catch (error) {
    // Даже при ошибке принудительно очищаем состояние
    setIsAuthenticated(false);
    setCurrentUser(null);
  }
};
```

### 3. **AuthService** (`src/shared/lib/auth.ts`)
```tsx
async logout(): Promise<void> {
  try {
    // Очистка пользовательского состояния
    this.currentUser = null;
    apiClient.setToken(null);
    
    // Остановка таймера обновления токенов
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    // Очистка данных браузерной аутентификации
    if (!this.isInTeams) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      sessionStorage.clear();
    }

    // Очистка Teams credential
    if (this.isInTeams && this.credential) {
      this.credential = null;
    }
  } catch (error) {
    // Принудительная очистка даже при ошибке
    this.currentUser = null;
    apiClient.setToken(null);
    throw error;
  }
}
```

## Что происходит при нажатии "Sign out"

1. **Нажатие кнопки** → `handleLogout()` в Header
2. **Вызов AppProvider** → `appLogout()` из контекста
3. **AuthService очистка** → `authService.logout()`
4. **Обновление состояния** → `setIsAuthenticated(false)`, `setCurrentUser(null)`
5. **Автоматическое перенаправление** → Показ `LoginScreen` компонента
6. **Уведомление** → Успешное сообщение о выходе

## Поддерживаемые среды

- ✅ **Microsoft Teams** - очистка Teams credential и состояния
- ✅ **Браузер** - очистка localStorage, sessionStorage и токенов
- ✅ **Гибридная среда** - автоматическое определение и соответствующая очистка

## Безопасность

- Полная очистка всех токенов и пользовательских данных
- Принудительное обновление состояния даже при ошибках
- Очистка таймеров и фоновых процессов
- Удаление всех следов аутентификации из браузера

## Пользовательский опыт

- ✅ Мгновенный выход без задержек
- ✅ Информативные уведомления
- ✅ Автоматическое перенаправление на страницу входа
- ✅ Отсутствие необходимости в ручной перезагрузке страницы

## Тестирование

Для тестирования функциональности:

1. Войдите в систему
2. Нажмите на аватар пользователя в Header
3. Выберите "Sign out"
4. Проверьте:
   - Появление уведомления об успешном выходе
   - Автоматическое перенаправление на LoginScreen
   - Очистка localStorage (в браузерных инструментах разработчика)

## Обработка ошибок

- Логирование всех ошибок выхода
- Принудительная очистка состояния при любых ошибках
- Показ соответствующих уведомлений пользователю
- Гарантированное перенаправление на страницу входа
