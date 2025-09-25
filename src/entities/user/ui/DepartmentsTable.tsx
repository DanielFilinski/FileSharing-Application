import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  TableCellLayout,
  Text,
  Body1,
  Caption1,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuButton
} from '@fluentui/react-components';
import { MoreHorizontal20Regular, Edit20Regular, Delete20Regular, BuildingMultiple20Regular } from '@fluentui/react-icons';
import { useTableStyles } from '@/shared/ui/TableContainer';
import type { Department } from '../model/types';

// Props interface for the departments table component
interface DepartmentsTableProps {
  departments: Department[];
  onEdit?: (department: Department) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

/**
 * Table component for displaying departments with edit/delete actions
 * Provides a responsive layout that adapts to different screen sizes
 */
export const DepartmentsTable: React.FC<DepartmentsTableProps> = ({
  departments,
  onEdit,
  onDelete,
  className
}) => {
  const styles = useTableStyles();

  /**
   * Renders a table row for a single department
   * @param department - Department data to display
   */
  const renderDepartmentRow = (department: Department) => (
    <TableRow key={department.id}>
      {/* Department ID column */}
      <TableCell>
        <TableCellLayout media={<BuildingMultiple20Regular />}>
          <Body1>DEP{String(department.id).padStart(3, '0')}</Body1>
        </TableCellLayout>
      </TableCell>
      
      {/* Department name column */}
      <TableCell>
        <Body1>{department.name}</Body1>
      </TableCell>
      
      {/* Description column - hidden on mobile */}
      <TableCell className={styles.mobileHidden}>
        <Text>{department.description || 'No description'}</Text>
      </TableCell>
      
      {/* Manager column - placeholder for future implementation */}
      <TableCell className={styles.mobileHidden}>
        <Caption1>Not assigned</Caption1>
      </TableCell>
      
      {/* Actions menu column */}
      <TableCell>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton
              appearance="subtle"
              size="small"
              icon={<MoreHorizontal20Regular />}
              aria-label="More actions"
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {onEdit && (
                <MenuItem icon={<Edit20Regular />} onClick={() => onEdit(department)}>
                  Edit Department
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem icon={<Delete20Regular />} onClick={() => onDelete(department.id)}>
                  Delete Department
                </MenuItem>
              )}
            </MenuList>
          </MenuPopover>
        </Menu>
      </TableCell>
    </TableRow>
  );

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Department ID</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell className={styles.mobileHidden}>Description</TableHeaderCell>
          <TableHeaderCell className={styles.mobileHidden}>Manager</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departments.map(department => renderDepartmentRow(department))}
      </TableBody>
    </Table>
  );
};
