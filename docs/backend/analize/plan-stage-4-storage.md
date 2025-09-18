## Этап 4 — Настройки хранилища

Статус: 20% выполнено

### Компоненты и страницы:
- **API хранилища:** `/src/entities/storage/api/storageApi.ts`
- **Хук настроек:** `/src/entities/storage/model/useStorageSettings.ts` (существует с локальной логикой)
- **Страница настроек:** `/src/pages/settings/storage/storage-settings.tsx`
- **Компоненты:** `/src/pages/settings/storage/components/SharePointCredentials.tsx`, `/src/pages/settings/storage/components/StorageAllocation.tsx`
- **Шаблоны:** `/src/pages/settings/storage/components/TemplateManagerModal.tsx`, `/src/pages/settings/storage/components/FolderStructure.tsx`

- [ ] API `storageApi` (settings/update/verify/info/templates)
- [x] Хук `useStorageSettings` (пока локальная логика)
- [ ] Подключение API в `useStorageSettings`
- [ ] Интеграция UI `storage-settings.tsx` с API

Текущее состояние: `useStorageSettings` реализован с локальными сторами/превью/верификацией-заглушкой.

### 2.2 Хранилище API
```typescript
// /src/entities/storage/api/storageApi.ts
// см. общий план: методы get/update/verify/info/templates
```

### 2.3 Хук для хранилища
```typescript
// /src/entities/storage/model/useStorageSettings.ts
// текущее: локальная реализация; целевое: перевести на storageApi с состояниями загрузки/ошибок
```

Источник: детали — `api-integration-plan.md`.


