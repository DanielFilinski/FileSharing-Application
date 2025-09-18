# FirmSide2Page Components

## Описание

FirmSide2Page - это точная копия интерфейса из HTML макета "Firm Side 2.html", преобразованная в React компоненты с использованием Fluent UI Design System. Страница полностью соответствует оригинальному дизайну и функциональности.

## Соответствие HTML макету

### Точное воспроизведение:
- **Цветовая схема**: Использованы точные цвета из HTML (#3b82f6, #f8fafc, #334155 и др.)
- **Типографика**: Segoe UI шрифт с точными размерами (20px, 18px, 14px, 12px)
- **Отступы и размеры**: Все размеры и отступы соответствуют оригиналу
- **Анимации**: Progress bar анимация с задержкой 500ms
- **Адаптивность**: Медиа-запросы для 1200px и 768px

### Структура компонентов:
1. **TopNavigation** - точная копия `.top-nav` с логотипом, поиском и уведомлениями
2. **ClientSidebar** - точная копия `.left-sidebar` со списком клиентов
3. **DashboardContent** - точная копия `.main-content` с дашбордом
4. **DocumentSidebar** - точная копия `.right-sidebar` с информацией о документе

## Структура компонентов

### Основные компоненты

1. **FirmSide2Page** (`../ui/FirmSide2Page.tsx`)
   - Главный компонент страницы
   - Управляет состоянием выбранного клиента и документа
   - Оркестрирует взаимодействие между компонентами

2. **TopNavigation** (`TopNavigation.tsx`)
   - Верхняя панель навигации
   - Содержит логотип, поиск, уведомления и профиль пользователя
   - Использует Fluent UI компоненты: Input, Avatar, Badge

3. **ClientSidebar** (`ClientSidebar.tsx`)
   - Левая панель со списком клиентов
   - Поиск клиентов
   - Добавление новых клиентов
   - Выбор активного клиента

4. **DashboardContent** (`DashboardContent.tsx`)
   - Основной контент дашборда
   - Сводка по проектам
   - Предстоящие дедлайны
   - Документы, требующие действий
   - Лента активности

5. **DocumentSidebar** (`DocumentSidebar.tsx`)
   - Правая панель с информацией о документе
   - Метаданные документа
   - Назначенная команда
   - Workflow процесса
   - Информация о безопасности

## Интерфейсы

### Client
```typescript
interface Client {
  id: string;
  name: string;
  type: string;
  notifications?: number;
}
```

### Document
```typescript
interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  domain: string;
  created: string;
  status: string;
  uploadedBy: string;
  uploadedTime: string;
}
```

### TeamMember
```typescript
interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}
```

### WorkflowStep
```typescript
interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'pending';
}
```

## Использование

```typescript
import { FirmSide2Page } from '@/pages/documents';

// В роутере
<Route path="/firm-side-2" element={<FirmSide2Page />} />
```

## Особенности

- Полностью адаптивный дизайн
- Использование Fluent UI Design System
- Поддержка темной и светлой темы
- Интерактивные элементы с hover эффектами
- Модульная архитектура компонентов

## Адаптивность

- **Desktop (>1200px)**: Полный интерфейс с тремя панелями
- **Tablet (768px-1200px)**: Скрывается правая панель
- **Mobile (<768px)**: Уменьшается левая панель, сетка становится одноколоночной 