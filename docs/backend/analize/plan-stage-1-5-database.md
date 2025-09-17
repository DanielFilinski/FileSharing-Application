## Этап 1.5 — Сущности и база данных

Статус: 100% выполнено

### Компоненты и страницы:
- **Гибридная архитектура:** CosmosDB (документы/чаты) + Azure SQL (пользователи/роли)
- **API сущностей:** `/src/entities/*/api/*Api.ts` для всех сущностей
- **Хуки сущностей:** `/src/entities/*/model/use*.ts` с интеграцией API
- **Microsoft Graph API:** интеграция с Azure AD и SharePoint
- **Миграции:** скрипты создания и обновления БД

- [x] Создать схему Azure SQL Database (пользователи, роли, организации)
- [x] Настроить CosmosDB контейнеры (документы, чаты, аудит)
- [x] Настроить миграции и индексы для обеих БД
- [x] Создать API для всех сущностей (Users, Offices, Departments, Clients)
- [x] Интегрировать Microsoft Graph API
- [x] Обновить хуки сущностей для работы с API
- [x] Настроить синхронизацию Azure AD ↔ Azure SQL
- [x] Добавить валидацию и обработку ошибок
- [x] Создать тесты для API сущностей

### 1.5.1 Гибридная архитектура БД

#### 1.5.1.1 Azure SQL Database — Реляционные данные
**Назначение:** Пользователи, роли, организации, настройки
```sql
-- 1. Организации (Tenants)
CREATE TABLE Organizations (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  TenantId NVARCHAR(255) UNIQUE NOT NULL, -- Azure AD Tenant ID
  Name NVARCHAR(200) NOT NULL,
  DisplayName NVARCHAR(200),
  Domain NVARCHAR(100),
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- 2. Офисы
CREATE TABLE Offices (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Address NVARCHAR(500),
  City NVARCHAR(100),
  Country NVARCHAR(100),
  TimeZone NVARCHAR(50),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  INDEX IX_Offices_OrganizationId (OrganizationId)
);

-- 3. Отделы
CREATE TABLE Departments (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Description NVARCHAR(500),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  INDEX IX_Departments_OrganizationId (OrganizationId)
);

-- 4. Сотрудники (расширенные данные)
CREATE TABLE Employees (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  AzureAdUserId NVARCHAR(255) UNIQUE NOT NULL, -- Связь с Azure AD
  OfficeId UNIQUEIDENTIFIER NOT NULL,
  DepartmentId UNIQUEIDENTIFIER NOT NULL,
  Classification NVARCHAR(50) NOT NULL, -- 'Manager' | 'Senior' | 'Associate' | 'Junior'
  Role NVARCHAR(100) NOT NULL,
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  FOREIGN KEY (OfficeId) REFERENCES Offices(Id),
  FOREIGN KEY (DepartmentId) REFERENCES Departments(Id),
  INDEX IX_Employees_OrganizationId (OrganizationId),
  INDEX IX_Employees_OfficeId (OfficeId),
  INDEX IX_Employees_DepartmentId (DepartmentId),
  INDEX IX_Employees_AzureAdUserId (AzureAdUserId)
);

-- 5. Клиенты (внешние пользователи)
CREATE TABLE Clients (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  FirstName NVARCHAR(100) NOT NULL,
  LastName NVARCHAR(100) NOT NULL,
  Email NVARCHAR(255) NOT NULL,
  Phone NVARCHAR(50),
  FirmName NVARCHAR(200),
  FirmAddress NVARCHAR(500),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  INDEX IX_Clients_OrganizationId (OrganizationId),
  INDEX IX_Clients_Email (Email)
);

-- 6. Роли и права доступа
CREATE TABLE UserRoles (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL, -- Azure AD User ID или Client ID
  UserType NVARCHAR(20) NOT NULL, -- 'Employee' | 'Client' | 'Guest'
  Role NVARCHAR(50) NOT NULL, -- 'signer', 'validator', 'approver', 'viewer', 'admin'
  DocumentType NVARCHAR(100), -- для каких документов
  OfficeId UNIQUEIDENTIFIER, -- ограничение по офису
  DepartmentId UNIQUEIDENTIFIER, -- ограничение по отделу
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  FOREIGN KEY (OfficeId) REFERENCES Offices(Id),
  FOREIGN KEY (DepartmentId) REFERENCES Departments(Id),
  INDEX IX_UserRoles_OrganizationId (OrganizationId),
  INDEX IX_UserRoles_UserId (UserId),
  INDEX IX_UserRoles_Role (Role)
);

-- 7. Настройки организации
CREATE TABLE OrganizationSettings (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER UNIQUE NOT NULL,
  StorageType NVARCHAR(20) DEFAULT 'cloud', -- 'cloud' | 'physical'
  SharePointSiteUrl NVARCHAR(500),
  DefaultApprovalFlow NVARCHAR(20) DEFAULT 'parallel', -- 'parallel' | 'consecutive'
  RequireManualValidation BIT DEFAULT 0,
  RequireApproval BIT DEFAULT 0,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
```

#### 1.5.1.2 Дополнительные таблицы
```sql
-- 8. Аудит изменений
CREATE TABLE AuditLog (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  Action NVARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
  EntityType NVARCHAR(50) NOT NULL, -- 'document', 'user', 'office', 'department'
  EntityId NVARCHAR(255),
  OldValues NVARCHAR(MAX), -- JSON
  NewValues NVARCHAR(MAX), -- JSON
  IpAddress NVARCHAR(45),
  UserAgent NVARCHAR(500),
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  INDEX IX_AuditLog_OrganizationId (OrganizationId),
  INDEX IX_AuditLog_UserId (UserId),
  INDEX IX_AuditLog_CreatedAt (CreatedAt)
);

-- 9. Кэш данных Azure AD
CREATE TABLE AzureAdCache (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  AzureAdUserId NVARCHAR(255) NOT NULL,
  DisplayName NVARCHAR(200),
  Email NVARCHAR(255),
  JobTitle NVARCHAR(200),
  Department NVARCHAR(200),
  OfficeLocation NVARCHAR(200),
  LastSyncAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  INDEX IX_AzureAdCache_OrganizationId (OrganizationId),
  INDEX IX_AzureAdCache_AzureAdUserId (AzureAdUserId)
);
```

#### 1.5.1.2 Azure CosmosDB — Документо-ориентированные данные
**Назначение:** Документы, чаты, аудит событий, метаданные

```typescript
// Контейнер: documents
interface Document {
  id: string; // UUID документа
  partitionKey: string; // tenantId для партиционирования
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string; // Azure Blob Storage URL
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  category: string;
  tags: string[];
  metadata: {
    createdBy: string; // Azure AD User ID
    createdAt: string; // ISO date
    modifiedBy?: string;
    modifiedAt?: string;
    officeId?: string;
    departmentId?: string;
    clientId?: string;
    approvalFlow?: 'parallel' | 'consecutive';
    validators?: string[]; // Array of User IDs
    signers?: string[]; // Array of User IDs
    deadline?: string; // ISO date
    priority: 'low' | 'medium' | 'high';
    isLocked: boolean;
    lockedBy?: string;
    lockedAt?: string;
    version: number;
    parentDocumentId?: string; // для версионирования
  };
  permissions: {
    owners: string[]; // User IDs
    viewers: string[];
    editors: string[];
    approvers: string[];
  };
  workflow: {
    currentStep: number;
    steps: Array<{
      stepId: string;
      type: 'validation' | 'approval' | 'signature';
      assignedTo: string[];
      status: 'pending' | 'in_progress' | 'completed' | 'rejected';
      completedBy?: string;
      completedAt?: string;
      comments?: string;
    }>;
  };
  analytics: {
    viewCount: number;
    downloadCount: number;
    lastViewedAt?: string;
    lastDownloadedAt?: string;
  };
}

// Контейнер: chat-messages
interface ChatMessage {
  id: string;
  partitionKey: string; // documentId для группировки сообщений по документу
  documentId: string;
  senderId: string; // Azure AD User ID
  senderName: string;
  senderType: 'employee' | 'client' | 'guest';
  message: string;
  messageType: 'text' | 'file' | 'system';
  timestamp: string; // ISO date
  attachments?: Array<{
    fileName: string;
    fileSize: number;
    blobUrl: string;
    mimeType: string;
  }>;
  metadata: {
    isEdited: boolean;
    editedAt?: string;
    replyToMessageId?: string;
    mentions?: string[]; // Array of User IDs
  };
}

// Контейнер: audit-events
interface AuditEvent {
  id: string;
  partitionKey: string; // tenantId для партиционирования
  tenantId: string;
  userId: string;
  userType: 'employee' | 'client' | 'guest';
  action: 'create' | 'update' | 'delete' | 'view' | 'download' | 'approve' | 'reject' | 'lock' | 'unlock';
  entityType: 'document' | 'user' | 'office' | 'department' | 'client';
  entityId: string;
  timestamp: string; // ISO date
  ipAddress?: string;
  userAgent?: string;
  details: {
    oldValues?: any;
    newValues?: any;
    reason?: string;
    targetUserId?: string; // для действий с пользователями
    documentStatus?: string;
    workflowStep?: string;
  };
  sessionId?: string;
  correlationId?: string; // для группировки связанных событий
}

// Контейнер: user-favorites
interface UserFavorite {
  id: string;
  partitionKey: string; // userId для партиционирования
  userId: string; // Azure AD User ID
  documentId: string;
  addedAt: string; // ISO date
  category?: string; // пользовательская категория
  notes?: string; // пользовательские заметки
  metadata: {
    documentName: string;
    documentStatus: string;
    lastViewedAt?: string;
  };
}

// Контейнер: document-versions
interface DocumentVersion {
  id: string;
  partitionKey: string; // documentId для группировки версий
  documentId: string;
  version: number;
  fileName: string;
  fileSize: number;
  blobUrl: string;
  createdBy: string;
  createdAt: string;
  changeDescription?: string;
  metadata: {
    mimeType: string;
    checksum: string; // для проверки целостности
    isMajorVersion: boolean;
  };
}
```

#### 1.5.1.3 Стратегия партиционирования CosmosDB

```typescript
// Партиционирование по tenantId для изоляции данных организаций
const partitionKeyStrategy = {
  documents: 'partitionKey', // tenantId
  chatMessages: 'partitionKey', // documentId (для группировки сообщений по документу)
  auditEvents: 'partitionKey', // tenantId
  userFavorites: 'partitionKey', // userId (для быстрого доступа к избранному пользователя)
  documentVersions: 'partitionKey' // documentId (для группировки версий)
};

// Индексы для эффективных запросов
const cosmosIndexes = {
  documents: [
    { path: '/status', type: 'Range' },
    { path: '/metadata/createdBy', type: 'Hash' },
    { path: '/metadata/officeId', type: 'Hash' },
    { path: '/metadata/departmentId', type: 'Hash' },
    { path: '/metadata/createdAt', type: 'Range' },
    { path: '/tags/[]', type: 'Hash' },
    { path: '/permissions/owners/[]', type: 'Hash' },
    { path: '/permissions/viewers/[]', type: 'Hash' }
  ],
  chatMessages: [
    { path: '/timestamp', type: 'Range' },
    { path: '/senderId', type: 'Hash' },
    { path: '/messageType', type: 'Hash' }
  ],
  auditEvents: [
    { path: '/timestamp', type: 'Range' },
    { path: '/userId', type: 'Hash' },
    { path: '/action', type: 'Hash' },
    { path: '/entityType', type: 'Hash' }
  ]
};
```

### 1.5.2 API для сущностей

#### 1.5.2.1 CosmosDB сервисы
```typescript
// /src/shared/lib/cosmosDbService.ts
import { CosmosClient, Container, Database } from '@azure/cosmos';

export class CosmosDbService {
  private client: CosmosClient;
  private database: Database;
  private containers: {
    documents: Container;
    chatMessages: Container;
    auditEvents: Container;
    userFavorites: Container;
    documentVersions: Container;
  };

  constructor(connectionString: string, databaseName: string) {
    this.client = new CosmosClient(connectionString);
    this.database = this.client.database(databaseName);
    this.initializeContainers();
  }

  private async initializeContainers() {
    this.containers = {
      documents: this.database.container('documents'),
      chatMessages: this.database.container('chat-messages'),
      auditEvents: this.database.container('audit-events'),
      userFavorites: this.database.container('user-favorites'),
      documentVersions: this.database.container('document-versions')
    };
  }

  // Documents API
  async createDocument(document: Omit<Document, 'id'>): Promise<Document> {
    const { resource } = await this.containers.documents.items.create(document);
    return resource as Document;
  }

  async getDocument(id: string, partitionKey: string): Promise<Document> {
    const { resource } = await this.containers.documents.item(id, partitionKey).read();
    return resource as Document;
  }

  async updateDocument(id: string, partitionKey: string, updates: Partial<Document>): Promise<Document> {
    const { resource } = await this.containers.documents.item(id, partitionKey).replace(updates);
    return resource as Document;
  }

  async deleteDocument(id: string, partitionKey: string): Promise<void> {
    await this.containers.documents.item(id, partitionKey).delete();
  }

  async queryDocuments(query: string, parameters: any[] = []): Promise<Document[]> {
    const { resources } = await this.containers.documents.items.query({
      query,
      parameters
    });
    return resources as Document[];
  }

  // Chat Messages API
  async addChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    const { resource } = await this.containers.chatMessages.items.create(message);
    return resource as ChatMessage;
  }

  async getChatMessages(documentId: string, limit: number = 50): Promise<ChatMessage[]> {
    const { resources } = await this.containers.chatMessages.items.query({
      query: 'SELECT * FROM c WHERE c.documentId = @documentId ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit',
      parameters: [
        { name: '@documentId', value: documentId },
        { name: '@limit', value: limit }
      ]
    });
    return resources as ChatMessage[];
  }

  // Audit Events API
  async logAuditEvent(event: Omit<AuditEvent, 'id'>): Promise<AuditEvent> {
    const { resource } = await this.containers.auditEvents.items.create(event);
    return resource as AuditEvent;
  }

  async getAuditEvents(tenantId: string, filters?: any): Promise<AuditEvent[]> {
    let query = 'SELECT * FROM c WHERE c.tenantId = @tenantId';
    const parameters = [{ name: '@tenantId', value: tenantId }];

    if (filters?.userId) {
      query += ' AND c.userId = @userId';
      parameters.push({ name: '@userId', value: filters.userId });
    }

    if (filters?.action) {
      query += ' AND c.action = @action';
      parameters.push({ name: '@action', value: filters.action });
    }

    query += ' ORDER BY c.timestamp DESC';

    const { resources } = await this.containers.auditEvents.items.query({
      query,
      parameters
    });
    return resources as AuditEvent[];
  }

  // User Favorites API
  async addToFavorites(favorite: Omit<UserFavorite, 'id'>): Promise<UserFavorite> {
    const { resource } = await this.containers.userFavorites.items.create(favorite);
    return resource as UserFavorite;
  }

  async removeFromFavorites(userId: string, documentId: string): Promise<void> {
    const { resources } = await this.containers.userFavorites.items.query({
      query: 'SELECT c.id, c.partitionKey FROM c WHERE c.userId = @userId AND c.documentId = @documentId',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@documentId', value: documentId }
      ]
    });

    if (resources.length > 0) {
      await this.containers.userFavorites.item(resources[0].id, resources[0].partitionKey).delete();
    }
  }

  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    const { resources } = await this.containers.userFavorites.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.addedAt DESC',
      parameters: [{ name: '@userId', value: userId }]
    });
    return resources as UserFavorite[];
  }

  // Document Versions API
  async createDocumentVersion(version: Omit<DocumentVersion, 'id'>): Promise<DocumentVersion> {
    const { resource } = await this.containers.documentVersions.items.create(version);
    return resource as DocumentVersion;
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const { resources } = await this.containers.documentVersions.items.query({
      query: 'SELECT * FROM c WHERE c.documentId = @documentId ORDER BY c.version DESC',
      parameters: [{ name: '@documentId', value: documentId }]
    });
    return resources as DocumentVersion[];
  }
}

export const cosmosDbService = new CosmosDbService(
  process.env.COSMOSDB_CONNECTION_STRING!,
  process.env.COSMOSDB_DATABASE_NAME!
);
```

#### 1.5.2.2 Organizations API
```typescript
// /src/entities/organization/api/organizationsApi.ts
export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  displayName: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

export const organizationsApi = {
  async getCurrentOrganization(): Promise<Organization> {
    return apiClient.get<Organization>('/organizations/current');
  },

  async updateOrganization(updates: Partial<Organization>): Promise<Organization> {
    return apiClient.put<Organization>('/organizations/current', updates);
  },

  async getOrganizationSettings(): Promise<any> {
    return apiClient.get<any>('/organizations/current/settings');
  },

  async updateOrganizationSettings(settings: any): Promise<any> {
    return apiClient.put<any>('/organizations/current/settings', settings);
  }
};
```

#### 1.5.2.2 Offices API
```typescript
// /src/entities/office/api/officesApi.ts
export interface Office {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  timeZone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const officesApi = {
  async getOffices(): Promise<Office[]> {
    return apiClient.get<Office[]>('/offices');
  },

  async getOffice(id: string): Promise<Office> {
    return apiClient.get<Office>(`/offices/${id}`);
  },

  async createOffice(data: Omit<Office, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Office> {
    return apiClient.post<Office>('/offices', data);
  },

  async updateOffice(id: string, updates: Partial<Office>): Promise<Office> {
    return apiClient.put<Office>(`/offices/${id}`, updates);
  },

  async deleteOffice(id: string): Promise<void> {
    return apiClient.delete<void>(`/offices/${id}`);
  }
};
```

#### 1.5.2.3 Departments API
```typescript
// /src/entities/department/api/departmentsApi.ts
export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const departmentsApi = {
  async getDepartments(): Promise<Department[]> {
    return apiClient.get<Department[]>('/departments');
  },

  async getDepartment(id: string): Promise<Department> {
    return apiClient.get<Department>(`/departments/${id}`);
  },

  async createDepartment(data: Omit<Department, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    return apiClient.post<Department>('/departments', data);
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
    return apiClient.put<Department>(`/departments/${id}`, updates);
  },

  async deleteDepartment(id: string): Promise<void> {
    return apiClient.delete<void>(`/departments/${id}`);
  }
};
```

#### 1.5.2.4 Enhanced Users API
```typescript
// /src/entities/user/api/enhancedUsersApi.ts
export interface EnhancedEmployee {
  id: string;
  organizationId: string;
  azureAdUserId: string;
  officeId: string;
  departmentId: string;
  classification: 'Manager' | 'Senior' | 'Associate' | 'Junior';
  role: string;
  isActive: boolean;
  // Данные из Azure AD (кэшированные)
  displayName?: string;
  email?: string;
  jobTitle?: string;
  officeLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export const enhancedUsersApi = {
  async getEmployees(): Promise<EnhancedEmployee[]> {
    return apiClient.get<EnhancedEmployee[]>('/users/employees');
  },

  async getEmployee(id: string): Promise<EnhancedEmployee> {
    return apiClient.get<EnhancedEmployee>(`/users/employees/${id}`);
  },

  async createEmployee(data: Omit<EnhancedEmployee, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<EnhancedEmployee> {
    return apiClient.post<EnhancedEmployee>('/users/employees', data);
  },

  async updateEmployee(id: string, updates: Partial<EnhancedEmployee>): Promise<EnhancedEmployee> {
    return apiClient.put<EnhancedEmployee>(`/users/employees/${id}`, updates);
  },

  async deleteEmployee(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/employees/${id}`);
  },

  async syncWithAzureAd(): Promise<void> {
    return apiClient.post<void>('/users/sync-azure-ad');
  }
};
```

### 1.5.3 Microsoft Graph API интеграция

#### 1.5.3.1 Graph API сервис
```typescript
// /src/shared/lib/graphApi.ts
import { Client } from '@microsoft/microsoft-graph-client';

export class GraphApiService {
  private graphClient: Client;

  constructor(token: string) {
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, token);
      }
    });
  }

  // Получение информации о пользователе
  async getUserProfile(userId: string) {
    return this.graphClient.api(`/users/${userId}`).get();
  }

  // Получение всех пользователей организации
  async getOrganizationUsers() {
    return this.graphClient.api('/users').get();
  }

  // Получение групп (отделов)
  async getGroups() {
    return this.graphClient.api('/groups').get();
  }

  // Получение членства пользователя в группах
  async getUserGroups(userId: string) {
    return this.graphClient.api(`/users/${userId}/memberOf`).get();
  }

  // Получение информации об организации
  async getOrganization() {
    return this.graphClient.api('/organization').get();
  }

  // Получение SharePoint сайтов
  async getSites() {
    return this.graphClient.api('/sites').get();
  }

  // Получение документов из SharePoint
  async getSharePointDocuments(siteId: string, driveId: string) {
    return this.graphClient.api(`/sites/${siteId}/drives/${driveId}/root/children`).get();
  }
}

export const createGraphApiService = (token: string) => new GraphApiService(token);
```

#### 1.5.3.2 Синхронизация данных
```typescript
// /src/shared/lib/syncService.ts
import { createGraphApiService } from './graphApi';
import { apiClient } from '../api';

export class SyncService {
  private graphApi: GraphApiService;

  constructor(token: string) {
    this.graphApi = createGraphApiService(token);
  }

  // Синхронизация пользователей с Azure AD
  async syncUsersWithAzureAd() {
    try {
      // 1. Получаем пользователей из Azure AD
      const azureUsers = await this.graphApi.getOrganizationUsers();
      
      // 2. Обновляем кэш в нашей БД
      await apiClient.post('/users/sync-azure-ad', {
        users: azureUsers.value
      });

      // 3. Получаем обновленные данные
      const updatedEmployees = await apiClient.get('/users/employees');
      
      return updatedEmployees.data;
    } catch (error) {
      console.error('Failed to sync users with Azure AD:', error);
      throw error;
    }
  }

  // Синхронизация групп (отделов)
  async syncDepartmentsWithAzureAd() {
    try {
      const groups = await this.graphApi.getGroups();
      
      await apiClient.post('/departments/sync-azure-ad', {
        groups: groups.value
      });

      return await apiClient.get('/departments');
    } catch (error) {
      console.error('Failed to sync departments with Azure AD:', error);
      throw error;
    }
  }

  // Полная синхронизация организации
  async fullSync() {
    await Promise.all([
      this.syncUsersWithAzureAd(),
      this.syncDepartmentsWithAzureAd()
    ]);
  }
}
```

### 1.5.4 Обновленные хуки сущностей

#### 1.5.4.1 Enhanced useUsers
```typescript
// /src/entities/user/model/useEnhancedUsers.ts
import { useState, useEffect, useCallback } from 'react';
import { enhancedUsersApi } from '../api/enhancedUsersApi';
import { officesApi } from '@/entities/office/api/officesApi';
import { departmentsApi } from '@/entities/department/api/departmentsApi';
import { clientsApi } from '../api/clientsApi';

export const useEnhancedUsers = () => {
  const [employees, setEmployees] = useState<EnhancedEmployee[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, offRes, depRes, cliRes] = await Promise.all([
        enhancedUsersApi.getEmployees(),
        officesApi.getOffices(),
        departmentsApi.getDepartments(),
        clientsApi.getClients()
      ]);

      setEmployees(empRes.data);
      setOffices(offRes.data);
      setDepartments(depRes.data);
      setClients(cliRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncWithAzureAd = useCallback(async () => {
    try {
      await enhancedUsersApi.syncWithAzureAd();
      await fetchAll(); // Обновляем данные после синхронизации
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync with Azure AD');
    }
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    employees,
    offices,
    departments,
    clients,
    loading,
    error,
    fetchAll,
    syncWithAzureAd
  };
};
```

### 1.5.5 Azure Functions endpoints

#### 1.5.5.1 CosmosDB endpoints
- `GET /api/documents` — список документов с фильтрами
- `GET /api/documents/{id}` — документ по ID
- `POST /api/documents` — создание документа
- `PUT /api/documents/{id}` — обновление документа
- `DELETE /api/documents/{id}` — удаление документа
- `POST /api/documents/{id}/lock` — блокировка документа
- `POST /api/documents/{id}/unlock` — разблокировка документа
- `POST /api/documents/{id}/favorite` — добавление в избранное
- `DELETE /api/documents/{id}/favorite` — удаление из избранного
- `GET /api/documents/{id}/chat` — сообщения чата документа
- `POST /api/documents/{id}/chat` — отправка сообщения в чат
- `GET /api/documents/{id}/versions` — версии документа
- `POST /api/documents/{id}/versions` — создание новой версии
- `GET /api/audit/events` — события аудита с фильтрами
- `GET /api/favorites` — избранное пользователя

#### 1.5.5.2 Organizations endpoints
- `GET /api/organizations/current` - текущая организация
- `PUT /api/organizations/current` - обновление организации
- `GET /api/organizations/current/settings` - настройки организации
- `PUT /api/organizations/current/settings` - обновление настроек

#### 1.5.5.2 Offices endpoints
- `GET /api/offices` - список офисов
- `GET /api/offices/{id}` - офис по ID
- `POST /api/offices` - создание офиса
- `PUT /api/offices/{id}` - обновление офиса
- `DELETE /api/offices/{id}` - удаление офиса

#### 1.5.5.3 Departments endpoints
- `GET /api/departments` - список отделов
- `GET /api/departments/{id}` - отдел по ID
- `POST /api/departments` - создание отдела
- `PUT /api/departments/{id}` - обновление отдела
- `DELETE /api/departments/{id}` - удаление отдела

#### 1.5.5.4 Enhanced Users endpoints
- `GET /api/users/employees` - список сотрудников
- `GET /api/users/employees/{id}` - сотрудник по ID
- `POST /api/users/employees` - создание сотрудника
- `PUT /api/users/employees/{id}` - обновление сотрудника
- `DELETE /api/users/employees/{id}` - удаление сотрудника
- `POST /api/users/sync-azure-ad` - синхронизация с Azure AD

#### 1.5.5.5 Clients endpoints
- `GET /api/users/clients` - список клиентов
- `GET /api/users/clients/{id}` - клиент по ID
- `POST /api/users/clients` - создание клиента
- `PUT /api/users/clients/{id}` - обновление клиента
- `DELETE /api/users/clients/{id}` - удаление клиента

### 1.5.6 Миграции и индексы

#### 1.5.6.1 Файл миграции
```sql
-- migrations/001_initial_schema.sql
-- Создание всех таблиц с индексами и ограничениями

-- Организации
CREATE TABLE Organizations (
  -- ... (см. схему выше)
);

-- Офисы
CREATE TABLE Offices (
  -- ... (см. схему выше)
);

-- Отделы
CREATE TABLE Departments (
  -- ... (см. схему выше)
);

-- Сотрудники
CREATE TABLE Employees (
  -- ... (см. схему выше)
);

-- Клиенты
CREATE TABLE Clients (
  -- ... (см. схему выше)
);

-- Роли пользователей
CREATE TABLE UserRoles (
  -- ... (см. схему выше)
);

-- Настройки организации
CREATE TABLE OrganizationSettings (
  -- ... (см. схему выше)
);

-- Аудит
CREATE TABLE AuditLog (
  -- ... (см. схему выше)
);

-- Кэш Azure AD
CREATE TABLE AzureAdCache (
  -- ... (см. схему выше)
);

-- Создание индексов для производительности
CREATE INDEX IX_Employees_Classification ON Employees(Classification);
CREATE INDEX IX_Employees_IsActive ON Employees(IsActive);
CREATE INDEX IX_Clients_IsActive ON Clients(IsActive);
CREATE INDEX IX_UserRoles_UserType ON UserRoles(UserType);
CREATE INDEX IX_UserRoles_IsActive ON UserRoles(IsActive);
```

### 1.5.7 Тестирование

#### 1.5.7.1 Unit тесты для API
```typescript
// /src/entities/organization/__tests__/organizationsApi.test.ts
import { describe, it, expect, vi } from 'vitest';
import { organizationsApi } from '../api/organizationsApi';

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Organizations API', () => {
  it('should get current organization', async () => {
    // Test implementation
  });

  it('should update organization', async () => {
    // Test implementation
  });
});
```

#### 1.5.7.2 Integration тесты
```typescript
// /src/shared/lib/__tests__/syncService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SyncService } from '../syncService';

describe('Sync Service', () => {
  it('should sync users with Azure AD', async () => {
    // Test implementation
  });

  it('should handle sync errors gracefully', async () => {
    // Test implementation
  });
});
```

### 1.5.8 Критерии готовности

Этап 1.5 готов, когда:
- ✅ Azure SQL Database создана с полной схемой (пользователи, роли, организации)
- ✅ Azure CosmosDB настроена с контейнерами (документы, чаты, аудит, избранное, версии)
- ✅ Стратегия партиционирования и индексы настроены для обеих БД
- ✅ CosmosDB сервис реализован с полным API
- ✅ Все API endpoints работают и протестированы
- ✅ Microsoft Graph API интеграция настроена
- ✅ Синхронизация Azure AD ↔ Azure SQL работает
- ✅ Хуки сущностей обновлены для работы с API
- ✅ Миграции и индексы созданы для обеих БД
- ✅ Unit и integration тесты написаны
- ✅ Документация API создана

Источник: детали и примеры — `api-integration-plan.md`.
