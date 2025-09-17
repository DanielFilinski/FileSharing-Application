# НЕДЕЛЯ 8: ТЕСТЫ + МОНИТОРИНГ + ДЕПЛОЙ

Статус: 0% — нет тестов/мониторинга/CI

## Тестирование

- [ ] Интеграционные тесты HTTP-функций (Vitest/Playwright API)
- [ ] Нагрузочные (Azure Load Testing)
- [ ] Безопасность (JWT/роль-гарды)

## Мониторинг

- [ ] Application Insights SDK для Node

```ts
import appInsights from "applicationinsights";
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();
```

- [ ] Кастомные события/метрики на ключевых путях (upload, approve)

## Деплой

- [ ] CI/CD (GitHub Actions/Azure DevOps): билд `api/`, деплой функций; артефакты Vite для фронта
- [ ] Конфигурация переменных окружения (prod)


