# Storage Settings - Рефакторинг

## Обзор

Компонент `StorageSettings` был подвергнут полному рефакторингу с целью улучшения архитектуры, читаемости кода и переиспользования компонентов.

## Структура после рефакторинга

### Entity Layer (`src/entities/storage/`)

#### `model/types.ts`
- **Template** - интерфейс для шаблонов структуры папок
- **PreviewStructure** - интерфейс для предварительного просмотра структуры
- **StorageSettings** - основной интерфейс состояния
- **StorageSettingsActions** - интерфейс действий

#### `model/useStorageSettings.ts`
- Хук с бизнес-логикой для управления состоянием
- Функции генерации структур папок
- Обработчики событий
- Логика валидации

### Components Layer (`src/pages/settings/storage/components/`)

#### Основные компоненты:
- **StorageTypeSelector** - выбор типа хранилища (облачное/физическое)
- **SharePointCredentials** - настройка учетных данных SharePoint
- **DeviceSelector** - выбор устройства для физического хранилища
- **StorageAllocation** - настройка распределения хранилища
- **DataRetention** - настройка хранения данных
- **FolderStructure** - настройка структуры папок

#### Модальные окна:
- **TemplateManagerModal** - управление шаблонами
- **NotEnoughSpaceModal** - предупреждение о недостатке места

## Преимущества рефакторинга

### 1. Разделение ответственности
- **Entity** содержит бизнес-логику и состояние
- **Components** отвечают только за UI
- Четкое разделение между данными и представлением

### 2. Переиспользование
- Каждый компонент может быть использован независимо
- Легко тестировать отдельные части
- Возможность создания новых страниц с похожей функциональностью

### 3. Читаемость
- Основной компонент стал в 5 раз короче (с 1103 до ~235 строк)
- Каждый компонент имеет четкую ответственность
- Легче понимать и поддерживать код

### 4. Типизация
- Строгая типизация всех интерфейсов
- Автодополнение в IDE
- Предотвращение ошибок на этапе компиляции

### 5. Производительность
- Компоненты перерендериваются только при изменении их пропсов
- Оптимизированные хуки с правильными зависимостями

## Использование

```tsx
import { StorageSettings } from './storage-settings';

// Основной компонент автоматически использует все подкомпоненты
<StorageSettings />
```

## Структура файлов

```
src/
├── entities/
│   └── storage/
│       ├── index.ts
│       └── model/
│           ├── types.ts
│           └── useStorageSettings.ts
└── pages/
    └── settings/
        └── storage/
            ├── components/
            │   ├── index.ts
            │   ├── StorageTypeSelector.tsx
            │   ├── SharePointCredentials.tsx
            │   ├── DeviceSelector.tsx
            │   ├── StorageAllocation.tsx
            │   ├── DataRetention.tsx
            │   ├── FolderStructure.tsx
            │   ├── TemplateManagerModal.tsx
            │   └── NotEnoughSpaceModal.tsx
            ├── storage-settings.tsx
            └── README.md
```

## Миграция

Для использования в других частях приложения:

1. Импортируйте нужные компоненты:
```tsx
import { StorageTypeSelector } from '@/pages/settings/storage/components';
```

2. Используйте хук для получения логики:
```tsx
import { useStorageSettings } from '@/entities/storage/model/useStorageSettings';
```

3. Создайте собственные компоненты, используя существующие как основу. 