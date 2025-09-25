# 📋 Список компонентов для реализации системы ролей

## 🆕 Новые компоненты

### 🔐 RBAC Core System
- `src/shared/lib/rbac/types.ts` - типы ролей и разрешений
- `src/shared/lib/rbac/permissions.ts` - определения разрешений
- `src/shared/lib/rbac/roles.ts` - определения ролей
- `src/shared/lib/rbac/context.tsx` - React контекст для RBAC
- `src/shared/lib/rbac/hooks.ts` - хуки для работы с ролями
- `src/shared/lib/rbac/guards.tsx` - компоненты защиты
- `src/shared/lib/rbac/utils.ts` - утилиты RBAC

### 👥 Role Management Feature
- `src/features/roleManagement/index.ts`
- `src/features/roleManagement/model/useRoleManagement.ts`
- `src/features/roleManagement/model/types.ts`
- `src/features/roleManagement/ui/RoleSelector.tsx`
- `src/features/roleManagement/ui/PermissionsList.tsx`
- `src/features/roleManagement/ui/RoleAssignmentDialog.tsx`

### 🛡️ Backend Security
- `api/src/middleware/rbac.ts` - middleware для проверки разрешений
- `api/src/functions/roleManagement.ts` - API для управления ролями
- `api/src/shared/rbac/` - backend RBAC утилиты

## 🔄 Компоненты для модификации

### 📊 User Management
- `src/entities/user/model/types.ts` - добавить роли к пользователю
- `src/entities/user/model/useUsers.ts` - интеграция с ролями
- `src/entities/user/ui/UserTable.tsx` - отображение ролей
- `src/entities/user/ui/UserCard.tsx` - показать роль пользователя

### 🎛️ User Management Widget
- `src/widgets/userManagement/ui/UserManagementWidget.tsx` - вкладка ролей
- `src/features/userManagement/ui/AddEmployeeDialog.tsx` - выбор роли
- `src/features/userManagement/ui/AddClientDialog.tsx` - роль клиента
- `src/features/userManagement/model/useUserManagement.ts` - роли

### 🔐 Authentication & Authorization
- `src/shared/lib/auth.ts` - интеграция с RBAC контекстом
- `src/shared/lib/AppProvider.tsx` - провайдер ролей
- `src/components/LoginScreen.tsx` - установка роли при входе

### 🧭 Navigation & Routing  
- `src/app/navigation/Navigation.tsx` - фильтрация по ролям
- `src/app/navigation/router.tsx` - защищенные маршруты
- `src/app/pages/` - проверки доступа к страницам

### ⚙️ Settings Pages
- `src/pages/settings/organization/` - доступ по ролям
- `src/pages/settings/storage/` - проверка разрешений
- `src/pages/settings/approval/` - права на настройку
- `src/pages/settings/validation/` - ограничения по ролям
- `src/pages/settings/users/` - управление ролями пользователей

### 📄 Document Management
- `src/pages/documents/` - доступ к документам по ролям
- `src/pages/documents/components/Toolbar.tsx` - действия по ролям
- `src/entities/document/` - права на документы

### 🔙 API Functions
- `api/src/functions/getUserProfile.ts` - возврат ролей
- `api/src/functions/documents.ts` - проверка прав на документы
- `api/src/functions/createNewDocument.ts` - права создания
- `api/src/functions/uploadFile.ts` - права загрузки
- `api/src/functions/usersSync.ts` - синхронизация ролей

## 🎯 Приоритет реализации

### 🔴 Высокий приоритет (Core)
1. `src/shared/lib/rbac/` - базовая RBAC система
2. `src/entities/user/model/types.ts` - типы с ролями  
3. `src/shared/lib/auth.ts` - интеграция аутентификации
4. `api/src/middleware/rbac.ts` - защита API

### 🟡 Средний приоритет (Features)
5. `src/features/roleManagement/` - управление ролями
6. `src/widgets/userManagement/` - UI для ролей
7. `src/app/navigation/` - навигация по ролям
8. API functions - проверки разрешений

### 🟢 Низкий приоритет (Polish)
9. Settings pages - проверки доступа
10. Document management - ролевые права
11. Расширенная аналитика и отчеты

## 📈 Этапы реализации

### Этап 1: Основа (Core Foundation)
- Создать RBAC систему и типы
- Интегрировать с аутентификацией
- Добавить роли в типы пользователей

### Этап 2: Backend Security  
- Создать middleware для API
- Обновить функции с проверками
- Настроить роли в БД

### Этап 3: Frontend Integration
- Обновить UI управления пользователями
- Добавить компоненты управления ролями
- Интегрировать в навигацию

### Этап 4: Advanced Features
- Детальные настройки разрешений
- Аналитика использования ролей
- Документация и тесты
