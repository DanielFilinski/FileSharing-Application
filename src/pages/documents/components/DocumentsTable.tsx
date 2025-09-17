import React, { useState } from 'react';
import { 
  makeStyles, 
  tokens, 
  Table, 
  TableHeader, 
  TableRow, 
  TableHeaderCell, 
  TableBody, 
  TableCell, 
  Text,
  Button,
  Menu,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  Badge
} from '@fluentui/react-components';
import { Document20Regular, DocumentBulletList20Regular, StarRegular, StarFilled, MoreHorizontal20Regular, LockClosed20Regular, LockOpen20Regular } from '@fluentui/react-icons';
import { useFavorites } from '@/features/favorites';

const TABLE_COLUMNS = [
  { key: 'name', name: 'Name' },
  { key: 'modified', name: 'Modified' },
  { key: 'createdBy', name: 'Created by' },
  { key: 'modifiedBy', name: 'Modified by' },
  { key: 'documentType', name: 'Type' },
  { key: 'period', name: 'Period' },
  { key: 'clientEmail', name: 'Client Email' },
  { key: 'favorite', name: 'Favorite' },
  { key: 'status', name: 'Status' }
];

const CLIENT_COLUMNS = [
  { key: 'name', name: 'Name' },
  { key: 'modified', name: 'Modified' },
  { key: 'status', name: 'Status' }
];

// Функция для получения цвета статуса
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'pending validation':
      return 'warning';
    case 'validation in process':
      return 'informative';
    case 'pending review':
      return 'danger';
    case 'Locked':
      return 'subtle';
    case 'Access Closed':
      return 'subtle';
    default:
      return 'brand';
  }
};


export const DocumentsTable: React.FC<{ 
  items: any[], 
  selectedItems: Set<string>, 
  setSelectedItems: (s: Set<string>) => void, 
  isGridView: boolean,
  showAccessControl?: boolean,
  onCloseAccess?: (documentKey: string) => void,
  onToggleLock?: (documentKey: string) => void,
  onDelete?: (documentKey: string) => void,
  onMoveToClient?: (documentKey: string) => void,
  onMoveToFirm?: (documentKey: string) => void,
  onPreview?: (documentKey: string) => void,
  onDownload?: (documentKey: string) => void,
  showBulkSelection?: boolean,
  showAdvancedColumns?: boolean,
  pageType?: 'firm' | 'client',
  onRowClick?: (doc: any) => void
}> = ({ 
  items, 
  selectedItems, 
  setSelectedItems, 
  isGridView,
  showAccessControl = false,
  onCloseAccess,
  onToggleLock,
  onDelete,
  onMoveToClient,
  onMoveToFirm,
  onPreview,
  onDownload,
  showBulkSelection = false,
  showAdvancedColumns = false,
  pageType = 'firm',
  onRowClick
}) => {
  const styles = useStyles();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemKey: string } | null>(null);

  const getMenuItems = (itemKey: string) => {
    const baseItems = [
      { key: 'preview', label: 'Preview', action: () => onPreview?.(itemKey) },
      { key: 'download', label: 'Download', action: () => onDownload?.(itemKey) },
      { key: 'delete', label: 'Delete', action: () => onDelete?.(itemKey) },
    ];

    if (pageType === 'firm') {
      return [
        { key: 'lock', label: 'Lock/Unlock', action: () => onToggleLock?.(itemKey) },
        { key: 'moveToClient', label: 'Move to Client Side', action: () => onMoveToClient?.(itemKey) },
        ...baseItems
      ];
    } else {
      return [
        { key: 'moveToFirm', label: 'Move to Firm Side', action: () => onMoveToFirm?.(itemKey) },
        ...baseItems
      ];
    }
  };

  const handleContextMenu = (e: React.MouseEvent, itemKey: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemKey });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // Закрытие контекстного меню при клике вне его
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.key)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemKey: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemKey);
    } else {
      newSelected.delete(itemKey);
    }
    setSelectedItems(newSelected);
  };

  const handleFavoriteClick = (e: React.MouseEvent, itemKey: string) => {
    e.stopPropagation();
    toggleFavorite(itemKey);
  };

  const handleLockClick = (e: React.MouseEvent, itemKey: string) => {
    e.stopPropagation();
    onToggleLock?.(itemKey);
  };

  const isAllSelected = selectedItems.size === items.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < items.length;

  if (isGridView) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16 }}>
        {items.map(item => (
          <div 
            key={item.key} 
            style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, minWidth: 200, maxWidth: 240, background: '#fafafa', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onContextMenu={(e) => handleContextMenu(e, item.key)}
            onClick={() => onRowClick?.(item)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, flex: 1 }}>{item.name}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {pageType === 'firm' && (
                  <Button
                    appearance="transparent"
                    icon={isFavorite(item.key) ? <StarFilled style={{ color: '#FFD700' }} /> : <StarRegular />}
                    onClick={(e) => handleFavoriteClick(e, item.key)}
                    style={{ minWidth: 'auto', padding: '4px' }}
                  />
                )}
                <Menu>
                  <MenuTrigger>
                    <Button
                      appearance="transparent"
                      icon={<MoreHorizontal20Regular />}
                      style={{ minWidth: 'auto', padding: '4px' }}
                    />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {getMenuItems(item.key).map(menuItem => (
                        <MenuItem 
                          key={menuItem.key}
                          onClick={() => {
                            menuItem.action();
                          }}
                        >
                          {menuItem.label}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Modified: {item.modified}</div>
            {pageType === 'firm' && (
              <>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Created by: {item.createdBy}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Modified by: {item.modifiedBy}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Type: {item.documentType || '-'}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Period: {item.period || '-'}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Client: {item.clientEmail || '-'}</div>
              </>
            )}
            <div style={{ marginTop: 8 }}>
              <Badge appearance="filled" color={getStatusColor(item.status)}>
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <div className={styles.tableContainer}>
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <div className={styles.cellContent}>
                  <input 
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isIndeterminate;
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Document20Regular />
                  <Text weight="semibold">Name</Text>
                </div>
              </TableHeaderCell>
              {(pageType === 'client' ? CLIENT_COLUMNS : TABLE_COLUMNS).slice(1).map(column => (
                <TableHeaderCell key={column.key}>
                  <Text weight="semibold">{column.name}</Text>
                </TableHeaderCell>
              ))}
              {showAccessControl && (
                <TableHeaderCell>
                  <Text weight="semibold">Lock</Text>
                </TableHeaderCell>
              )}
              {showAdvancedColumns && (
                <>
                  <TableHeaderCell>
                    <Text weight="semibold">Permissions</Text>
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <Text weight="semibold">Version</Text>
                  </TableHeaderCell>
                </>
              )}
              <TableHeaderCell >
                <Text weight="semibold">More</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow 
                key={item.key}
                onContextMenu={(e) => handleContextMenu(e, item.key)}
              >
                <TableCell>
                  <div className={styles.cellContent}>
                    <input 
                      type="checkbox"
                      checked={selectedItems.has(item.key)}
                      onChange={(e) => handleSelectItem(item.key, e.target.checked)}
                    />
                    <DocumentBulletList20Regular />
                    <Text 
                      style={{ cursor: 'pointer' }}
                      onClick={() => onRowClick?.(item)}
                    >
                      {item.name}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  <Text>{item.modified}</Text>
                </TableCell>
                {pageType === 'firm' && (
                  <>
                    <TableCell>
                      <Text>{item.createdBy}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{item.modifiedBy}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{item.documentType || '-'}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{item.period || '-'}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{item.clientEmail || '-'}</Text>
                    </TableCell>
                    <TableCell>
                      <Button
                        appearance="transparent"
                        icon={isFavorite(item.key) ? <StarFilled style={{ color: '#FFD700' }} /> : <StarRegular />}
                        onClick={(e) => handleFavoriteClick(e, item.key)}
                        style={{ minWidth: 'auto', padding: '4px' }}
                      />
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <Badge appearance="filled" color={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                {showAccessControl && (
                  <TableCell>
                    <Button
                      appearance="transparent"
                      icon={item.lock ? (
                        <LockClosed20Regular 
                      // style={{ color: tokens.colorPaletteRedBackground3 }} 
                      />
                    ) : (
                      <LockOpen20Regular 
                      // style={{ color: tokens.colorPaletteGreenBackground3 }} 
                      />
                    )}
                    onClick={(e) => handleLockClick(e, item.key)}
                    style={{ minWidth: 'auto', padding: '4px' }}
                  />
                </TableCell>
              )}
              {showAdvancedColumns && (
                <>
                  <TableCell>
                    <Text>Read/Write</Text>
                  </TableCell>
                  <TableCell>
                    <Text>v1.0</Text>
                  </TableCell>
                </>
              )}
              <TableCell>
                <Menu>
                  <MenuTrigger>
                    <Button
                      appearance="transparent"
                      icon={<MoreHorizontal20Regular />}
                      style={{ minWidth: 'auto', padding: '4px' }}
                    />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {getMenuItems(item.key).map(menuItem => (
                        <MenuItem 
                          key={menuItem.key}
                          onClick={() => {
                            menuItem.action();
                          }}
                        >
                          {menuItem.label}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    {/* Контекстное меню */}
    {contextMenu && (
      <div 
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          padding: '4px 0'
        }}
        onMouseLeave={handleContextMenuClose}
      >
        {getMenuItems(contextMenu.itemKey).map(menuItem => (
          <div 
            key={menuItem.key}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => { 
              menuItem.action(); 
              handleContextMenuClose(); 
            }}
          >
            {menuItem.label}
          </div>
        ))}
        {/* {showAccessControl && (
          <div 
            style={{ padding: '8px 16px', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => { onCloseAccess?.(contextMenu.itemKey); handleContextMenuClose(); }}
          >
            Close Access
          </div>
        )} */}
      </div>
    )}
    </div>
  );
}; 

const useStyles = makeStyles({
    tableContainer: {
      flex: 1,
      overflowX: 'auto', // <-- Здесь
      overflowY: 'hidden',
      backgroundColor: tokens.colorNeutralBackground1,
      position: 'absolute',
      top: '0px',
      left: 0,
      right: 0,
      bottom: 0,
      // width: '100%',     
      '&::-webkit-scrollbar': {
        height: '4px',
        width: '4px'
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: tokens.colorNeutralStroke2,
        borderRadius: '4px'
      }
    },
    table: {
      width: '100%',
      minWidth: '550px',
      tableLayout: 'fixed',
      '& .fui-TableHeader': {
        backgroundColor: tokens.colorNeutralBackground2,
        position: 'sticky',
        top: 0,
        zIndex: 1
      },
      '& .fui-TableHeaderCell': {
        color: tokens.colorNeutralForeground2,
        fontWeight: tokens.fontWeightSemibold,
        fontSize: tokens.fontSizeBase200,
        padding: '12px 16px',
        height: '44px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      '& .fui-TableRow': {
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        height: '48px',
        ':hover': {
          backgroundColor: tokens.colorSubtleBackgroundHover
        }
      },
      '& .fui-TableCell': {
        padding: '12px 16px',
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorNeutralForeground1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    },
    cellContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      '& input[type="checkbox"]': {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
        accentColor: '#9333EA'
      }
    }
  });