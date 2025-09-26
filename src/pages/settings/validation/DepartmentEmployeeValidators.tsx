import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Text,
  Title3,
  MessageBar,
  MessageBarBody,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  TableColumnDefinition,
  createTableColumn,
  Badge
} from '@fluentui/react-components';
import {
  People20Regular,
  PersonCircle20Regular,
  PersonAdd20Regular,
  Save20Regular,
  ArrowLeft20Regular,
  Delete20Regular,
  Add20Regular
} from '@fluentui/react-icons';

import { useValidationSettings } from './hooks/useValidationSettings';
import { EmployeeSelectionDialog } from './components/EmployeeSelectionDialog';
import {
  Employee,
  Department,
  EmployeeValidator,
  DepartmentValidator
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
 * Страница назначения валидаторов по отделам/сотрудникам (Стадия 4.3)
 */
export const DepartmentEmployeeValidators = () => {
  const navigate = useNavigate();
  const { settings, isLoading, updateSettings, saveSettings } = useValidationSettings();
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');

  // Mock данные - в реальном приложении получать из API
  const departments: Department[] = [
    { id: 'dept1', name: 'Юридический отдел' },
    { id: 'dept2', name: 'Финансовый отдел' },
    { id: 'dept3', name: 'Технический отдел' },
    { id: 'dept4', name: 'Отдел маркетинга' }
  ];

  const employees: Employee[] = [
    { id: 'emp1', name: 'Иван Иванов', email: 'ivan@company.com', department: 'Юридический отдел', departmentId: 'dept1', avatar: '👨🏻‍💼' },
    { id: 'emp2', name: 'Мария Петрова', email: 'maria@company.com', department: 'Финансовый отдел', departmentId: 'dept2', avatar: '👩🏼‍💼' },
    { id: 'emp3', name: 'Алексей Сидоров', email: 'alexey@company.com', department: 'Технический отдел', departmentId: 'dept3', avatar: '👨🏽‍💼' },
    { id: 'emp4', name: 'Елена Козлова', email: 'elena@company.com', department: 'Отдел маркетинга', departmentId: 'dept4', avatar: '👩🏻‍💼' },
    { id: 'emp5', name: 'Петр Сергеев', email: 'petr@company.com', department: 'Юридический отдел', departmentId: 'dept1', avatar: '👨🏻‍💼' },
    { id: 'emp6', name: 'Анна Федорова', email: 'anna@company.com', department: 'Финансовый отдел', departmentId: 'dept2', avatar: '👩🏻‍💼' }
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

  // Колонки для таблицы сотрудников-валидаторов
  const employeeColumns: TableColumnDefinition<EmployeeValidator>[] = [
    createTableColumn({
      columnId: 'name',
      compare: (a, b) => a.userName.localeCompare(b.userName)
    }),
    createTableColumn({
      columnId: 'email',
      compare: (a, b) => a.email.localeCompare(b.email)
    }),
    createTableColumn({
      columnId: 'department',
      compare: (a, b) => a.departmentName.localeCompare(b.departmentName)
    }),
    createTableColumn({
      columnId: 'actions'
    })
  ];

  // Получение валидаторов для отдела
  const getDepartmentValidators = (departmentId: string): Employee[] => {
    const departmentValidator = settings.validatorsByDepartment?.find(v => v.departmentId === departmentId);
    return departmentValidator?.validators || [];
  };

  // Обработка выбора валидаторов для отдела
  const handleDepartmentEmployeeSelect = (departmentId: string, selectedEmployees: Employee[]) => {
    const currentDepartmentValidators = settings.validatorsByDepartment || [];
    const existingIndex = currentDepartmentValidators.findIndex(v => v.departmentId === departmentId);
    const department = departments.find(d => d.id === departmentId);
    
    const departmentValidator: DepartmentValidator = {
      departmentId,
      departmentName: department?.name || '',
      validatorIds: selectedEmployees.map(emp => emp.id),
      validators: selectedEmployees
    };

    const updatedValidators = [...currentDepartmentValidators];
    if (existingIndex >= 0) {
      updatedValidators[existingIndex] = departmentValidator;
    } else {
      updatedValidators.push(departmentValidator);
    }

    updateSettings({ validatorsByDepartment: updatedValidators });
    setShowEmployeeDialog(false);
    setCurrentDepartmentId('');
  };

  // Обработка добавления индивидуального валидатора
  const handleAddIndividualValidator = (selectedEmployees: Employee[]) => {
    if (selectedEmployees.length === 0) return;

    const currentEmployeeValidators = settings.validatorsByEmployee || [];
    const newEmployeeValidators = selectedEmployees.map(employee => {
      const department = departments.find(d => d.id === employee.departmentId);
      
      const employeeValidator: EmployeeValidator = {
        userId: employee.id,
        userName: employee.name,
        email: employee.email,
        departmentId: employee.departmentId,
        departmentName: department?.name || employee.department,
        officeId: employee.officeId,
        officeName: employee.officeId // TODO: Получать название офиса из API
      };
      
      return employeeValidator;
    });

    // Добавляем только новых валидаторов (избегаем дублей)
    const existingIds = currentEmployeeValidators.map(v => v.userId);
    const uniqueValidators = newEmployeeValidators.filter(v => !existingIds.includes(v.userId));
    
    const updatedValidators = [...currentEmployeeValidators, ...uniqueValidators];
    updateSettings({ validatorsByEmployee: updatedValidators });
    setShowAddEmployeeDialog(false);
  };

  // Удаление индивидуального валидатора
  const handleRemoveEmployeeValidator = (employeeId: string) => {
    const currentValidators = settings.validatorsByEmployee || [];
    const updatedValidators = currentValidators.filter(v => v.userId !== employeeId);
    updateSettings({ validatorsByEmployee: updatedValidators });
  };

  // Открытие диалога для выбора валидаторов отдела
  const handleOpenDepartmentDialog = (departmentId: string) => {
    setCurrentDepartmentId(departmentId);
    setShowEmployeeDialog(true);
  };

  const handleSaveSettings = async () => {
    const success = await saveSettings();
    if (success) {
      navigate('/settings/validation/complete');
    }
  };

  const renderDepartmentValidators = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <People20Regular className="text-xl text-blue-600" />
        <Title3>Назначение валидаторов по отделам</Title3>
      </div>
      <Text size={300} className="text-gray-600 mb-6">
        Выберите руководителей отделов или назначенных сотрудников для валидации документов
      </Text>
      
      {departments.map(department => {
        const validators = getDepartmentValidators(department.id);
        
        return (
          <CardContainer key={department.id}>
            <CardHeader 
              text={department.name}
              icon={<People20Regular />}
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
                      </div>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Кнопка добавления валидаторов */}
              <Button
                appearance="outline"
                icon={<PersonAdd20Regular />}
                onClick={() => handleOpenDepartmentDialog(department.id)}
              >
                {validators.length > 0 ? 'Изменить валидаторов' : 'Назначить валидаторов'}
              </Button>
            </div>
          </CardContainer>
        );
      })}
    </div>
  );

  const renderEmployeeValidators = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PersonCircle20Regular className="text-xl text-blue-600" />
          <Title3>Назначение валидаторов по сотрудникам</Title3>
        </div>
        
        <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
          <DialogTrigger>
            <Button 
              appearance="primary" 
              icon={<Add20Regular />}
            >
              Добавить валидатора
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
      
      <Text size={300} className="text-gray-600 mb-6">
        Выберите конкретных сотрудников для выполнения валидации документов
      </Text>

      {/* Таблица назначенных валидаторов */}
      {settings.validatorsByEmployee && settings.validatorsByEmployee.length > 0 ? (
        <CardContainer>
          <DataGrid 
            columns={employeeColumns} 
            items={settings.validatorsByEmployee}
            sortable
          >
            <DataGridHeader>
              <DataGridRow>
                <DataGridHeaderCell>Имя</DataGridHeaderCell>
                <DataGridHeaderCell>Email</DataGridHeaderCell>
                <DataGridHeaderCell>Отдел</DataGridHeaderCell>
                <DataGridHeaderCell>Действия</DataGridHeaderCell>
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody>
              {({ item }) => (
                <DataGridRow key={item.userId}>
                  <DataGridCell>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>{item.userName}</span>
                    </div>
                  </DataGridCell>
                  <DataGridCell>{item.email}</DataGridCell>
                  <DataGridCell>{item.departmentName}</DataGridCell>
                  <DataGridCell>
                    <Button 
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => handleRemoveEmployeeValidator(item.userId)}
                    >
                      Удалить
                    </Button>
                  </DataGridCell>
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </CardContainer>
      ) : (
        <CardContainer>
          <div className="text-center py-8">
            <PersonCircle20Regular className="text-4xl text-gray-400 mb-4" />
            <Text size={400} className="text-gray-600">
              Валидаторы не назначены
            </Text>
            <Text size={300} className="text-gray-500 mt-2">
              Нажмите "Добавить валидатора" для назначения сотрудников
            </Text>
          </div>
        </CardContainer>
      )}
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
            {settings.validationAssignment === 'by_department' && renderDepartmentValidators()}
            {settings.validationAssignment === 'by_employee' && renderEmployeeValidators()}
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

        {/* Диалог выбора сотрудников для отдела */}
        <EmployeeSelectionDialog
          open={showEmployeeDialog}
          onOpenChange={setShowEmployeeDialog}
          employees={employees.filter(emp => emp.departmentId === currentDepartmentId)}
          selectedEmployees={currentDepartmentId ? getDepartmentValidators(currentDepartmentId) : []}
          searchTerm=""
          onSearchChange={() => {}}
          onEmployeeSelect={() => {}}
          getDepartmentName={(deptId) => departments.find(d => d.id === deptId)?.name || ''}
          onConfirm={(selected) => handleDepartmentEmployeeSelect(currentDepartmentId, selected)}
          title={`Выбор валидаторов для отдела: ${departments.find(d => d.id === currentDepartmentId)?.name}`}
        />

        {/* Диалог добавления индивидуального валидатора */}
        <EmployeeSelectionDialog
          open={showAddEmployeeDialog}
          onOpenChange={setShowAddEmployeeDialog}
          employees={employees.filter(emp => 
            !(settings.validatorsByEmployee || []).some(v => v.userId === emp.id)
          )}
          selectedEmployees={[]}
          searchTerm=""
          onSearchChange={() => {}}
          onEmployeeSelect={() => {}}
          getDepartmentName={(deptId) => departments.find(d => d.id === deptId)?.name || ''}
          onConfirm={handleAddIndividualValidator}
          title="Добавление валидатора"
          allowMultiple
        />
      </ScreenContainer>
    </PermissionGate>
  );
};

export default DepartmentEmployeeValidators;
