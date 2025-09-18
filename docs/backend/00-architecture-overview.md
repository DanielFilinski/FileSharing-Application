# AZURE FUNCTIONS ARCHITECTURE OVERVIEW

Статус: 10% — базовая структура `api/` (Functions v4, TypeScript) есть; остальная реализация отсутствует

## Стек (адаптация под Node/TS Azure Functions)

- Frontend (React, уже в `src/`)
- Azure Functions (HTTP Triggers, Service Bus Triggers, Durable Orchestrations) — каталог `api/`
- Cosmos DB (документы/чаты) + Azure SQL (пользователи/роли)
- Azure Blob Storage (файлы) + CDN
- Azure Service Bus (асинхронные события)
- Azure SignalR Service (реалтайм)
- Redis Cache (кэширование, опционально)
- Application Insights (логирование/метрики)

## Ключевые решения

- Бэкенд только на Azure Functions (без выделенных VM/K8s)
- HTTP-триггеры для API, выходные биндинги для SignalR/Service Bus, SDK для Blob/Cosmos/SQL
- Durable Functions (пакет `durable-functions`) для согласований
- Аутентификация: Azure AD B2C + валидация JWT в каждом HTTP-триггере

## Высокоуровневый поток

Frontend → HTTP Trigger (Functions) → CosmosDB/Azure SQL → Blob Storage → Service Bus → SignalR






�� Реализованный функционал
Backend (Azure Functions)
Сервисы Azure:
CosmosDbService - работа с базой данных
BlobStorageService - хранение файлов
ServiceBusService - асинхронные уведомления
SignalRService - реалтайм коммуникация
API Endpoints:
Пользователи: CRUD операции для сотрудников и клиентов
Документы: создание, загрузка файлов, одобрение, скачивание
Чат: отправка/получение сообщений для документов
Уведомления: реалтайм уведомления через SignalR
Безопасность:
Middleware для аутентификации через Azure AD
Валидация JWT токенов
Защищенные endpoints
Frontend интеграция
Обновленные хуки:
useUsers - работа с пользователями через API
useDocuments - управление документами
useChat - чат документов
useNotifications - реалтайм уведомления
Типы данных:
Обновлены для соответствия API
Добавлены поля для файлов и метаданных
��️ Архитектура
)
�� Следующие шаги
Настройка Azure ресурсов:
README
Заполнить переменные окружения в api/local.settings.json
Запустить локально:
dev
Интегрировать с существующими компонентами - обновить UI для использования новых хуков
Система готова к использованию и полностью соответствует архитектуре MS Teams приложений с использованием Azure сервисов!