// Navigation link type definition
export type NavLink = {
  name: string;
  url?: string;
  key: string;
  icon?: string;
  links?: NavLink[];
  linkName?: string;
};

// Navigation group type definition
export type NavGroup = {
  title: string;
  links: NavLink[];
};

// Main navigation links with proper structure for Teams
export const NAV_LINKS: NavLink[] = [
  {
    name: 'Client Side',
    url: '#',
    key: 'dms',
    linkName: '/client-side',
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
    name: 'Firm Side',
    url: '#',
    key: 'portal',
    linkName: '/firm-side',
    icon: 'Table'
  },
  {
    name: 'Analytics',
    url: '#',
    key: 'portal2',
    linkName: '/firm-side-2',
    icon: 'TableMultiple'
  },
  {
    name: 'Favorites',
    url: '#',
    key: 'favorites',
    linkName: '/favorites',
    icon: 'Star'
  },
  {
    name: 'Organization',
    url: '#',
    key: 'org',
    linkName: '/settings/organization',
    icon: 'Building'
  },
  {
    name: 'Storage',
    url: '#',
    key: 'storage',
    linkName: '/settings/storage',
    icon: 'Storage',
    
  },
  {
    name: 'Validation',
    url: '#',
    key: 'validation',
    linkName: '/settings/validation',
    icon: 'CheckmarkCircle'
  },
  {
    name: 'Approval',
    url: '#',
    key: 'approval',
    linkName: '/settings/approval',
    icon: 'CheckmarkCircle'
  },
  {
    name: 'Leads',
    url: '#',
    key: 'leads',
    linkName: '/leads',
    icon: 'Leads'
  },
  {
    name: 'Users',
    url: '#',
    key: 'users',
    linkName: '/settings/users',
    icon: 'Person'
  }
];

// Navigation groups following Teams design patterns
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Dashboard',
    links: [
      NAV_LINKS[0], // Client Side
      NAV_LINKS[1], // Firm Side
      NAV_LINKS[2], // Firm Side 2
      NAV_LINKS[3], // Favorites
      NAV_LINKS[8], // Leads
    ]
  },
  {
    title: 'Settings',
    links: [
      NAV_LINKS[4], // Organization
      NAV_LINKS[5], // Storage
      NAV_LINKS[6], // Validation
      NAV_LINKS[7], // Approval
      NAV_LINKS[9], // Users
    ]
  }
];

// Breadcrumb configuration for navigation state
export const BREADCRUMB_ITEMS = [
  { text: 'DMS', key: 'dms' },
  { text: 'To End User', key: 'toenduser' },
  { text: 'Tax', key: 'tax' },
  { text: 'IRS Tax Form', key: 'irs' },
];

// Table configuration for content areas
export const TABLE_COLUMNS = [
  { 
    key: 'column1', 
    name: '', 
    fieldName: 'checkbox', 
    minWidth: 32, 
    maxWidth: 32,
    isRowHeader: false
  },
  { 
    key: 'column2', 
    name: 'Name', 
    fieldName: 'name', 
    minWidth: 200, 
    isResizable: true,
    isRowHeader: true
  },
  { 
    key: 'column3', 
    name: 'Modified', 
    fieldName: 'modified', 
    minWidth: 120, 
    isResizable: true,
    isRowHeader: false
  },
  { 
    key: 'column4', 
    name: 'Created By', 
    fieldName: 'createdBy', 
    minWidth: 150, 
    isResizable: true,
    isRowHeader: false
  },
  { 
    key: 'column5', 
    name: 'Modified By', 
    fieldName: 'modifiedBy', 
    minWidth: 150, 
    isResizable: true,
    isRowHeader: false
  },
];

// Sample table data
export const TABLE_ITEMS = [
  { 
    key: 1, 
    name: 'Book.xlsx', 
    modified: 'April 11', 
    createdBy: 'AZMAT HUSSAIN', 
    icon: 'ExcelDocument', 
    modifiedBy: 'AZMAT HUSSAIN' 
  },
  { 
    key: 2, 
    name: 'Contract.docx', 
    modified: 'April 4', 
    createdBy: 'AZMAT HUSSAIN', 
    icon: 'WordDocument', 
    modifiedBy: 'AZMAT HUSSAIN' 
  },
  { 
    key: 3, 
    name: 'Trial Balance.xlsx', 
    modified: 'April 21', 
    createdBy: 'AZMAT HUSSAIN', 
    icon: 'ExcelDocument', 
    modifiedBy: 'AZMAT HUSSAIN' 
  },
  { 
    key: 4, 
    name: 'Trial Balance1.xlsx', 
    modified: 'April 4', 
    createdBy: 'AZMAT HUSSAIN', 
    icon: 'ExcelDocument', 
    modifiedBy: 'AZMAT HUSSAIN' 
  },
];

// Teams theme configuration
export const TEAMS_THEME = {
  brandColor: '#9333EA',
  brandColorHover: '#7c3aed',
  brandColorPressed: '#6d28d9',
  
  // Grid system base unit (Teams standard)
  gridBaseUnit: 4,
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1440
  },
  
  // Navigation specific measurements
  navigation: {
    desktopWidth: 240,
    mobileWidth: '100%',
    itemHeight: 40,
    subItemHeight: 32,
    avatarSize: 32
  }
} as const;

// Accessibility labels for screen readers
export const ARIA_LABELS = {
  navigation: 'Main navigation',
  mobileMenu: 'Open navigation menu',
  closeMenu: 'Close navigation menu',
  expandSubmenu: 'Expand submenu',
  collapseSubmenu: 'Collapse submenu'
} as const;