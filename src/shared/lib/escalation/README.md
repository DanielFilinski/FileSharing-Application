# Escalation System

Система эскалации для управления инцидентами и проблемами в приложении.

## 🚨 Возможности

### Основные функции
- **13 типов эскалаций** - от storage overflow до security breach
- **4 уровня приоритета** - low, medium, high, critical
- **6 статусов** - open, acknowledged, in_progress, resolved, closed, escalated
- **SLA tracking** - автоматический расчет времени ответа и решения
- **Auto-escalation** - автоматическая эскалация просроченных задач
- **Multi-channel notifications** - email, Teams, SMS, in-app
- **Audit trail** - полная история изменений
- **Comments system** - комментарии и внутренние заметки

### Типы эскалаций
1. **Storage Overflow** - превышение квоты хранилища
2. **Storage Quota Warning** - предупреждение о приближении к лимиту
3. **Document Validation Failed** - ошибка валидации документа
4. **Document Approval Overdue** - просроченное утверждение
5. **Document Signing Failed** - ошибка подписания
6. **SharePoint Sync Failed** - ошибка синхронизации SharePoint
7. **System Error** - системная ошибка
8. **Security Breach** - нарушение безопасности
9. **User Access Issue** - проблема доступа пользователя
10. **Workflow Blocked** - заблокированный workflow
11. **Deadline Missed** - пропущенный дедлайн
12. **API Integration Failed** - ошибка API интеграции
13. **Custom** - пользовательская эскалация

## 🏗️ Архитектура

### Core Services
- **EscalationManager** - управление жизненным циклом эскалаций
- **NotificationService** - отправка уведомлений через различные каналы

### Backend API
- `POST /api/escalations` - создание эскалации
- `GET /api/escalations` - получение списка с фильтрами
- `GET /api/escalations/{id}` - получение деталей эскалации
- `PATCH /api/escalations/{id}` - обновление эскалации
- `POST /api/escalations/{id}/comments` - добавление комментария

### Frontend Components
- **EscalationList** - основной компонент списка эскалаций
- **CreateEscalationDialog** - диалог создания эскалации
- **EscalationDetailsDialog** - диалог просмотра деталей
- **useEscalation** - React hook для управления эскалациями

## 📊 SLA Configuration

### Время ответа по приоритету
- **Critical**: 1 час
- **High**: 4 часа
- **Medium**: 24 часа
- **Low**: 48 часов

### Время решения по приоритету
- **Critical**: 1 час
- **High**: 4 часа
- **Medium**: 24 часа
- **Low**: 48 часов

### Auto-escalation
- **Critical**: 2 часа
- **High**: 8 часов
- **Medium**: 2 дня
- **Low**: 3 дня

## 🔔 Notification Channels

### Поддерживаемые каналы
1. **Email** - уведомления по электронной почте
2. **Teams** - уведомления в Microsoft Teams
3. **SMS** - SMS уведомления
4. **In-app** - уведомления в приложении
5. **Webhook** - HTTP webhook уведомления

### Шаблоны уведомлений
- Создание эскалации
- Изменение статуса
- Просрочка SLA
- Разрешение эскалации

## 🎯 Usage Examples

### Создание эскалации
```typescript
import { escalationService } from '../api/escalationService';

// Storage overflow
const result = await escalationService.createStorageOverflowEscalation(
  'user123',
  'John Doe',
  9500000000, // 9.5GB used
  10000000000, // 10GB total
  95 // 95% usage
);

// System error
const result = await escalationService.createSystemErrorEscalation(
  'Database connection failed',
  'DB_CONN_001',
  'Error stack trace...'
);
```

### React Hook
```typescript
import { useEscalations } from '../hooks/useEscalation';

const MyComponent = () => {
  const { escalations, loading, createEscalation } = useEscalations({
    status: 'open',
    priority: 'high'
  });

  const handleCreate = async () => {
    const result = await createEscalation({
      type: 'custom',
      title: 'Issue Title',
      description: 'Issue description',
      priority: 'high'
    });
  };

  return (
    <div>
      {loading ? 'Loading...' : (
        <ul>
          {escalations.map(esc => (
            <li key={esc.id}>{esc.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### Компонент списка
```typescript
import { EscalationList } from '../components/Escalation';

const EscalationsPage = () => {
  return (
    <EscalationList
      tenantId="tenant123"
      autoRefresh={true}
    />
  );
};
```

## 🔧 Configuration

### EscalationConfig
```typescript
const config: EscalationConfig = {
  defaultResponseTimeMinutes: 30,
  defaultResolutionTimeMinutes: {
    low: 48 * 60,        // 48 hours
    medium: 24 * 60,     // 24 hours
    high: 4 * 60,        // 4 hours
    critical: 60,        // 1 hour
  },
  autoEscalateEnabled: true,
  enableEmailNotifications: true,
  enableTeamsNotifications: true,
  storageWarningThreshold: 80,
  storageCriticalThreshold: 95,
};
```

## 📈 Statistics & Metrics

### Доступные метрики
- Общее количество эскалаций
- Распределение по статусам
- Распределение по приоритетам
- Распределение по типам
- Среднее время ответа
- Среднее время решения
- Процент соблюдения SLA
- Количество просроченных эскалаций

### Dashboard Integration
```typescript
import { useEscalationStatistics } from '../hooks/useEscalation';

const StatsWidget = () => {
  const { statistics, loading } = useEscalationStatistics({
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <h3>Escalation Statistics</h3>
      <p>Total: {statistics?.total}</p>
      <p>Open: {statistics?.byStatus?.open}</p>
      <p>Overdue: {statistics?.overdue}</p>
      <p>SLA Compliance: {statistics?.slaCompliance}%</p>
    </div>
  );
};
```

## 🔒 Security & Compliance

### Audit Trail
- Полная история всех изменений
- Отслеживание пользователей и времени
- Логирование всех действий

### Access Control
- Интеграция с RBAC системой
- Различные уровни доступа
- Внутренние vs публичные комментарии

### Data Retention
- Соблюдение политик хранения данных
- Автоматическая архивация
- Экспорт для compliance

## 🚀 Deployment

### Backend
1. Deploy Azure Functions
2. Configure Cosmos DB containers
3. Set up notification services
4. Configure environment variables

### Frontend
1. Import escalation components
2. Configure API endpoints
3. Set up notification channels
4. Customize SLA settings

## 📝 Future Enhancements

### Planned Features
- **Escalation Rules Engine** - настраиваемые правила автоматической эскалации
- **Escalation Dashboard** - dedicated dashboard для мониторинга
- **Integration APIs** - интеграция с внешними системами
- **Advanced Analytics** - детальная аналитика и отчеты
- **Mobile Notifications** - push уведомления для мобильных устройств
- **Escalation Templates** - шаблоны для быстрого создания эскалаций

### Integration Points
- **Document Management** - автоматические эскалации при проблемах с документами
- **Storage Management** - мониторинг использования хранилища
- **User Management** - эскалации при проблемах с доступом
- **Workflow Engine** - интеграция с workflow процессами
- **SharePoint** - синхронизация и мониторинг состояния

## 🛠️ Troubleshooting

### Common Issues
1. **Notifications not sending** - проверьте конфигурацию каналов
2. **Auto-escalation not working** - проверьте настройки правил
3. **SLA calculations incorrect** - проверьте временные зоны
4. **Performance issues** - оптимизируйте запросы к базе данных

### Debug Mode
```typescript
// Enable debug logging
const escalationManager = new EscalationManager({
  debug: true,
  logLevel: 'verbose'
});
```

---

**Статус**: ✅ Полностью реализовано  
**Версия**: 1.0.0  
**Последнее обновление**: Декабрь 2024
