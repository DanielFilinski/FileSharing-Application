import React, { useState } from 'react';
import {
  Button,
  Tab,
  TabList,
  Card,
  CardHeader,
  Subtitle2,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  PersonAdd20Regular,
  BuildingMultiple20Regular,
  ArrowDownload20Regular,
  Save20Regular,
  Settings20Regular,
  People20Regular,
  Person20Regular
} from '@fluentui/react-icons';
import { useTheme } from '@/app/theme/ThemeProvider';
import { UserTable } from '@/entities/user';
import { useUsers } from '@/entities/user';
import { useUserManagement } from '@/features/userManagement';
import {
  AddEmployeeDialog,
  AddClientDialog,
  ImportDialog,
  DepartmentDialog
} from '@/features/userManagement';
import { TableContainer } from '@/shared/ui/TableContainer';
import type { Employee, Client } from '@/entities/user';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
    minHeight: '60px',
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
      flexDirection: 'column',
      gap: tokens.spacingVerticalS,
      minHeight: 'auto'
    }
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXL}`,
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalM}`
    }
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  },
  tabContainer: {
    marginBottom: tokens.spacingVerticalXL
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2
  },
  cardHeader: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
      flexDirection: 'column',
      gap: tokens.spacingVerticalM,
      alignItems: 'flex-start'
    }
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    '@media (max-width: 768px)': {
      flexWrap: 'wrap',
      width: '100%'
    }
  },

});

export const UserManagementWidget: React.FC = () => {
  const styles = useStyles();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('employees');
  
  const {
    employees,
    clients,
    departments,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addClient,
    updateClient,
    deleteClient,
    addDepartment
  } = useUsers();

  const {
    showAddEmployeeDialog,
    showAddClientDialog,
    showImportDialog,
    showDepartmentDialog,
    editingUser,
    openAddEmployeeDialog,
    closeAddEmployeeDialog,
    openAddClientDialog,
    closeAddClientDialog,
    openImportDialog,
    closeImportDialog,
    openDepartmentDialog,
    closeDepartmentDialog,
    openEditDialog,
    closeEditDialog
  } = useUserManagement();

  const offices = ['New York', 'Chicago', 'Los Angeles', 'Boston'];

  const handleAddEmployee = (employeeData: Omit<Employee, 'id'>) => {
    if (editingUser && 'classification' in editingUser) {
      updateEmployee(editingUser.id, employeeData);
    } else {
      addEmployee(employeeData);
    }
    closeEditDialog();
  };

  const handleAddClient = (clientData: Omit<Client, 'id'>) => {
    if (editingUser && !('classification' in editingUser)) {
      updateClient(editingUser.id, clientData);
    } else {
      addClient(clientData);
    }
    closeEditDialog();
  };

  const handleImport = (file: File) => {
    // TODO: Implement file import logic
    console.log('Importing file:', file.name);
    closeImportDialog();
  };

  const handleAddDepartment = (departmentData: { name: string; description: string }) => {
    addDepartment(departmentData);
    closeDepartmentDialog();
  };

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Settings20Regular />
          <Subtitle2>User Settings</Subtitle2>
        </div>
        <Button 
          appearance="primary" 
          icon={<Save20Regular />}
        >
          Save changes
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          {/* Tab Navigation */}
          <div className={styles.tabContainer}>
            <TabList 
              selectedValue={activeTab} 
              onTabSelect={(event, data) => setActiveTab(data.value?.toString() || 'employees')}
            >
              <Tab value="employees" icon={<People20Regular />}>
                Employees
              </Tab>
              <Tab value="clients" icon={<Person20Regular />}>
                Clients
              </Tab>
            </TabList>
          </div>

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Subtitle2>Employees</Subtitle2>
                <div className={styles.actionButtons}>
                  <Button
                    appearance="subtle"
                    icon={<BuildingMultiple20Regular />}
                    onClick={openDepartmentDialog}
                  >
                    Add Department
                  </Button>
                  <Button
                    appearance="subtle"
                    icon={<ArrowDownload20Regular />}
                    onClick={openImportDialog}
                  >
                    Import
                  </Button>
                  <Button
                    appearance="primary"
                    icon={<PersonAdd20Regular />}
                    onClick={openAddEmployeeDialog}
                  >
                    Add Employee
                  </Button>
                </div>
              </div>
              
                             <TableContainer>
                 <UserTable
                   users={employees}
                   type="employee"
                   onEdit={openEditDialog}
                   onDelete={deleteEmployee}
                 />
               </TableContainer>
            </Card>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Subtitle2>Clients</Subtitle2>
                <div className={styles.actionButtons}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowDownload20Regular />}
                    onClick={openImportDialog}
                  >
                    Import
                  </Button>
                  <Button
                    appearance="primary"
                    icon={<PersonAdd20Regular />}
                    onClick={openAddClientDialog}
                  >
                    Add Client
                  </Button>
                </div>
              </div>
              
                             <TableContainer>
                 <UserTable
                   users={clients}
                   type="client"
                   onEdit={openEditDialog}
                   onDelete={deleteClient}
                 />
               </TableContainer>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddEmployeeDialog
        open={showAddEmployeeDialog}
        onOpenChange={(event: any, data: { open: boolean }) => data.open ? openAddEmployeeDialog() : closeAddEmployeeDialog()}
        onSubmit={handleAddEmployee}
        editingEmployee={editingUser && 'classification' in editingUser ? editingUser : null}
        departments={departments}
        offices={offices}
      />
      <AddClientDialog
        open={showAddClientDialog}
        onOpenChange={(event: any, data: { open: boolean }) => data.open ? openAddClientDialog() : closeAddClientDialog()}
        onSubmit={handleAddClient}
        editingClient={editingUser && !('classification' in editingUser) ? editingUser : null}
      />
      <ImportDialog
        open={showImportDialog}
        onOpenChange={(event: any, data: { open: boolean }) => data.open ? openImportDialog() : closeImportDialog()}
        onImport={handleImport}
      />
      <DepartmentDialog
        open={showDepartmentDialog}
        onOpenChange={(event: any, data: { open: boolean }) => data.open ? openDepartmentDialog() : closeDepartmentDialog()}
        onSubmit={handleAddDepartment}
      />
    </div>
  );
}; 