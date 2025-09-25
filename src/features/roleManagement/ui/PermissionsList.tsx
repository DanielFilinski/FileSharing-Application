import React from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  makeStyles,
  tokens,
  Subtitle2
} from '@fluentui/react-components';
import { 
  Shield20Regular,
  Checkmark20Regular 
} from '@fluentui/react-icons';
import { Permission } from '@/shared/lib/rbac';
import { PermissionsListProps } from '../model/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  permissionsList: {
    display: 'grid',
    gap: tokens.spacingVerticalS,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  permissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  permissionIcon: {
    color: tokens.colorBrandForeground1,
  },
  permissionText: {
    flex: 1,
    fontSize: tokens.fontSizeBase200,
  },
  compactList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
  },
  compactItem: {
    fontSize: tokens.fontSizeBase100,
  },
});

const getPermissionDisplayName = (permission: Permission): string => {
  const permissionNames: Record<Permission, string> = {
    [Permission.SYSTEM_ADMIN]: 'Системное администрирование',
    [Permission.SYSTEM_CONFIG]: 'Системные настройки',
    [Permission.SYSTEM_ANALYTICS]: 'Системная аналитика',
    
    [Permission.ORG_MANAGE]: 'Управление организацией',
    [Permission.ORG_SETTINGS]: 'Настройки организации',
    [Permission.ORG_BILLING]: 'Биллинг организации',
    
    [Permission.USERS_VIEW]: 'Просмотр пользователей',
    [Permission.USERS_CREATE]: 'Создание пользователей',
    [Permission.USERS_EDIT]: 'Редактирование пользователей',
    [Permission.USERS_DELETE]: 'Удаление пользователей',
    [Permission.USERS_ASSIGN_ROLES]: 'Назначение ролей',
    
    [Permission.DEPT_MANAGE]: 'Управление департаментами',
    [Permission.OFFICE_MANAGE]: 'Управление офисами',
    
    [Permission.STORAGE_CONFIG]: 'Настройки хранилища',
    [Permission.STORAGE_VIEW]: 'Просмотр хранилища',
    
    [Permission.DOCS_VIEW_ALL]: 'Просмотр всех документов',
    [Permission.DOCS_VIEW_ASSIGNED]: 'Просмотр назначенных документов',
    [Permission.DOCS_CREATE]: 'Создание документов',
    [Permission.DOCS_EDIT]: 'Редактирование документов',
    [Permission.DOCS_DELETE]: 'Удаление документов',
    [Permission.DOCS_SHARE]: 'Публикация документов',
    [Permission.DOCS_UPLOAD]: 'Загрузка документов',
    [Permission.DOCS_DOWNLOAD]: 'Скачивание документов',
    
    [Permission.DOCS_VALIDATE]: 'Валидация документов',
    [Permission.DOCS_VALIDATE_SETTINGS]: 'Настройки валидации',
    
    [Permission.DOCS_APPROVE]: 'Одобрение документов',
    [Permission.DOCS_APPROVE_DEPT]: 'Одобрение документов департамента',
    [Permission.DOCS_APPROVE_SETTINGS]: 'Настройки одобрения',
    
    [Permission.DOCS_SIGN]: 'Подписание документов',
    [Permission.DOCS_SIGN_SETTINGS]: 'Настройки подписания',
    
    [Permission.WORKFLOW_CREATE]: 'Создание рабочих процессов',
    [Permission.WORKFLOW_MANAGE]: 'Управление рабочими процессами',
    [Permission.WORKFLOW_VIEW]: 'Просмотр рабочих процессов',
    
    [Permission.VALIDATION_CONFIG]: 'Настройка валидации',
    [Permission.APPROVAL_CONFIG]: 'Настройка одобрения',
  };

  return permissionNames[permission] || permission;
};

export const PermissionsList: React.FC<PermissionsListProps> = ({
  permissions,
  title = 'Разрешения',
  compact = false,
}) => {
  const styles = useStyles();

  if (compact) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Shield20Regular />
          <Subtitle2>{title}</Subtitle2>
          <Badge appearance="outline" color="brand">
            {permissions.length}
          </Badge>
        </div>
        <div className={styles.compactList}>
          {permissions.map((permission) => (
            <Badge
              key={permission}
              appearance="tint"
              color="success"
              className={styles.compactItem}
            >
              {getPermissionDisplayName(permission)}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Shield20Regular />
        <Subtitle2>{title}</Subtitle2>
        <Badge appearance="outline" color="brand">
          {permissions.length}
        </Badge>
      </div>
      
      <div className={styles.permissionsList}>
        {permissions.map((permission) => (
          <div key={permission} className={styles.permissionItem}>
            <Checkmark20Regular className={styles.permissionIcon} />
            <Text className={styles.permissionText}>
              {getPermissionDisplayName(permission)}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};
