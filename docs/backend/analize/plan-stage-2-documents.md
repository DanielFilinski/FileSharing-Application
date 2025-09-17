## Этап 2 — Документы

Статус: 60% выполнено

### Компоненты и страницы:
- **API документов:** `/src/entities/document/api/documentsApi.ts`
- **Хук документов:** `/src/entities/document/model/useDocuments.ts`
- **Страницы документов:** `/src/pages/documents/ui/FirmSide2Page.tsx`, `/src/pages/documents/ui/BaseDocumentsPage.tsx`
- **Компоненты:** `/src/pages/documents/components/UploadForm.tsx`, `/src/pages/documents/components/DocumentsTable.tsx`
- **Виджеты:** `/src/widgets/documentList/ui/DocumentList.tsx`
- **Функции избранного:** `/src/features/favorites/model/useFavorites.ts` (уже реализован)

- [x] API `documentsApi` (CRUD, фильтры, поиск)
- [x] Загрузка/скачивание файлов с прогрессом (скачивание TBD на backend)
- [x] Хук `useDocuments` с состоянием и оптимистичными обновлениями
- [x] Интеграция в `FirmSide2Page` и `BaseDocumentsPage`
- [x] Drag&Drop загрузка и прогресс-бар
- [x] **Lock/Unlock документов** (блокировка для редактирования)
- [x] **Move to Client Side/Firm Side** (перемещение между сторонами)
- [ ] **Избранное (Favorites)** - интеграция с SharePoint/Azure DB (локально есть, сервер TBD)
- [x] **Массовые операции** (bulk delete, share, move) (share TBD)
- [x] **Расширенные фильтры** (по статусу, типу, дате, клиенту) — параметры в API
- [ ] **Управление статусами** (Active, pending validation, validation in process, pending review, Locked, Access Closed)
- [ ] **Контроль доступа** (shared, owner, permissions) — минимальная логика (в процессе)
- [x] **Контекстное меню** (правый клик на документе)
- [x] **Поиск документов** (глобальный и локальный) — базово через Toolbar/фильтры
- [x] **Предпросмотр файлов** (в модальном окне/новой вкладке если blobUrl)
- [ ] **История изменений** (кто и когда изменял) — локальная запись (в процессе)
- [x] **Уведомления** (при изменениях статуса, блокировке)

### 2.2 Документы API
```typescript
// /src/entities/document/api/documentsApi.ts
export interface Document {
  id: string;
  name: string;
  modified: string;
  createdBy: string;
  modifiedBy: string;
  owner: 'me' | 'other';
  shared: boolean;
  status: 'Active' | 'pending validation' | 'validation in process' | 'pending review' | 'Locked' | 'Access Closed';
  lock: boolean;
  clientEmail?: string;
  documentType?: string;
  documentSubtype?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  fileSize?: number;
  fileType?: string;
  path?: string;
}

export interface DocumentFilters {
  status?: string;
  documentType?: string;
  clientEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  owner?: 'me' | 'other' | 'all';
  shared?: boolean;
  favorites?: boolean;
}

export const documentsApi = {
  // Основные CRUD операции
  async getDocuments(filters?: DocumentFilters): Promise<Document[]> { /* ... */ },
  async getDocument(id: string): Promise<Document> { /* ... */ },
  async createDocument(data: CreateDocumentRequest): Promise<Document> { /* ... */ },
  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> { /* ... */ },
  async deleteDocument(id: string): Promise<void> { /* ... */ },
  
  // Файловые операции
  async uploadFile(file: File, metadata?: DocumentMetadata): Promise<Document> { /* ... */ },
  async downloadFile(id: string): Promise<Blob> { /* ... */ },
  async previewFile(id: string): Promise<string> { /* ... */ },
  
  // Блокировка и доступ
  async lockDocument(id: string): Promise<Document> { /* ... */ },
  async unlockDocument(id: string): Promise<Document> { /* ... */ },
  async moveToClientSide(id: string): Promise<Document> { /* ... */ },
  async moveToFirmSide(id: string): Promise<Document> { /* ... */ },
  
  // Массовые операции
  async bulkDelete(ids: string[]): Promise<void> { /* ... */ },
  async bulkShare(ids: string[], users: string[]): Promise<void> { /* ... */ },
  async bulkMove(ids: string[], targetSide: 'client' | 'firm'): Promise<void> { /* ... */ },
  
  // Статусы и утверждение
  async approveDocument(id: string, comment?: string): Promise<Document> { /* ... */ },
  async rejectDocument(id: string, comment: string): Promise<Document> { /* ... */ },
  async signDocument(id: string, signatureData: any): Promise<Document> { /* ... */ },
  
  // История и чат
  async getDocumentHistory(id: string): Promise<any[]> { /* ... */ },
  async getDocumentChat(id: string): Promise<any[]> { /* ... */ },
  async sendChatMessage(id: string, message: string): Promise<any> { /* ... */ }
};
```

### 2.3 Хук для документов 
```typescript
// /src/entities/document/model/useDocuments.ts
export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});
  
  // Основные операции
  const fetchDocuments = useCallback(async (newFilters?: DocumentFilters) => { /* ... */ }, []);
  const createDocument = useCallback(async (data: CreateDocumentRequest) => { /* ... */ }, []);
  const updateDocument = useCallback(async (id: string, updates: UpdateDocumentRequest) => { /* ... */ }, []);
  const deleteDocument = useCallback(async (id: string) => { /* ... */ }, []);
  
  // Блокировка и перемещение
  const lockDocument = useCallback(async (id: string) => { /* ... */ }, []);
  const unlockDocument = useCallback(async (id: string) => { /* ... */ }, []);
  const moveToClientSide = useCallback(async (id: string) => { /* ... */ }, []);
  const moveToFirmSide = useCallback(async (id: string) => { /* ... */ }, []);
  
  // Массовые операции
  const bulkDelete = useCallback(async (ids: string[]) => { /* ... */ }, []);
  const bulkShare = useCallback(async (ids: string[], users: string[]) => { /* ... */ }, []);
  const bulkMove = useCallback(async (ids: string[], targetSide: 'client' | 'firm') => { /* ... */ }, []);
  
  // Статусы
  const approveDocument = useCallback(async (id: string, comment?: string) => { /* ... */ }, []);
  const rejectDocument = useCallback(async (id: string, comment: string) => { /* ... */ }, []);
  const signDocument = useCallback(async (id: string, signatureData: any) => { /* ... */ }, []);
  
  return {
    documents, loading, error, filters,
    fetchDocuments, createDocument, updateDocument, deleteDocument,
    lockDocument, unlockDocument, moveToClientSide, moveToFirmSide,
    bulkDelete, bulkShare, bulkMove,
    approveDocument, rejectDocument, signDocument
  };
};
```

### 2.4 Интеграция страницы документов
```typescript
// /src/pages/documents/ui/FirmSide2Page.tsx
// подключение useDocuments, замена моков, обработка загрузки/ошибок
// интеграция с useFavorites, обработка контекстного меню
```

### 2.5 Реализация избранного (Favorites)

#### 2.5.1 SharePoint/Azure Database схема
```sql
-- Таблица избранных документов пользователей
CREATE TABLE UserFavorites (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  UserId NVARCHAR(255) NOT NULL, -- Teams User ID
  DocumentId NVARCHAR(255) NOT NULL, -- SharePoint Document ID
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  INDEX IX_UserFavorites_UserId (UserId),
  INDEX IX_UserFavorites_DocumentId (DocumentId),
  UNIQUE (UserId, DocumentId) -- Предотвращает дублирование
);
```

#### 2.5.2 API для избранного
```typescript
// /src/entities/document/api/favoritesApi.ts
export const favoritesApi = {
  async getUserFavorites(userId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/favorites/${userId}`);
  },
  
  async addToFavorites(userId: string, documentId: string): Promise<void> {
    return apiClient.post<void>('/favorites', { userId, documentId });
  },
  
  async removeFromFavorites(userId: string, documentId: string): Promise<void> {
    return apiClient.delete<void>(`/favorites/${userId}/${documentId}`);
  },
  
  async getFavoritesCount(userId: string): Promise<number> {
    return apiClient.get<number>(`/favorites/${userId}/count`);
  }
};
```

#### 2.5.3 Обновление useFavorites
```typescript
// /src/features/favorites/model/useFavorites.ts
import { favoritesApi } from '@/entities/document/api/favoritesApi';
import { authService } from '@/shared/lib/auth';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // Загрузка избранного с сервера
  const loadFavorites = useCallback(async () => {
    try {
      const user = await authService.getUserInfo();
      if (user) {
        const favoritesList = await favoritesApi.getUserFavorites(user.id);
        setFavorites(new Set(favoritesList));
      }
    } catch (error) {
      // Fallback на localStorage
      const savedFavorites = localStorage.getItem('documentFavorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    }
  }, []);
  
  // Добавление/удаление из избранного
  const toggleFavorite = useCallback(async (documentId: string) => {
    try {
      const user = await authService.getUserInfo();
      if (!user) return;
      
      const newFavorites = new Set(favorites);
      if (newFavorites.has(documentId)) {
        newFavorites.delete(documentId);
        await favoritesApi.removeFromFavorites(user.id, documentId);
      } else {
        newFavorites.add(documentId);
        await favoritesApi.addToFavorites(user.id, documentId);
      }
      
      setFavorites(newFavorites);
      // Синхронизация с localStorage как backup
      localStorage.setItem('documentFavorites', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Показываем уведомление об ошибке
    }
  }, [favorites]);
  
  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite: (id: string) => favorites.has(id),
    getFavorites: () => Array.from(favorites),
    loadFavorites
  };
};
```

### 2.6 Azure Functions endpoints для документов

#### 2.6.1 Основные endpoints
- `GET /api/documents` - список документов с фильтрами
- `GET /api/documents/{id}` - документ по ID
- `POST /api/documents` - создание документа
- `PUT /api/documents/{id}` - обновление документа
- `DELETE /api/documents/{id}` - удаление документа

#### 2.6.2 Файловые операции
- `POST /api/documents/upload` - загрузка файла
- `GET /api/documents/{id}/download` - скачивание файла
- `GET /api/documents/{id}/preview` - предпросмотр файла

#### 2.6.3 Блокировка и перемещение
- `POST /api/documents/{id}/lock` - блокировка документа
- `POST /api/documents/{id}/unlock` - разблокировка документа
- `POST /api/documents/{id}/move-to-client` - перемещение на клиентскую сторону
- `POST /api/documents/{id}/move-to-firm` - перемещение на фирменную сторону

#### 2.6.4 Массовые операции
- `POST /api/documents/bulk-delete` - массовое удаление
- `POST /api/documents/bulk-share` - массовое предоставление доступа
- `POST /api/documents/bulk-move` - массовое перемещение

#### 2.6.5 Избранное
- `GET /api/favorites/{userId}` - избранные документы пользователя
- `POST /api/favorites` - добавление в избранное
- `DELETE /api/favorites/{userId}/{documentId}` - удаление из избранного

#### 2.6.6 Статусы и утверждение
- `POST /api/documents/{id}/approve` - утверждение документа
- `POST /api/documents/{id}/reject` - отклонение документа
- `POST /api/documents/{id}/sign` - подписание документа

#### 2.6.7 История и чат
- `GET /api/documents/{id}/history` - история изменений
- `GET /api/documents/{id}/chat` - чат документа
- `POST /api/documents/{id}/chat` - отправка сообщения в чат

### 2.7 SharePoint интеграция

#### 2.7.1 Хранение документов
- Документы физически хранятся в SharePoint Document Library
- Метаданные (статус, блокировка, владелец) - в Azure SQL Database
- Связь через SharePoint Document ID

#### 2.7.2 Права доступа
- SharePoint permissions для физического доступа к файлам
- Azure Database для бизнес-логики (статусы, избранное, история)
- Синхронизация через Microsoft Graph API

#### 2.7.3 Избранное
- Статус "в избранном" хранится в Azure Database
- Фильтрация документов по избранному через JOIN с таблицей UserFavorites
- Кэширование в localStorage для offline работы

Источник: детали и примеры — `api-integration-plan.md`.


