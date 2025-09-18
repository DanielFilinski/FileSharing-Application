# НЕДЕЛЯ 3: ПОЛЬЗОВАТЕЛИ + WORKFLOW (DURABLE FUNCTIONS)

Статус: 15% — есть `api/src/functions/getUserProfile.ts` (черновик профиля);
Durable/остальные endpoints отсутствуют

## User Management API

- GET `/api/users/profile` — текущий пользователь (уже частично есть)
- PUT `/api/users/profile` — обновление профиля
- GET `/api/users` — список (admin)
- POST `/api/users` — создание (admin)
- GET `/api/users/{id}/permissions` — права
- PUT `/api/users/{id}/roles` — роли

## Базовый оркестратор согласования (TS)

```ts
import * as df from "durable-functions";

const orchestrator = df.orchestrator(function* (context) {
  const docId = context.df.getInput<string>();
  yield context.df.callActivity("AssignReviewer", docId);
  const result = yield context.df.waitForExternalEvent<string>("ApprovalDecision");
  yield context.df.callActivity("UpdateDocumentStatus", { docId, result });
  return result;
});

export default orchestrator;
```

Активити-функции `AssignReviewer`, `UpdateDocumentStatus` — обычные HTTP/Activity triggers, пишут в Cosmos/SQL.


