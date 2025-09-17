## Этап 8 — Операции с файлами

Статус: 0% выполнено

### Компоненты и страницы:
- **API операций:** `/src/entities/document/api/fileOperationsApi.ts`
- **Хук операций:** `/src/entities/document/model/useFileOperations.ts`
- **Предпросмотр:** `/src/pages/documents/components/FilePreview.tsx`
- **Перемещение:** `/src/pages/documents/components/FileMoveDialog.tsx`
- **Проверка места:** `/src/pages/documents/components/StorageCheckModal.tsx`
- **Аудит:** `/src/pages/documents/components/FileAuditLog.tsx`
- **Интеграция:** обновление существующих компонентов документов

- [ ] Перемещение файлов между папками
- [ ] Предпросмотр файлов
- [ ] Проверка доступного места перед загрузкой
- [ ] Эскалация при нехватке места
- [ ] Аудит операций с файлами

### Критически важные компоненты из project.md:

#### 2. Сформированный интерфейс
- **2.1:** Загрузить файл
- **2.2:** Удалить файл  
- **2.3:** Переместить файл (из одной папки в другую)
- **2.4:** Предпросмотр файла

#### 3.2 Загрузка/выгрузка документов
- **Этап 1.1:** Начало загрузки с проверкой места
- **Этап 1.2:** Назначение хранилища (SharePoint/физическое)
- **Этап 1.3:** Организация папок (DMS/Portal)
- **Этап 1.4:** Скачать процесс с аудитом

### API для операций с файлами
```typescript
// /src/entities/document/api/fileOperationsApi.ts
export const fileOperationsApi = {
  // Перемещение файлов
  async moveFile(fileId: string, targetFolderId: string): Promise<void>,
  async copyFile(fileId: string, targetFolderId: string): Promise<Document>,
  
  // Предпросмотр
  async getFilePreview(fileId: string): Promise<PreviewData>,
  async getFileThumbnail(fileId: string): Promise<Blob>,
  
  // Проверка места
  async checkStorageSpace(fileSize: number): Promise<StorageCheckResult>,
  async escalateStorageIssue(): Promise<void>,
  
  // Аудит
  async getFileAuditLog(fileId: string): Promise<AuditEntry[]>,
  async logFileOperation(operation: FileOperation): Promise<void>
};
```

### Хуки для операций с файлами
```typescript
// /src/entities/document/model/useFileOperations.ts
export const useFileOperations = () => {
  // Перемещение файлов
  // Предпросмотр
  // Проверка места
  // Аудит операций
};
```

### Компоненты UI
```typescript
// /src/pages/documents/components/FilePreview.tsx
// /src/pages/documents/components/FileMoveDialog.tsx
// /src/pages/documents/components/StorageCheckModal.tsx
```

Источник: детали операций — `project.md` разделы 2 и 3.2.
