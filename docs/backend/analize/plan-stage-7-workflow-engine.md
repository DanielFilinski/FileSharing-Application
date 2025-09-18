## Этап 7 — Workflow Engine (Движок процессов)

Статус: 0% выполнено

### Компоненты и страницы:
- **API workflow:** `/src/entities/workflow/api/workflowApi.ts`
- **Хук workflow:** `/src/entities/workflow/model/useWorkflow.ts`
- **Типы workflow:** `/src/entities/workflow/model/types.ts`
- **Компоненты задач:** `/src/pages/tasks/components/TaskCard.tsx`, `/src/pages/tasks/components/TaskList.tsx`
- **Страницы задач:** `/src/pages/tasks/ValidationTaskPage.tsx`, `/src/pages/tasks/ApprovalTaskPage.tsx`
- **Уведомления:** интеграция с системой уведомлений для задач

- [ ] Система workflow для документов
- [ ] Последовательные/параллельные процессы
- [ ] Автоматическое назначение задач
- [ ] Управление статусами и переходами
- [ ] Система уведомлений о задачах

### Критически важные компоненты из project.md:

#### 3.3 Валидация документов
- **Этап 2.1:** Определение требований к валидации (автоматическая/ручная)
- **Этап 2.2:** Назначение валидатора (по офису/типу документа/отделу)
- **Этап 2.3:** Распределение задач по проверке
- **Этап 2.4:** Действия по проверке (одобрить/отклонить с комментариями)

#### 3.4 Утверждение документов  
- **Этап 3.1:** Проверка требований к утверждению
- **Этап 3.2:** Назначение уполномоченного (по офису/документу/отделу)
- **Этап 3.3:** Выполнение рабочего процесса (последовательный/параллельный)
- **Этап 3.4:** Решение об утверждении

#### 3.5 Подписание документов
- **Этап 4.1:** Определение требований к подписи
- **Этап 4.2:** Назначение подписывающего лица
- **Этап 4.3:** Аутентификация и подписание (4 метода)
- **Этап 4.4:** Завершение и проверка подписи

### API для Workflow Engine
```typescript
// /src/entities/workflow/api/workflowApi.ts
export const workflowApi = {
  // Назначение задач
  async assignValidationTask(documentId: string): Promise<Task>,
  async assignApprovalTask(documentId: string): Promise<Task>,
  async assignSignatureTask(documentId: string): Promise<Task>,
  
  // Управление задачами
  async getTasks(userId: string): Promise<Task[]>,
  async completeTask(taskId: string, result: TaskResult): Promise<void>,
  async escalateTask(taskId: string): Promise<void>,
  
  // Workflow процессы
  async startWorkflow(documentId: string, workflowType: string): Promise<Workflow>,
  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus>,
  async pauseWorkflow(workflowId: string): Promise<void>,
  async resumeWorkflow(workflowId: string): Promise<void>
};
```

### Хуки для Workflow
```typescript
// /src/entities/workflow/model/useWorkflow.ts
export const useWorkflow = () => {
  // Управление задачами пользователя
  // Автоматическое назначение
  // Отслеживание прогресса
};
```

Источник: детали процессов — `project.md` разделы 3.3-3.5.
