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
import { MoreHorizontal20Regular, Edit20Regular, Delete20Regular } from '@fluentui/react-icons';
import { UserAvatar } from './UserAvatar';
import { useTableStyles } from '@/shared/ui/TableContainer';
import type { User, Employee, Client } from '../model/types';

interface UserTableProps {
  users: (Employee | Client)[];
  type: 'employee' | 'client';
  onEdit?: (user: Employee | Client) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  type,
  onEdit,
  onDelete,
  className
}) => {
  const styles = useTableStyles();
  const isEmployee = type === 'employee';

  const renderEmployeeRow = (employee: Employee) => (
    <TableRow key={employee.id}>
      <TableCell>
        <TableCellLayout media={<UserAvatar user={employee} size={32} />}>
          <Body1>{employee.firstName} {employee.lastName}</Body1>
        </TableCellLayout>
      </TableCell>
             <TableCell className={styles.mobileHidden}>
         <Text>{employee.classification}</Text>
       </TableCell>
       <TableCell className={styles.mobileHidden}>
         <Text>{employee.office}</Text>
       </TableCell>
       <TableCell>
         <Text>{employee.role}</Text>
       </TableCell>
       <TableCell className={styles.mobileHidden}>
         <Text>{employee.department}</Text>
       </TableCell>
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
                <MenuItem icon={<Edit20Regular />} onClick={() => onEdit(employee)}>
                  Edit
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem icon={<Delete20Regular />} onClick={() => onDelete(employee.id)}>
                  Delete
                </MenuItem>
              )}
            </MenuList>
          </MenuPopover>
        </Menu>
      </TableCell>
    </TableRow>
  );

  const renderClientRow = (client: Client) => (
    <TableRow key={client.id}>
      <TableCell>
        <TableCellLayout media={<UserAvatar user={client} size={32} />}>
          <Body1>{client.firstName} {client.lastName}</Body1>
        </TableCellLayout>
      </TableCell>
             <TableCell className={styles.mobileHidden}>
         <Text>{client.phone}</Text>
       </TableCell>
       <TableCell>
         <Text>{client.email}</Text>
       </TableCell>
       <TableCell className={styles.mobileHidden}>
         <div>
           <Body1>{client.firmName}</Body1>
           <Caption1>{client.firmAddress}</Caption1>
         </div>
       </TableCell>
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
                <MenuItem icon={<Edit20Regular />} onClick={() => onEdit(client)}>
                  Edit
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem icon={<Delete20Regular />} onClick={() => onDelete(client.id)}>
                  Delete
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
          <TableHeaderCell>Name</TableHeaderCell>
                     {isEmployee ? (
             <>
               <TableHeaderCell className={styles.mobileHidden}>Classification</TableHeaderCell>
               <TableHeaderCell className={styles.mobileHidden}>Office</TableHeaderCell>
               <TableHeaderCell>Role</TableHeaderCell>
               <TableHeaderCell className={styles.mobileHidden}>Department</TableHeaderCell>
             </>
           ) : (
             <>
               <TableHeaderCell className={styles.mobileHidden}>Phone</TableHeaderCell>
               <TableHeaderCell>Email</TableHeaderCell>
               <TableHeaderCell className={styles.mobileHidden}>Firm</TableHeaderCell>
             </>
           )}
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => isEmployee ? renderEmployeeRow(user as Employee) : renderClientRow(user as Client))}
      </TableBody>
    </Table>
  );
}; 