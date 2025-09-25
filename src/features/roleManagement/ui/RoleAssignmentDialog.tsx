import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Field,
  Input,
  Label,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  PersonAdd20Regular,
  Shield20Regular,
  Dismiss20Regular
} from '@fluentui/react-icons';
import { UserRole } from '@/shared/lib/rbac';
import { RoleSelector } from './RoleSelector';
import { PermissionsList } from './PermissionsList';
import { useRoleManagement } from '../model/useRoleManagement';
import { getRolePermissions, getPermissionsForRoles } from '@/shared/lib/rbac';
import { RoleAssignmentDialogProps } from '../model/types';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    minWidth: '500px',
    maxWidth: '600px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  previewSection: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalL,
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
});

export const RoleAssignmentDialog: React.FC<RoleAssignmentDialogProps> = ({
  open,
  onOpenChange,
  userId,
  currentRoles,
  onAssign,
  isLoading = false,
}) => {
  const styles = useStyles();
  const { 
    selectedRoles, 
    availableRoles, 
    isAssigning, 
    error,
    getAvailableRoles,
    updateSelectedRoles,
    reset 
  } = useRoleManagement();

  const [organizationId, setOrganizationId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [officeId, setOfficeId] = useState('');

  // Получить разрешения для выбранных ролей
  const selectedPermissions = getPermissionsForRoles(selectedRoles);

  // Инициализация при открытии диалога
  useEffect(() => {
    if (open) {
      getAvailableRoles();
      updateSelectedRoles(currentRoles);
    } else {
      reset();
    }
  }, [open, currentRoles, getAvailableRoles, updateSelectedRoles, reset]);

  const handleAssign = async () => {
    if (selectedRoles.length === 0) {
      return;
    }

    const assignmentData = {
      userId,
      roles: selectedRoles,
      organizationId: organizationId || undefined,
      departmentId: departmentId || undefined,
      officeId: officeId || undefined,
    };

    const success = await onAssign(assignmentData);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const hasChanges = JSON.stringify(selectedRoles) !== JSON.stringify(currentRoles);

  return (
    <Dialog open={open} onOpenChange={(event, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <PersonAdd20Regular />
            Назначение ролей пользователю
          </div>
        </DialogTitle>
        
        <DialogContent>
          <DialogBody>
            {isLoading || isAssigning ? (
              <div className={styles.loadingContainer}>
                <Spinner size="small" />
                <span>{isAssigning ? 'Назначение ролей...' : 'Загрузка...'}</span>
              </div>
            ) : (
              <div className={styles.dialogContent}>
                {error && (
                  <MessageBar intent="error" className={styles.errorMessage}>
                    <MessageBarBody>{error}</MessageBarBody>
                  </MessageBar>
                )}

                <div className={styles.section}>
                  <Field>
                    <Label>ID пользователя</Label>
                    <Input value={userId} disabled />
                  </Field>
                </div>

                <div className={styles.section}>
                  <RoleSelector
                    selectedRoles={selectedRoles}
                    availableRoles={availableRoles}
                    onRoleChange={updateSelectedRoles}
                    multiple={true}
                  />
                </div>

                <div className={styles.section}>
                  <Field>
                    <Label>ID организации (опционально)</Label>
                    <Input 
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      placeholder="Введите ID организации"
                    />
                  </Field>
                </div>

                <div className={styles.section}>
                  <Field>
                    <Label>ID департамента (опционально)</Label>
                    <Input 
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      placeholder="Введите ID департамента"
                    />
                  </Field>
                </div>

                <div className={styles.section}>
                  <Field>
                    <Label>ID офиса (опционально)</Label>
                    <Input 
                      value={officeId}
                      onChange={(e) => setOfficeId(e.target.value)}
                      placeholder="Введите ID офиса"
                    />
                  </Field>
                </div>

                {selectedRoles.length > 0 && (
                  <div className={styles.previewSection}>
                    <PermissionsList
                      permissions={selectedPermissions}
                      title="Разрешения для выбранных ролей"
                      compact={true}
                    />
                  </div>
                )}
              </div>
            )}
          </DialogBody>
        </DialogContent>
        
        <DialogActions>
          <Button 
            appearance="secondary" 
            onClick={handleCancel}
            icon={<Dismiss20Regular />}
          >
            Отмена
          </Button>
          <Button 
            appearance="primary" 
            onClick={handleAssign}
            disabled={!hasChanges || selectedRoles.length === 0 || isAssigning}
            icon={<Shield20Regular />}
          >
            {isAssigning ? 'Назначение...' : 'Назначить роли'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
