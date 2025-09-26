import { useState, useEffect } from 'react';
import { makeStyles } from '@fluentui/react-components';
import {
  Button,
  Input,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Label,
  Select,
  Option,
  Spinner,
} from '@fluentui/react-components';
import { 
  dashboardService, 
  type DashboardClient, 
  type DashboardDocument, 
  type DashboardStats,
  type ActivityItem,
  type DeadlineItem 
} from '@/shared/api';

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
  mainContainer: {
    display: 'flex',
    height: '100vh',
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
  clientStatusIndicator: {
    borderRadius: '50%',
    width: '8px',
    height: '8px',
    marginRight: '4px',
  },
  statusUrgent: { background: '#ef4444' },
  statusAttention: { background: '#f59e0b' },
  statusNormal: { background: 'transparent' },
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

// Re-export types from API for backward compatibility
export type Client = DashboardClient;
export type Document = DashboardDocument;
export type Activity = ActivityItem;
export type Deadline = DeadlineItem;

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


// Data from HTML mockup
const mockClients: Client[] = [
  { Id: '1', FirstName: 'XYZ', LastName: 'Accounting', Email: 'xyz@accounting.com', FirmName: 'XYZ Accounting LLP', IsActive: true, name: 'XYZ Accounting LLP', type: 'Tax Preparation Services', notifications: 3, status: 'urgent' },
  { Id: '2', FirstName: 'ABC', LastName: 'Legal', Email: 'abc@legal.com', FirmName: 'ABC Legal Services', IsActive: true, name: 'ABC Legal Services', type: 'Legal Consulting', notifications: 1, status: 'urgent' },
  { Id: '3', FirstName: 'Johnson', LastName: 'Associates', Email: 'johnson@law.com', FirmName: 'Johnson & Associates LLP', IsActive: true, name: 'Johnson & Associates LLP', type: 'Business Law', status: 'normal' },
  { Id: '4', FirstName: 'Smith', LastName: 'Dental', Email: 'smith@dental.com', FirmName: 'Smith Dental Clinic', IsActive: true, name: 'Smith Dental Clinic', type: 'Healthcare Services', notifications: 2, status: 'attention' },
  { Id: '5', FirstName: 'Carter', LastName: 'Investments', Email: 'carter@invest.com', FirmName: 'Carter Investments', IsActive: true, name: 'Carter Investments', type: 'Financial Services', status: 'normal' },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    partitionKey: 'documents',
    name: 'Service Agreement',
    fileName: 'service-agreement.pdf',
    contentType: 'application/pdf',
    size: 1024000,
    uploadDate: 'May 20, 2025',
    lastModified: 'May 20, 2025',
    type: 'Service Agreement',
    category: 'Business Documents',
    domain: 'Law',
    created: 'May 20, 2025',
    status: 'pending',
    uploadedBy: 'Robert Chen',
    uploadedTime: 'May 20, 2025',
    metadata: {
      createdAt: 'May 20, 2025',
      createdBy: 'Robert Chen',
      priority: 'High'
    }
  },
  {
    id: '2',
    partitionKey: 'documents',
    name: 'Financial Statement Questionnaire',
    fileName: 'financial-statement.pdf',
    contentType: 'application/pdf',
    size: 512000,
    uploadDate: 'May 19, 2025',
    lastModified: 'May 19, 2025',
    type: 'Financial Statement',
    category: 'Financial Documents',
    domain: 'Accounting',
    created: 'May 19, 2025',
    status: 'approved',
    uploadedBy: 'Anna Martinez',
    uploadedTime: 'May 19, 2025',
    metadata: {
      createdAt: 'May 19, 2025',
      createdBy: 'Anna Martinez',
      priority: 'Medium'
    }
  },
  {
    id: '3',
    partitionKey: 'documents',
    name: 'Board Meeting Minutes',
    fileName: 'board-meeting-minutes.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 256000,
    uploadDate: 'May 18, 2025',
    lastModified: 'May 18, 2025',
    type: 'Meeting Minutes',
    category: 'Corporate Documents',
    domain: 'Corporate',
    created: 'May 18, 2025',
    status: 'draft',
    uploadedBy: 'John Doe',
    uploadedTime: 'May 18, 2025',
    metadata: {
      createdAt: 'May 18, 2025',
      createdBy: 'John Doe',
      priority: 'Low'
    }
  }
];

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Robert Chen', role: 'Validator', avatar: 'RC' },
  { id: '2', name: 'Anna Martinez', role: 'Signatory', avatar: 'AM' },
  { id: '3', name: 'John Doe', role: 'Approver', avatar: 'JD' },
];

const mockWorkflowSteps: WorkflowStep[] = [
  { id: '1', title: 'Initial Draft Review', status: 'completed' },
  { id: '2', title: 'Draft Validation', status: 'active' },
  { id: '3', title: 'Draft Approval', status: 'pending' },
  { id: '4', title: 'Draft Signing', status: 'pending' },
];

const mockDeadlines: Deadline[] = [
  { id: '1', title: 'Service Agreement Signature', priority: 'high', dueDate: 'March 15, 2024', action: 'Signature required' },
  { id: '2', title: 'Tax Return Authorization', priority: 'medium', dueDate: 'February 28, 2024', action: 'Approval needed' },
  { id: '3', title: 'Financial Statement Approval', priority: 'low', dueDate: 'March 5, 2024', action: 'Review pending' },
];

const mockActivities: Activity[] = [
  { id: '1', title: 'Khalil Salehi uploaded a new document "Service Agreement"', description: 'Service Agreement for XYZ Accounting LLP', time: 'May 20 1:00 PM', type: 'upload', userId: 'user1' },
  { id: '2', title: 'Gary Hussein commented on "Financial Statement"', description: 'Financial Statement for ABC Legal Services', time: 'Today at 4:47 PM', type: 'comment', userId: 'user2' },
  { id: '3', title: 'Robert Chavez completed review of "Initial Draft"', description: 'Board Meeting Minutes review completed', time: 'Yesterday', type: 'review', userId: 'user3' },
  { id: '4', title: 'Anna Martinez uploaded documents', description: 'Tax documents for Smith Dental Clinic', time: 'May 18 9:30 AM', type: 'upload', userId: 'user4' },
];

export default function Dashboard() {
  const styles = useStyles();
  
  // State for data - initialize with mock data immediately
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [deadlines, setDeadlines] = useState<Deadline[]>(mockDeadlines);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalDocuments: mockDocuments.length,
    pendingValidation: 5,
    pendingSigning: 3,
    pendingApproval: 2,
    completionPercentage: 75
  });
  
  // State for UI
  const [selectedClient, setSelectedClient] = useState<Client>(mockClients[0]);
  const [selectedDocument, setSelectedDocument] = useState<Document>(mockDocuments[0]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [progressWidth, setProgressWidth] = useState(0);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState('');
  
  // Loading states for individual sections
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isAddClientLoading, setIsAddClientLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'api'>('mock');

  // Load initial data progressively
  useEffect(() => {
    loadAllData();
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (dashboardStats) {
      const timer = setTimeout(() => {
        setProgressWidth(dashboardStats.completionPercentage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dashboardStats]);

  // Helper function to create timeout promise
  const createTimeoutPromise = <T,>(promise: Promise<T>, timeout: number = 8000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  };

  // Load clients data
  const loadClientsData = async () => {
    console.log('🔄 Loading clients data...');
    setIsClientsLoading(true);
    
    try {
      const clientsData = await createTimeoutPromise(dashboardService.getClients(), 8000);
      if (clientsData.length > 0) {
        setClients(clientsData);
        setSelectedClient(clientsData[0]);
        setDataSource('api');
        console.log('✅ Clients loaded from API:', clientsData.length);
      } else {
        throw new Error('No clients data');
      }
    } catch (error) {
      console.warn('⚠️ Clients API failed, using mock data:', error);
      // Keep mock data that's already set
    } finally {
      setIsClientsLoading(false);
    }
  };

  // Load documents data
  const loadDocumentsData = async () => {
    console.log('🔄 Loading documents data...');
    setIsDocumentsLoading(true);
    
    try {
      const documentsData = await createTimeoutPromise(dashboardService.getDocuments(), 8000);
      if (documentsData.length > 0) {
        setDocuments(documentsData);
        setSelectedDocument(documentsData[0]);
        setDataSource('api');
        console.log('✅ Documents loaded from API:', documentsData.length);
      } else {
        throw new Error('No documents data');
      }
    } catch (error) {
      console.warn('⚠️ Documents API failed, using mock data:', error);
      // Keep mock data that's already set
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  // Load activities and deadlines
  const loadActivitiesData = async () => {
    console.log('🔄 Loading activities data...');
    setIsActivitiesLoading(true);
    
    try {
      const [activitiesData, deadlinesData] = await Promise.all([
        createTimeoutPromise(dashboardService.getRecentActivities(4), 5000).catch(() => []),
        createTimeoutPromise(dashboardService.getUpcomingDeadlines(3), 5000).catch(() => [])
      ]);
      
      if (activitiesData.length > 0 || deadlinesData.length > 0) {
        if (activitiesData.length > 0) {
          setActivities(activitiesData);
        }
        if (deadlinesData.length > 0) {
          setDeadlines(deadlinesData);
        }
        setDataSource('api');
        console.log('✅ Activities/Deadlines loaded from API');
      }
    } catch (error) {
      console.warn('⚠️ Activities API failed, using mock data:', error);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  // Load dashboard stats
  const loadStatsData = async () => {
    console.log('🔄 Loading stats data...');
    setIsStatsLoading(true);
    
    try {
      const statsData = await createTimeoutPromise(dashboardService.getDashboardStats(), 5000);
      if (statsData) {
        setDashboardStats(statsData);
        setDataSource('api');
        console.log('✅ Stats loaded from API');
      }
    } catch (error) {
      console.warn('⚠️ Stats API failed, using mock data:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Load all data progressively
  const loadAllData = async () => {
    console.log('🔄 Starting progressive data loading...');
    setError(null);
    
    // Start loading all data in parallel, but each section handles its own loading state
    const promises = [
      loadClientsData(),
      loadDocumentsData(), 
      loadActivitiesData(),
      loadStatsData()
    ];

    try {
      await Promise.allSettled(promises);
      console.log('✅ All data loading completed');
      
      // Show success message only if we got API data
      if (dataSource === 'api') {
        setError('✅ Connected to Azure Functions - showing live data');
        setTimeout(() => setError(null), 3000); // Clear message after 3 seconds
      } else {
        setError('Using offline data. Azure Functions may be unavailable.');
      }
    } catch (error) {
      console.error('❌ Error during data loading:', error);
    }
  };

  // Client filtering
  const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (client.type || '').toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;

    setIsAddClientLoading(true);
    try {
      const [firstName, ...lastNameParts] = newClientName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || 'Client';
      
      const newClientData: Partial<DashboardClient> = {
        FirstName: firstName,
        LastName: lastName,
        Email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        FirmName: newClientType === 'General' ? undefined : newClientName,
        IsActive: true
      };

      const createdClient = await dashboardService.createClient(newClientData);
      
      // Add to local state
      setClients(prev => [...prev, createdClient]);
      
      // Reset form
      setNewClientName('');
      setNewClientType('');
      setIsAddClientDialogOpen(false);
      
      // Select the new client
      setSelectedClient(createdClient);
      
      setDataSource('api');
      console.log('✅ Client created successfully');
    } catch (error) {
      console.error('Error adding client:', error);
      setError('Failed to add client. Please try again.');
    } finally {
      setIsAddClientLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Review & Sign': return styles.statusPending;
      case 'Review': return styles.statusReview;
      case 'Complete': return styles.statusApproved;
      case 'Validation Required': return styles.statusPending;
      case 'Signature Required': return styles.statusReview;
      case 'Final Approval': return styles.statusApproved;
      default: return styles.statusPending;
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'Validator': return styles.roleValidator;
      case 'Approver': return styles.roleApprover;
      case 'Signatory': return styles.roleSignatory;
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

  const getClientStatusClass = (status?: string) => {
    switch (status) {
      case 'urgent': return styles.statusUrgent;
      case 'attention': return styles.statusAttention;
      case 'normal': return styles.statusNormal;
      default: return styles.statusNormal;
    }
  };

  return (
    <div className={styles.root}>
      {error && (
        <div style={{ 
          background: error.startsWith('✅') ? '#d1edff' : '#fff3cd', 
          border: `1px solid ${error.startsWith('✅') ? '#0078d4' : '#ffeaa7'}`, 
          padding: '12px 16px', 
          color: error.startsWith('✅') ? '#0078d4' : '#856404',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          {!error.startsWith('✅') && (
            <Button 
              size="small" 
              onClick={loadAllData}
              disabled={isClientsLoading || isDocumentsLoading || isActivitiesLoading || isStatsLoading}
            >
              {(isClientsLoading || isDocumentsLoading || isActivitiesLoading || isStatsLoading) ? 'Loading...' : 'Try Again'}
            </Button>
          )}
        </div>
      )}
      
      {/* Data source indicator */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        background: dataSource === 'api' ? '#d1edff' : '#f8f9fa',
        border: `1px solid ${dataSource === 'api' ? '#0078d4' : '#dee2e6'}`,
        borderRadius: '20px',
        padding: '8px 12px',
        fontSize: '12px',
        color: dataSource === 'api' ? '#0078d4' : '#6c757d',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: dataSource === 'api' ? '#0078d4' : '#6c757d'
        }}></div>
        {dataSource === 'api' ? '🌐 Live Data' : '📱 Offline Data'}
      </div>
      <div className={styles.mainContainer}>
        {/* Left Sidebar */}
        <aside className={styles.leftSidebar}>
          <div className={styles.sidebarHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <h2 className={styles.sidebarTitle} style={{ margin: 0 }}>Client Directory</h2>
              {isClientsLoading && <Spinner size="tiny" />}
            </div>
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
            {filteredClients.map((client, index) => (
              <div
                key={client?.id || `client-${index}`}
                className={`${styles.clientItem} ${selectedClient?.id === client?.id ? styles.clientItemActive : ''}`}
                onClick={() => handleClientSelect(client)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {client?.status && client.status !== 'normal' && (
                    <div className={`${styles.clientStatusIndicator} ${getClientStatusClass(client.status)}`}></div>
                  )}
                  <div className={styles.clientInfo}>
                    <h4>{client?.name || 'Unknown Client'}</h4>
                    <p>{client?.type || 'Unknown'}</p>
                  </div>
                </div>
                {client?.notifications && (
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
                <h3 className={styles.cardTitle}>
                  {selectedClient?.name || 'Overall'} - Project Status Summary
                </h3>
                {isStatsLoading && <Spinner size="tiny" />}
              </div>
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${progressWidth}%` }}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  {dashboardStats?.completionPercentage || 75}% Complete
                </div>
              </div>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <div className={styles.statusNumber}>
                    {dashboardStats?.pendingValidation || 5}
                  </div>
                  <div className={styles.statusLabel}>Pending Validation</div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusNumber}>
                    {dashboardStats?.pendingSigning || 3}
                  </div>
                  <div className={styles.statusLabel}>Pending Signing</div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusNumber}>
                    {dashboardStats?.pendingApproval || 2}
                  </div>
                  <div className={styles.statusLabel}>Pending Approval</div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Upcoming Deadlines</h3>
                {isActivitiesLoading && <Spinner size="tiny" />}
              </div>
              <div className={styles.deadlineList}>
                {deadlines.length > 0 ? deadlines.map((deadline, index) => (
                  <div key={deadline?.id || `deadline-${index}`} className={styles.deadlineItem}>
                    <div className={`${styles.deadlinePriority} ${getPriorityClass(deadline?.priority || 'medium')}`}></div>
                    <div>
                      <h5>{deadline?.title || 'Untitled'}</h5>
                      <p>Due {deadline?.dueDate || 'TBD'} - {deadline?.action || 'Action required'}</p>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No upcoming deadlines
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Required Documents */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Action Required Documents</h3>
              {isDocumentsLoading && <Spinner size="tiny" />}
            </div>
            <div className={styles.documentList}>
              {documents.length > 0 ? documents.map((document, index) => (
                <div 
                  key={document?.id || `document-${index}`} 
                  className={styles.documentItem}
                  onClick={() => handleDocumentSelect(document)}
                >
                  <div>
                    <h5>{document?.name || 'Untitled Document'}</h5>
                    <p>Uploaded {document?.uploadedTime || document?.created || 'Unknown'} by {document?.uploadedBy || document?.metadata?.createdBy || 'Unknown'}</p>
                  </div>
                  <div className={`${styles.documentStatus} ${getStatusClass(document?.status || 'draft')}`}>
                    {document?.status || 'Draft'}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No documents requiring action
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
              {isActivitiesLoading && <Spinner size="tiny" />}
            </div>
            <div className={styles.activityList}>
              {activities.length > 0 ? activities.map((activity, index) => (
                <div key={activity?.id || `activity-${index}`} className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityContent}>
                    <h5>{activity?.title || 'Activity'}</h5>
                    <p>{activity?.description || 'No description'} - {activity?.time || 'Unknown time'}</p>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className={styles.rightSidebar}>
          {/* Document Information */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>Document Information</h3>
            {selectedDocument ? (
              <div className={styles.documentMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Document Type:</span>
                  <span className={styles.metaValue}>{selectedDocument?.type || selectedDocument?.category || 'Unknown'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Category:</span>
                  <span className={styles.metaValue}>{selectedDocument?.category || 'General'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Domain:</span>
                  <span className={styles.metaValue}>{selectedDocument?.domain || 'General'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Created:</span>
                  <span className={styles.metaValue}>{selectedDocument?.created || selectedDocument?.metadata?.createdAt || 'Unknown'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Status:</span>
                  <span className={styles.metaValue}>{selectedDocument?.status || 'Unknown'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Priority:</span>
                  <span className={styles.metaValue}>{selectedDocument?.metadata?.priority || 'Medium'}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No document selected
              </div>
            )}
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
                  {member.role}
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
      <Dialog open={isAddClientDialogOpen} onOpenChange={(_, data) => setIsAddClientDialogOpen(data.open)}>
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
                  onChange={(_, data) => setNewClientType(data.value)}
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
              <Button 
                appearance="primary" 
                onClick={handleAddClient}
                disabled={isAddClientLoading}
              >
                {isAddClientLoading ? (
                  <>
                    <Spinner size="tiny" />
                    Adding...
                  </>
                ) : (
                  'Add Client'
                )}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}


