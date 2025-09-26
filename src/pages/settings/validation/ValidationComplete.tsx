import { useNavigate } from 'react-router-dom';
import {
  Button,
  Text,
  Title3,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {
  CheckmarkCircle20Regular,
  Settings20Regular,
  ArrowLeft20Regular
} from '@fluentui/react-icons';

import { useValidationSettings } from './hooks/useValidationSettings';
import {
  PermissionGate
} from '@/shared/lib/rbac';
import { Permission } from '@/shared/lib/rbac/types';
import {
  ContentContainer,
  RowCardContainer,
  ScreenContainer,
  CardContainer
} from '@/app/styles/layouts';
import { CardHeader } from '@/components/card/card-header';

/**
 * Страница завершения настройки валидации (Стадия 4.4)
 * Показывает сводку настроенной конфигурации валидации
 */
export const ValidationComplete = () => {
  const navigate = useNavigate();
  const { settings } = useValidationSettings();

  if (!settings) {
    navigate('/settings/validation');
    return null;
  }

  const getValidationSummary = () => {
    if (!settings.manualValidationNeeded) {
      return {
        type: 'Автоматическая валидация',
        description: 'Документы будут проходить автоматическую проверку без участия человека',
        details: 'Система будет автоматически проверять документы на соответствие базовым требованиям и правилам'
      };
    }

    const validatorCounts = {
      by_office: settings.validatorsByOffice?.length || 0,
      by_document: settings.validatorsByDocument?.length || 0,
      by_department: settings.validatorsByDepartment?.length || 0,
      by_employee: settings.validatorsByEmployee?.length || 0
    };

    switch (settings.validationAssignment) {
      case 'by_office':
        return {
          type: 'Валидация по офисам',
          description: `Валидаторы назначены для ${validatorCounts.by_office} офисов`,
          details: 'Документы будут направляться валидаторам в зависимости от офиса происхождения'
        };
      case 'by_document':
        return {
          type: 'Валидация по типу документов',
          description: `Валидаторы назначены для ${validatorCounts.by_document} типов документов`,
          details: 'Документы будут направляться валидаторам с соответствующей экспертизой'
        };
      case 'by_department':
        return {
          type: 'Валидация по отделам',
          description: `Валидаторы назначены для ${validatorCounts.by_department} отделов`,
          details: 'Документы будут направляться руководителям или назначенным сотрудникам отделов'
        };
      case 'by_employee':
        return {
          type: 'Валидация по сотрудникам',
          description: `Назначено ${validatorCounts.by_employee} индивидуальных валидаторов`,
          details: 'Документы будут направляться конкретным назначенным сотрудникам'
        };
      default:
        return {
          type: 'Неопределенная конфигурация',
          description: 'Конфигурация валидации не завершена',
          details: 'Необходимо вернуться и завершить настройку'
        };
    }
  };

  const summary = getValidationSummary();

  return (
    <PermissionGate 
      permissions={[Permission.VALIDATION_CONFIG]}
      fallback={
        <MessageBar intent="error">
          <MessageBarBody>
            You don't have permission to view validation settings
          </MessageBarBody>
        </MessageBar>
      }
    >
      <ScreenContainer>
        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckmarkCircle20Regular className="text-2xl text-green-600" />
            <Title3>Настройка валидации завершена</Title3>
          </div>
          <Text size={400} className="text-gray-600">
            Ваши настройки валидации документов сохранены и активны
          </Text>
        </div>

        <ContentContainer>
          <RowCardContainer>
            {/* Сводка конфигурации */}
            <CardContainer>
              <CardHeader 
                text="Конфигурация валидации"
                icon={<Settings20Regular />}
              />
              
              <div className="space-y-4">
                {/* Успешное сохранение */}
                <MessageBar intent="success">
                  <MessageBarBody>
                    <div className="flex items-start gap-2">
                      <CheckmarkCircle20Regular className="mt-1 flex-shrink-0 text-green-600" />
                      <div>
                        <Text weight="semibold">Настройки сохранены успешно</Text>
                        <br />
                        <Text size={200}>
                          Система валидации документов настроена и готова к работе
                        </Text>
                      </div>
                    </div>
                  </MessageBarBody>
                </MessageBar>

                {/* Детали конфигурации */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Text weight="semibold" size={400} className="block mb-2">
                    {summary.type}
                  </Text>
                  <Text size={300} className="block mb-2 text-gray-700">
                    {summary.description}
                  </Text>
                  <Text size={200} className="text-gray-600">
                    {summary.details}
                  </Text>
                </div>

                {/* Дополнительная информация для ручной валидации */}
                {settings.manualValidationNeeded && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Text weight="semibold" size={300} className="block mb-2 text-blue-800">
                      Что происходит дальше?
                    </Text>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• Новые документы будут автоматически направляться назначенным валидаторам</li>
                      <li>• Валидаторы получат уведомления о новых задачах валидации</li>
                      <li>• Документы будут помечены как "На валидации" до получения одобрения</li>
                      <li>• После валидации документы перейдут к следующему этапу обработки</li>
                    </ul>
                  </div>
                )}

                {/* Дополнительная информация для автоматической валидации */}
                {!settings.manualValidationNeeded && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <Text weight="semibold" size={300} className="block mb-2 text-orange-800">
                      Автоматическая обработка
                    </Text>
                    <ul className="space-y-1 text-sm text-orange-700">
                      <li>• Документы проходят автоматическую проверку при загрузке</li>
                      <li>• Система проверяет формат, размер и базовые требования</li>
                      <li>• Валидные документы сразу переходят к следующему этапу</li>
                      <li>• Невалидные документы отклоняются с указанием причины</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContainer>

            {/* Управление настройками */}
            <CardContainer>
              <CardHeader 
                text="Управление настройками"
                icon={<Settings20Regular />}
              />
              
              <div className="space-y-3">
                <Text size={300} className="text-gray-600">
                  Вы можете в любое время изменить настройки валидации или назначить новых валидаторов
                </Text>
                
                <div className="flex gap-3">
                  <Button
                    appearance="outline"
                    onClick={() => navigate('/settings/validation')}
                  >
                    Изменить настройки
                  </Button>
                  
                  {settings.manualValidationNeeded && (
                    <Button
                      appearance="outline"
                      onClick={() => {
                        const route = settings.validationAssignment === 'by_office' || settings.validationAssignment === 'by_document'
                          ? '/settings/validation/office-document'
                          : '/settings/validation/department-employee';
                        navigate(route);
                      }}
                    >
                      Управлять валидаторами
                    </Button>
                  )}
                </div>
              </div>
            </CardContainer>
          </RowCardContainer>
        </ContentContainer>

        {/* Кнопки навигации */}
        <div className="flex justify-between items-center mt-8 px-6">
          <Button
            appearance="secondary"
            icon={<ArrowLeft20Regular />}
            onClick={() => navigate('/settings')}
          >
            Вернуться к настройкам
          </Button>
          
          <Button
            appearance="primary"
            onClick={() => navigate('/')}
          >
            Перейти к документам
          </Button>
        </div>
      </ScreenContainer>
    </PermissionGate>
  );
};

export default ValidationComplete;
