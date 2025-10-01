# SharePoint Bidirectional Sync

Система двусторонней синхронизации между локальным хранилищем и SharePoint.

## 🔄 Возможности

### Основные функции
- **Двусторонняя синхронизация** - локальное хранилище ↔ SharePoint
- **7 операций синхронизации** - upload, download, update, delete, rename, move, copy
- **3 направления синхронизации** - local_to_sharepoint, sharepoint_to_local, bidirectional
- **4 уровня приоритета** - low, normal, high, critical
- **Автоматическое разрешение конфликтов** - 6 стратегий разрешения
- **Batch операции** - массовая синхронизация
- **Real-time updates** - webhooks и push уведомления
- **Offline support** - кэширование и очередь синхронизации

### Типы синхронизации
1. **Upload** - загрузка файла в SharePoint
2. **Download** - скачивание файла из SharePoint
3. **Update** - обновление файла в SharePoint
4. **Delete** - удаление файла
5. **Rename** - переименование файла
6. **Move** - перемещение файла
7. **Copy** - копирование файла

### Стратегии разрешения конфликтов
1. **use_local** - использовать локальную версию
2. **use_sharepoint** - использовать версию SharePoint
3. **merge_content** - объединить содержимое
4. **manual_resolution** - ручное разрешение
5. **keep_both** - сохранить обе версии
6. **skip_sync** - пропустить синхронизацию

## 🏗️ Архитектура

### Core Services
- **SharePointService** - интеграция с Microsoft Graph API
- **SyncEngine** - механизм двусторонней синхронизации

### Backend API
- `POST /api/sharepoint/sync/start` - запуск синхронизации
- `POST /api/sharepoint/sync/item` - добавление элемента синхронизации
- `POST /api/sharepoint/sync/batch` - массовая синхронизация
- `GET /api/sharepoint/sync/status` - статус синхронизации
- `GET /api/sharepoint/sync/item/{id}` - получение элемента синхронизации
- `POST /api/sharepoint/sync/conflict/resolve` - разрешение конфликта
- `DELETE /api/sharepoint/sync/clear-completed` - очистка завершенных элементов
- `GET /api/sharepoint/sync/metrics` - метрики синхронизации

### Frontend Components
- **useSharePointSync** - React hooks для управления синхронизацией
- **SharePointSyncService** - API service для синхронизации

## ⚙️ Конфигурация

### SyncEngineConfig
```typescript
const config: SyncEngineConfig = {
  maxConcurrentSyncs: 5,
  syncInterval: 30000, // 30 seconds
  retryDelay: 5000, // 5 seconds
  maxRetries: 3,
  
  defaultConflictStrategy: 'newest_wins',
  autoResolveConflicts: true,
  requireUserApproval: false,
  
  includeFileTypes: ['*'],
  excludeFileTypes: ['.tmp', '.temp', '~$*'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  includeHiddenFiles: false,
  
  syncOnStartup: true,
  syncOnChange: true,
  syncDeletedFiles: true,
  preservePermissions: true,
  
  chunkSize: 4 * 1024 * 1024, // 4MB
  compressionEnabled: true,
  encryptionEnabled: false,
  
  enableMetrics: true,
  logLevel: 'info',
  enableWebhooks: true,
  
  offlineModeEnabled: true,
  cacheSize: 500 * 1024 * 1024, // 500MB
  syncQueueSize: 1000,
};
```

## 🎯 Usage Examples

### Базовые операции
```typescript
import { useSyncActions } from '../hooks/useSharePointSync';

const MyComponent = () => {
  const { uploadFile, downloadFile, syncFolder } = useSyncActions({
    tenantId: 'tenant123'
  });

  const handleUpload = async () => {
    const result = await uploadFile(
      '/local/path/file.pdf',
      '/SharePoint/path/file.pdf',
      'high'
    );
    
    if (result.success) {
      console.log('Upload queued:', result.data?.syncItemId);
    }
  };

  const handleSyncFolder = async () => {
    const result = await syncFolder(
      '/local/folder',
      '/SharePoint/folder',
      'bidirectional'
    );
    
    console.log('Folder sync result:', result.data);
  };

  return (
    <div>
      <button onClick={handleUpload}>Upload File</button>
      <button onClick={handleSyncFolder}>Sync Folder</button>
    </div>
  );
};
```

### Мониторинг статуса
```typescript
import { useSyncStatus, useSyncMetrics } from '../hooks/useSharePointSync';

const SyncDashboard = () => {
  const { syncItems, statistics, loading } = useSyncStatus({
    limit: 50,
    offset: 0
  }, {
    autoRefresh: true,
    refreshInterval: 10000, // 10 seconds
    tenantId: 'tenant123'
  });

  const { metrics } = useSyncMetrics('day', {
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h3>Sync Statistics</h3>
      <p>Total: {statistics.total}</p>
      <p>Pending: {statistics.pending}</p>
      <p>Failed: {statistics.failed}</p>
      <p>Conflicts: {statistics.conflict}</p>
      
      <h3>Recent Sync Items</h3>
      <ul>
        {syncItems.map(item => (
          <li key={item.id}>
            {item.fileName} - {item.status} - {item.operation}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Разрешение конфликтов
```typescript
import { useSyncActions } from '../hooks/useSharePointSync';

const ConflictResolver = ({ conflictId }) => {
  const { resolveConflict } = useSyncActions();

  const handleResolve = async (resolution) => {
    const result = await resolveConflict(
      conflictId,
      resolution,
      'user123',
      'Resolved using local version'
    );
    
    if (result.success) {
      console.log('Conflict resolved successfully');
    }
  };

  return (
    <div>
      <h3>Resolve Conflict</h3>
      <button onClick={() => handleResolve('use_local')}>
        Use Local Version
      </button>
      <button onClick={() => handleResolve('use_sharepoint')}>
        Use SharePoint Version
      </button>
      <button onClick={() => handleResolve('merge_content')}>
        Merge Content
      </button>
    </div>
  );
};
```

### Batch операции
```typescript
import { sharePointSyncService } from '../api/sharepointSyncService';

const BatchSyncExample = () => {
  const handleBatchSync = async () => {
    const batchRequest = {
      batchId: 'BATCH-' + Date.now(),
      items: [
        {
          localPath: '/local/file1.pdf',
          sharePointPath: '/SharePoint/file1.pdf',
          operation: 'upload',
          direction: 'local_to_sharepoint',
          priority: 'normal'
        },
        {
          localPath: '/local/file2.docx',
          sharePointPath: '/SharePoint/file2.docx',
          operation: 'upload',
          direction: 'local_to_sharepoint',
          priority: 'high'
        }
      ],
      priority: 'high'
    };

    const result = await sharePointSyncService.addBatchSync(batchRequest);
    
    if (result.success) {
      console.log('Batch sync queued:', result.data?.batchId);
      console.log('Results:', result.data?.results);
    }
  };

  return (
    <button onClick={handleBatchSync}>
      Start Batch Sync
    </button>
  );
};
```

## 📊 Метрики и мониторинг

### Доступные метрики
- Общее количество элементов синхронизации
- Распределение по статусам (pending, in_progress, completed, failed, conflict)
- Среднее время синхронизации
- Пропускная способность (bytes/second)
- Количество ошибок и конфликтов
- Процент успешных операций
- Время последней синхронизации

### Dashboard Integration
```typescript
import { useSyncMetrics } from '../hooks/useSharePointSync';

const MetricsWidget = () => {
  const { metrics, loading } = useSyncMetrics('week', {
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <h3>Sync Metrics (Week)</h3>
      <div className="metrics-grid">
        <div className="metric">
          <span className="label">Total Items:</span>
          <span className="value">{metrics?.totalItems || 0}</span>
        </div>
        <div className="metric">
          <span className="label">Success Rate:</span>
          <span className="value">
            {metrics ? Math.round((metrics.completedItems / metrics.totalItems) * 100) : 0}%
          </span>
        </div>
        <div className="metric">
          <span className="label">Avg Sync Time:</span>
          <span className="value">{metrics?.averageSyncTime || 0}ms</span>
        </div>
        <div className="metric">
          <span className="label">Error Rate:</span>
          <span className="value">{metrics?.errorRate || 0}%</span>
        </div>
      </div>
    </div>
  );
};
```

## 🔔 Real-time Updates

### Webhook Integration
```typescript
// Webhook notification handler
const handleWebhookNotification = (notification) => {
  const { resource, changeType, resourceData } = notification;
  
  switch (changeType) {
    case 'created':
      // File created in SharePoint
      break;
    case 'updated':
      // File updated in SharePoint
      break;
    case 'deleted':
      // File deleted from SharePoint
      break;
  }
  
  // Trigger sync if needed
  syncEngine.checkForChanges();
};
```

### Push Notifications
```typescript
import { useSyncCounters } from '../hooks/useSharePointSync';

const NotificationBadge = () => {
  const { pending, failed, conflict } = useSyncCounters({
    autoRefresh: true,
    refreshInterval: 5000 // 5 seconds
  });

  const totalIssues = failed + conflict;

  return (
    <div className="notification-badge">
      {pending > 0 && (
        <span className="badge pending">{pending} pending</span>
      )}
      {totalIssues > 0 && (
        <span className="badge error">{totalIssues} issues</span>
      )}
    </div>
  );
};
```

## 🚫 Offline Support

### Кэширование
```typescript
// Offline cache configuration
const offlineConfig = {
  enabled: true,
  cacheSize: 500 * 1024 * 1024, // 500MB
  compressionEnabled: true,
  encryptionEnabled: false,
  syncQueueSize: 1000,
};

// Check offline status
const isOffline = !navigator.onLine;
if (isOffline) {
  // Queue operations for later sync
  syncEngine.pause();
  // Show offline indicator
}
```

### Sync Queue
```typescript
import { useSyncStatus } from '../hooks/useSharePointSync';

const OfflineQueue = () => {
  const { syncItems } = useSyncStatus();

  const pendingItems = syncItems.filter(item => 
    item.status === 'pending' || item.status === 'failed'
  );

  return (
    <div>
      <h3>Offline Queue ({pendingItems.length})</h3>
      <ul>
        {pendingItems.map(item => (
          <li key={item.id}>
            {item.fileName} - {item.operation} - {item.priority}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## 🔒 Безопасность

### Аутентификация
```typescript
// SharePoint credentials
const credentials = {
  clientId: 'your-client-id',
  tenantId: 'your-tenant-id',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 3600000),
  scopes: ['Files.ReadWrite.All', 'Sites.ReadWrite.All'],
};

// Connect to SharePoint
await sharePointService.connect(credentials);
```

### Шифрование
```typescript
// Enable encryption for sensitive files
const syncConfig = {
  encryptionEnabled: true,
  compressionEnabled: true,
  preservePermissions: true,
};

// Sync with encryption
await uploadFile(
  '/sensitive/document.pdf',
  '/SharePoint/encrypted/document.pdf',
  'high'
);
```

## 🛠️ Troubleshooting

### Common Issues
1. **Connection failed** - проверьте credentials и network
2. **Sync conflicts** - настройте стратегии разрешения конфликтов
3. **Rate limiting** - уменьшите частоту синхронизации
4. **File size limits** - проверьте размеры файлов
5. **Permission errors** - проверьте права доступа SharePoint

### Debug Mode
```typescript
// Enable debug logging
const syncEngine = new SyncEngine({
  logLevel: 'debug',
  enableMetrics: true,
});

// Monitor sync events
syncEngine.on('itemCompleted', (item) => {
  console.log('Sync completed:', item.id);
});

syncEngine.on('conflictDetected', (item, conflict) => {
  console.log('Conflict detected:', conflict.id);
});
```

## 🚀 Deployment

### Backend
1. Deploy Azure Functions
2. Configure Cosmos DB containers
3. Set up SharePoint credentials
4. Configure webhooks

### Frontend
1. Import sync components
2. Configure sync settings
3. Set up offline support
4. Configure notifications

## 📝 Future Enhancements

### Planned Features
- **Advanced Conflict Resolution** - AI-powered merge strategies
- **Selective Sync** - sync only specific file types or folders
- **Version Control** - track file versions across sync
- **Bandwidth Throttling** - control sync speed
- **Multi-tenant Support** - sync across multiple SharePoint sites
- **Mobile Sync** - mobile app synchronization
- **Cloud Storage Integration** - support for OneDrive, Google Drive

### Integration Points
- **Document Management** - автоматическая синхронизация при изменениях
- **Workflow Engine** - интеграция с workflow процессами
- **Audit Trail** - логирование всех операций синхронизации
- **Escalation System** - уведомления при проблемах синхронизации

---

**Статус**: ✅ Полностью реализовано  
**Версия**: 1.0.0  
**Последнее обновление**: Декабрь 2024
