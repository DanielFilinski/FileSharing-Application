# OneDrive Upload Integration

## Обзор

Реализована интеграция с Microsoft OneDrive для загрузки файлов в личное хранилище пользователя без использования пространства SharePoint или облака проекта. Все файлы сохраняются в OneDrive пользователя, а в базе данных проекта хранятся только метаданные и ссылки.

## Функциональность

### 1. Загрузка с устройства
- Пользователь выбирает файлы с локального устройства
- Файлы загружаются напрямую в OneDrive пользователя
- Поддерживается загрузка больших файлов через upload sessions
- Файлы организуются в папки по типу документа

### 2. Загрузка из облака
- Интеграция с Teams file picker для выбора файлов из облачных хранилищ
- Файлы скачиваются из облака и загружаются в OneDrive пользователя
- Сохраняется информация об оригинальном источнике

### 3. Загрузка с портала Teams
- Выбор файлов из Teams/SharePoint портала
- Копирование файлов в личный OneDrive пользователя
- Сохранение ссылки на оригинальный файл

## Архитектура

### Backend Components

#### 1. `uploadToOneDrive.ts`
- Основная функция для загрузки файлов в OneDrive
- Поддерживает три типа загрузки: device, cloud, portal
- Использует Microsoft Graph API для работы с OneDrive
- Реализует chunked upload для больших файлов

#### 2. `saveOneDriveDocument.ts`
- Сохраняет метаданные загруженных файлов в Cosmos DB
- Совместим с существующей схемой документов
- Хранит ссылки на файлы в OneDrive вместо blob storage

### Frontend Components

#### 1. `oneDriveService.ts`
- Клиентский сервис для работы с OneDrive API
- Интеграция с Teams SDK для аутентификации
- Методы для всех типов загрузки

#### 2. `Toolbar.tsx` (обновлен)
- Добавлены обработчики для новых сценариев загрузки
- Интеграция с OneDrive сервисом
- Автоматическое сохранение метаданных после загрузки

#### 3. `CloudUploadDialog.tsx` и `PortalUploadDialog.tsx`
- Диалоги для настройки метаданных при загрузке из облака/портала
- Повторное использование компонентов из UploadForm

## Структура данных

### OneDrive файлы
Файлы сохраняются в OneDrive пользователя в следующей структуре:
```
/FileSharing-App/
  ├── Tax/
  ├── Audit/
  ├── Consulting/
  ├── Legal/
  ├── Financial/
  ├── Compliance/
  └── General/
```

### Метаданные в базе данных
```json
{
  "id": "onedrive-file-id",
  "partitionKey": "user-tenant-id",
  "name": "document.pdf",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "blobUrl": "https://onedrive-web-url",
  "oneDriveId": "onedrive-file-id",
  "oneDriveWebUrl": "https://onedrive-web-url",
  "oneDriveDownloadUrl": "https://onedrive-download-url",
  "uploadSource": "device|cloud|portal",
  "status": "draft",
  "metadata": {
    "createdBy": "User Name",
    "createdAt": "2024-01-01T00:00:00Z",
    "documentType": "tax",
    "documentSubtype": "income_tax",
    "period": "quarter",
    "description": "Q1 2024 tax documents",
    "originalUrl": "https://original-cloud-url", // для cloud uploads
    "originalFileId": "portal-file-id" // для portal uploads
  }
}
```

## Настройка

### Требуемые разрешения Microsoft Graph
- `Files.ReadWrite` - для записи в OneDrive пользователя
- `Files.Read` - для чтения файлов (если нужно)

### Переменные окружения
Используются существующие переменные для Teams/Graph интеграции:
- `M365_CLIENT_ID`
- `M365_CLIENT_SECRET`
- `M365_TENANT_ID`
- `M365_AUTHORITY_HOST`

## Использование

### Для разработчиков

1. **Загрузка с устройства:**
```typescript
const uploadResults = await oneDriveService.uploadFromDevice(files, metadata);
```

2. **Загрузка из облака:**
```typescript
const selectedFiles = await oneDriveService.selectFilesFromCloud();
const uploadResult = await oneDriveService.uploadFromCloud(fileUrl, fileName, metadata);
```

3. **Загрузка с портала:**
```typescript
const selectedFiles = await oneDriveService.selectFilesFromPortal();
const uploadResult = await oneDriveService.uploadFromPortal(fileId, fileName, metadata);
```

### Для пользователей

1. Нажмите кнопку "Upload" в toolbar
2. Выберите источник: "From Device", "From Cloud", или "From Portal"
3. Для устройства: выберите файлы и заполните метаданные
4. Для облака/портала: сначала выберите файлы, затем заполните метаданные
5. Файлы будут загружены в ваш OneDrive и появятся в списке документов

## Преимущества

1. **Экономия места**: файлы не занимают место в хранилище проекта
2. **Безопасность**: файлы остаются в личном OneDrive пользователя
3. **Доступность**: пользователи могут получить доступ к файлам через OneDrive
4. **Масштабируемость**: нет ограничений на размер хранилища проекта
5. **Соответствие требованиям**: данные остаются в контроле пользователя

## Ограничения

1. Требуется активная подписка Microsoft 365
2. Пользователи должны иметь достаточно места в OneDrive
3. Файлы доступны только при наличии доступа к OneDrive пользователя
4. Teams file picker API может иметь ограничения в зависимости от версии SDK

## Будущие улучшения

1. Реализация настоящего Teams file picker (когда API станет доступен)
2. Синхронизация изменений файлов в OneDrive
3. Групповые разрешения для совместного доступа
4. Интеграция с другими облачными хранилищами
5. Предварительный просмотр файлов из OneDrive
