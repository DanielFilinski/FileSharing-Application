import { apiClient } from './apiClient';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'review' | 'signature' | 'notification';
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'skipped';
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  comments?: string;
  priority: 'low' | 'medium' | 'high';
  requirements?: {
    documentsNeeded?: string[];
    approvalLevel?: 'basic' | 'advanced' | 'executive';
    delegationAllowed?: boolean;
    timeoutAction?: 'escalate' | 'auto-approve' | 'auto-reject';
  };
  stepNumber?: number;
  action?: string;
  delegatedBy?: string;
  delegatedAt?: string;
}

export interface WorkflowInstance {
  id: string;
  partitionKey: string;
  documentId: string;
  documentName: string;
  type: 'approval' | 'review' | 'signature-collection' | 'compliance-check';
  name: string;
  description?: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  businessRules?: {
    requireAllApprovals?: boolean;
    allowParallelProcessing?: boolean;
    escalationTimeoutHours?: number;
    autoCompleteOnTimeout?: boolean;
    notifyCreatorOnUpdate?: boolean;
  };
  metadata?: any;
  // Computed fields
  currentStepInfo?: WorkflowStep | null;
  progressPercentage?: number;
  isOverdue?: boolean;
  canUserAct?: boolean;
  userRole?: 'creator' | 'assignee' | 'viewer';
}

export interface CreateWorkflowRequest {
  documentId: string;
  workflowType: 'approval' | 'review' | 'signature-collection' | 'compliance-check';
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'status' | 'completedAt' | 'completedBy'>[];
  businessRules?: {
    requireAllApprovals?: boolean;
    allowParallelProcessing?: boolean;
    escalationTimeoutHours?: number;
    autoCompleteOnTimeout?: boolean;
    notifyCreatorOnUpdate?: boolean;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  metadata?: any;
}

export interface AdvanceWorkflowRequest {
  action: 'approve' | 'reject' | 'request-changes' | 'delegate' | 'skip';
  comments?: string;
  delegateToId?: string;
  attachments?: string[];
}

export interface WorkflowsQueryParams {
  status?: string;
  documentId?: string;
  assignedToMe?: boolean;
  createdByMe?: boolean;
}

export class WorkflowApiClient {
  /**
   * Create a new workflow
   */
  static async createWorkflow(data: CreateWorkflowRequest): Promise<WorkflowInstance> {
    try {
      console.log('Creating workflow:', data);
      
      const response = await apiClient.post('/workflows', data);
      
      console.log('Workflow created successfully:', response);
      return response.data as WorkflowInstance;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflows with optional filtering
   */
  static async getWorkflows(params?: WorkflowsQueryParams): Promise<{
    success: boolean;
    data: WorkflowInstance[];
    count: number;
    filters: any;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.status) queryParams.set('status', params.status);
      if (params?.documentId) queryParams.set('documentId', params.documentId);
      if (params?.assignedToMe) queryParams.set('assignedToMe', 'true');
      if (params?.createdByMe) queryParams.set('createdByMe', 'true');
      
      const url = `/workflows${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching workflows:', url);
      
      const response = await apiClient.get(url);
      
      console.log('Workflows retrieved:', response);
      return response;
    } catch (error) {
      console.error('Failed to get workflows:', error);
      throw error;
    }
  }

  /**
   * Get a specific workflow by ID
   */
  static async getWorkflowById(workflowId: string): Promise<{
    success: boolean;
    data: WorkflowInstance;
  }> {
    try {
      console.log('Fetching workflow:', workflowId);
      
      const response = await apiClient.get(`/workflows/${workflowId}`);
      
      console.log('Workflow retrieved:', response);
      return response;
    } catch (error) {
      console.error('Failed to get workflow:', error);
      throw error;
    }
  }

  /**
   * Advance workflow to next step
   */
  static async advanceWorkflow(workflowId: string, data: AdvanceWorkflowRequest): Promise<{
    success: boolean;
    workflow: Partial<WorkflowInstance>;
    currentStepResult: WorkflowStep;
    nextStep?: WorkflowStep;
    message: string;
  }> {
    try {
      console.log(`Advancing workflow ${workflowId} with action:`, data);
      
      const response = await apiClient.post(`/workflows/${workflowId}/advance`, data);
      
      console.log('Workflow advanced successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to advance workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflows assigned to current user
   */
  static async getMyWorkflows(): Promise<WorkflowInstance[]> {
    try {
      const response = await this.getWorkflows({ assignedToMe: true });
      return response.data;
    } catch (error) {
      console.error('Failed to get my workflows:', error);
      throw error;
    }
  }

  /**
   * Get workflows created by current user
   */
  static async getMyCreatedWorkflows(): Promise<WorkflowInstance[]> {
    try {
      const response = await this.getWorkflows({ createdByMe: true });
      return response.data;
    } catch (error) {
      console.error('Failed to get my created workflows:', error);
      throw error;
    }
  }

  /**
   * Get workflows by document ID
   */
  static async getWorkflowsForDocument(documentId: string): Promise<WorkflowInstance[]> {
    try {
      const response = await this.getWorkflows({ documentId });
      return response.data;
    } catch (error) {
      console.error('Failed to get workflows for document:', error);
      throw error;
    }
  }

  /**
   * Get pending workflows (workflows that need action)
   */
  static async getPendingWorkflows(): Promise<WorkflowInstance[]> {
    try {
      const response = await this.getWorkflows({ assignedToMe: true, status: 'in-progress' });
      return response.data.filter(workflow => workflow.canUserAct);
    } catch (error) {
      console.error('Failed to get pending workflows:', error);
      throw error;
    }
  }

  /**
   * Helper method to get workflow status display info
   */
  static getWorkflowStatusInfo(status: string): {
    color: 'success' | 'warning' | 'danger' | 'neutral';
    text: string;
    icon: string;
  } {
    switch (status) {
      case 'pending':
        return { color: 'neutral', text: 'Pending', icon: 'Clock' };
      case 'in-progress':
        return { color: 'warning', text: 'In Progress', icon: 'Play' };
      case 'completed':
        return { color: 'success', text: 'Completed', icon: 'CheckmarkCircle' };
      case 'cancelled':
        return { color: 'danger', text: 'Cancelled', icon: 'ErrorCircle' };
      case 'escalated':
        return { color: 'warning', text: 'Escalated', icon: 'Important' };
      default:
        return { color: 'neutral', text: status, icon: 'Circle' };
    }
  }

  /**
   * Helper method to get step status display info
   */
  static getStepStatusInfo(status: string): {
    color: 'success' | 'warning' | 'danger' | 'neutral';
    text: string;
    icon: string;
  } {
    switch (status) {
      case 'pending':
        return { color: 'neutral', text: 'Pending', icon: 'Clock' };
      case 'in-progress':
        return { color: 'warning', text: 'In Progress', icon: 'Play' };
      case 'completed':
        return { color: 'success', text: 'Completed', icon: 'CheckmarkCircle' };
      case 'rejected':
        return { color: 'danger', text: 'Rejected', icon: 'Dismiss' };
      case 'skipped':
        return { color: 'neutral', text: 'Skipped', icon: 'ChevronRight' };
      default:
        return { color: 'neutral', text: status, icon: 'Circle' };
    }
  }

  /**
   * Helper method to get priority display info
   */
  static getPriorityInfo(priority: string): {
    color: 'success' | 'warning' | 'danger' | 'neutral';
    text: string;
    icon: string;
  } {
    switch (priority) {
      case 'urgent':
        return { color: 'danger', text: 'Urgent', icon: 'Important' };
      case 'high':
        return { color: 'warning', text: 'High', icon: 'ChevronUp' };
      case 'medium':
        return { color: 'neutral', text: 'Medium', icon: 'Remove' };
      case 'low':
        return { color: 'success', text: 'Low', icon: 'ChevronDown' };
      default:
        return { color: 'neutral', text: priority, icon: 'Circle' };
    }
  }

  /**
   * Helper method to format workflow type display name
   */
  static formatWorkflowType(type: string): string {
    switch (type) {
      case 'approval':
        return 'Approval';
      case 'review':
        return 'Review';
      case 'signature-collection':
        return 'Signature Collection';
      case 'compliance-check':
        return 'Compliance Check';
      default:
        return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  /**
   * Helper method to calculate workflow progress percentage
   */
  static calculateProgress(workflow: WorkflowInstance): number {
    if (!workflow.steps || workflow.steps.length === 0) return 0;
    return Math.round((workflow.currentStep / workflow.steps.length) * 100);
  }

  /**
   * Helper method to check if workflow is overdue
   */
  static isWorkflowOverdue(workflow: WorkflowInstance): boolean {
    if (!workflow.dueDate) return false;
    return new Date(workflow.dueDate) < new Date();
  }

  /**
   * Helper method to get available actions for current user
   */
  static getAvailableActions(workflow: WorkflowInstance): Array<{
    action: string;
    label: string;
    icon: string;
    appearance: 'primary' | 'secondary' | 'subtle';
  }> {
    if (!workflow.canUserAct || workflow.status !== 'in-progress') {
      return [];
    }

    const currentStep = workflow.currentStepInfo;
    if (!currentStep) return [];

    const actions = [
      { action: 'approve', label: 'Approve', icon: 'CheckmarkCircle', appearance: 'primary' as const },
      { action: 'reject', label: 'Reject', icon: 'ErrorCircle', appearance: 'secondary' as const },
      { action: 'request-changes', label: 'Request Changes', icon: 'Edit', appearance: 'subtle' as const }
    ];

    if (currentStep.requirements?.delegationAllowed) {
      actions.push({ action: 'delegate', label: 'Delegate', icon: 'People', appearance: 'subtle' as const });
    }

    actions.push({ action: 'skip', label: 'Skip', icon: 'ChevronRight', appearance: 'subtle' as const });

    return actions;
  }
}

export default WorkflowApiClient;
