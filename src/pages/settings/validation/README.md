# 🛡️ Система валидации документов

Полная реализация системы настройки валидации документов согласно техническому описанию стадий 4.1-4.4.

## 📋 Обзор

Система валидации позволяет настроить процесс проверки документов в организации с поддержкой различных схем назначения валидаторов:

- **Автоматическая валидация** - документы проходят автоматическую проверку
- **Ручная валидация** - документы проверяются назначенными валидаторами

## 🚀 Стадии реализации

### Стадия 4.1 - Основные настройки валидации
**Файл:** `ValidationSettings.tsx`

- Выбор типа валидации (ручная/автоматическая)  
- Выбор схемы назначения валидаторов
- Интеграция с RBAC системой
- Маршрутизация на соответствующие стадии

### Стадия 4.2 - Назначение по офисам/документам  
**Файлы:** `OfficeDocumentValidators.tsx`

- Назначение валидаторов по офисам
- Назначение валидаторов по типу документов
- Управление списками валидаторов
- Интерактивный выбор сотрудников

### Стадия 4.3 - Назначение по отделам/сотрудникам
**Файлы:** `DepartmentEmployeeValidators.tsx`

- Назначение валидаторов по отделам
- Назначение индивидуальных валидаторов
- Табличное отображение данных
- Массовое добавление валидаторов

### Стадия 4.4 - Завершение настройки
**Файлы:** `ValidationComplete.tsx`

- Сводка настроенной конфигурации
- Информация о следующих шагах
- Управление настройками

## 🔧 Архитектура

### Типы и интерфейсы
```typescript
// Основные настройки валидации
interface ValidationSettings {
  manualValidationNeeded: boolean;
  validationAssignment: ValidationAssignmentType;
  validatorsByOffice?: OfficeValidator[];
  validatorsByDocument?: DocumentValidator[];
  validatorsByDepartment?: DepartmentValidator[];
  validatorsByEmployee?: EmployeeValidator[];
}

// Схемы назначения валидаторов  
type ValidationAssignmentType = 
  | 'by_office'
  | 'by_document' 
  | 'by_department'
  | 'by_employee';
```

### Хуки
- `useValidationSettings()` - управление состоянием настроек
- `useValidationNavigation()` - логика маршрутизации

### API интеграция
- `saveValidationSettings.ts` - Azure Function для сохранения настроек
- Полная валидация данных на backend
- Аудит изменений настроек

## 📱 Компоненты UI

### Основные компоненты
- `ValidationTypeSelector` - выбор схемы назначения
- `EmployeeSelectionDialog` - диалог выбора сотрудников  
- `ValidationMessageBars` - информационные сообщения

### Интеграция с дизайн-системой
- Использование Fluent UI компонентов
- Адаптивный дизайн для мобильных устройств
- Темная тема поддержка
- Accessibility (a11y) поддержка

## 🔐 Безопасность и права доступа

### RBAC интеграция
```typescript
// Проверка прав доступа
<PermissionGate permissions={[Permission.VALIDATION_CONFIG]}>
  <ValidationSettings />
</PermissionGate>
```

### Разрешения
- `Permission.VALIDATION_CONFIG` - настройка валидации
- `Permission.DOCS_VALIDATE` - выполнение валидации
- `Permission.DOCS_VALIDATE_SETTINGS` - управление настройками

## 🛠️ Использование

### Базовое использование
```tsx
import { ValidationSettings } from '@/pages/settings/validation';

// Основная страница настроек
<ValidationSettings />
```

### Программное управление
```tsx
import { useValidationSettings } from '@/pages/settings/validation';

const MyComponent = () => {
  const { settings, updateSettings, saveSettings } = useValidationSettings();
  
  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      console.log('Настройки сохранены');
    }
  };
};
```

## 🎯 Маршруты

- `/settings/validation` - основные настройки (4.1)
- `/settings/validation/office-document` - назначение по офисам/документам (4.2)
- `/settings/validation/department-employee` - назначение по отделам/сотрудникам (4.3)
- `/settings/validation/complete` - завершение настройки (4.4)
- `/settings/validation/legacy` - устаревшая версия (совместимость)

## 🔄 Логика маршрутизации

```typescript
const getNextRoute = (settings: ValidationSettings): string => {
  if (!settings.manualValidationNeeded) {
    return '/settings/validation/complete'; // Автоматическая валидация
  }

  switch (settings.validationAssignment) {
    case 'by_office':
    case 'by_document':
      return '/settings/validation/office-document';
    case 'by_department':  
    case 'by_employee':
      return '/settings/validation/department-employee';
    default:
      return '/settings/validation';
  }
};
```

## 📊 Диаграмма процесса

Система полностью соответствует диаграмме бизнес-логики валидации:

1. **Инициация** → Выбор типа валидации
2. **Условная логика** → Проверка прав и типа назначения  
3. **Параллельные ветки** → Различные схемы назначения
4. **Валидация** → Проверка корректности настроек
5. **Завершение** → Сохранение и применение настроек

## 🧪 Тестирование

### Mock данные
- Сотрудники, отделы, офисы для демонстрации
- Типы документов для валидации
- Полная имитация API взаимодействий

### Валидация
- Проверка обязательных полей
- Валидация бизнес-правил
- Проверка прав доступа

## 🎨 Стилизация

- Styled Components для кастомных стилей
- Fluent UI Design Language
- Responsive design принципы  
- Поддержка темной темы

## 📝 Обратная совместимость

Старый компонент `Validation.tsx` доступен по маршруту `/settings/validation/legacy` для обеспечения плавного перехода.

## 🔮 Будущие улучшения

- [ ] Интеграция с реальными API данными
- [ ] Уведомления для валидаторов  
- [ ] Аналитика процесса валидации
- [ ] Массовые операции с валидаторами
- [ ] Расширенные права доступа
- [ ] Мобильное приложение поддержка
