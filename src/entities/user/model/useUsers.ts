import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';
import type { Employee, Client, Department } from './types';

export const useUsers = () => {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, firstName: 'John', lastName: 'Smith', classification: 'Manager', office: 'New York', role: 'Operations Manager', department: 'Operations' },
    { id: 2, firstName: 'Sarah', lastName: 'Johnson', classification: 'Senior', office: 'Chicago', role: 'Senior Analyst', department: 'Finance' },
    { id: 3, firstName: 'Mike', lastName: 'Davis', classification: 'Associate', office: 'Los Angeles', role: 'Developer', department: 'IT' }
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: 1, firstName: 'Robert', lastName: 'Wilson', phone: '(555) 123-4567', email: 'robert.wilson@example.com', firmName: 'Wilson & Associates', firmAddress: '123 Main St, Boston, MA' },
    { id: 2, firstName: 'Lisa', lastName: 'Anderson', phone: '(555) 987-6543', email: 'lisa.anderson@techcorp.com', firmName: 'TechCorp Inc.', firmAddress: '456 Tech Ave, Seattle, WA' }
  ]);

  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: 'Operations', description: 'Operations department' },
    { id: 2, name: 'Finance', description: 'Finance department' },
    { id: 3, name: 'IT', description: 'Information Technology department' },
    { id: 4, name: 'HR', description: 'Human Resources department' }
  ]);

  const nextId = useMemo(() => ({
    employee: () => (employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1),
    client: () => (clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1),
    department: () => (departments.length ? Math.max(...departments.map(d => d.id)) + 1 : 1),
  }), [employees, clients, departments]);

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      try {
        const [empRes, cliRes, depRes] = await Promise.all([
          apiClient.get<Employee[]>('/users/employees').catch(() => null),
          apiClient.get<Client[]>('/users/clients').catch(() => null),
          apiClient.get<Department[]>('/users/departments').catch(() => null),
        ]);

        if (!mounted) return;

        if (empRes?.data) setEmployees(empRes.data);
        if (cliRes?.data) setClients(cliRes.data);
        if (depRes?.data) setDepartments(depRes.data);
      } catch (error) {
        // Тихий фолбэк на мок
        notificationService.info('Оффлайн режим', 'Используются локальные данные пользователей');
      }
    };

    loadAll();
    return () => { mounted = false; };
  }, []);

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    const optimistic = { ...employee, id: nextId.employee() };
    setEmployees(prev => [...prev, optimistic]);
    try {
      await apiClient.post<Employee>('/users/employees', employee);
    } catch (error) {
      setEmployees(prev => prev.filter(e => e.id !== optimistic.id));
      notificationService.showApiError(error, 'Не удалось добавить сотрудника');
    }
  };

  const updateEmployee = async (id: number, updates: Partial<Employee>) => {
    const prevSnapshot = employees;
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
    try {
      await apiClient.put<Employee>(`/users/employees/${id}`, updates);
    } catch (error) {
      setEmployees(prevSnapshot);
      notificationService.showApiError(error, 'Не удалось обновить сотрудника');
    }
  };

  const deleteEmployee = async (id: number) => {
    const prevSnapshot = employees;
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    try {
      await apiClient.delete<void>(`/users/employees/${id}`);
    } catch (error) {
      setEmployees(prevSnapshot);
      notificationService.showApiError(error, 'Не удалось удалить сотрудника');
    }
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    const optimistic = { ...client, id: nextId.client() };
    setClients(prev => [...prev, optimistic]);
    try {
      await apiClient.post<Client>('/users/clients', client);
    } catch (error) {
      setClients(prev => prev.filter(c => c.id !== optimistic.id));
      notificationService.showApiError(error, 'Не удалось добавить клиента');
    }
  };

  const updateClient = async (id: number, updates: Partial<Client>) => {
    const prevSnapshot = clients;
    setClients(prev => prev.map(client => client.id === id ? { ...client, ...updates } : client));
    try {
      await apiClient.put<Client>(`/users/clients/${id}`, updates);
    } catch (error) {
      setClients(prevSnapshot);
      notificationService.showApiError(error, 'Не удалось обновить клиента');
    }
  };

  const deleteClient = async (id: number) => {
    const prevSnapshot = clients;
    setClients(prev => prev.filter(client => client.id !== id));
    try {
      await apiClient.delete<void>(`/users/clients/${id}`);
    } catch (error) {
      setClients(prevSnapshot);
      notificationService.showApiError(error, 'Не удалось удалить клиента');
    }
  };

  const addDepartment = async (department: Omit<Department, 'id'>) => {
    const optimistic = { ...department, id: nextId.department() };
    setDepartments(prev => [...prev, optimistic]);
    try {
      await apiClient.post<Department>('/users/departments', department);
    } catch (error) {
      setDepartments(prev => prev.filter(d => d.id !== optimistic.id));
      notificationService.showApiError(error, 'Не удалось добавить отдел');
    }
  };

  return {
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
  };
}; 