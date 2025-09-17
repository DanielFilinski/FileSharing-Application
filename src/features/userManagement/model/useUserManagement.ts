import { useState } from 'react';
import type { Employee, Client } from '@/entities/user';

export const useUserManagement = () => {
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Employee | Client | null>(null);

  const openAddEmployeeDialog = () => {
    setShowAddEmployeeDialog(true);
  };

  const closeAddEmployeeDialog = () => {
    setShowAddEmployeeDialog(false);
  };

  const openAddClientDialog = () => {
    setShowAddClientDialog(true);
  };

  const closeAddClientDialog = () => {
    setShowAddClientDialog(false);
  };

  const openImportDialog = () => {
    setShowImportDialog(true);
  };

  const closeImportDialog = () => {
    setShowImportDialog(false);
  };

  const openDepartmentDialog = () => {
    setShowDepartmentDialog(true);
  };

  const closeDepartmentDialog = () => {
    setShowDepartmentDialog(false);
  };

  const openEditDialog = (user: Employee | Client) => {
    setEditingUser(user);
    if ('classification' in user) {
      setShowAddEmployeeDialog(true);
    } else {
      setShowAddClientDialog(true);
    }
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setShowAddEmployeeDialog(false);
    setShowAddClientDialog(false);
  };

  return {
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
  };
}; 