/**
 * Custom hook for managing user dialog states and interactions
 * Provides state management for all user-related dialogs and modals
 */
import { useState } from 'react';
import type { Employee, Client, Department } from '@/entities/user';

export const useUserManagement = () => {
  // Dialog visibility states
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showEditDepartmentDialog, setShowEditDepartmentDialog] = useState(false);
  
  // Editing states
  const [editingUser, setEditingUser] = useState<Employee | Client | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

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

  /**
   * Opens edit dialog for a user (employee or client)
   */
  const openEditDialog = (user: Employee | Client) => {
    setEditingUser(user);
    if ('classification' in user) {
      setShowAddEmployeeDialog(true);
    } else {
      setShowAddClientDialog(true);
    }
  };

  /**
   * Closes user edit dialogs and clears editing state
   */
  const closeEditDialog = () => {
    setEditingUser(null);
    setShowAddEmployeeDialog(false);
    setShowAddClientDialog(false);
  };

  /**
   * Opens edit department dialog
   */
  const openEditDepartmentDialog = (department: Department) => {
    setEditingDepartment(department);
    setShowEditDepartmentDialog(true);
  };

  /**
   * Closes edit department dialog and clears editing state
   */
  const closeEditDepartmentDialog = () => {
    setEditingDepartment(null);
    setShowEditDepartmentDialog(false);
  };

  return {
    // Dialog visibility states
    showAddEmployeeDialog,
    showAddClientDialog,
    showImportDialog,
    showDepartmentDialog,
    showEditDepartmentDialog,
    
    // Editing states
    editingUser,
    editingDepartment,
    
    // Employee dialog functions
    openAddEmployeeDialog,
    closeAddEmployeeDialog,
    
    // Client dialog functions
    openAddClientDialog,
    closeAddClientDialog,
    
    // Import dialog functions
    openImportDialog,
    closeImportDialog,
    
    // Department dialog functions
    openDepartmentDialog,
    closeDepartmentDialog,
    openEditDepartmentDialog,
    closeEditDepartmentDialog,
    
    // General edit functions
    openEditDialog,
    closeEditDialog
  };
}; 