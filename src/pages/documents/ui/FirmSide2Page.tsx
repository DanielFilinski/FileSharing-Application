import React, { useState, useEffect } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Button,
  Input,
  Avatar,
  Badge,
  Card,
  CardHeader,
  Text,
  Divider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Label,
  Select,
  Option,
  ProgressBar,
  Tab,
  TabList,
  TabValue,
} from '@fluentui/react-components';
import {
  SearchRegular,
  AlertRegular,
  SettingsRegular,
  QuestionCircleRegular,
  AddRegular,
  PersonRegular,
  DocumentRegular,
  CheckmarkRegular,
  ClockRegular,
  WarningRegular,
  InfoRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    color: '#334155',
    lineHeight: 1.5,
  },
  topNav: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    padding: '8px 16px 8px 40px',
    borderRadius: '8px',
    width: '300px',
    background: '#f9fafb',
    border: 'none',
    outline: 'none',
    '&:focus': {
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navIcon: {
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  notificationBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
  },
  mainContainer: {
    display: 'flex',
    height: 'calc(100vh - 64px)',
  },
  leftSidebar: {
    width: '300px',
    background: 'white',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #e2e8f0',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1f2937',
  },
  addClientBtn: {
    width: '100%',
    padding: '10px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      background: '#2563eb',
    },
  },
  clientSearch: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
  },
  clientSearchInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    background: '#f9fafb',
    border: 'none',
    outline: 'none',
    '&:focus': {
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  },
  clientList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  clientItem: {
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeft: '3px solid transparent',
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
  },
  clientItemActive: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  clientInfo: {
    '& h4': {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '2px',
      color: '#1f2937',
    },
    '& p': {
      fontSize: '12px',
      color: '#6b7280',
    },
  },
  clientStatus: {
    background: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  progressContainer: {
    marginBottom: '20px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
    width: '73%',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  statusItem: {
    textAlign: 'center',
    padding: '12px',
    borderRadius: '6px',
    background: '#f8fafc',
  },
  statusNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  activityList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  activityItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#3b82f6',
    marginTop: '6px',
    flexShrink: 0,
  },
  activityContent: {
    '& h5': {
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '4px',
      color: '#1f2937',
    },
    '& p': {
      fontSize: '12px',
      color: '#6b7280',
    },
  },
  deadlineList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  deadlineItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  deadlinePriority: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    marginTop: '4px',
    flexShrink: 0,
  },
  priorityHigh: { background: '#ef4444' },
  priorityMedium: { background: '#f59e0b' },
  priorityLow: { background: '#10b981' },
  documentList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  documentItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  documentStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    marginTop: '4px',
  },
  statusPending: { background: '#fef3c7', color: '#92400e' },
  statusReview: { background: '#dbeafe', color: '#1e40af' },
  statusApproved: { background: '#d1fae5', color: '#065f46' },
  rightSidebar: {
    width: '350px',
    background: 'white',
    borderLeft: '1px solid #e2e8f0',
    padding: '24px',
    overflowY: 'auto',
  },
  sidebarSection: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1f2937',
  },
  documentMeta: {
    background: '#f8fafc',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  metaLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: '12px',
    color: '#1f2937',
    fontWeight: '500',
  },
  teamMember: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  memberAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
  },
  memberInfo: {
    '& h5': {
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '2px',
      color: '#1f2937',
    },
    '& p': {
      fontSize: '12px',
      color: '#6b7280',
    },
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  roleValidator: { background: '#fef3c7', color: '#92400e' },
  roleApprover: { background: '#dbeafe', color: '#1e40af' },
  roleSignatory: { background: '#f3e8ff', color: '#7c3aed' },
  workflowChecklist: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  workflowStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    position: 'relative',
  },
  stepIndicator: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  stepCompleted: {
    background: '#10b981',
    color: 'white',
  },
  stepActive: {
    background: '#3b82f6',
    color: 'white',
  },
  stepPending: {
    background: '#e5e7eb',
    color: '#6b7280',
  },
  stepContent: {
    fontSize: '14px',
    color: '#374151',
  },
  securityInfo: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    padding: '16px',
  },
  securityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  '@media (max-width: 1200px)': {
    rightSidebar: {
      display: 'none',
    },
  },
  '@media (max-width: 768px)': {
    leftSidebar: {
      width: '250px',
    },
    dashboardGrid: {
      gridTemplateColumns: '1fr',
    },
  },
});

export interface Client {
  id: string;
  name: string;
  type: string;
  notifications?: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  domain: string;
  created: string;
  status: string;
  uploadedBy: string;
  uploadedTime: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'pending';
}

export interface Deadline {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueIn: string;
  action: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
}

// Данные из HTML макета
const mockClients: Client[] = [
  { id: '1', name: 'TechCorp Solutions', type: 'Corporate Law', notifications: 3 },
  { id: '2', name: 'Smith Family Trust', type: 'Estate Planning', notifications: 1 },
  { id: '3', name: 'Green Energy LLC', type: 'Business Formation' },
  { id: '4', name: 'Martinez Construction', type: 'Contract Review', notifications: 2 },
  { id: '5', name: 'Digital Marketing Inc', type: 'Intellectual Property' },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Partnership Agreement - TechCorp Solutions',
    type: 'Partnership Agreement',
    category: 'Business Documents',
    domain: 'Law',
    created: 'Jan 15, 2025',
    status: 'Validation Required',
    uploadedBy: 'Sarah Wilson',
    uploadedTime: '2 hours ago'
  },
  {
    id: '2',
    name: 'Estate Plan Amendment - Smith Family Trust',
    type: 'Estate Plan Amendment',
    category: 'Estate Documents',
    domain: 'Law',
    created: 'Jan 14, 2025',
    status: 'Signature Required',
    uploadedBy: 'Michael Smith',
    uploadedTime: 'yesterday'
  },
  {
    id: '3',
    name: 'LLC Operating Agreement - Green Energy LLC',
    type: 'LLC Operating Agreement',
    category: 'Business Documents',
    domain: 'Law',
    created: 'Jan 12, 2025',
    status: 'Final Approval',
    uploadedBy: 'Jennifer Green',
    uploadedTime: '3 days ago'
  }
];

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'James Patterson', role: 'Lead Attorney', avatar: 'JP' },
  { id: '2', name: 'Lisa Chen', role: 'Senior Associate', avatar: 'LC' },
  { id: '3', name: 'Michael Rodriguez', role: 'Partner', avatar: 'MR' },
];

const mockWorkflowSteps: WorkflowStep[] = [
  { id: '1', title: 'Initial Draft Review', status: 'completed' },
  { id: '2', title: 'Draft Validation', status: 'active' },
  { id: '3', title: 'Draft Approval', status: 'pending' },
  { id: '4', title: 'Draft Signing', status: 'pending' },
];

const mockDeadlines: Deadline[] = [
  { id: '1', title: 'Contract Amendment', priority: 'high', dueIn: '2 days', action: 'Signature required' },
  { id: '2', title: 'Tax Filing Documents', priority: 'medium', dueIn: '5 days', action: 'Approval needed' },
  { id: '3', title: 'Annual Report', priority: 'low', dueIn: '12 days', action: 'Review pending' },
];

const mockActivities: Activity[] = [
  { id: '1', title: 'Document validated by James Patterson', description: 'Contract Amendment for TechCorp Solutions', time: '15 minutes ago' },
  { id: '2', title: 'New document uploaded by client', description: 'Tax documents from Martinez Construction', time: '1 hour ago' },
  { id: '3', title: 'Document signed by client', description: 'Service Agreement for Digital Marketing Inc', time: '3 hours ago' },
  { id: '4', title: 'Document approved by Lisa Chen', description: 'Business License Application', time: 'Yesterday' },
];

export default function FirmSide2Page() {
  const styles = useStyles();
  const [selectedClient, setSelectedClient] = useState<Client>(mockClients[0]);
  const [selectedDocument, setSelectedDocument] = useState<Document>(mockDocuments[0]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [progressWidth, setProgressWidth] = useState(0);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState('');

  // Анимация прогресс-бара
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth(73);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Фильтрация клиентов
  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.type.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleAddClient = () => {
    if (newClientName.trim()) {
      const newClient: Client = {
        id: Date.now().toString(),
        name: newClientName,
        type: newClientType || 'General',
      };
      mockClients.push(newClient);
      setNewClientName('');
      setNewClientType('');
      setIsAddClientDialogOpen(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Validation Required': return styles.statusPending;
      case 'Signature Required': return styles.statusReview;
      case 'Final Approval': return styles.statusApproved;
      default: return styles.statusPending;
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'Lead Attorney': return styles.roleValidator;
      case 'Senior Associate': return styles.roleApprover;
      case 'Partner': return styles.roleSignatory;
      default: return styles.roleValidator;
    }
  };

  const getStepClass = (status: string) => {
    switch (status) {
      case 'completed': return styles.stepCompleted;
      case 'active': return styles.stepActive;
      case 'pending': return styles.stepPending;
      default: return styles.stepPending;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      case 'low': return styles.priorityLow;
      default: return styles.priorityMedium;
    }
  };

  return (
    <div className={styles.root}>
      {/* Top Navigation */}
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <div className={styles.logo}>ClientPortal</div>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search documents, clients, tasks..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </div>
        <div className={styles.navRight}>
          <div className={styles.navIcon} onClick={() => alert('You have 3 new notifications:\n• Document validation required\n• Client uploaded new files\n• Deadline approaching')}>
            🔔
            <span className={styles.notificationBadge}>3</span>
          </div>
          <div className={styles.navIcon} onClick={() => alert('Settings clicked')}>⚙️</div>
          <div className={styles.navIcon} onClick={() => alert('Help clicked')}>❓</div>
          <div className={styles.userProfile} onClick={() => alert('User profile clicked')}>
            <div className={styles.userAvatar}>JD</div>
            <span>John Doe</span>
          </div>
        </div>
      </nav>

      <div className={styles.mainContainer}>
        {/* Left Sidebar */}
        <aside className={styles.leftSidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Client Directory</h2>
            <button 
              className={styles.addClientBtn}
              onClick={() => setIsAddClientDialogOpen(true)}
            >
              + Add New Client
            </button>
          </div>
          <div className={styles.clientSearch}>
            <input
              type="text"
              placeholder="Search clients..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className={styles.clientSearchInput}
            />
          </div>
          <div className={styles.clientList}>
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className={`${styles.clientItem} ${selectedClient.id === client.id ? styles.clientItemActive : ''}`}
                onClick={() => handleClientSelect(client)}
              >
                <div className={styles.clientInfo}>
                  <h4>{client.name}</h4>
                  <p>{client.type}</p>
                </div>
                {client.notifications && (
                  <div className={styles.clientStatus}>{client.notifications}</div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.dashboardGrid}>
            {/* Project Status Summary */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{selectedClient.name} - Project Status Summary</h3>
              </div>
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${progressWidth}%` }}
                  ></div>
                </div>
                <div className={styles.progressText}>73% Complete</div>
              </div>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <div className={styles.statusNumber}>5</div>
                  <div className={styles.statusLabel}>Pending Validation</div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusNumber}>3</div>
                  <div className={styles.statusLabel}>Pending Signing</div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusNumber}>2</div>
                  <div className={styles.statusLabel}>Pending Approval</div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Upcoming Deadlines</h3>
              </div>
              <div className={styles.deadlineList}>
                {mockDeadlines.map((deadline) => (
                  <div key={deadline.id} className={styles.deadlineItem}>
                    <div className={`${styles.deadlinePriority} ${getPriorityClass(deadline.priority)}`}></div>
                    <div>
                      <h5>{deadline.title}</h5>
                      <p>Due in {deadline.dueIn} - {deadline.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Required Documents */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Action Required Documents</h3>
            </div>
            <div className={styles.documentList}>
              {mockDocuments.map((document) => (
                <div 
                  key={document.id} 
                  className={styles.documentItem}
                  onClick={() => handleDocumentSelect(document)}
                >
                  <div>
                    <h5>{document.name}</h5>
                    <p>Uploaded {document.uploadedTime} by {document.uploadedBy}</p>
                  </div>
                  <div className={`${styles.documentStatus} ${getStatusClass(document.status)}`}>
                    {document.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
            </div>
            <div className={styles.activityList}>
              {mockActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityContent}>
                    <h5>{activity.title}</h5>
                    <p>{activity.description} - {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className={styles.rightSidebar}>
          {/* Document Information */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>Document Information</h3>
            <div className={styles.documentMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Document Type:</span>
                <span className={styles.metaValue}>{selectedDocument.type}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Category:</span>
                <span className={styles.metaValue}>{selectedDocument.category}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Domain:</span>
                <span className={styles.metaValue}>{selectedDocument.domain}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Created:</span>
                <span className={styles.metaValue}>{selectedDocument.created}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Status:</span>
                <span className={styles.metaValue}>{selectedDocument.status}</span>
              </div>
            </div>
          </div>

          {/* Assigned Team */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>Assigned Team</h3>
            {mockTeamMembers.map((member) => (
              <div key={member.id} className={styles.teamMember}>
                <div className={styles.memberAvatar}>{member.avatar}</div>
                <div className={styles.memberInfo}>
                  <h5>{member.name}</h5>
                  <p>{member.role}</p>
                </div>
                <span className={`${styles.roleBadge} ${getRoleClass(member.role)}`}>
                  {member.role.includes('Attorney') ? 'Validator' : 
                   member.role.includes('Associate') ? 'Approver' : 'Signatory'}
                </span>
              </div>
            ))}
          </div>

          {/* Workflow Checklist */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>Document Workflow</h3>
            <ul className={styles.workflowChecklist}>
              {mockWorkflowSteps.map((step) => (
                <li key={step.id} className={styles.workflowStep}>
                  <div className={`${styles.stepIndicator} ${getStepClass(step.status)}`}>
                    {step.status === 'completed' ? '✓' : step.id}
                  </div>
                  <div className={styles.stepContent}>{step.title}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Information */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>Security Information</h3>
            <div className={styles.securityInfo}>
              <div className={styles.securityItem}>
                <span className={styles.metaLabel}>Validation Status:</span>
                <span className={styles.metaValue}>✓ Verified</span>
              </div>
              <div className={styles.securityItem}>
                <span className={styles.metaLabel}>Retention Period:</span>
                <span className={styles.metaValue}>90 days</span>
              </div>
              <div className={styles.securityItem}>
                <span className={styles.metaLabel}>Access Level:</span>
                <span className={styles.metaValue}>Team & Client</span>
              </div>
              <div className={styles.securityItem}>
                <span className={styles.metaLabel}>Modifications:</span>
                <span className={styles.metaValue}>Restricted</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={(e, data) => setIsAddClientDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogContent>
              <div style={{ marginBottom: '16px' }}>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="clientType">Client Type</Label>
                <Select
                  id="clientType"
                  value={newClientType}
                  onChange={(e, data) => setNewClientType(data.value)}
                >
                  <Option value="Corporate Law">Corporate Law</Option>
                  <Option value="Estate Planning">Estate Planning</Option>
                  <Option value="Business Formation">Business Formation</Option>
                  <Option value="Contract Review">Contract Review</Option>
                  <Option value="Intellectual Property">Intellectual Property</Option>
                  <Option value="General">General</Option>
                </Select>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsAddClientDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleAddClient}>
                Add Client
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
} 