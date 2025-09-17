## Этап 10 — Dashboard и управление задачами

Статус: 0% выполнено

### Компоненты и страницы:
- **API dashboard:** `/src/entities/dashboard/api/dashboardApi.ts`
- **Хук dashboard:** `/src/entities/dashboard/model/useDashboard.ts`
- **Главная страница:** `/src/pages/dashboard/DashboardPage.tsx`
- **Список задач:** `/src/pages/dashboard/components/TaskList.tsx`
- **Карточка задачи:** `/src/pages/dashboard/components/TaskCard.tsx`
- **Статистика:** `/src/pages/dashboard/components/StatisticsWidget.tsx`
- **Уведомления:** `/src/pages/dashboard/components/NotificationCenter.tsx`
- **Страницы задач:** `/src/pages/tasks/ValidationTaskPage.tsx`, `/src/pages/tasks/ApprovalTaskPage.tsx`, `/src/pages/tasks/SignatureTaskPage.tsx`

- [ ] Dashboard для задач пользователя
- [ ] Уведомления о новых задачах
- [ ] Интерфейс валидации документов
- [ ] Интерфейс утверждения документов
- [ ] Интерфейс подписания документов
- [ ] Управление сроками и напоминания

### Критически важные компоненты из project.md:

#### Интерфейсы для разных ролей:
- **Валидаторы:** Просмотр документов, проверка содержимого, одобрение/отклонение с комментариями
- **Утверждающие:** Рассмотрение документов, последовательное/параллельное утверждение
- **Подписывающие:** Выбор метода подписи, аутентификация, загрузка подписанной версии

#### Система уведомлений:
- Уведомления о новых задачах валидации
- Уведомления о задачах утверждения с контекстом и сроками
- Уведомления о запросах на подпись
- Напоминания об ожидающих задачах

### API для Dashboard
```typescript
// /src/entities/dashboard/api/dashboardApi.ts
export const dashboardApi = {
  // Задачи пользователя
  async getUserTasks(userId: string): Promise<UserTask[]>,
  async getTaskDetails(taskId: string): Promise<TaskDetails>,
  
  // Статистика
  async getTaskStatistics(userId: string): Promise<TaskStatistics>,
  async getDocumentStatistics(): Promise<DocumentStatistics>,
  
  // Уведомления
  async getNotifications(userId: string): Promise<Notification[]>,
  async markNotificationAsRead(notificationId: string): Promise<void>,
  
  // Управление сроками
  async getOverdueTasks(userId: string): Promise<Task[]>,
  async setTaskReminder(taskId: string, reminderDate: Date): Promise<void>
};
```

### Хуки для Dashboard
```typescript
// /src/entities/dashboard/model/useDashboard.ts
export const useDashboard = () => {
  // Задачи пользователя
  // Статистика
  // Уведомления
  // Управление сроками
};
```

### Компоненты UI
```typescript
// /src/pages/dashboard/DashboardPage.tsx
// /src/pages/dashboard/components/TaskList.tsx
// /src/pages/dashboard/components/TaskCard.tsx
// /src/pages/dashboard/components/StatisticsWidget.tsx
// /src/pages/dashboard/components/NotificationCenter.tsx
```

### Интерфейсы для ролей
```typescript
// /src/pages/tasks/ValidationTaskPage.tsx
// /src/pages/tasks/ApprovalTaskPage.tsx  
// /src/pages/tasks/SignatureTaskPage.tsx
```

Источник: детали интерфейсов — `project.md` разделы 3.3-3.5.
