export const NAV_LINKS = [
  {
    name: 'DMS',
    url: '#',
    key: 'dms',
    icon: 'Document',
    links: [
      { 
        name: 'To End User', 
        url: '#', 
        key: 'toenduser', 
        icon: 'DocumentArrowUp', 
      },
      { 
        name: 'From End User', 
        url: '#', 
        key: 'fromenduser', 
        icon: 'DocumentArrowDown' 
      },
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

export const NAV_GROUPS = [
  {
    title: 'Storage',
    links: [
      NAV_LINKS[0], // DMS
      NAV_LINKS[1], // Portal
    ]
  },
  {
    title: 'Settings',
    links: [
      NAV_LINKS[2], // Organization
      NAV_LINKS[3], // Storage
      NAV_LINKS[4], // Users
      NAV_LINKS[5], // Employees
      NAV_LINKS[6], // Clients
    ]
  }
];

export const BREADCRUMB_ITEMS = [
  { text: 'DMS', key: 'dms' },
  { text: 'To End User', key: 'toenduser' },
  { text: 'Tax', key: 'tax' },
  { text: 'IRS Tax Form', key: 'irs' },
];

export const TABLE_COLUMNS = [
  { key: 'column1', name: '', fieldName: 'checkbox', minWidth: 32, maxWidth: 32 },
  { key: 'column2', name: 'Name', fieldName: 'name', minWidth: 200, isResizable: true },
  { key: 'column3', name: 'Modified', fieldName: 'modified', minWidth: 120, isResizable: true },
  { key: 'column4', name: 'Created By', fieldName: 'createdBy', minWidth: 150, isResizable: true },
  { key: 'column5', name: 'Modified By', fieldName: 'modifiedBy', minWidth: 150, isResizable: true },
];

export const TABLE_ITEMS = [
  { key: 1, name: 'Book.xlsx', modified: 'April 11', createdBy: 'AZMAT HUSSAIN', icon: 'ExcelDocument', modifiedBy: 'AZMAT HUSSAIN' },
  { key: 2, name: 'Contract.docx', modified: 'April 4', createdBy: 'AZMAT HUSSAIN', icon: 'WordDocument', modifiedBy: 'AZMAT HUSSAIN' },
  { key: 3, name: 'Trial Balance.xlsx', modified: 'April 21', createdBy: 'AZMAT HUSSAIN', icon: 'ExcelDocument', modifiedBy: 'AZMAT HUSSAIN' },
  { key: 4, name: 'Trial Balance1.xlsx', modified: 'April 4', createdBy: 'AZMAT HUSSAIN', icon: 'ExcelDocument', modifiedBy: 'AZMAT HUSSAIN' },
]; 