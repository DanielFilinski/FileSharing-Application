import React from 'react';
import { Nav } from '@fluentui/react/lib/Nav';
import { 
  PrimaryButton as FluentUIPrimaryButton,
  DefaultButton as FluentUIDefaultButton,
  IconButton as FluentUIconButton,
  Text as FluentUIText,
  Stack,
  CommandBar,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  Checkbox,
  Breadcrumb
} from '@fluentui/react';


const navStyles = { root: { width: 220, height: '100vh', boxSizing: 'border-box', borderRight: '1px solid #eee', padding: 0 } };

const navLinks = [
  {
    name: 'DMS',
    url: '#',
    key: 'dms',
    links: [
      { name: 'To End User', url: '#', key: 'toenduser' },
      { name: 'From End User', url: '#', key: 'fromenduser' },
    ],
  },
  {
    name: 'Portal',
    url: '#',
    key: 'portal',
  },
  {
    name: 'Organization',
    url: '#',
    key: 'org',
  },
  {
    name: 'Storage',
    url: '#',
    key: 'storage',
  },
  {
    name: 'Users',
    url: '#',
    key: 'users',
  },
  {
    name: 'Employees',
    url: '#',
    key: 'employees',
  },
  {
    name: 'Clients',
    url: '#',
    key: 'clients',
  },
  {
    name: 'Validation',
    url: '#',
    key: 'validation',
  },
];

const breadcrumbItems = [
  { text: 'DMS', key: 'dms' },
  { text: 'To End User', key: 'toenduser' },
  { text: 'Tax', key: 'tax' },
  { text: 'IRS Tax Form', key: 'irs' },
];

const columns = [
  { key: 'column1', name: '', fieldName: 'checkbox', minWidth: 32, maxWidth: 32, onRender: () => <Checkbox /> },
  { key: 'column2', name: 'Name', fieldName: 'name', minWidth: 200, isResizable: true },
  { key: 'column3', name: 'Modified', fieldName: 'modified', minWidth: 120, isResizable: true },
  { key: 'column4', name: 'Created By', fieldName: 'createdBy', minWidth: 150, isResizable: true },
];

const items = [
  { key: 1, name: 'Book.xlsx', modified: 'April 11', createdBy: 'AZMAT HUSSAIN', icon: 'ExcelDocument' },
  { key: 2, name: 'Contract.docx', modified: 'April 4', createdBy: 'AZMAT HUSSAIN', icon: 'WordDocument' },
  { key: 3, name: 'Trial Balance.xlsx', modified: 'April 21', createdBy: 'AZMAT HUSSAIN', icon: 'ExcelDocument' },
  { key: 4, name: 'Trial Balance1.xlsx', modified: 'April 4', createdBy: 'AZMAT HUSSAIN', icon: 'ExcelDocument' },
];

const commandBarItems = [
  {
    key: 'new',
    text: 'New',
    iconProps: { iconName: 'Add' },
    split: true,
    subMenuProps: {
      items: [
        { key: 'folder', text: 'Folder', iconProps: { iconName: 'Folder' } },
        { key: 'word', text: 'Word document', iconProps: { iconName: 'WordDocument' } },
        { key: 'excel', text: 'Excel workbook', iconProps: { iconName: 'ExcelDocument' } },
      ],
    },
  },
  {
    key: 'upload',
    text: 'Upload',
    iconProps: { iconName: 'Upload' },
  },
  {
    key: 'editGrid',
    text: 'Edit in grid view',
    iconProps: { iconName: 'Edit' },
  },
  {
    key: 'open',
    text: 'Open',
    iconProps: { iconName: 'OpenFile' },
  },
  {
    key: 'share',
    text: 'Share',
    iconProps: { iconName: 'Share' },
  },
];

export default function DmsMainScreen() {
  return (
    <Stack horizontal styles={{ root: { height: '100vh' } }}>
      <Nav groups={[{ links: navLinks }]} styles={navStyles} />
      <Stack grow styles={{ root: { background: '#fff' } }}>
        <Stack horizontal verticalAlign="center" styles={{ root: { borderBottom: '1px solid #eee', padding: '0 24px', height: 48 } }}>
          <FluentUIText variant="xLarge" styles={{ root: { fontWeight: 600, color: '#0078d4' } }}>DMS</FluentUIText>
        </Stack>
        <Stack horizontalAlign="start" styles={{ root: { padding: '16px 24px 0 24px' } }}>
          <Breadcrumb items={breadcrumbItems} maxDisplayedItems={4} />
        </Stack>
        <Stack horizontalAlign="start" styles={{ root: { padding: '8px 24px 0 24px' } }}>
          <CommandBar items={commandBarItems} />
        </Stack>
        <Stack grow styles={{ root: { padding: '8px 24px 0 24px' } }}>
          <DetailsList
            items={items}
            columns={columns}
            setKey="set"
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.multiple}
            checkboxVisibility={2}
            styles={{ root: { background: '#fff' } }}
          />
        </Stack>
      </Stack>
    </Stack>
  );
} 