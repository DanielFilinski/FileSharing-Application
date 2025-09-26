/**
 * Экспорт компонентов системы валидации документов
 * Реализует стадии 4.1-4.4 согласно техническому описанию
 */

// Основные страницы
export { default as ValidationSettings } from './ValidationSettings';
export { default as OfficeDocumentValidators } from './OfficeDocumentValidators';
export { default as DepartmentEmployeeValidators } from './DepartmentEmployeeValidators';
export { default as ValidationComplete } from './ValidationComplete';

// Компоненты
export { ValidationTypeSelector } from './components/ValidationTypeSelector';
export { ValidationHeader } from './components/ValidationHeader';
export { ManualValidationToggle } from './components/ManualValidationToggle';
export { EmployeeValidators } from './components/EmployeeValidators';
export { OfficeValidators } from './components/OfficeValidators';
export { EmployeeSelectionDialog } from './components/EmployeeSelectionDialog';
export { ValidationMessageBars } from './components/ValidationMessageBars';

// Хуки
export { useValidationSettings, useValidationNavigation } from './hooks/useValidationSettings';

// Типы
export type {
  ValidationSettings,
  ValidationAssignmentType,
  Employee,
  Department,
  Office,
  DocumentType,
  OfficeValidator,
  DocumentValidator,
  DepartmentValidator,
  EmployeeValidator,
  UseValidationSettingsResult,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './types';

// Устаревший компонент (для обратной совместимости)
export { default as LegacyValidationSettings } from './Validation';
