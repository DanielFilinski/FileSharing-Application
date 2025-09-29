# 📋 SharePoint Integration Plan - File Sharing Application

*Подробный технический план интеграции с SharePoint в соответствии с официальной документацией Microsoft*

---

## 🎯 **ОБЗОР ИНТЕГРАЦИИ**

### **Цели SharePoint интеграции:**
- Централизованное хранение документов в SharePoint Online
- Совместная работа через SharePoint с сохранением контекста End User
- Открытие документов в SharePoint для редактирования
- Автоматическое создание папочной структуры для каждого End User
- Интеграция с Microsoft Teams через SharePoint

### **Ключевые компоненты:**
- Microsoft Graph API для доступа к SharePoint
- Azure Functions для серверной логики
- Автоматическое создание сайтов SharePoint для End Users
- Интеграция с существующей системой управления документами

---

## 🗓️ **ДЕТАЛЬНЫЙ ПЛАН ПО НЕДЕЛЯМ**

### **НЕДЕЛЯ 1: ПОДГОТОВКА И НАСТРОЙКА СРЕДЫ**

#### **День 1-2: Изучение документации и настройка разрешений**

**📚 Официальная документация для изучения:**
- [Microsoft Graph API for SharePoint](https://docs.microsoft.com/en-us/graph/api/resources/sharepoint)
- [SharePoint REST API](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/complete-basic-operations-using-sharepoint-rest-endpoints)
- [Microsoft Graph SDK для JavaScript](https://docs.microsoft.com/en-us/graph/sdks/sdk-installation)

**🔐 Настройка разрешений в Azure AD:**
```json
{
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "01d4889c-1287-42c6-ac1f-5d1e02578ef6",
          "type": "Scope"
        },
        {
          "id": "863451e7-0667-486c-a5d6-d135439485f0",
          "type": "Scope"  
        },
        {
          "id": "89fe6a52-be36-487e-b7d8-d061c450a026",
          "type": "Scope"
        }
      ]
    }
  ]
}
```

**Разрешения (Scopes):**
- `Sites.ReadWrite.All` - чтение и запись сайтов SharePoint
- `Files.ReadWrite.All` - чтение и запись файлов
- `Sites.Manage.All` - управление сайтами SharePoint

#### **День 3-4: Установка и настройка Microsoft Graph Client**

**📦 Установка зависимостей:**
```bash
# В папке api
npm install @microsoft/microsoft-graph-client
npm install @azure/msal-node
npm install @microsoft/microsoft-graph-types

# В папке src (frontend)  
npm install @microsoft/microsoft-graph-client
npm install @azure/msal-browser
```

**🔧 Базовая настройка Graph Client:**
```typescript
// api/src/shared/graphClient.ts
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { OnBehalfOfUserCredential } from '@microsoft/teamsfx';

export class GraphClientService {
  private static instance: GraphClientService;
  private graphClient: Client | null = null;

  static getInstance(): GraphClientService {
    if (!GraphClientService.instance) {
      GraphClientService.instance = new GraphClientService();
    }
    return GraphClientService.instance;
  }

  async initializeClient(accessToken: string): Promise<Client> {
    if (this.graphClient) {
      return this.graphClient;
    }

    const oboCredential = new OnBehalfOfUserCredential(accessToken, {
      authorityHost: process.env.AZURE_AUTHORITY_HOST,
      clientId: process.env.AZURE_CLIENT_ID,
      tenantId: process.env.AZURE_TENANT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET
    });

    const authProvider = new TokenCredentialAuthenticationProvider(oboCredential, {
      scopes: [
        'https://graph.microsoft.com/Sites.ReadWrite.All',
        'https://graph.microsoft.com/Files.ReadWrite.All',
        'https://graph.microsoft.com/Sites.Manage.All'
      ]
    });

    this.graphClient = Client.initWithMiddleware({ authProvider });
    return this.graphClient;
  }

  async getSitesClient(accessToken: string) {
    const client = await this.initializeClient(accessToken);
    return client.api('/sites');
  }
}
```

#### **День 5: Создание базовых SharePoint операций**

**📝 Создание Azure Function для базовых операций:**
```typescript
// api/src/functions/sharePointBasic.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { GraphClientService } from '../shared/graphClient';

// Получение информации о SharePoint сайте
app.http('getSharePointSite', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sites/{siteId}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return { status: 200, headers: corsHeaders };
    }

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!accessToken) {
        return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'No access token' }) };
      }

      const siteId = req.params.get('siteId');
      const graphService = GraphClientService.getInstance();
      const graphClient = await graphService.initializeClient(accessToken);

      const site = await graphClient.api(`/sites/${siteId}`).get();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(site)
      };
    } catch (error: any) {
      ctx.error('SharePoint site get error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
});

// Получение списка файлов в SharePoint
app.http('getSharePointFiles', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/sites/{siteId}/files',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
      const siteId = req.params.get('siteId');
      const folderPath = req.query.get('folderPath') || '';

      const graphService = GraphClientService.getInstance();
      const graphClient = await graphService.initializeClient(accessToken);

      let apiPath = `/sites/${siteId}/drive/root/children`;
      if (folderPath) {
        apiPath = `/sites/${siteId}/drive/root:/${folderPath}:/children`;
      }

      const files = await graphClient.api(apiPath).get();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(files)
      };
    } catch (error: any) {
      ctx.error('SharePoint files get error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
});
```

---

### **НЕДЕЛЯ 2: СОЗДАНИЕ SHAREPOINT САЙТОВ ДЛЯ END USERS**

#### **День 1-3: Автоматическое создание сайтов**

**🏗️ Создание SharePoint сайтов для End Users:**
```typescript
// api/src/functions/sharePointProvisioning.ts
app.http('createEndUserSite', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/provision-site',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
      const { endUserId, endUserName, endUserEmail, organizationId } = await req.json();

      const graphService = GraphClientService.getInstance();
      const graphClient = await graphService.initializeClient(accessToken);

      // Создание SharePoint Team Site
      const siteCreationRequest = {
        displayName: `Documents - ${endUserName}`,
        name: `docs-${endUserId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        description: `Document workspace for ${endUserName} (${endUserEmail})`,
        template: 'STS#3', // Team Site template
        webTemplate: 'STS',
        language: 1033 // English
      };

      // Создаем сайт через SharePoint Admin API
      const newSite = await graphClient
        .api('/sites/root/sites')
        .post(siteCreationRequest);

      ctx.log(`SharePoint site created: ${newSite.id} for End User: ${endUserName}`);

      // Ожидание создания сайта (может занять несколько минут)
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 секунд

      // Создание папочной структуры
      await createFolderStructure(graphClient, newSite.id, endUserId, ctx);

      // Настройка разрешений
      await configureSitePermissions(graphClient, newSite.id, endUserEmail, organizationId, ctx);

      // Сохранение информации о сайте в CosmosDB
      await saveSiteInfoToDatabase(newSite, endUserId, organizationId);

      return {
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'SharePoint site created successfully',
          site: {
            id: newSite.id,
            url: newSite.webUrl,
            name: newSite.displayName
          }
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint site creation error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
});

// Создание папочной структуры согласно Project Description
async function createFolderStructure(
  graphClient: Client,
  siteId: string,
  endUserId: string,
  ctx: InvocationContext
) {
  const folders = [
    'DMS', // Внутреннее хранилище для сотрудников
    'Portal', // Портал для End User
    'Portal/To End User', // От фирмы к End User
    'Portal/From End User' // От End User к фирме
  ];

  for (const folderPath of folders) {
    try {
      const folderParts = folderPath.split('/');
      let currentPath = '';

      for (const part of folderParts) {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        try {
          // Проверяем существует ли папка
          await graphClient
            .api(`/sites/${siteId}/drive/root:/${currentPath}`)
            .get();
        } catch {
          // Папка не существует, создаем
          const createPath = parentPath 
            ? `/sites/${siteId}/drive/root:/${parentPath}:/children`
            : `/sites/${siteId}/drive/root/children`;

          await graphClient
            .api(createPath)
            .post({
              name: part,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename'
            });

          ctx.log(`Created folder: ${currentPath} in site ${siteId}`);
        }
      }
    } catch (error: any) {
      ctx.error(`Failed to create folder ${folderPath}:`, error);
    }
  }
}

// Настройка разрешений сайта
async function configureSitePermissions(
  graphClient: Client,
  siteId: string,
  endUserEmail: string,
  organizationId: string,
  ctx: InvocationContext
) {
  try {
    // Предоставляем читательские права End User'у
    await graphClient
      .api(`/sites/${siteId}/permissions`)
      .post({
        recipients: [{ email: endUserEmail }],
        message: "You have been granted access to your document workspace",
        requireSignIn: true,
        sendInvitation: true,
        roles: ["read"]
      });

    ctx.log(`Permissions granted to End User: ${endUserEmail} for site ${siteId}`);

    // Получение административных пользователей организации
    const adminUsers = await getOrganizationAdmins(organizationId);
    
    // Предоставляем полный доступ администраторам организации
    for (const admin of adminUsers) {
      await graphClient
        .api(`/sites/${siteId}/permissions`)
        .post({
          recipients: [{ email: admin.email }],
          roles: ["owner"]
        });
    }

    ctx.log(`Admin permissions granted for site ${siteId}`);
  } catch (error: any) {
    ctx.error(`Failed to configure permissions for site ${siteId}:`, error);
  }
}
```

#### **День 4-5: Интеграция с существующей системой**

**🔗 Связывание SharePoint сайтов с End Users:**
```typescript
// Обновление CosmosDB schema для хранения SharePoint информации
interface EndUserWithSharePoint extends EndUser {
  sharePointSite?: {
    siteId: string;
    siteUrl: string;
    driveId: string;
    created: string;
  };
}

// api/src/functions/endUsers.ts - обновление
// Добавить в создание End User автоматическое создание SharePoint сайта
const handleCreateEndUserWithSite = async (endUserData: EndUserFormData) => {
  // Создаем End User
  const endUser = await createEndUser(endUserData);
  
  // Создаем SharePoint сайт
  const siteResponse = await fetch('/api/sharepoint/provision-site', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      endUserId: endUser.id,
      endUserName: endUser.displayName,
      endUserEmail: endUser.email,
      organizationId: endUser.organizationId
    })
  });
  
  if (siteResponse.ok) {
    const siteData = await siteResponse.json();
    
    // Обновляем End User с информацией о SharePoint сайте
    const updatedEndUser = {
      ...endUser,
      sharePointSite: {
        siteId: siteData.site.id,
        siteUrl: siteData.site.url,
        driveId: siteData.site.driveId,
        created: new Date().toISOString()
      }
    };
    
    // Сохраняем обновленного End User
    await updateEndUser(endUser.id, { sharePointSite: updatedEndUser.sharePointSite });
  }
  
  return endUser;
};
```

---

### **НЕДЕЛЯ 3: ОПЕРАЦИИ С ДОКУМЕНТАМИ**

#### **День 1-2: Загрузка файлов в SharePoint**

**⬆️ Загрузка документов в SharePoint:**
```typescript
// api/src/functions/sharePointDocuments.ts
app.http('uploadToSharePoint', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint/upload',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
      const { 
        fileBuffer,
        fileName,
        endUserId,
        folderType, // 'dms' | 'portal-to-end-user' | 'portal-from-end-user'
        metadata 
      } = await req.json();

      // Получаем информацию об End User и его SharePoint сайте
      const endUser = await getEndUserById(endUserId);
      if (!endUser?.sharePointSite) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'End User SharePoint site not found' })
        };
      }

      const graphService = GraphClientService.getInstance();
      const graphClient = await graphService.initializeClient(accessToken);

      // Определяем путь загрузки на основе типа папки
      const folderPath = getFolderPath(folderType);
      const uploadPath = `/sites/${endUser.sharePointSite.siteId}/drive/root:/${folderPath}/${fileName}:/content`;

      // Загружаем файл
      const buffer = Buffer.from(fileBuffer);
      const driveItem = await graphClient
        .api(uploadPath)
        .put(buffer);

      ctx.log(`File uploaded to SharePoint: ${fileName} for End User: ${endUserId}`);

      // Сохраняем метаданные документа в CosmosDB
      const documentRecord = {
        id: `sp_${driveItem.id}`,
        partitionKey: endUserId,
        type: 'sharepoint-document',
        sharePointItemId: driveItem.id,
        sharePointSiteId: endUser.sharePointSite.siteId,
        name: fileName,
        webUrl: driveItem.webUrl,
        downloadUrl: driveItem['@microsoft.graph.downloadUrl'],
        folderType,
        metadata,
        createdAt: new Date().toISOString(),
        endUserId,
        organizationId: endUser.organizationId
      };

      const container = getContainer('documents');
      await container.items.create(documentRecord);

      return {
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'File uploaded successfully',
          document: documentRecord,
          sharePointItem: driveItem
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint upload error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
});

function getFolderPath(folderType: string): string {
  switch (folderType) {
    case 'dms':
      return 'DMS';
    case 'portal-to-end-user':
      return 'Portal/To End User';
    case 'portal-from-end-user':
      return 'Portal/From End User';
    default:
      return 'Portal';
  }
}
```

#### **День 3-4: Открытие документов в SharePoint**

**📂 Открытие и редактирование документов:**
```typescript
app.http('openSharePointDocument', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sharepoint/open/{documentId}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
      const documentId = req.params.get('documentId');
      const openMode = req.query.get('mode') || 'view'; // 'view' | 'edit'

      // Получаем документ из CosmosDB
      const container = getContainer('documents');
      const { resource: document } = await container.item(documentId).read();

      if (!document || !document.sharePointItemId) {
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Document not found in SharePoint' })
        };
      }

      const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
      const graphService = GraphClientService.getInstance();
      const graphClient = await graphService.initializeClient(accessToken);

      // Получаем актуальную информацию о документе из SharePoint
      const driveItem = await graphClient
        .api(`/sites/${document.sharePointSiteId}/drive/items/${document.sharePointItemId}`)
        .get();

      let openUrl = driveItem.webUrl;
      
      // Если нужно открыть в режиме редактирования
      if (openMode === 'edit') {
        openUrl = `${driveItem.webUrl}?web=1`; // Открывает в Office Online
      }

      // Обновляем lastAccessTime в CosmosDB
      await container.item(documentId).patch([
        { op: 'replace', path: '/lastAccessTime', value: new Date().toISOString() }
      ]);

      ctx.log(`Document opened: ${document.name} for End User: ${document.endUserId}`);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          openUrl,
          document: {
            id: document.id,
            name: document.name,
            webUrl: driveItem.webUrl,
            lastModifiedDateTime: driveItem.lastModifiedDateTime,
            size: driveItem.size
          }
        })
      };
    } catch (error: any) {
      ctx.error('SharePoint document open error:', error);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
});
```

#### **День 5: Frontend интеграция**

**⚛️ React компоненты для SharePoint:**
```typescript
// src/shared/api/sharePointApi.ts
export class SharePointApiClient {
  static async uploadToSharePoint(
    file: File,
    endUserId: string,
    folderType: 'dms' | 'portal-to-end-user' | 'portal-from-end-user',
    metadata?: any
  ): Promise<any> {
    const fileBuffer = await file.arrayBuffer();
    
    const response = await apiClient.post('/sharepoint/upload', {
      fileBuffer: Array.from(new Uint8Array(fileBuffer)),
      fileName: file.name,
      endUserId,
      folderType,
      metadata
    });
    
    return response;
  }
  
  static async openSharePointDocument(
    documentId: string,
    mode: 'view' | 'edit' = 'view'
  ): Promise<any> {
    return await apiClient.get(`/sharepoint/open/${documentId}?mode=${mode}`);
  }
  
  static async getSharePointFiles(
    endUserId: string,
    folderType?: string
  ): Promise<any> {
    const endUser = await endUserApi.getEndUserById(endUserId);
    if (!endUser.sharePointSite) {
      throw new Error('End User SharePoint site not found');
    }
    
    const folderPath = folderType ? getFolderPath(folderType) : '';
    return await apiClient.get(
      `/sharepoint/sites/${endUser.sharePointSite.siteId}/files?folderPath=${folderPath}`
    );
  }
  
  static async createEndUserSite(endUser: EndUser): Promise<any> {
    return await apiClient.post('/sharepoint/provision-site', {
      endUserId: endUser.id,
      endUserName: endUser.displayName,
      endUserEmail: endUser.email,
      organizationId: endUser.organizationId
    });
  }
}
```

**🖼️ UI компонент для SharePoint операций:**
```typescript
// src/components/SharePoint/SharePointIntegration.tsx
import React, { useState } from 'react';
import { SharePointApiClient } from '../../shared/api/sharePointApi';
import { useSelectedEndUser } from '../EndUser';

export const SharePointIntegration: React.FC = () => {
  const { selectedEndUser } = useSelectedEndUser();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadToSharePoint = async (
    files: FileList,
    folderType: 'dms' | 'portal-to-end-user' | 'portal-from-end-user'
  ) => {
    if (!selectedEndUser) {
      alert('Please select an End User first');
      return;
    }

    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        await SharePointApiClient.uploadToSharePoint(
          file,
          selectedEndUser.id,
          folderType
        );
      }
      
      // Показываем успешное сообщение
      alert('Files uploaded to SharePoint successfully');
      
      // Обновляем список документов
      window.location.reload();
    } catch (error) {
      console.error('SharePoint upload failed:', error);
      alert('Failed to upload files to SharePoint');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenInSharePoint = async (documentId: string, editMode = false) => {
    try {
      const response = await SharePointApiClient.openSharePointDocument(
        documentId,
        editMode ? 'edit' : 'view'
      );
      
      // Открываем в новом окне
      window.open(response.openUrl, '_blank');
    } catch (error) {
      console.error('Failed to open in SharePoint:', error);
      alert('Failed to open document in SharePoint');
    }
  };

  return (
    <div className="sharepoint-integration">
      <h3>SharePoint Integration</h3>
      
      {/* Upload to DMS */}
      <div className="upload-section">
        <h4>Upload to DMS (Internal)</h4>
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleUploadToSharePoint(e.target.files, 'dms')}
          disabled={isUploading || !selectedEndUser}
        />
      </div>

      {/* Upload to Portal */}
      <div className="upload-section">
        <h4>Upload to Portal (To End User)</h4>
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleUploadToSharePoint(e.target.files, 'portal-to-end-user')}
          disabled={isUploading || !selectedEndUser}
        />
      </div>

      {/* Upload from End User */}
      <div className="upload-section">
        <h4>Upload from End User</h4>
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleUploadToSharePoint(e.target.files, 'portal-from-end-user')}
          disabled={isUploading || !selectedEndUser}
        />
      </div>

      {isUploading && <div>Uploading files to SharePoint...</div>}
    </div>
  );
};
```

---

## 🔧 **ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ**

### **Зависимости (package.json):**
```json
{
  "dependencies": {
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "@microsoft/microsoft-graph-types": "^2.40.0",
    "@azure/msal-node": "^1.18.4",
    "@azure/msal-browser": "^2.38.4",
    "@microsoft/teamsfx": "^2.2.0"
  }
}
```

### **Environment Variables:**
```bash
# Azure AD App Registration
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret  
AZURE_TENANT_ID=your-tenant-id
AZURE_AUTHORITY_HOST=https://login.microsoftonline.com

# SharePoint Configuration
SHAREPOINT_ROOT_SITE_URL=https://yourtenant.sharepoint.com
SHAREPOINT_ADMIN_URL=https://yourtenant-admin.sharepoint.com

# Microsoft Graph API
GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
```

### **CosmosDB Schema Updates:**
```typescript
// Новые контейнеры
containers: [
  'documents',
  'end-users',
  'sharepoint-sites', // Информация о созданных SharePoint сайтах
  'document-permissions', // Разрешения на документы
  'sharepoint-webhooks' // Webhooks для синхронизации с SharePoint
]

// Обновленная схема документов
interface SharePointDocument {
  id: string;
  partitionKey: string; // endUserId
  type: 'sharepoint-document';
  
  // SharePoint специфичная информация
  sharePointItemId: string;
  sharePointSiteId: string;
  sharePointDriveId: string;
  
  // Базовая информация о документе
  name: string;
  webUrl: string;
  downloadUrl: string;
  
  // Папочная структура
  folderType: 'dms' | 'portal-to-end-user' | 'portal-from-end-user';
  folderPath: string;
  
  // Метаданные
  metadata?: any;
  tags?: string[];
  
  // Временные метки
  createdAt: string;
  lastModifiedAt: string;
  lastAccessTime?: string;
  
  // Связи
  endUserId: string;
  organizationId: string;
  createdBy: string;
}
```

---

## 🧪 **ТЕСТИРОВАНИЕ И ОТЛАДКА**

### **Тестовые сценарии:**

1. **Создание End User с SharePoint сайтом:**
   ```bash
   POST /api/end-users
   {
     "firstName": "John",
     "lastName": "Doe", 
     "email": "john.doe@example.com",
     "createSharePointSite": true
   }
   ```

2. **Загрузка файла в SharePoint:**
   ```bash
   POST /api/sharepoint/upload
   {
     "fileBuffer": [...],
     "fileName": "test-document.pdf",
     "endUserId": "enduser_123",
     "folderType": "portal-to-end-user"
   }
   ```

3. **Открытие документа в SharePoint:**
   ```bash
   GET /api/sharepoint/open/sp_item_456?mode=edit
   ```

### **Мониторинг и логирование:**
```typescript
// Добавить в каждую Azure Function
ctx.log('SharePoint operation:', {
  operation: 'upload',
  endUserId,
  fileName,
  siteId: endUser.sharePointSite.siteId,
  timestamp: new Date().toISOString()
});

// Application Insights tracking
trackEvent('SharePointDocumentUploaded', {
  endUserId,
  fileName,
  folderType,
  siteId
});
```

---

## 🚀 **РАЗВЕРТЫВАНИЕ И PRODUCTION**

### **Checklist для Production:**

- [ ] Azure AD App Registration настроена с необходимыми разрешениями
- [ ] SharePoint Admin Center настроен для создания сайтов
- [ ] CosmosDB контейнеры созданы
- [ ] Azure Functions развернуты и протестированы
- [ ] Frontend компоненты интегрированы
- [ ] Разрешения настроены корректно
- [ ] Мониторинг и логирование работает
- [ ] Backup стратегия для SharePoint данных
- [ ] Error handling и recovery процедуры

### **Безопасность:**
- Все API endpoints защищены аутентификацией
- Разрешения в SharePoint настроены по принципу least privilege
- Sensitive данные не логируются
- CORS настроен для production доменов
- Rate limiting включен для API endpoints

---

**📋 План готов к исполнению!**
*Время выполнения: 3 недели*
*Статус: Ready for Implementation*
