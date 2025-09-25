# 🔗 Примеры интеграции RBAC системы

## 1. Обновление UserTable с ролями

```tsx
// src/entities/user/ui/UserTable.tsx
import React from 'react';
import { Badge } from '@fluentui/react-components';
import { Shield20Regular } from '@fluentui/react-icons';
import { 
  UserRole, 
  getRoleDisplayName, 
  getRoleIcon,
  PermissionGate,
  Permission 
} from '@/shared/lib/rbac';
import { Employee, Client } from '../model/types';

// Добавить колонку ролей в таблицу сотрудников
const renderEmployeeRow = (employee: Employee) => (
  <TableRow key={employee.id}>
    <TableCell>
      <UserAvatar user={employee} />
      {employee.firstName} {employee.lastName}
    </TableCell>
    
    {/* Новая колонка с ролями */}
    <TableCell>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {employee.userRoles?.map(role => (
          <Badge
            key={role}
            appearance="tint"
            color="brand"
            icon={<span>{getRoleIcon(role)}</span>}
          >
            {getRoleDisplayName(role)}
          </Badge>
        )) || <Badge appearance="outline">Нет ролей</Badge>}
      </div>
    </TableCell>
    
    {/* Действия только для пользователей с правами */}
    <TableCell>
      <PermissionGate permissions={[Permission.USERS_EDIT]}>
        <Button onClick={() => openRoleAssignmentDialog(employee)}>
          <Shield20Regular />
          Управление ролями
        </Button>
      </PermissionGate>
    </TableCell>
  </TableRow>
);
```

## 2. Защищенная навигация

```tsx
// src/app/navigation/Navigation.tsx
import { useNavigationPermissions } from '@/shared/lib/rbac';

export const Navigation = () => {
  const {
    canAccessDocuments,
    canAccessSettings,
    canAccessUsers,
    canAccessAdmin
  } = useNavigationPermissions();

  return (
    <nav>
      {canAccessDocuments && (
        <NavItem href="/documents">Документы</NavItem>
      )}
      
      {canAccessUsers && (
        <NavItem href="/users">Пользователи</NavItem>
      )}
      
      {canAccessSettings && (
        <NavItem href="/settings">Настройки</NavItem>
      )}
      
      {canAccessAdmin && (
        <NavItem href="/admin">Администрирование</NavItem>
      )}
    </nav>
  );
};
```

## 3. Условные UI элементы

```tsx
// src/pages/documents/components/Toolbar.tsx
import { 
  useDocumentPermissions,
  AdminGuard,
  Permission,
  PermissionGate 
} from '@/shared/lib/rbac';

export const DocumentToolbar = () => {
  const {
    canCreateDocuments,
    canDeleteDocuments,
    canApproveDocuments
  } = useDocumentPermissions();

  return (
    <div className="toolbar">
      {/* Создание документов */}
      <PermissionGate permissions={[Permission.DOCS_CREATE]}>
        <Button appearance="primary">
          Создать документ
        </Button>
      </PermissionGate>
      
      {/* Одобрение документов */}
      <PermissionGate permissions={[Permission.DOCS_APPROVE]}>
        <Button appearance="secondary">
          Одобрить
        </Button>
      </PermissionGate>
      
      {/* Административные действия */}
      <AdminGuard>
        <Button appearance="subtle">
          Панель администратора
        </Button>
      </AdminGuard>
    </div>
  );
};
```

## 4. Обновление UserManagementWidget

```tsx
// src/widgets/userManagement/ui/UserManagementWidget.tsx
import { useState } from 'react';
import { Tab, TabList } from '@fluentui/react-components';
import { Shield20Regular } from '@fluentui/react-icons';
import { 
  UserManagementGuard,
  RoleAssignmentDialog,
  useRoleManagement 
} from '@/shared/lib/rbac';
import { RoleAssignmentDialog } from '@/features/roleManagement';

export const UserManagementWidget = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  
  const roleManagement = useRoleManagement();

  const handleAssignRoles = async (data) => {
    const success = await roleManagement.assignRoles(data);
    if (success) {
      // Обновить список пользователей
      fetchUsers();
    }
    return success;
  };

  return (
    <UserManagementGuard>
      <div>
        <TabList selectedValue={activeTab}>
          <Tab value="employees">Сотрудники</Tab>
          <Tab value="clients">Клиенты</Tab>
          <Tab value="roles">
            <Shield20Regular />
            Управление ролями
          </Tab>
        </TabList>
        
        {activeTab === 'roles' && (
          <RoleManagement onAssignRoles={handleAssignRoles} />
        )}
        
        <RoleAssignmentDialog
          open={showRoleDialog}
          onOpenChange={setShowRoleDialog}
          userId={selectedUser?.id}
          currentRoles={selectedUser?.userRoles || []}
          onAssign={handleAssignRoles}
        />
      </div>
    </UserManagementGuard>
  );
};
```

## 5. API Protection (Backend)

```typescript
// api/src/middleware/rbac.ts
import { HttpRequest } from '@azure/functions';
import { Permission, checkUserPermission } from './rbac-utils';

export const requirePermission = (permission: Permission) => {
  return async (req: HttpRequest, user: any, next: Function) => {
    const check = checkUserPermission(user, permission);
    
    if (!check.granted) {
      return {
        status: 403,
        body: JSON.stringify({
          error: 'Access denied',
          reason: check.reason,
          requiredPermission: permission
        })
      };
    }
    
    return next();
  };
};

// Использование в API функциях
export const createDocument = requirePermission(Permission.DOCS_CREATE)(
  async (req, context) => {
    // Создание документа только для пользователей с правами
  }
);
```

## 6. Настройки страниц

```tsx
// src/pages/settings/organization/Organization.tsx
import { SettingsGuard, Permission } from '@/shared/lib/rbac';

export const OrganizationSettings = () => {
  return (
    <SettingsGuard 
      fallback={<div>У вас нет прав для просмотра настроек организации</div>}
    >
      <OrganizationForm />
    </SettingsGuard>
  );
};
```

## 🎯 Практические советы

### 1. Иерархия ролей
Роли имеют приоритет - Organization Owner может назначить любую роль, Administrator не может назначить Organization Owner.

### 2. Контекстные разрешения
```tsx
const canEditThisDocument = checkUserPermission(
  user, 
  Permission.DOCS_EDIT, 
  { organizationId: document.organizationId }
).granted;
```

### 3. Множественные роли
Пользователь может иметь несколько ролей - система автоматически объединяет разрешения.

### 4. Защита маршрутов
```tsx
// router.tsx
<ProtectedRoute permission={Permission.USERS_VIEW}>
  <UsersPage />
</ProtectedRoute>
```
