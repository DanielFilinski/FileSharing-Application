import { useState, useEffect } from 'react';
import { 
  ValidationSettings, 
  ValidationAssignmentType,
  UseValidationSettingsResult,
  ValidationResult,
  ValidationError,
  ValidationWarning 
} from '../types';

/**
 * Хук для управления настройками валидации документов
 * Поддерживает все стадии из технического описания (4.1-4.3)
 */
export const useValidationSettings = (): UseValidationSettingsResult => {
  const [settings, setSettings] = useState<ValidationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Инициализация настроек по умолчанию
  useEffect(() => {
    loadDefaultSettings();
  }, []);

  const loadDefaultSettings = () => {
    const defaultSettings: ValidationSettings = {
      id: crypto.randomUUID(),
      organizationId: 'default-org', // TODO: Получать из контекста RBAC
      manualValidationNeeded: false,
      validationAssignment: undefined,
      validatorsByOffice: [],
      validatorsByDocument: [],
      validatorsByDepartment: [],
      validatorsByEmployee: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user' // TODO: Получать из контекста пользователя
    };
    
    setSettings(defaultSettings);
  };

  const updateSettings = (updates: Partial<ValidationSettings>) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date()
    };
    
    // Очистка валидаторов при изменении типа назначения
    if (updates.validationAssignment && updates.validationAssignment !== settings.validationAssignment) {
      updatedSettings.validatorsByOffice = [];
      updatedSettings.validatorsByDocument = [];
      updatedSettings.validatorsByDepartment = [];
      updatedSettings.validatorsByEmployee = [];
    }
    
    // Очистка всех валидаторов при отключении ручной валидации
    if (updates.manualValidationNeeded === false) {
      updatedSettings.validationAssignment = undefined;
      updatedSettings.validatorsByOffice = [];
      updatedSettings.validatorsByDocument = [];
      updatedSettings.validatorsByDepartment = [];
      updatedSettings.validatorsByEmployee = [];
    }
    
    setSettings(updatedSettings);
  };

  const validateSettings = (settingsToValidate: ValidationSettings): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Валидация для ручной валидации
    if (settingsToValidate.manualValidationNeeded) {
      if (!settingsToValidate.validationAssignment) {
        errors.push({
          field: 'validationAssignment',
          message: 'Необходимо выбрать тип назначения валидаторов',
          severity: 'error'
        });
      } else {
        // Валидация конкретных типов назначения
        switch (settingsToValidate.validationAssignment) {
          case 'by_office':
            if (!settingsToValidate.validatorsByOffice?.length) {
              errors.push({
                field: 'validatorsByOffice',
                message: 'Необходимо назначить валидаторов для офисов',
                severity: 'error'
              });
            }
            break;
            
          case 'by_document':
            if (!settingsToValidate.validatorsByDocument?.length) {
              errors.push({
                field: 'validatorsByDocument',
                message: 'Необходимо назначить валидаторов для типов документов',
                severity: 'error'
              });
            }
            break;
            
          case 'by_department':
            if (!settingsToValidate.validatorsByDepartment?.length) {
              errors.push({
                field: 'validatorsByDepartment',
                message: 'Необходимо назначить валидаторов для отделов',
                severity: 'error'
              });
            }
            break;
            
          case 'by_employee':
            if (!settingsToValidate.validatorsByEmployee?.length) {
              errors.push({
                field: 'validatorsByEmployee',
                message: 'Необходимо назначить валидаторов',
                severity: 'error'
              });
            }
            break;
        }
      }
    }

    // Предупреждения
    if (!settingsToValidate.manualValidationNeeded) {
      warnings.push({
        field: 'manualValidationNeeded',
        message: 'Документы будут проходить только автоматическую валидацию',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const saveSettings = async (): Promise<boolean> => {
    if (!settings) return false;

    setIsLoading(true);
    setIsError(false);

    try {
      // Валидация перед сохранением
      const validation = validateSettings(settings);
      if (!validation.isValid) {
        console.error('Validation failed:', validation.errors);
        setIsError(true);
        return false;
      }

      // API вызов для сохранения настроек валидации
      const response = await fetch('/api/saveValidationSettings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const savedSettings = await response.json();
      setSettings(savedSettings);
      
      console.log('Настройки валидации сохранены:', savedSettings);
      return true;

    } catch (error) {
      console.error('Error saving validation settings:', error);
      setIsError(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    loadDefaultSettings();
  };

  return {
    settings,
    isLoading,
    isError,
    updateSettings,
    saveSettings,
    resetSettings
  };
};

/**
 * Хук для определения следующего шага в зависимости от настроек валидации
 */
export const useValidationNavigation = () => {
  const getNextRoute = (settings: ValidationSettings): string => {
    if (!settings.manualValidationNeeded) {
      // Стадия 4.4 - автоматическая валидация
      return '/settings/validation/complete';
    }

    // Стадии 4.2 и 4.3 в зависимости от типа назначения
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

  return { getNextRoute };
};
