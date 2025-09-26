import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Text,
  Title3,
  Switch,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { 
  Shield20Regular,
  Save20Regular,
  Warning20Regular,
  Info20Regular 
} from '@fluentui/react-icons';

import { ValidationTypeSelector } from './components/ValidationTypeSelector';
import { ValidationMessageBars } from './components/ValidationMessageBars';
import { useValidationSettings, useValidationNavigation } from './hooks/useValidationSettings';
import { 
  PermissionGate, 
  Permission 
} from '@/shared/lib/rbac';
import { 
  ContentContainer, 
  RowCardContainer, 
  ScreenContainer, 
  CardContainer 
} from '@/app/styles/layouts';
import { CardHeader } from '@/components/card/card-header';

/**
 * Главная страница настроек валидации (Стадия 4.1)
 * Реализует выбор типа валидации и маршрутизацию на соответствующие стадии
 */
export const ValidationSettings = () => {
  const navigate = useNavigate();
  const { 
    settings, 
    isLoading, 
    isError, 
    updateSettings, 
    saveSettings 
  } = useValidationSettings();
  const { getNextRoute } = useValidationNavigation();

  if (!settings) {
    return (
      <ScreenContainer>
        <div className="flex items-center justify-center h-64">
          <Spinner label="Loading validation settings..." />
        </div>
      </ScreenContainer>
    );
  }

  const handleSaveSettings = async () => {
    if (!settings) return;

    const success = await saveSettings();
    if (success) {
      // Определение маршрута в зависимости от настроек (согласно диаграмме)
      const nextRoute = getNextRoute(settings);
      navigate(nextRoute);
    }
  };

  const handleToggleManualValidation = (checked: boolean) => {
    updateSettings({
      manualValidationNeeded: checked,
      // При отключении ручной валидации очищаем тип назначения
      ...(checked === false && { validationAssignment: undefined })
    });
  };

  const handleValidationAssignmentChange = (assignment: any) => {
    updateSettings({
      validationAssignment: assignment
    });
  };

  const isSettingsValid = () => {
    if (settings.manualValidationNeeded && !settings.validationAssignment) {
      return false;
    }
    return true;
  };

  return (
    <PermissionGate 
      permissions={[Permission.VALIDATION_CONFIG]}
      fallback={
        <MessageBar intent="error">
          <MessageBarBody>
            You don't have permission to configure document validation settings
          </MessageBarBody>
        </MessageBar>
      }
    >
      <ScreenContainer>
        {/* Заголовок страницы */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield20Regular className="text-2xl text-blue-600" />
            <Title3>Настройки валидации документов</Title3>
          </div>
          <Text size={400} className="text-gray-600">
            Настройте процесс валидации документов в вашей организации
          </Text>
        </div>

        {/* Ошибки */}
        {isError && (
          <MessageBar intent="error" className="mb-4">
            <MessageBarBody>
              An error occurred while saving settings. Please try again.
            </MessageBarBody>
          </MessageBar>
        )}

        <ContentContainer>
          <RowCardContainer>
            {/* Основные настройки валидации */}
            <CardContainer>
              <CardHeader 
                text="Тип валидации" 
                icon={<Shield20Regular />} 
              />
              
              <div className="space-y-4">
                {/* Переключатель ручной валидации */}
                <div className="flex items-start gap-3">
                  <Switch
                    checked={settings.manualValidationNeeded}
                    onChange={(_, data) => handleToggleManualValidation(data.checked)}
                    disabled={isLoading}
                    label="Требуется ручная валидация"
                  />
                </div>
                
                {/* Описание выбранного режима */}
                <div className="mt-3">
                  {settings.manualValidationNeeded ? (
                    <MessageBar intent="info">
                      <MessageBarBody>
                        <div className="flex items-start gap-2">
                          <Info20Regular className="mt-1 flex-shrink-0" />
                          <div>
                            <Text weight="semibold">Ручная валидация</Text>
                            <br />
                            <Text size={200}>
                              Документы будут проходить проверку назначенными валидаторами перед публикацией
                            </Text>
                          </div>
                        </div>
                      </MessageBarBody>
                    </MessageBar>
                  ) : (
                    <MessageBar intent="warning">
                      <MessageBarBody>
                        <div className="flex items-start gap-2">
                          <Warning20Regular className="mt-1 flex-shrink-0" />
                          <div>
                            <Text weight="semibold">Автоматическая валидация</Text>
                            <br />
                            <Text size={200}>
                              Документы будут автоматически проходить валидацию без участия человека
                            </Text>
                          </div>
                        </div>
                      </MessageBarBody>
                    </MessageBar>
                  )}
                </div>
              </div>
            </CardContainer>

            {/* Выбор типа назначения валидаторов (только при ручной валидации) */}
            {settings.manualValidationNeeded && (
              <ValidationTypeSelector
                validationType={settings.validationAssignment || 'by_employee'}
                onTypeChange={handleValidationAssignmentChange}
              />
            )}

            {/* Информационные сообщения */}
            <ValidationMessageBars
              manualValidation={settings.manualValidationNeeded}
              approvalNeeded={false} // TODO: Добавить поддержку аппрувала при необходимости
            />
          </RowCardContainer>
        </ContentContainer>

        {/* Кнопки управления */}
        <div className="flex justify-end gap-3 mt-8 px-6">
          <Button 
            appearance="secondary"
            onClick={() => navigate('/settings')}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button 
            appearance="primary"
            icon={<Save20Regular />}
            onClick={handleSaveSettings}
            disabled={!isSettingsValid() || isLoading}
          >
            {isLoading ? 'Saving...' : 'Сохранить настройки'}
          </Button>
        </div>
      </ScreenContainer>
    </PermissionGate>
  );
};

export default ValidationSettings;
