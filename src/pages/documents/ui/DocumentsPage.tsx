import React from 'react';
import { Nav } from '@fluentui/react/lib/Nav';
import {
  makeStyles,
  tokens,
  TabList,
  Tab,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Checkbox,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  MenuButton
} from '@fluentui/react-components';
import {
  ArrowUploadRegular,
  AddRegular,
  ShareRegular,
  EditRegular,
  FolderRegular,
  DocumentRegular,
  TableRegular,
  DocumentArrowUpRegular,
  DocumentArrowDownRegular,
  BuildingRegular,
  StorageRegular,
  PeopleRegular,
  PersonRegular,
  PeopleTeamRegular,
  CheckmarkCircleRegular,
  NewRegular,
  OpenRegular,
  ShareAndroid16Regular,
  ShareAndroid20Regular,
  Table16Regular,
  Table20Regular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    height: '100vh',
    display: 'flex'
  },
  nav: {
    width: '220px',
    height: '100vh',
    boxSizing: 'border-box',
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: 0
  },
  content: {
    flex: 1,
    background: tokens.colorNeutralBackground1
  },
  header: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '0 24px',
    height: '48px',
    display: 'flex',
    alignItems: 'center'
  },
  title: {
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    fontSize: '20px'
  },
  breadcrumb: {
    padding: '16px 24px 0 24px'
  },
  toolbar: {
    padding: '8px 24px 0 24px'
  },
  table: {
    padding: '8px 24px 0 24px',
    flex: 1
  }
});

const navLinks = [
  {
    name: 'DMS',
    url: '#',
    key: 'dms',
    icon: 'Document',
    links: [
      { name: 'To End User', url: '#', key: 'toenduser', icon: 'DocumentArrowUp' },
      { name: 'From End User', url: '#', key: 'fromenduser', icon: 'DocumentArrowDown' },
    ],
  },
  {
    name: 'Portal',
    url: '#',
    key: 'portal',
    icon: 'Table'
  },
  {
    name: 'Organization',
    url: '#',
    key: 'org',
    icon: 'Building'
  },
  {
    name: 'Storage',
    url: '#',
    key: 'storage',
    icon: 'Storage'
  },
  {
    name: 'Users',
    url: '#',
    key: 'users',
    icon: 'People'
  },
  {
    name: 'Employees',
    url: '#',
    key: 'employees',
    icon: 'Person'
  },
  {
    name: 'Clients',
    url: '#',
    key: 'clients',
    icon: 'PeopleTeam'
  },
  {
    name: 'Validation',
    url: '#',
    key: 'validation',
    icon: 'CheckmarkCircle'
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
  const styles = useStyles();
  
  return (
    <div className={styles.root}>
      <Nav groups={[{ links: navLinks }]} className={styles.nav} />
      <div className={styles.content}>
        <div className={styles.header}>
          <Text className={styles.title}>DMS</Text>
        </div>
        <div className={styles.breadcrumb}>
          <Breadcrumb>
            {breadcrumbItems.map(item => (
              <BreadcrumbItem key={item.key}>{item.text}</BreadcrumbItem>
            ))}
          </Breadcrumb>
        </div>
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: '8px' }}>
          <MenuButton 
            icon={<AddRegular />} 
            appearance="outline" 
            shape="rounded"
            style={{ backgroundColor: tokens.colorBrandBackground }}
          >
            New
          </MenuButton>
            <Button icon={<ArrowUploadRegular />} iconPosition="before" appearance="outline" shape="rounded">Upload</Button>
            <Button icon={<Table20Regular />} iconPosition="before" appearance="outline" shape="rounded">Edit in grid view</Button>
            <MenuButton appearance="outline" shape="rounded">Open</MenuButton>           
            <Button icon={<ShareAndroid20Regular />} iconPosition="before" appearance="outline" shape="rounded">Share</Button>
          </div>
        </div>
        <div className={styles.table}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell><Checkbox /></TableHeaderCell>
                {columns.slice(1).map(column => (
                  <TableHeaderCell key={column.key}>{column.name}</TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.key}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.modified}</TableCell>
                  <TableCell>{item.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 