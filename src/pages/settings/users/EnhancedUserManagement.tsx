/**
 * Enhanced User Management - Main component for managing employees, clients, and departments
 * Integrates all user management functionality with advanced features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tab,
  TabList,
  TabValue,
  Button,
  Input,
  SearchBox,
  Dropdown,
  Option,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  TableSelectionCell,
  TableColumnDefinition,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  Divider,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  PersonAdd24Regular,
  BuildingAdd24Regular,
  DocumentArrowUp24Regular,
  DocumentArrowDown24Regular,
  Search24Regular,
  Filter24Regular,
  MoreHorizontal24Regular,
  Edit24Regular,
  Delete24Regular,
  Person24Regular,
  Building24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular
} from '@fluentui/react-icons';

import { 
  userManagementService,
  type Employee,
  type Client,
  type Department,
  type BulkOperationResult
} from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';

import {
  EmployeeForm,
  ClientForm,
  DepartmentForm,
  ExcelImportDialog
} from './components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },
  searchBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },
  searchInput: {
    flex: 1,
    maxWidth: '400px'
  },
  filterDropdown: {
    minWidth: '150px'
  },
  actionsBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },
  tabContent: {
    marginTop: tokens.spacingVerticalM
  },
  dataGrid: {
    marginTop: tokens.spacingVerticalM
  },
  statusBadge: {
    marginLeft: tokens.spacingHorizontalXS
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXL
  },
  error: {
    marginBottom: tokens.spacingVerticalM
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground2
  }
});

type TabValue = 'employees' | 'clients' | 'departments';
type ViewMode = 'create' | 'edit' | 'view';

export const EnhancedUserManagement: React.FC = () => {
  const styles = useStyles();
  
  // State management
  const [activeTab, setActiveTab] = useState<TabValue>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | undefined>();
  const [formMode, setFormMode] = useState<ViewMode>('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    department: '',
    office: '',
    isActive: '',
    accessLevel: ''
  });
  
  // Selection states
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set());
  
  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);
  
  // Load data based on active tab
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'employees':
          await loadEmployees();
          break;
        case 'clients':
          await loadClients();
          break;
        case 'departments':
          await loadDepartments();
          break;
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load employees
  const loadEmployees = async () => {
    const filters: any = {};
    if (selectedFilters.department) filters.department = selectedFilters.department;
    if (selectedFilters.office) filters.office = selectedFilters.office;
    if (selectedFilters.isActive) filters.isActive = selectedFilters.isActive === 'true';
    
    const result = await userManagementService.getEmployees(filters);
    if (result.success && result.data) {
      setEmployees(result.data);
    } else {
      throw new Error(result.error || 'Failed to load employees');
    }
  };
  
  // Load clients
  const loadClients = async () => {
    const filters: any = {};
    if (selectedFilters.isActive) filters.isActive = selectedFilters.isActive === 'true';
    if (selectedFilters.accessLevel) filters.accessLevel = selectedFilters.accessLevel;
    
    const result = await userManagementService.getClients(filters);
    if (result.success && result.data) {
      setClients(result.data);
    } else {
      throw new Error(result.error || 'Failed to load clients');
    }
  };
  
  // Load departments
  const loadDepartments = async () => {
    const result = await userManagementService.getDepartments();
    if (result.success && result.data) {
      setDepartments(result.data);
    } else {
      throw new Error(result.error || 'Failed to load departments');
    }
  };
  
  // Handle form submission
  const handleFormSubmit = useCallback((data: Employee | Client | Department) => {
    switch (activeTab) {
      case 'employees':
        setEmployees(prev => {
          if (formMode === 'create') {
            return [...prev, data as Employee];
          } else {
            return prev.map(emp => emp.id === data.id ? data as Employee : emp);
          }
        });
        break;
      case 'clients':
        setClients(prev => {
          if (formMode === 'create') {
            return [...prev, data as Client];
          } else {
            return prev.map(client => client.id === data.id ? data as Client : client);
          }
        });
        break;
      case 'departments':
        setDepartments(prev => {
          if (formMode === 'create') {
            return [...prev, data as Department];
          } else {
            return prev.map(dept => dept.id === data.id ? data as Department : dept);
          }
        });
        break;
    }
    setIsFormOpen(false);
  }, [activeTab, formMode]);
  
  // Handle import completion
  const handleImportComplete = useCallback((result: BulkOperationResult) => {
    notificationService.success(
      'Import Completed',
      `Successfully imported ${result.success} users, ${result.failed} failed`
    );
    loadData(); // Reload data to show imported users
  }, []);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await userManagementService.searchUsers(
        searchQuery,
        activeTab === 'employees' ? 'employees' : 'clients'
      );
      
      if (result.success && result.data) {
        if (activeTab === 'employees') {
          setEmployees(result.data as Employee[]);
        } else if (activeTab === 'clients') {
          setClients(result.data as Client[]);
        }
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle bulk operations
  const handleBulkOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
    const selectedIds = activeTab === 'employees' ? Array.from(selectedEmployees) :
                       activeTab === 'clients' ? Array.from(selectedClients) :
                       Array.from(selectedDepartments);
    
    if (selectedIds.length === 0) {
      notificationService.warning('No Selection', 'Please select items to perform bulk operations');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let updates: any = {};
      
      switch (operation) {
        case 'activate':
          updates.isActive = true;
          break;
        case 'deactivate':
          updates.isActive = false;
          break;
      }
      
      const result = await userManagementService.bulkUpdateUsers({
        userIds: selectedIds,
        updates
      });
      
      if (result.success && result.data) {
        notificationService.success(
          'Bulk Operation Completed',
          `Operation completed: ${result.data.success} success, ${result.data.failed} failed`
        );
        loadData(); // Reload data
      } else {
        throw new Error(result.error || 'Bulk operation failed');
      }
    } catch (error: any) {
      console.error('Bulk operation error:', error);
      notificationService.error('Bulk Operation Failed', error.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle export
  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      const blob = await userManagementService.exportUsersToExcel(
        activeTab === 'departments' ? 'all' : activeTab,
        selectedFilters
      );
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notificationService.success('Export Completed', 'Users exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      notificationService.error('Export Failed', error.message || 'Export failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open form dialog
  const openForm = (mode: ViewMode, item?: Employee | Client | Department) => {
    setFormMode(mode);
    setSelectedEmployee(item as Employee);
    setSelectedClient(item as Client);
    setSelectedDepartment(item as Department);
    setIsFormOpen(true);
  };
  
  // Close form dialog
  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(undefined);
    setSelectedClient(undefined);
    setSelectedDepartment(undefined);
  };
  
  // Table column definitions
  const employeeColumns: TableColumnDefinition<Employee>[] = [
    {
      columnId: 'select',
      renderHeaderCell: () => <TableSelectionCell type="checkbox" />,
      renderCell: (item) => (
        <TableSelectionCell
          checked={selectedEmployees.has(item.id)}
          onChange={(_, data) => {
            const newSelection = new Set(selectedEmployees);
            if (data.checked) {
              newSelection.add(item.id);
            } else {
              newSelection.delete(item.id);
            }
            setSelectedEmployees(newSelection);
          }}
        />
      )
    },
    {
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.firstName} {item.lastName}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {item.email}
          </Text>
        </TableCellLayout>
      )
    },
    {
      columnId: 'classification',
      renderHeaderCell: () => 'Classification',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge color="brand" className={styles.statusBadge}>
            {item.classification}
          </Badge>
        </TableCellLayout>
      )
    },
    {
      columnId: 'office',
      renderHeaderCell: () => 'Office',
      renderCell: (item) => item.office
    },
    {
      columnId: 'department',
      renderHeaderCell: () => 'Department',
      renderCell: (item) => item.department || 'N/A'
    },
    {
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <TableCellLayout>
          {item.isActive ? (
            <CheckmarkCircle24Regular color="green" />
          ) : (
            <ErrorCircle24Regular color="red" />
          )}
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </TableCellLayout>
      )
    },
    {
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <TableCellLayout>
          <Button
            appearance="subtle"
            icon={<Edit24Regular />}
            onClick={() => openForm('edit', item)}
          />
          <Button
            appearance="subtle"
            icon={<Delete24Regular />}
            onClick={() => openForm('view', item)}
          />
        </TableCellLayout>
      )
    }
  ];
  
  const clientColumns: TableColumnDefinition<Client>[] = [
    {
      columnId: 'select',
      renderHeaderCell: () => <TableSelectionCell type="checkbox" />,
      renderCell: (item) => (
        <TableSelectionCell
          checked={selectedClients.has(item.id)}
          onChange={(_, data) => {
            const newSelection = new Set(selectedClients);
            if (data.checked) {
              newSelection.add(item.id);
            } else {
              newSelection.delete(item.id);
            }
            setSelectedClients(newSelection);
          }}
        />
      )
    },
    {
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.firstName} {item.lastName}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {item.email}
          </Text>
        </TableCellLayout>
      )
    },
    {
      columnId: 'firm',
      renderHeaderCell: () => 'Firm',
      renderCell: (item) => item.firmName || 'N/A'
    },
    {
      columnId: 'accessLevel',
      renderHeaderCell: () => 'Access Level',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge 
            color={item.accessLevel === 'admin' ? 'danger' : 
                   item.accessLevel === 'write' ? 'warning' : 'success'}
            className={styles.statusBadge}
          >
            {item.accessLevel}
          </Badge>
        </TableCellLayout>
      )
    },
    {
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <TableCellLayout>
          {item.isActive ? (
            <CheckmarkCircle24Regular color="green" />
          ) : (
            <ErrorCircle24Regular color="red" />
          )}
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </TableCellLayout>
      )
    },
    {
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <TableCellLayout>
          <Button
            appearance="subtle"
            icon={<Edit24Regular />}
            onClick={() => openForm('edit', item)}
          />
          <Button
            appearance="subtle"
            icon={<Delete24Regular />}
            onClick={() => openForm('view', item)}
          />
        </TableCellLayout>
      )
    }
  ];
  
  const departmentColumns: TableColumnDefinition<Department>[] = [
    {
      columnId: 'select',
      renderHeaderCell: () => <TableSelectionCell type="checkbox" />,
      renderCell: (item) => (
        <TableSelectionCell
          checked={selectedDepartments.has(item.id)}
          onChange={(_, data) => {
            const newSelection = new Set(selectedDepartments);
            if (data.checked) {
              newSelection.add(item.id);
            } else {
              newSelection.delete(item.id);
            }
            setSelectedDepartments(newSelection);
          }}
        />
      )
    },
    {
      columnId: 'name',
      renderHeaderCell: () => 'Department',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.name}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {item.description || 'No description'}
          </Text>
        </TableCellLayout>
      )
    },
    {
      columnId: 'manager',
      renderHeaderCell: () => 'Manager',
      renderCell: (item) => item.managerName
    },
    {
      columnId: 'employees',
      renderHeaderCell: () => 'Employees',
      renderCell: (item) => (
        <TableCellLayout>
          <Person24Regular />
          <Text>{item.employees.length}</Text>
        </TableCellLayout>
      )
    },
    {
      columnId: 'permissions',
      renderHeaderCell: () => 'Permissions',
      renderCell: (item) => (
        <TableCellLayout>
          {Object.entries(item.permissions)
            .filter(([_, value]) => value)
            .map(([key, _]) => (
              <Badge key={key} size="small" color="brand" className={styles.statusBadge}>
                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            ))}
        </TableCellLayout>
      )
    },
    {
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <TableCellLayout>
          <Button
            appearance="subtle"
            icon={<Edit24Regular />}
            onClick={() => openForm('edit', item)}
          />
          <Button
            appearance="subtle"
            icon={<Delete24Regular />}
            onClick={() => openForm('view', item)}
          />
        </TableCellLayout>
      )
    }
  ];
  
  const currentData = activeTab === 'employees' ? employees :
                     activeTab === 'clients' ? clients :
                     departments;
  
  const currentColumns = activeTab === 'employees' ? employeeColumns :
                        activeTab === 'clients' ? clientColumns :
                        departmentColumns;
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Text size={600} weight="bold">
          Enhanced User Management
        </Text>
        <div className={styles.actionsBar}>
          <Button
            appearance="primary"
            icon={activeTab === 'employees' ? <PersonAdd24Regular /> :
                  activeTab === 'clients' ? <PersonAdd24Regular /> :
                  <BuildingAdd24Regular />}
            onClick={() => openForm('create')}
          >
            Add {activeTab === 'employees' ? 'Employee' :
                 activeTab === 'clients' ? 'Client' :
                 'Department'}
          </Button>
          <Button
            appearance="secondary"
            icon={<DocumentArrowUp24Regular />}
            onClick={() => setIsImportOpen(true)}
          >
            Import
          </Button>
          <Button
            appearance="secondary"
            icon={<DocumentArrowDown24Regular />}
            onClick={handleExport}
            disabled={isLoading}
          >
            Export
          </Button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <MessageBar intent="error" className={styles.error}>
          <MessageBarBody>
            <Warning24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
            {error}
          </MessageBarBody>
        </MessageBar>
      )}
      
      {/* Search and Filter Bar */}
      <div className={styles.searchBar}>
        <SearchBox
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
          onSearch={handleSearch}
          className={styles.searchInput}
        />
        
        {activeTab === 'employees' && (
          <>
            <Dropdown
              placeholder="Department"
              value={selectedFilters.department}
              onOptionSelect={(_, data) => setSelectedFilters(prev => ({
                ...prev,
                department: data.optionValue as string
              }))}
              className={styles.filterDropdown}
            >
              <Option value="">All Departments</Option>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Dropdown>
            
            <Dropdown
              placeholder="Office"
              value={selectedFilters.office}
              onOptionSelect={(_, data) => setSelectedFilters(prev => ({
                ...prev,
                office: data.optionValue as string
              }))}
              className={styles.filterDropdown}
            >
              <Option value="">All Offices</Option>
              <Option value="New York">New York</Option>
              <Option value="Chicago">Chicago</Option>
              <Option value="Los Angeles">Los Angeles</Option>
            </Dropdown>
          </>
        )}
        
        {activeTab === 'clients' && (
          <Dropdown
            placeholder="Access Level"
            value={selectedFilters.accessLevel}
            onOptionSelect={(_, data) => setSelectedFilters(prev => ({
              ...prev,
              accessLevel: data.optionValue as string
            }))}
            className={styles.filterDropdown}
          >
            <Option value="">All Levels</Option>
            <Option value="read">Read Only</Option>
            <Option value="write">Read/Write</Option>
            <Option value="admin">Admin</Option>
          </Dropdown>
        )}
        
        <Dropdown
          placeholder="Status"
          value={selectedFilters.isActive}
          onOptionSelect={(_, data) => setSelectedFilters(prev => ({
            ...prev,
            isActive: data.optionValue as string
          }))}
          className={styles.filterDropdown}
        >
          <Option value="">All Status</Option>
          <Option value="true">Active</Option>
          <Option value="false">Inactive</Option>
        </Dropdown>
        
        <Button
          appearance="subtle"
          icon={<Filter24Regular />}
          onClick={loadData}
        >
          Apply Filters
        </Button>
      </div>
      
      {/* Bulk Actions */}
      {(selectedEmployees.size > 0 || selectedClients.size > 0 || selectedDepartments.size > 0) && (
        <div className={styles.actionsBar}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {activeTab === 'employees' ? selectedEmployees.size :
             activeTab === 'clients' ? selectedClients.size :
             selectedDepartments.size} selected
          </Text>
          <Button
            appearance="secondary"
            onClick={() => handleBulkOperation('activate')}
            disabled={isLoading}
          >
            Activate
          </Button>
          <Button
            appearance="secondary"
            onClick={() => handleBulkOperation('deactivate')}
            disabled={isLoading}
          >
            Deactivate
          </Button>
        </div>
      )}
      
      {/* Tab Navigation */}
      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(data.value as TabValue)}
      >
        <Tab value="employees">
          <Person24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
          Employees ({employees.length})
        </Tab>
        <Tab value="clients">
          <Person24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
          Clients ({clients.length})
        </Tab>
        <Tab value="departments">
          <Building24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
          Departments ({departments.length})
        </Tab>
      </TabList>
      
      {/* Tab Content */}
      <div className={styles.tabContent}>
        {isLoading ? (
          <div className={styles.loading}>
            <Spinner size="large" label="Loading data..." />
          </div>
        ) : currentData.length === 0 ? (
          <div className={styles.emptyState}>
            <Text size={400}>No {activeTab} found</Text>
            <Text size={200} style={{ marginTop: tokens.spacingVerticalS }}>
              {searchQuery ? 'Try adjusting your search criteria' : 
               `Create your first ${activeTab.slice(0, -1)} to get started`}
            </Text>
          </div>
        ) : (
          <DataGrid
            items={currentData}
            columns={currentColumns}
            className={styles.dataGrid}
          />
        )}
      </div>
      
      {/* Form Dialogs */}
      {isFormOpen && (
        <>
          {activeTab === 'employees' && (
            <EmployeeForm
              employee={selectedEmployee}
              mode={formMode}
              isOpen={isFormOpen}
              onClose={closeForm}
              onSubmit={handleFormSubmit}
              departments={departments}
            />
          )}
          
          {activeTab === 'clients' && (
            <ClientForm
              client={selectedClient}
              mode={formMode}
              isOpen={isFormOpen}
              onClose={closeForm}
              onSubmit={handleFormSubmit}
              serviceProviders={employees.filter(emp => emp.classification === 'Manager')}
            />
          )}
          
          {activeTab === 'departments' && (
            <DepartmentForm
              department={selectedDepartment}
              mode={formMode}
              isOpen={isFormOpen}
              onClose={closeForm}
              onSubmit={handleFormSubmit}
              managers={employees.filter(emp => emp.classification === 'Manager')}
              parentDepartments={departments}
              availableEmployees={employees}
            />
          )}
        </>
      )}
      
      {/* Import Dialog */}
      <ExcelImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
        userType={activeTab === 'departments' ? 'employees' : activeTab}
      />
    </div>
  );
};

