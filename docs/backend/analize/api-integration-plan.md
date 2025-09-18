# План интеграции фронтенда с API Azure Functions

## Обзор

Данный документ описывает последовательные действия по связыванию фронтенда приложения с API, реализованным на Azure Functions. Анализ основан на существующем интерфейсе проекта, который включает страницы работы с документами, настройки организации и управление пользователями.

## 1. Сводная таблица прогресса

| Этап | Название | Статус | Часы | Приоритет |
|------|----------|--------|------|-----------|
| 1 | Базовая инфраструктура API | 100% | 16 | Критический |
| 1.5 | Сущности и база данных | 0% | 18 | Критический |
| 2 | Документы | 0% | 24 | Критический |
| 3 | Управление пользователями | 0% | 20 | Основной |
| 4 | Настройки хранилища | 0% | 18 | Основной |
| 5 | Утверждение и валидация | 0% | 22 | Дополнительный |
| 6 | Дополнительные функции | 0% | 20 | Дополнительный |
| 7 | Workflow Engine | 0% | 25 | Критический |
| 8 | Операции с файлами | 0% | 18 | Основной |
| 9 | Система подписания | 0% | 20 | Дополнительный |
| 10 | Dashboard и задачи | 0% | 16 | Основной |

**Общий прогресс:** 7% (16 из 213 часов)

## 2. Анализ текущего состояния интерфейса

### 1.1 Основные страницы и компоненты

#### Документы (`/src/pages/documents/`)
- **FirmSide2Page.tsx** - основная страница работы с документами для фирмы
- **ClientSidePage.tsx** - интерфейс для клиентов
- **BaseDocumentsPage.tsx** - базовая страница документов
- **DocumentsPage.tsx** - общая страница документов

#### Настройки (`/src/pages/settings/`)
- **Storage** - настройки хранилища (SharePoint, физическое)
- **Users** - управление пользователями (сотрудники, клиенты)
- **Approval** - настройки процесса утверждения
- **Validation** - настройки валидации
- **Organization** - настройки организации

### 1.2 Сущности данных

#### Документы (`/src/entities/document/`)
```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  status: DocumentStatus; // 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string;
  updatedAt: string;
  authorId: string;
  approverId?: string;
}
```

#### Пользователи (`/src/entities/user/`)
```typescript
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  classification: 'Manager' | 'Senior' | 'Associate' | 'Junior';
  office: string;
  role: string;
  department: string;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  firmName: string;
  firmAddress: string;
}
```

#### Хранилище (`/src/entities/storage/`)
```typescript
interface StorageSettings {
  storageType: 'cloud' | 'physical';
  sharePointEmail: string;
  sharePointPassword: string;
  connectionStatus: '' | 'verifying' | 'established' | 'invalid';
  deviceType: string;
  storageAmount: string;
  storageUnit: 'MB' | 'GB';
  retentionPeriod: string;
  retentionUnit: 'days' | 'months' | 'years';
  firmType: string;
  selectedTemplate: string;
  // ... другие настройки
}
```

## 2. План интеграции API

### 2.1 Этап 1: Создание API клиента

#### 2.1.1 Создать базовый API клиент
```typescript
// /src/shared/api/client.ts
export class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // GET запросы
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST запросы
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT запросы
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE запросы
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Загрузка файлов
  async uploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.send(formData);
    });
  }
}
```

#### 2.1.2 Создать экземпляр API клиента
```typescript
// /src/shared/api/index.ts
import { ApiClient } from './client';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-function-app.azurewebsites.net/api';

export const apiClient = new ApiClient(API_BASE_URL);

// Экспорт для использования в хуках
export { apiClient };
```

### 2.2 Этап 2: API сервисы для сущностей

#### 2.2.1 Документы API
```typescript
// /src/entities/document/api/documentsApi.ts
import { apiClient } from '@/shared/api';
import type { Document } from '../model/types';

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  file?: File;
  clientId?: string;
  category?: string;
  domain?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  status?: string;
}

export interface DocumentFilters {
  status?: string;
  clientId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const documentsApi = {
  // Получить список документов
  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const endpoint = `/documents${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<Document[]>(endpoint);
  },

  // Получить документ по ID
  async getDocument(id: string): Promise<Document> {
    return apiClient.get<Document>(`/documents/${id}`);
  },

  // Создать новый документ
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    if (data.file) {
      return apiClient.uploadFile<Document>('/documents/upload', data.file);
    }
    return apiClient.post<Document>('/documents', data);
  },

  // Обновить документ
  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> {
    return apiClient.put<Document>(`/documents/${id}`, data);
  },

  // Удалить документ
  async deleteDocument(id: string): Promise<void> {
    return apiClient.delete<void>(`/documents/${id}`);
  },

  // Загрузить файл документа
  async downloadDocument(id: string): Promise<Blob> {
    const response = await fetch(`${apiClient.baseUrl}/documents/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${apiClient.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    return response.blob();
  },

  // Утвердить документ
  async approveDocument(id: string, comment?: string): Promise<Document> {
    return apiClient.post<Document>(`/documents/${id}/approve`, { comment });
  },

  // Отклонить документ
  async rejectDocument(id: string, comment: string): Promise<Document> {
    return apiClient.post<Document>(`/documents/${id}/reject`, { comment });
  },

  // Подписать документ
  async signDocument(id: string, signatureData: any): Promise<Document> {
    return apiClient.post<Document>(`/documents/${id}/sign`, signatureData);
  },

  // Получить историю документа
  async getDocumentHistory(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/documents/${id}/history`);
  },

  // Получить чат документа
  async getDocumentChat(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/documents/${id}/chat`);
  },

  // Отправить сообщение в чат
  async sendChatMessage(id: string, message: string): Promise<any> {
    return apiClient.post<any>(`/documents/${id}/chat`, { message });
  }
};
```

#### 2.2.2 Пользователи API
```typescript
// /src/entities/user/api/usersApi.ts
import { apiClient } from '@/shared/api';
import type { Employee, Client, Department } from '../model/types';

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  classification: 'Manager' | 'Senior' | 'Associate' | 'Junior';
  office: string;
  role: string;
  department: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  firmName: string;
  firmAddress: string;
}

export const usersApi = {
  // Сотрудники
  async getEmployees(): Promise<Employee[]> {
    return apiClient.get<Employee[]>('/employees');
  },

  async getEmployee(id: number): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}`);
  },

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    return apiClient.post<Employee>('/employees', data);
  },

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    return apiClient.put<Employee>(`/employees/${id}`, data);
  },

  async deleteEmployee(id: number): Promise<void> {
    return apiClient.delete<void>(`/employees/${id}`);
  },

  // Клиенты
  async getClients(): Promise<Client[]> {
    return apiClient.get<Client[]>('/clients');
  },

  async getClient(id: number): Promise<Client> {
    return apiClient.get<Client>(`/clients/${id}`);
  },

  async createClient(data: CreateClientRequest): Promise<Client> {
    return apiClient.post<Client>('/clients', data);
  },

  async updateClient(id: number, data: Partial<Client>): Promise<Client> {
    return apiClient.put<Client>(`/clients/${id}`, data);
  },

  async deleteClient(id: number): Promise<void> {
    return apiClient.delete<void>(`/clients/${id}`);
  },

  // Отделы
  async getDepartments(): Promise<Department[]> {
    return apiClient.get<Department[]>('/departments');
  },

  async createDepartment(data: Omit<Department, 'id'>): Promise<Department> {
    return apiClient.post<Department>('/departments', data);
  },

  // Импорт пользователей
  async importUsers(file: File): Promise<{ success: number; errors: string[] }> {
    return apiClient.uploadFile<{ success: number; errors: string[] }>('/users/import', file);
  }
};
```

#### 2.2.3 Хранилище API
```typescript
// /src/entities/storage/api/storageApi.ts
import { apiClient } from '@/shared/api';
import type { StorageSettings } from '../model/types';

export const storageApi = {
  // Получить настройки хранилища
  async getStorageSettings(): Promise<StorageSettings> {
    return apiClient.get<StorageSettings>('/storage/settings');
  },

  // Обновить настройки хранилища
  async updateStorageSettings(settings: Partial<StorageSettings>): Promise<StorageSettings> {
    return apiClient.put<StorageSettings>('/storage/settings', settings);
  },

  // Проверить подключение к SharePoint
  async verifySharePointCredentials(email: string, password: string): Promise<{ status: string }> {
    return apiClient.post<{ status: string }>('/storage/verify-sharepoint', { email, password });
  },

  // Получить информацию о доступном месте
  async getStorageInfo(): Promise<{
    used: number;
    total: number;
    available: number;
    unit: string;
  }> {
    return apiClient.get<any>('/storage/info');
  },

  // Получить шаблоны структуры
  async getTemplates(): Promise<any[]> {
    return apiClient.get<any[]>('/storage/templates');
  },

  // Сохранить шаблон
  async saveTemplate(template: any): Promise<any> {
    return apiClient.post<any>('/storage/templates', template);
  },

  // Удалить шаблон
  async deleteTemplate(templateId: string): Promise<void> {
    return apiClient.delete<void>(`/storage/templates/${templateId}`);
  }
};
```

### 2.3 Этап 3: Обновление хуков для работы с API

#### 2.3.1 Хук для документов
```typescript
// /src/entities/document/model/useDocuments.ts
import { useState, useEffect, useCallback } from 'react';
import { documentsApi } from '../api/documentsApi';
import type { Document } from './types';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentsApi.getDocuments(filters);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocument = useCallback(async (documentData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newDocument = await documentsApi.createDocument(documentData);
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (id: string, updates: any) => {
    setLoading(true);
    setError(null);
    try {
      const updatedDocument = await documentsApi.updateDocument(id, updates);
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? updatedDocument : doc
      ));
      return updatedDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await documentsApi.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveDocument = useCallback(async (id: string, comment?: string) => {
    setLoading(true);
    setError(null);
    try {
      const approvedDocument = await documentsApi.approveDocument(id, comment);
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? approvedDocument : doc
      ));
      return approvedDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectDocument = useCallback(async (id: string, comment: string) => {
    setLoading(true);
    setError(null);
    try {
      const rejectedDocument = await documentsApi.rejectDocument(id, comment);
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? rejectedDocument : doc
      ));
      return rejectedDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    approveDocument,
    rejectDocument,
  };
};
```

#### 2.3.2 Хук для пользователей
```typescript
// /src/entities/user/model/useUsers.ts
import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/usersApi';
import type { Employee, Client, Department } from './types';

export const useUsers = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getClients();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getDepartments();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, []);

  const addEmployee = useCallback(async (employeeData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newEmployee = await usersApi.createEmployee(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addClient = useCallback(async (clientData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newClient = await usersApi.createClient(clientData);
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importUsers = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await usersApi.importUsers(file);
      // Обновляем списки после импорта
      await Promise.all([fetchEmployees(), fetchClients()]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import users');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, fetchClients]);

  useEffect(() => {
    Promise.all([fetchEmployees(), fetchClients(), fetchDepartments()]);
  }, [fetchEmployees, fetchClients, fetchDepartments]);

  return {
    employees,
    clients,
    departments,
    loading,
    error,
    addEmployee,
    addClient,
    importUsers,
    fetchEmployees,
    fetchClients,
    fetchDepartments,
  };
};
```

#### 2.3.3 Хук для хранилища
```typescript
// /src/entities/storage/model/useStorageSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { storageApi } from '../api/storageApi';
import type { StorageSettings } from './types';

export const useStorageSettings = () => {
  const [settings, setSettings] = useState<StorageSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storageApi.getStorageSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch storage settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<StorageSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedSettings = await storageApi.updateStorageSettings(updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update storage settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCredentials = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await storageApi.verifySharePointCredentials(email, password);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify credentials');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStorageInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await storageApi.getStorageInfo();
      return info;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get storage info');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    verifyCredentials,
    getStorageInfo,
  };
};
```

### 2.4 Этап 4: Обновление компонентов

#### 2.4.1 Обновление страницы документов
```typescript
// Обновление FirmSide2Page.tsx
import { useDocuments } from '@/entities/document/model/useDocuments';

export const FirmSide2Page = () => {
  const { documents, loading, error, fetchDocuments, createDocument } = useDocuments();
  
  // Заменить моковые данные на реальные
  const handleDocumentSelect = (document: Document) => {
    // Логика выбора документа
  };

  const handleUploadDocument = async (file: File) => {
    try {
      await createDocument({ file });
      // Показать уведомление об успехе
    } catch (error) {
      // Показать уведомление об ошибке
    }
  };

  // Остальной код компонента...
};
```

#### 2.4.2 Обновление настроек хранилища
```typescript
// Обновление storage-settings.tsx
import { useStorageSettings } from '@/entities/storage/model/useStorageSettings';

export const StorageSettings = () => {
  const { settings, loading, error, updateSettings, verifyCredentials } = useStorageSettings();
  
  const handleSaveSettings = async () => {
    try {
      await updateSettings(settings);
      // Показать уведомление об успехе
    } catch (error) {
      // Показать уведомление об ошибке
    }
  };

  const handleVerifySharePoint = async () => {
    try {
      const result = await verifyCredentials(settings.sharePointEmail, settings.sharePointPassword);
      // Обновить статус подключения
    } catch (error) {
      // Показать уведомление об ошибке
    }
  };

  // Остальной код компонента...
};
```

### 2.5 Этап 5: Обработка ошибок и уведомления

#### 2.5.1 Создать систему уведомлений
```typescript
// /src/shared/lib/notifications.ts
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

class NotificationService {
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private notifications: Notification[] = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  add(notification: Omit<Notification, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    this.notifications.push(newNotification);
    this.notify();

    if (notification.duration !== 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration || 5000);
    }
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }
}

export const notificationService = new NotificationService();
```

#### 2.5.2 Хук для уведомлений
```typescript
// /src/shared/lib/useNotifications.ts
import { useState, useEffect } from 'react';
import { notificationService, type Notification } from './notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const showSuccess = (title: string, message: string) => {
    notificationService.add({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    notificationService.add({ type: 'error', title, message });
  };

  const showWarning = (title: string, message: string) => {
    notificationService.add({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message: string) => {
    notificationService.add({ type: 'info', title, message });
  };

  const removeNotification = (id: string) => {
    notificationService.remove(id);
  };

  return {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  };
};
```

### 2.6 Этап 6: Аутентификация и авторизация

#### 2.6.1 Интеграция с Microsoft Teams
```typescript
// /src/shared/lib/auth.ts
import { TeamsUserCredential } from '@microsoft/teamsfx';

export class AuthService {
  private credential: TeamsUserCredential | null = null;

  async initialize() {
    try {
      this.credential = new TeamsUserCredential({
        clientId: process.env.REACT_APP_CLIENT_ID!,
        initiateLoginEndpoint: process.env.REACT_APP_START_LOGIN_PAGE_URL!,
        apiEndpoint: process.env.REACT_APP_API_ENDPOINT!,
      });
    } catch (error) {
      console.error('Failed to initialize Teams credential:', error);
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.credential) {
      await this.initialize();
    }

    try {
      const token = await this.credential?.getToken([process.env.REACT_APP_API_SCOPE!]);
      return token?.token || null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async getUserInfo() {
    if (!this.credential) {
      await this.initialize();
    }

    try {
      return await this.credential?.getUserInfo();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
```

#### 2.6.2 Обновление API клиента для работы с токенами
```typescript
// Обновление /src/shared/api/client.ts
import { authService } from '@/shared/lib/auth';

export class ApiClient {
  // ... существующий код ...

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, { 
      ...options, 
      headers: { ...headers, ...options.headers } 
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ... остальные методы остаются без изменений ...
}
```

## 3. Детальный план внедрения с оценкой времени

### 3.0 Файлы по этапам

- Этап 1 (Базовая инфраструктура API) — см. [plan-stage-1.md](./plan-stage-1.md)
  - `/src/shared/api/client.ts` — базовый клиент HTTP, загрузки файлов
  - `/src/shared/api/index.ts` — инициализация клиента
  - `/src/shared/lib/auth.ts` — Teams/SSO аутентификация
  - `/src/shared/lib/notifications.ts`, `/src/shared/lib/useNotifications.ts` — уведомления

- Этап 1.5 (Сущности и база данных) — см. [plan-stage-1-5-database.md](./plan-stage-1-5-database.md)
  - Azure SQL Database — схема таблиц, миграции, индексы
  - `/src/entities/*/api/*Api.ts` — API для всех сущностей
  - `/src/shared/lib/graphApi.ts` — Microsoft Graph API интеграция
  - `/src/shared/lib/syncService.ts` — синхронизация Azure AD ↔ Azure SQL

- Этап 2 (Работа с документами) — см. [plan-stage-2-documents.md](./plan-stage-2-documents.md)
  - `/src/entities/document/api/documentsApi.ts` — API документов
  - `/src/entities/document/model/useDocuments.ts` — хук документов
  - `/src/pages/documents/ui/FirmSide2Page.tsx` — интеграция UI
  - `/src/pages/documents/ui/BaseDocumentsPage.tsx` — обобщённые списки/фильтры
  - при необходимости: `/src/pages/documents/components/UploadForm.tsx` — загрузка/прогресс

- Этап 3 (Управление пользователями) — см. [plan-stage-3-users.md](./plan-stage-3-users.md)
  - `/src/entities/user/api/usersApi.ts` — API сотрудников/клиентов/отделов
  - `/src/entities/user/model/useUsers.ts` — хук пользователей (перевод с моков)
  - `/src/widgets/userManagement/ui/UserManagementWidget.tsx` — интеграция экранов
  - `/src/features/userManagement/ui/*Dialog.tsx` — формы создания/импорта

- Этап 4 (Настройки хранилища) — см. [plan-stage-4-storage.md](./plan-stage-4-storage.md)
  - `/src/entities/storage/api/storageApi.ts` — API настроек хранилища
  - `/src/entities/storage/model/useStorageSettings.ts` — хук настроек (перевод на API)
  - `/src/pages/settings/storage/storage-settings.tsx` — интеграция UI
  - `/src/pages/settings/storage/components/*` — верификация SharePoint/шаблоны

- Этап 5 (Процессы утверждения и валидации) — см. [plan-stage-5-approval-validation.md](./plan-stage-5-approval-validation.md)
  - `/src/features/documentApproval/model/useDocumentApproval.ts` — доработка для API
  - `/src/pages/settings/validation/*` — UI настроек валидации/правил
  - (по необходимости) `/src/features/*` — хуки/workflow для статусов

- Этап 6 (Дополнительные функции) — см. [plan-stage-6-extras.md](./plan-stage-6-extras.md)
   - Чат: `/src/pages/documents/components/DocumentChat.tsx`, сервис SignalR
   - История: новый сервис `/src/entities/document/api/historyApi.ts` или в `documentsApi`
   - Уведомления real-time: интеграция с Service Bus/SignalR в соответствующих сервисах

- Этап 7 (Workflow Engine) — см. [plan-stage-7-workflow-engine.md](./plan-stage-7-workflow-engine.md)
   - Система workflow для документов
   - Последовательные/параллельные процессы
   - Автоматическое назначение задач валидации/утверждения/подписания

- Этап 8 (Операции с файлами) — см. [plan-stage-8-file-operations.md](./plan-stage-8-file-operations.md)
   - Перемещение файлов между папками
   - Предпросмотр файлов
   - Проверка доступного места перед загрузкой
   - Аудит операций с файлами

- Этап 9 (Система подписания) — см. [plan-stage-9-signature-system.md](./plan-stage-9-signature-system.md)
   - 4 метода аутентификации подписи
   - Загрузка подписанной версии поверх оригинала
   - Временные метки и аудит подписей

- Этап 10 (Dashboard и задачи) — см. [plan-stage-10-dashboard-tasks.md](./plan-stage-10-dashboard-tasks.md)
   - Dashboard для задач пользователя
   - Интерфейсы для валидаторов/утверждающих/подписывающих
   - Управление сроками и напоминания

### 3.1 Этап 1: Базовая инфраструктура API (16 часов)

#### 3.1.1 Создание API клиента (6 часов)
**Задачи:**
- Создать базовый класс ApiClient с методами GET, POST, PUT, DELETE
- Реализовать обработку ошибок и статусов HTTP
- Добавить поддержку загрузки файлов с прогрессом
- Настроить базовые заголовки и аутентификацию

**Результат:** Готовый API клиент для всех HTTP запросов к Azure Functions

#### 3.1.2 Настройка аутентификации (4 часа)
**Задачи:**
- Интегрировать Microsoft Teams SDK
- Создать AuthService для работы с токенами
- Настроить автоматическое обновление токенов
- Добавить обработку ошибок аутентификации

**Результат:** Система аутентификации через Microsoft Teams готова к использованию

#### 3.1.3 Система уведомлений (3 часа)
**Задачи:**
- Создать NotificationService для централизованных уведомлений
- Реализовать хук useNotifications
- Добавить компоненты для отображения уведомлений
- Настроить автоматическое скрытие уведомлений

**Результат:** Система уведомлений готова для отображения ошибок и успешных операций

#### 3.1.4 Обработка ошибок (3 часа)
**Задачи:**
- Создать типы ошибок API
- Реализовать глобальный обработчик ошибок
- Добавить retry логику для неудачных запросов
- Настроить логирование ошибок

**Результат:** Надежная система обработки ошибок API

**Итого по этапу:** 16 часов
**Промежуточный результат:** Базовая инфраструктура для работы с API готова. Можно начинать интеграцию с конкретными сущностями.

### 3.2 Этап 2: Работа с документами (24 часа)

#### 3.2.1 API для документов (8 часов)
**Задачи:**
- Создать documentsApi с методами CRUD
- Реализовать загрузку и скачивание файлов
- Добавить фильтрацию и поиск документов
- Настроить валидацию данных на клиенте

**Результат:** Полный API для работы с документами

#### 3.2.2 Хук useDocuments (4 часа)
**Задачи:**
- Создать хук для управления состоянием документов
- Добавить методы для CRUD операций
- Реализовать кэширование данных
- Настроить оптимистичные обновления

**Результат:** Хук для работы с документами с полным функционалом

#### 3.2.3 Интеграция в FirmSide2Page (8 часов)
**Задачи:**
- Заменить моковые данные на реальные API вызовы
- Добавить индикаторы загрузки
- Реализовать обработку ошибок
- Настроить обновление данных в реальном времени

**Результат:** Основная страница документов работает с реальными данными

#### 3.2.4 Загрузка файлов (4 часа)
**Задачи:**
- Реализовать drag & drop загрузку
- Добавить прогресс-бар для загрузки
- Настроить валидацию типов файлов
- Добавить предпросмотр файлов

**Результат:** Полнофункциональная система загрузки файлов

**Итого по этапу:** 24 часа
**Промежуточный результат:** Система работы с документами полностью функциональна. Пользователи могут загружать, просматривать, редактировать и удалять документы.

### 3.3 Этап 3: Управление пользователями (20 часов)

#### 3.3.1 API для пользователей (6 часов)
**Задачи:**
- Создать usersApi для сотрудников и клиентов
- Реализовать импорт пользователей из CSV/Excel
- Добавить валидацию данных пользователей
- Настроить поиск и фильтрацию

**Результат:** API для управления пользователями

#### 3.3.2 Хук useUsers (4 часа)
**Задачи:**
- Создать хук для управления пользователями
- Добавить методы для CRUD операций
- Реализовать кэширование
- Настроить синхронизацию данных

**Результат:** Хук для работы с пользователями

#### 3.3.3 Интеграция в компоненты управления (6 часов)
**Задачи:**
- Обновить UserManagementWidget
- Интегрировать AddEmployeeDialog и AddClientDialog
- Добавить ImportDialog для массового импорта
- Настроить DepartmentDialog

**Результат:** Полнофункциональное управление пользователями

#### 3.3.4 Валидация и права доступа (4 часа)
**Задачи:**
- Добавить валидацию форм
- Реализовать проверку прав доступа
- Настроить роли пользователей
- Добавить аудит действий

**Результат:** Безопасная система управления пользователями

**Итого по этапу:** 20 часов
**Промежуточный результат:** Система управления пользователями готова. Администраторы могут добавлять, редактировать, удалять сотрудников и клиентов, а также импортировать данные из файлов.

### 3.4 Этап 4: Настройки хранилища (18 часов)

#### 3.4.1 API для хранилища (6 часов)
**Задачи:**
- Создать storageApi для настроек хранилища
- Реализовать проверку подключения к SharePoint
- Добавить управление шаблонами
- Настроить мониторинг использования места

**Результат:** API для управления хранилищем

#### 3.4.2 Хук useStorageSettings (4 часа)
**Задачи:**
- Обновить существующий хук для работы с API
- Добавить методы для сохранения настроек
- Реализовать валидацию настроек
- Настроить синхронизацию с сервером

**Результат:** Хук для работы с настройками хранилища

#### 3.4.3 Интеграция в страницу настроек (6 часов)
**Задачи:**
- Обновить StorageSettings компонент
- Интегрировать все подкомпоненты
- Добавить валидацию форм
- Настроить автоматическое сохранение

**Результат:** Полнофункциональная страница настроек хранилища

#### 3.4.4 Шаблоны и структуры (2 часа)
**Задачи:**
- Реализовать управление шаблонами
- Добавить предпросмотр структур
- Настроить экспорт/импорт шаблонов
- Добавить валидацию структур

**Результат:** Система шаблонов для быстрой настройки

**Итого по этапу:** 18 часов
**Промежуточный результат:** Система настроек хранилища полностью функциональна. Администраторы могут настраивать SharePoint, физическое хранилище, создавать шаблоны и мониторить использование места.

### 3.5 Этап 5: Процессы утверждения и валидации (22 часа)

#### 3.5.1 API для процессов (8 часов)
**Задачи:**
- Создать API для утверждения документов
- Реализовать API для валидации
- Добавить систему уведомлений о задачах
- Настроить workflow engine

**Результат:** API для процессов утверждения и валидации

#### 3.5.2 Хуки для процессов (6 часов)
**Задачи:**
- Создать useDocumentApproval хук
- Добавить useDocumentValidation хук
- Реализовать useWorkflow хук
- Настроить уведомления о задачах

**Результат:** Хуки для работы с процессами

#### 3.5.3 Интеграция в интерфейс (6 часов)
**Задачи:**
- Обновить компоненты утверждения
- Добавить интерфейс валидации
- Реализовать dashboard для задач
- Настроить уведомления

**Результат:** Полнофункциональные процессы утверждения и валидации

#### 3.5.4 Настройки процессов (2 часа)
**Задачи:**
- Интегрировать настройки в интерфейс
- Добавить конфигурацию workflow
- Настроить правила назначения
- Добавить валидацию настроек

**Результат:** Настраиваемые процессы утверждения и валидации

**Итого по этапу:** 22 часа
**Промежуточный результат:** Система процессов утверждения и валидации готова. Документы проходят через настроенные workflow с уведомлениями и отслеживанием статуса.

### 3.6 Этап 6: Дополнительные функции (20 часов)

#### 3.6.1 Чат документов (8 часов)
**Задачи:**
- Создать API для чата
- Реализовать SignalR подключение
- Добавить интерфейс чата
- Настроить уведомления о сообщениях

**Результат:** Система чата для документов

#### 3.6.2 История изменений (4 часа)
**Задачи:**
- Создать API для истории
- Реализовать отображение истории
- Добавить фильтрацию по типам изменений
- Настроить экспорт истории

**Результат:** Полная история изменений документов

#### 3.6.3 Уведомления в реальном времени (4 часа)
**Задачи:**
- Настроить Service Bus
- Реализовать push уведомления
- Добавить настройки уведомлений
- Интегрировать с интерфейсом

**Результат:** Система уведомлений в реальном времени

#### 3.6.4 Оптимизация производительности (4 часа)
**Задачи:**
- Добавить виртуализацию списков
- Реализовать lazy loading
- Оптимизировать запросы к API
- Настроить кэширование

**Результат:** Оптимизированная производительность приложения

**Итого по этапу:** 20 часов
**Промежуточный результат:** Все дополнительные функции реализованы. Система полностью функциональна с чатом, историей, уведомлениями и оптимизированной производительностью.

## 4. Общая оценка времени

### 4.1 По этапам:
- **Этап 1 (Базовая инфраструктура):** 16 часов
- **Этап 2 (Работа с документами):** 24 часа
- **Этап 3 (Управление пользователями):** 20 часов
- **Этап 4 (Настройки хранилища):** 18 часов
- **Этап 5 (Процессы утверждения):** 22 часа
- **Этап 6 (Дополнительные функции):** 20 часов
- **Этап 7 (Workflow Engine):** 25 часов
- **Этап 8 (Операции с файлами):** 18 часов
- **Этап 9 (Система подписания):** 20 часов
- **Этап 10 (Dashboard и задачи):** 16 часов

**Общий итог:** 195 часов (24.4 рабочих дня при 8-часовом рабочем дне)

### 4.2 По приоритетам:
- **Критический функционал (этапы 1-2, 7):** 65 часов
- **Основной функционал (этапы 3-4, 8, 10):** 72 часов
- **Дополнительный функционал (этапы 5-6, 9):** 58 часов

### 4.3 Риски и буфер:
- **Тестирование и отладка:** +20 часов
- **Документация:** +8 часов
- **Интеграционное тестирование:** +12 часов
- **Буфер на непредвиденные ситуации:** +20 часов

**Итого с буфером:** 255 часов (31.9 рабочих дня)

## 5. Критерии готовности этапов

### 5.1 Этап 1 готов, когда:
- API клиент успешно выполняет все типы запросов
- Аутентификация работает через Microsoft Teams
- Система уведомлений отображает ошибки и успехи
- Обработка ошибок работает стабильно

### 5.2 Этап 2 готов, когда:
- Пользователи могут загружать файлы с прогрессом
- Документы отображаются в списке с фильтрацией
- CRUD операции работают без ошибок
- Предпросмотр файлов функционирует

### 5.3 Этап 3 готов, когда:
- Добавление/редактирование пользователей работает
- Импорт из файлов функционирует корректно
- Поиск и фильтрация пользователей работают
- Права доступа применяются корректно

### 5.4 Этап 4 готов, когда:
- Настройки хранилища сохраняются
- Подключение к SharePoint проверяется
- Шаблоны создаются и применяются
- Мониторинг места работает

### 5.5 Этап 5 готов, когда:
- Документы проходят через workflow
- Уведомления о задачах отправляются
- Статусы документов обновляются
- Настройки процессов применяются

### 5.6 Этап 6 готов, когда:
- Чат документов работает в реальном времени
- История изменений отображается корректно
- Push уведомления доставляются
- Производительность оптимизирована

## 6. Требования к Azure Functions API

### 6.1 Endpoints для документов
- `GET /api/documents` - список документов
- `GET /api/documents/{id}` - документ по ID
- `POST /api/documents` - создание документа
- `PUT /api/documents/{id}` - обновление документа
- `DELETE /api/documents/{id}` - удаление документа
- `POST /api/documents/{id}/approve` - утверждение документа
- `POST /api/documents/{id}/reject` - отклонение документа
- `POST /api/documents/{id}/sign` - подписание документа
- `GET /api/documents/{id}/history` - история документа
- `GET /api/documents/{id}/chat` - чат документа
- `POST /api/documents/{id}/chat` - отправка сообщения в чат

### 6.2 Endpoints для пользователей
- `GET /api/employees` - список сотрудников
- `POST /api/employees` - создание сотрудника
- `PUT /api/employees/{id}` - обновление сотрудника
- `DELETE /api/employees/{id}` - удаление сотрудника
- `GET /api/clients` - список клиентов
- `POST /api/clients` - создание клиента
- `PUT /api/clients/{id}` - обновление клиента
- `DELETE /api/clients/{id}` - удаление клиента
- `GET /api/departments` - список отделов
- `POST /api/departments` - создание отдела
- `POST /api/users/import` - импорт пользователей

### 6.3 Endpoints для хранилища
- `GET /api/storage/settings` - настройки хранилища
- `PUT /api/storage/settings` - обновление настроек
- `POST /api/storage/verify-sharepoint` - проверка SharePoint
- `GET /api/storage/info` - информация о хранилище
- `GET /api/storage/templates` - шаблоны
- `POST /api/storage/templates` - сохранение шаблона
- `DELETE /api/storage/templates/{id}` - удаление шаблона

## 7. Заключение

Данный план обеспечивает поэтапную интеграцию фронтенда с API Azure Functions, начиная с базовых операций и постепенно добавляя более сложную функциональность. Каждый этап можно тестировать независимо, что упрощает процесс разработки и отладки.

### 7.1 Ключевые моменты:
- Использование единого API клиента для всех запросов
- Разделение логики на сущности и API сервисы
- Обновление существующих хуков для работы с реальными данными
- Добавление обработки ошибок и уведомлений
- Интеграция с Microsoft Teams для аутентификации

### 7.2 Рекомендации по реализации:

#### 7.2.1 Приоритизация задач:
1. **Критический путь:** Этапы 1-2 (40 часов) - базовая функциональность
2. **Основной функционал:** Этапы 3-4 (38 часов) - управление пользователями и настройки
3. **Дополнительные возможности:** Этапы 5-6 (42 часа) - процессы и оптимизация

#### 7.2.2 Параллельная разработка:
- API клиент и аутентификация могут разрабатываться параллельно
- Документы и пользователи можно разрабатывать независимо
- Настройки хранилища можно реализовывать параллельно с основным функционалом

#### 7.2.3 Тестирование:
- Каждый этап должен включать unit тесты
- Интеграционные тесты после завершения каждого этапа
- E2E тесты для критических пользовательских сценариев

#### 7.2.4 Документация:
- API документация для каждого endpoint
- Руководство пользователя для новых функций
- Техническая документация для разработчиков

### 7.3 Ожидаемые результаты:

После завершения всех этапов система будет иметь:
- Полнофункциональный документооборот с загрузкой файлов
- Управление пользователями с импортом данных
- Настраиваемое хранилище с поддержкой SharePoint
- Процессы утверждения и валидации документов
- Чат и уведомления в реальном времени
- Оптимизированную производительность

Общее время реализации: **180 часов** (22.5 рабочих дня) с учетом буфера на непредвиденные ситуации.
