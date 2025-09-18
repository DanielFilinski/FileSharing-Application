# НЕДЕЛЯ 6: КЛИЕНТЫ + ДАШБОРД API

Статус: 0% — отсутствуют CRUD/аналитика

## Client API

- GET `/api/clients`
- POST `/api/clients`
- GET `/api/clients/{id}`
- PUT `/api/clients/{id}`
- GET `/api/clients/{id}/documents`
- POST `/api/clients/{id}/documents/{docId}`
- DELETE `/api/clients/{id}/documents/{docId}`

## Dashboard API

- GET `/api/dashboard/stats` — общая статистика
- GET `/api/dashboard/pending` — ожидающие задачи
- GET `/api/dashboard/activity` — последние события
- GET `/api/dashboard/deadlines` — дедлайны

## Заметки по реализации

- Клиенты/связи — Azure SQL (реляционные связи, индексы)
- Быстрые сводки — агрегации в Cosmos + кэш Redis
- Корреляция запросов — App Insights


