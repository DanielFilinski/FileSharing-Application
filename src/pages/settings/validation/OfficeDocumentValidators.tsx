import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Text,
  Title3,
  Card,
  CardHeader as FluentCardHeader,
  CardPreview,
  MessageBar,
  MessageBarBody,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Field,
  Input,
  Badge
} from '@fluentui/react-components';
import {
  Building20Regular,
  Document20Regular,
  PersonAdd20Regular,
  Save20Regular,
  ArrowLeft20Regular,
  People20Regular,
  Delete20Regular
} from '@fluentui/react-icons';

import { useValidationSettings } from './hooks/useValidationSettings';
import { EmployeeSelectionDialog } from './components/EmployeeSelectionDialog';
import {
  Employee,
  Office,
  DocumentType,
  OfficeValidator,
  DocumentValidator
} from './types';
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
 * Страница назначения валидаторов по офисам/документам (Стадия 4.2)
 */
export const OfficeDocumentValidators = () => {
  const navigate = useNavigate();
  const { settings, isLoading, updateSettings, saveSettings } = useValidationSettings();
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [currentContext, setCurrentContext] = useState<{
    type: 'office' | 'document';
    id: string;
    name: string;
  } | null>(null);

  // Mock данные - в реальном приложении получать из API
  const offices: Office[] = [
    { id: 'off1', name: 'Главный офис' },
    { id: 'off2', name: 'Региональный офис' },
    { id: 'off3', name: 'Филиал' }
  ];

  const documentTypes: DocumentType[] = [
    { id: 'doc1', name: 'Контракты', category: 'Юридические' },
    { id: 'doc2', name: 'Финансовые отчеты', category: 'Финансовые' },
    { id: 'doc3', name: 'Технические спецификации', category: 'Технические' },
    { id: 'doc4', name: 'Маркетинговые материалы', category: 'Маркетинг' }
  ];

  const employees: Employee[] = [
    { id: 'emp1', name: 'Иван Иванов', email: 'ivan@company.com', department: 'Legal', departmentId: 'dept1', officeId: 'off1', avatar: '👨🏻‍💼' },
    { id: 'emp2', name: 'Мария Петрова', email: 'maria@company.com', department: 'Finance', departmentId: 'dept2', officeId: 'off1', avatar: '👩🏼‍💼' },
    { id: 'emp3', name: 'Алексей Сидоров', email: 'alexey@company.com', department: 'Tech', departmentId: 'dept3', officeId: 'off2', avatar: '👨🏽‍💼' },
    { id: 'emp4', name: 'Елена Козлова', email: 'elena@company.com', department: 'Marketing', departmentId: 'dept4', officeId: 'off3', avatar: '👩🏻‍💼' }
  ];

  if (!settings) {
    return (
      <ScreenContainer>
        <div className="flex items-center justify-center h-64">
          <Spinner label="Loading settings..." />
        </div>
      </ScreenContainer>
    );
  }

  // Определение текущих валидаторов
  const getCurrentValidators = (type: 'office' | 'document', id: string): Employee[] => {
    if (type === 'office') {
      const officeValidator = settings.validatorsByOffice?.find(v => v.officeId === id);
      return officeValidator?.validators || [];
    } else {
      const documentValidator = settings.validatorsByDocument?.find(v => v.documentTypeId === id);
      return documentValidator?.validators || [];
    }
  };

  const handleOpenEmployeeDialog = (type: 'office' | 'document', id: string, name: string) => {
    setCurrentContext({ type, id, name });
    setShowEmployeeDialog(true);
  };

  const handleEmployeeSelect = (selectedEmployees: Employee[]) => {
    if (!currentContext) return;

    if (currentContext.type === 'office') {
      const currentOfficeValidators = settings.validatorsByOffice || [];
      const existingIndex = currentOfficeValidators.findIndex(v => v.officeId === currentContext.id);
      
      const officeValidator: OfficeValidator = {
        officeId: currentContext.id,
        officeName: currentContext.name,
        validatorIds: selectedEmployees.map(emp => emp.id),
        validators: selectedEmployees
      };

      const updatedValidators = [...currentOfficeValidators];
      if (existingIndex >= 0) {
        updatedValidators[existingIndex] = officeValidator;
      } else {
        updatedValidators.push(officeValidator);
      }

      updateSettings({ validatorsByOffice: updatedValidators });
    } else {
      const currentDocumentValidators = settings.validatorsByDocument || [];
      const existingIndex = currentDocumentValidators.findIndex(v => v.documentTypeId === currentContext.id);
      
      const documentValidator: DocumentValidator = {
        documentTypeId: currentContext.id,
        documentTypeName: currentContext.name,
        documentCategory: documentTypes.find(dt => dt.id === currentContext.id)?.category || '',
        validatorIds: selectedEmployees.map(emp => emp.id),
        validators: selectedEmployees
      };

      const updatedValidators = [...currentDocumentValidators];
      if (existingIndex >= 0) {
        updatedValidators[existingIndex] = documentValidator;
      } else {
        updatedValidators.push(documentValidator);
      }

      updateSettings({ validatorsByDocument: updatedValidators });
    }

    setShowEmployeeDialog(false);
    setCurrentContext(null);
  };

  const handleRemoveValidator = (type: 'office' | 'document', contextId: string, employeeId: string) => {
    if (type === 'office') {
      const currentValidators = settings.validatorsByOffice || [];
      const updatedValidators = currentValidators.map(validator => {
        if (validator.officeId === contextId) {
          return {
            ...validator,
            validators: validator.validators.filter(emp => emp.id !== employeeId),
            validatorIds: validator.validatorIds.filter(id => id !== employeeId)
          };
        }
        return validator;
      });
      updateSettings({ validatorsByOffice: updatedValidators });
    } else {
      const currentValidators = settings.validatorsByDocument || [];
      const updatedValidators = currentValidators.map(validator => {
        if (validator.documentTypeId === contextId) {
          return {
            ...validator,
            validators: validator.validators.filter(emp => emp.id !== employeeId),
            validatorIds: validator.validatorIds.filter(id => id !== employeeId)
          };
        }
        return validator;
      });
      updateSettings({ validatorsByDocument: updatedValidators });
    }
  };

  const handleSaveSettings = async () => {
    const success = await saveSettings();
    if (success) {
      navigate('/settings/validation/complete');
    }
  };

  const renderOfficeValidators = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building20Regular className="text-xl text-blue-600" />
        <Title3>Назначение валидаторов по офисам</Title3>
      </div>
      <Text size={300} className="text-gray-600 mb-6">
        Выберите сотрудников, ответственных за валидацию документов в каждом офисе
      </Text>
      
      {offices.map(office => {
        const validators = getCurrentValidators('office', office.id);
        
        return (
          <CardContainer key={office.id}>
            <CardHeader 
              text={office.name}
              icon={<Building20Regular />}
            />
            
            <div className="space-y-3">
              {/* Список назначенных валидаторов */}
              {validators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {validators.map(validator => (
                    <Badge 
                      key={validator.id}
                      appearance="tint"
                      color="brand"
                    >
                      <div className="flex items-center gap-2">
                        <span>{validator.avatar}</span>
                        <span>{validator.name}</span>
                        <Button
                          appearance="transparent"
                          icon={<Delete20Regular />}
                          size="small"
                          onClick={() => handleRemoveValidator('office', office.id, validator.id)}
                        />
                      </div>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Кнопка добавления валидаторов */}
              <Button
                appearance="outline"
                icon={<PersonAdd20Regular />}
                onClick={() => handleOpenEmployeeDialog('office', office.id, office.name)}
              >
                {validators.length > 0 ? 'Изменить валидаторов' : 'Назначить валидаторов'}
              </Button>
            </div>
          </CardContainer>
        );
      })}
    </div>
  );

  const renderDocumentValidators = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Document20Regular className="text-xl text-blue-600" />
        <Title3>Назначение валидаторов по типу документов</Title3>
      </div>
      <Text size={300} className="text-gray-600 mb-6">
        Выберите сотрудников с соответствующей экспертизой для каждого типа документов
      </Text>
      
      {documentTypes.map(docType => {
        const validators = getCurrentValidators('document', docType.id);
        
        return (
          <CardContainer key={docType.id}>
            <CardHeader 
              text={`${docType.name} (${docType.category})`}
              icon={<Document20Regular />}
            />
            
            <div className="space-y-3">
              {/* Список назначенных валидаторов */}
              {validators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {validators.map(validator => (
                    <Badge 
                      key={validator.id}
                      appearance="tint"
                      color="brand"
                    >
                      <div className="flex items-center gap-2">
                        <span>{validator.avatar}</span>
                        <span>{validator.name}</span>
                        <Button
                          appearance="transparent"
                          icon={<Delete20Regular />}
                          size="small"
                          onClick={() => handleRemoveValidator('document', docType.id, validator.id)}
                        />
                      </div>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Кнопка добавления валидаторов */}
              <Button
                appearance="outline"
                icon={<PersonAdd20Regular />}
                onClick={() => handleOpenEmployeeDialog('document', docType.id, docType.name)}
              >
                {validators.length > 0 ? 'Изменить валидаторов' : 'Назначить валидаторов'}
              </Button>
            </div>
          </CardContainer>
        );
      })}
    </div>
  );

  return (
    <PermissionGate 
      permissions={[Permission.VALIDATION_CONFIG]}
      fallback={
        <MessageBar intent="error">
          <MessageBarBody>
            You don't have permission to assign validators
          </MessageBarBody>
        </MessageBar>
      }
    >
      <ScreenContainer>
        <ContentContainer>
          <RowCardContainer>
            {settings.validationAssignment === 'by_office' && renderOfficeValidators()}
            {settings.validationAssignment === 'by_document' && renderDocumentValidators()}
          </RowCardContainer>
        </ContentContainer>

        {/* Кнопки управления */}
        <div className="flex justify-between items-center mt-8 px-6">
          <Button
            appearance="secondary"
            icon={<ArrowLeft20Regular />}
            onClick={() => navigate('/settings/validation')}
            disabled={isLoading}
          >
            Назад
          </Button>
          
          <Button
            appearance="primary"
            icon={<Save20Regular />}
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Сохранить настройки'}
          </Button>
        </div>

        {/* Диалог выбора сотрудников */}
        <EmployeeSelectionDialog
          open={showEmployeeDialog}
          onOpenChange={setShowEmployeeDialog}
          employees={employees}
          selectedEmployees={currentContext ? getCurrentValidators(currentContext.type, currentContext.id) : []}
          searchTerm=""
          onSearchChange={() => {}}
          onEmployeeSelect={() => {}}
          getDepartmentName={(deptId) => deptId}
          onConfirm={handleEmployeeSelect}
          title={`Выбор валидаторов для: ${currentContext?.name}`}
        />
      </ScreenContainer>
    </PermissionGate>
  );
};

export default OfficeDocumentValidators;
