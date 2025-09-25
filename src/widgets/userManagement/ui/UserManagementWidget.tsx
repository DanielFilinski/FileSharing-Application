/**
 * UserManagementWidget Component
 * 
 * Main component for managing users (employees, clients) and departments.
 * Provides a comprehensive interface with tabs, tables, dialogs, and
 * search/filter functionality.
 * 
 * @features
 * - Tabbed interface for employees, clients, and departments
 * - CRUD operations for all user types
 * - Search and filter functionality
 * - Bulk import via Excel files
 * - Responsive design for all screen sizes
 * - Confirmation dialogs for destructive actions
 */
import React, { useState, useMemo } from 'react';
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
  ArrowUpload20Regular,
  Save20Regular,
  Settings20Regular,
  People20Regular,
  Person20Regular
} from '@fluentui/react-icons';
import { useTheme } from '@/app/theme/ThemeProvider';
import { UserTable, DepartmentsTable } from '@/entities/user';
import { useUsers } from '@/entities/user';
import { useUserManagement } from '@/features/userManagement';
import {
  AddEmployeeDialog,
  AddClientDialog,
  ImportDialog,
  DepartmentDialog,
  EditDepartmentDialog
} from '@/features/userManagement';
import { TableContainer } from '@/shared/ui/TableContainer';
import { SearchAndFilter, ConfirmationDialog } from '@/shared/ui';
import { exportEmployees, exportClients, exportDepartments } from '@/shared/lib/excelExport';
import type { Employee, Client, Department } from '@/entities/user';
import type { FilterOption } from '@/shared/ui';

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

/**
 * Main UserManagementWidget component with enhanced functionality
 */
export const UserManagementWidget: React.FC = () => {
  const styles = useStyles();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('employees');
  
  // Search and filter states
  const [searchValue, setSearchValue] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
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
    addDepartment,
    updateDepartment,
    deleteDepartment
  } = useUsers();

  const {
    showAddEmployeeDialog,
    showAddClientDialog,
    showImportDialog,
    showDepartmentDialog,
    showEditDepartmentDialog,
    editingUser,
    editingDepartment,
    openAddEmployeeDialog,
    closeAddEmployeeDialog,
    openAddClientDialog,
    closeAddClientDialog,
    openImportDialog,
    closeImportDialog,
    openDepartmentDialog,
    closeDepartmentDialog,
    openEditDepartmentDialog,
    closeEditDepartmentDialog,
    openEditDialog,
    closeEditDialog
  } = useUserManagement();

  const offices = ['New York', 'Chicago', 'Los Angeles', 'Boston'];

  /**
   * Filtered data based on search and filter criteria
   */
  const filteredData = useMemo(() => {
    const filterBySearch = (text: string) => 
      text.toLowerCase().includes(searchValue.toLowerCase());

    const filteredEmployees = employees.filter(emp => {
      const matchesSearch = !searchValue || 
        filterBySearch(emp.firstName) || 
        filterBySearch(emp.lastName) || 
        filterBySearch(emp.role) ||
        filterBySearch(emp.department);
      
      const matchesDepartment = !departmentFilter || emp.department === departmentFilter;
      const matchesOffice = !officeFilter || emp.office === officeFilter;

      return matchesSearch && matchesDepartment && matchesOffice;
    });

    const filteredClients = clients.filter(client => {
      const matchesSearch = !searchValue || 
        filterBySearch(client.firstName) || 
        filterBySearch(client.lastName) || 
        filterBySearch(client.email) ||
        filterBySearch(client.firmName);

      return matchesSearch;
    });

    const filteredDepartments = departments.filter(dept => {
      const matchesSearch = !searchValue || 
        filterBySearch(dept.name) || 
        filterBySearch(dept.description || '');

      return matchesSearch;
    });

    return {
      employees: filteredEmployees,
      clients: filteredClients,
      departments: filteredDepartments
    };
  }, [employees, clients, departments, searchValue, departmentFilter, officeFilter]);

  /**
   * Filter options for search component
   */
  const filterOptions = useMemo(() => {
    const departmentOptions: FilterOption[] = departments.map(dept => ({
      key: dept.id.toString(),
      text: dept.name,
      value: dept.name
    }));

    const officeOptions: FilterOption[] = offices.map(office => ({
      key: office,
      text: office,
      value: office
    }));

    return {
      departments: departmentOptions,
      offices: officeOptions
    };
  }, [departments, offices]);

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

  /**
   * Handles import of data from Excel files
   * @param type - Type of import (employees or clients)
   * @param data - Parsed data from Excel file
   */
  const handleImport = (type: 'employees' | 'clients', data: any[]) => {
    try {
      if (type === 'employees') {
        // Add all employees from import
        data.forEach(employee => addEmployee(employee));
        console.log(`Successfully imported ${data.length} employees`);
      } else {
        // Add all clients from import
        data.forEach(client => addClient(client));
        console.log(`Successfully imported ${data.length} clients`);
      }
      
      // Switch to appropriate tab to show imported data
      setActiveTab(type);
      closeImportDialog();
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const handleAddDepartment = (departmentData: { name: string; description: string; manager?: string; managerId?: number }) => {
    addDepartment(departmentData);
    closeDepartmentDialog();
  };

  /**
   * Handles department editing
   */
  const handleEditDepartment = (departmentData: Department) => {
    updateDepartment(departmentData.id, departmentData);
    closeEditDepartmentDialog();
  };

  /**
   * Shows confirmation dialog for deleting employees
   */
  const handleDeleteEmployee = (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;

    setConfirmDialog({
      open: true,
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`,
      onConfirm: () => deleteEmployee(id)
    });
  };

  /**
   * Shows confirmation dialog for deleting clients
   */
  const handleDeleteClient = (id: number) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    setConfirmDialog({
      open: true,
      title: 'Delete Client',
      message: `Are you sure you want to delete ${client.firstName} ${client.lastName}? This action cannot be undone.`,
      onConfirm: () => deleteClient(id)
    });
  };

  /**
   * Shows confirmation dialog for deleting departments
   */
  const handleDeleteDepartment = (id: number) => {
    const department = departments.find(dept => dept.id === id);
    if (!department) return;

    setConfirmDialog({
      open: true,
      title: 'Delete Department',
      message: `Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`,
      onConfirm: () => deleteDepartment(id)
    });
  };

  /**
   * Clears all search and filter values
   */
  const handleClearFilters = () => {
    setDepartmentFilter('');
    setOfficeFilter('');
  };

  /**
   * Handles export of filtered employee data
   */
  const handleExportEmployees = async () => {
    await exportEmployees(filteredData.employees, {
      filename: 'employees_export'
    });
  };

  /**
   * Handles export of filtered client data
   */
  const handleExportClients = async () => {
    await exportClients(filteredData.clients, {
      filename: 'clients_export'
    });
  };

  /**
   * Handles export of filtered department data
   */
  const handleExportDepartments = async () => {
    await exportDepartments(filteredData.departments, {
      filename: 'departments_export'
    });
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
              <Tab value="departments" icon={<BuildingMultiple20Regular />}>
                Departments
              </Tab>
            </TabList>
          </div>

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Subtitle2>Employees ({filteredData.employees.length})</Subtitle2>
                <div className={styles.actionButtons}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowUpload20Regular />}
                    onClick={handleExportEmployees}
                    disabled={filteredData.employees.length === 0}
                  >
                    Export
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
              
              {/* Search and Filter */}
              <SearchAndFilter
                searchPlaceholder="Search employees..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                filters={[
                  {
                    label: 'Department',
                    value: departmentFilter,
                    options: filterOptions.departments,
                    onChange: setDepartmentFilter
                  },
                  {
                    label: 'Office',
                    value: officeFilter,
                    options: filterOptions.offices,
                    onChange: setOfficeFilter
                  }
                ]}
                onClearFilters={handleClearFilters}
              />
              
              <TableContainer>
                <UserTable
                  users={filteredData.employees}
                  type="employee"
                  onEdit={openEditDialog}
                  onDelete={handleDeleteEmployee}
                />
              </TableContainer>
            </Card>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Subtitle2>Clients ({filteredData.clients.length})</Subtitle2>
                <div className={styles.actionButtons}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowUpload20Regular />}
                    onClick={handleExportClients}
                    disabled={filteredData.clients.length === 0}
                  >
                    Export
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
                    onClick={openAddClientDialog}
                  >
                    Add Client
                  </Button>
                </div>
              </div>
              
              {/* Search for Clients */}
              <SearchAndFilter
                searchPlaceholder="Search clients..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onClearFilters={() => setSearchValue('')}
              />
              
              <TableContainer>
                <UserTable
                  users={filteredData.clients}
                  type="client"
                  onEdit={openEditDialog}
                  onDelete={handleDeleteClient}
                />
              </TableContainer>
            </Card>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Subtitle2>Departments ({filteredData.departments.length})</Subtitle2>
                <div className={styles.actionButtons}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowUpload20Regular />}
                    onClick={handleExportDepartments}
                    disabled={filteredData.departments.length === 0}
                  >
                    Export
                  </Button>
                  <Button
                    appearance="primary"
                    icon={<BuildingMultiple20Regular />}
                    onClick={openDepartmentDialog}
                  >
                    Add Department
                  </Button>
                </div>
              </div>
              
              {/* Search for Departments */}
              <SearchAndFilter
                searchPlaceholder="Search departments..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onClearFilters={() => setSearchValue('')}
              />
              
              <TableContainer>
                <DepartmentsTable
                  departments={filteredData.departments}
                  onEdit={openEditDepartmentDialog}
                  onDelete={handleDeleteDepartment}
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
        employees={employees}
      />
      
      <EditDepartmentDialog
        open={showEditDepartmentDialog}
        onOpenChange={(event: any, data: { open: boolean }) => data.open ? openEditDepartmentDialog(editingDepartment!) : closeEditDepartmentDialog()}
        onSubmit={handleEditDepartment}
        department={editingDepartment}
        employees={employees}
      />
      
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(event: any, data: { open: boolean }) => setConfirmDialog(prev => ({ ...prev, open: data.open }))}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}; 