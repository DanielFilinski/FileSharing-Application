# База данных Azure - Руководство по развертыванию

## Обзор архитектуры

Проект FileSharing-Application использует **гибридную архитектуру баз данных Azure**:

### 🗄️ Azure SQL Database
**Предназначение**: Реляционные данные и транзакционные операции
- **Организации** и их структура (офисы, департаменты)
- **Пользователи** (сотрудники, клиенты) и их роли
- **Настройки системы** и конфигурация
- **Аудит** и логирование действий

### 🌌 Azure Cosmos DB
**Предназначение**: Документы и высокопроизводительные операции
- **Метаданные документов** и файловая информация
- **Чаты** между сотрудниками и клиентами
- **Избранное** пользователей
- **Версии документов** и история изменений
- **События аудита** в реальном времени

## Настройка инфраструктуры

### 1. Требуемые переменные окружения

Добавьте следующие переменные в ваш процесс CI/CD:

```bash
# SQL Database
SQL_SERVER_ADMIN_LOGIN=your-sql-admin
SECRET_SQL_SERVER_ADMIN_PASSWORD=your-strong-password

# Автоматически генерируются при развертывании:
# SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD
# COSMOSDB_CONNECTION_STRING, COSMOSDB_DATABASE_NAME
```

### 2. Развертывание Azure ресурсов

```bash
# Развертывание инфраструктуры
az deployment group create \
  --resource-group your-rg \
  --template-file infra/azure.bicep \
  --parameters @infra/azure.parameters.json
```

### 3. Настройка баз данных

```bash
# Переход в папку API
cd api

# Установка зависимостей
npm install

# Развертывание всех баз данных
npm run deploy:databases

# Или по отдельности:
npm run deploy:sql      # только SQL Database
npm run deploy:cosmos   # только Cosmos DB

# Проверка состояния
npm run validate:databases
```

## Локальная разработка

### Требования для локальной разработки

1. **SQL Server LocalDB** или **Docker SQL Server**
2. **Azure Cosmos DB Emulator** или облачная учетная запись

### Настройка локального SQL Server

```bash
# Через Docker
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" \
   -p 1433:1433 --name sql-server \
   -d mcr.microsoft.com/mssql/server:2019-latest

# Создание базы данных
docker exec -it sql-server /opt/mssql-tools/bin/sqlcmd \
   -S localhost -U sa -P "YourStrong!Passw0rd" \
   -Q "CREATE DATABASE [filesharing-db-dev]"
```

### Настройка Cosmos DB Emulator

```bash
# Скачайте и установите Azure Cosmos DB Emulator
# https://aka.ms/cosmosdb-emulator

# Или используйте Docker
docker run -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 \
  -m 3g --cpus=2.0 --name=test-linux-emulator \
  -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 \
  -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

### Обновление local.settings.json

```json
{
  "Values": {
    "SQL_SERVER": "localhost",
    "SQL_DATABASE": "filesharing-db-dev",
    "SQL_USER": "sa",
    "SQL_PASSWORD": "YourStrong!Passw0rd",
    "COSMOSDB_CONNECTION_STRING": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==;",
    "COSMOSDB_DATABASE_NAME": "filesharing-cosmos-db"
  }
}
```

## Миграции и обновления

### SQL Database миграции

Миграции хранятся в папке `/migrations/` и выполняются автоматически:

```
migrations/
├── 001_initial_schema.sql       ✅ Базовая схема
├── 002_add_indexes.sql          📋 Будущие обновления
└── 003_new_features.sql         🚀 Новая функциональность
```

### Добавление новой миграции

1. Создайте файл `migrations/XXX_description.sql`
2. Добавьте SQL DDL команды
3. Выполните `npm run deploy:sql`

### Cosmos DB контейнеры

Создаются автоматически с оптимизированными настройками:

| Контейнер | Partition Key | Описание |
|-----------|---------------|----------|
| `documents` | `/partitionKey` | Метаданные документов |
| `chat-messages` | `/conversationId` | Сообщения чатов |
| `audit-events` | `/organizationId` | События аудита |
| `user-favorites` | `/userId` | Избранное пользователей |
| `document-versions` | `/documentId` | Версии документов |

## Мониторинг и обслуживание

### Application Insights

Автоматически настраивается для отслеживания:
- Производительности запросов к БД
- Ошибок подключения
- Метрик использования ресурсов

### Проверка состояния

```bash
# Проверка здоровья SQL Database
npm run db:health

# Полная валидация всех БД
npm run validate:databases
```

### Резервное копирование

- **SQL Database**: Автоматические резервные копии каждые 12 часов
- **Cosmos DB**: Point-in-time восстановление за последние 30 дней

## Безопасность

### SQL Database
- ✅ Шифрование в состоянии покоя (Transparent Data Encryption)
- ✅ Шифрование в пути (SSL/TLS)
- ✅ Аутентификация через Azure AD
- ✅ Правила брандмауэра

### Cosmos DB
- ✅ Шифрование в состоянии покоя
- ✅ RBAC управление доступом
- ✅ Сетевые правила доступа
- ✅ Аудит всех операций

## Стоимость и производительность

### Рекомендуемые конфигурации

**Для разработки/тестирования:**
- SQL Database: Basic (5 DTU) - ~$5/месяц
- Cosmos DB: Serverless - ~$0.25 за миллион операций

**Для продакшена:**
- SQL Database: Standard S2 (50 DTU) - ~$30/месяц  
- Cosmos DB: 1000 RU/s - ~$60/месяц

### Оптимизация затрат

1. **Используйте Reserved Capacity** для долгосрочных проектов
2. **Настройте автоскалирование** в Cosmos DB
3. **Мониторьте метрики** через Azure Cost Management
4. **Архивируйте старые данные** в Azure Storage

## Устранение неполадок

### Часто встречающиеся ошибки

**❌ Connection timeout**
```bash
# Проверьте настройки брандмауэра
az sql server firewall-rule create --resource-group myRG \
  --server myServer --name "AllowMyIP" \
  --start-ip-address "YOUR_IP" --end-ip-address "YOUR_IP"
```

**❌ Authentication failed**
```bash
# Убедитесь в правильности паролей
az sql server update --resource-group myRG --name myServer \
  --admin-password "NewStrongPassword123!"
```

**❌ Cosmos DB rate limiting**
```javascript
// Увеличьте RU/s или добавьте retry logic
const client = new CosmosClient({
  endpoint,
  key,
  retryOptions: {
    maxRetryAttemptCount: 10,
    fixedRetryIntervalInMilliseconds: 1000
  }
});
```

### Контакты для поддержки

- 📧 Техническая поддержка: [support@yourcompany.com]
- 📚 Внутренние документы: [internal-wiki-link]
- 🚨 Инциденты: [incident-management-system]

## Следующие шаги

1. ✅ Развернуть инфраструктуру Azure
2. ✅ Настроить базы данных  
3. ⏳ Настроить CI/CD pipeline
4. ⏳ Добавить мониторинг и алерты
5. ⏳ Провести нагрузочное тестирование
6. ⏳ Обучить команду работе с системой
