# ОСОБЕННОСТИ AZURE FUNCTIONS (NODE/TS)

Статус: Документация

## Модель выполнения

- Программная модель v4 (`@azure/functions`): `app.http`, `app.timer`, `app.serviceBusQueue`
- Stateless: хранить состояние вне функций (Cosmos/SQL/Redis)
- Холодный старт: минимизировать зависимости, прогрев, Premium план при необходимости

## Конфигурация

- `api/local.settings.json` — только локально, никогда не коммитить секреты в прод
- Приложение: Application Settings в Azure + Key Vault references
- Логи/трейсы: Application Insights

## Безопасность

- Валидация JWT для каждого HTTP-триггера
- RBAC на уровне кода (роли из токена/SQL)
- Управление ключами: Key Vault, user-assigned managed identity

## Хранилища

- Cosmos DB: партиционирование по `tenantId`/`documentId`
- Blob: отдельные контейнеры per env/tenant, access policies, SAS
- SQL: индексы и внешние ключи для клиентов/ролей


