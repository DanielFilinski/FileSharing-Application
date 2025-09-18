## Этап 3 — Управление пользователями

Статус: 20% выполнено

### Компоненты и страницы:
- **API пользователей:** `/src/entities/user/api/usersApi.ts`
- **Хук пользователей:** `/src/entities/user/model/useUsers.ts` (существует с моками)
- **Виджеты:** `/src/widgets/userManagement/ui/UserManagementWidget.tsx`
- **Диалоги:** `/src/features/userManagement/ui/AddEmployeeDialog.tsx`, `/src/features/userManagement/ui/AddClientDialog.tsx`
- **Импорт:** `/src/features/userManagement/ui/ImportDialog.tsx`, `/src/features/userManagement/ui/DepartmentDialog.tsx`
- **UI компоненты:** `/src/entities/user/ui/UserTable.tsx`, `/src/entities/user/ui/UserCard.tsx`

- [ ] API `usersApi` (сотрудники/клиенты/отделы/импорт)
- [ ] Хук `useUsers` с API
- [x] Моки и локальные CRUD в `useUsers`
- [ ] Интеграция диалогов (`AddEmployeeDialog`, `AddClientDialog`, `ImportDialog`, `DepartmentDialog`) с API

Текущее состояние: найден `useUsers` с мок-данными и локальными операциями — API ещё не подключён.

### 2.2 Пользователи API
```typescript
// /src/entities/user/api/usersApi.ts
// см. общий план: методы для employees/clients/departments/import
```

### 2.3 Хук для пользователей
```typescript
// /src/entities/user/model/useUsers.ts
// текущее: локальные массивы и CRUD; целевое: вызовы usersApi + состояния загрузки/ошибок
```

Источник: детали — `api-integration-plan.md`.


