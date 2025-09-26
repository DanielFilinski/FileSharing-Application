import { ApiClient, ApiResponse } from './client';

// Types for Dashboard API
export interface DashboardClient {
  Id?: string;
  FirstName: string;
  LastName: string;
  Email: string;
  FirmName?: string;
  IsActive: boolean;
  // UI specific properties
  id?: string;
  name?: string;
  type?: string;
  notifications?: number;
  status?: 'urgent' | 'attention' | 'normal';
}

export interface DashboardDocument {
  id: string;
  partitionKey: string;
  name: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadDate: string;
  lastModified: string;
  status: 'pending' | 'draft' | 'approved' | 'rejected' | 'archived';
  // UI specific properties
  type?: string;
  category?: string;
  domain?: string;
  created?: string;
  uploadedBy?: string;
  uploadedTime?: string;
  metadata?: {
    createdAt?: string;
    createdBy?: string;
    priority?: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface DashboardStats {
  totalDocuments: number;
  pendingValidation: number;
  pendingSigning: number;
  pendingApproval: number;
  completionPercentage: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: string;
  userId: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export class DashboardService {
  private apiClient: ApiClient;

  constructor() {
    const baseUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost') 
      ? 'http://localhost:7071/api'
      : (process.env.VITE_API_BASE_URL || '/api');
    this.apiClient = new ApiClient(baseUrl);
  }

  // Transform API client data to UI format
  private transformClientToUI(apiClient: DashboardClient): DashboardClient {
    return {
      ...apiClient,
      id: apiClient.Id || apiClient.id || Math.random().toString(),
      name: apiClient.FirmName || `${apiClient.FirstName} ${apiClient.LastName}`,
      type: this.determineClientType(apiClient),
      notifications: this.calculateNotifications(apiClient),
      status: this.determineClientStatus(apiClient)
    };
  }

  private determineClientType(client: DashboardClient): string {
    if (client.FirmName) {
      if (client.FirmName.toLowerCase().includes('law')) return 'Legal Services';
      if (client.FirmName.toLowerCase().includes('accounting')) return 'Tax Preparation Services';
      if (client.FirmName.toLowerCase().includes('dental') || client.FirmName.toLowerCase().includes('medical')) return 'Healthcare Services';
      return 'Business Services';
    }
    return 'Individual Client';
  }

  private calculateNotifications(_client: DashboardClient): number {
    // Mock notification calculation based on client activity
    return Math.floor(Math.random() * 5);
  }

  private determineClientStatus(_client: DashboardClient): 'urgent' | 'attention' | 'normal' {
    const random = Math.random();
    if (random < 0.2) return 'urgent';
    if (random < 0.4) return 'attention';
    return 'normal';
  }

  // Transform API document data to UI format
  private transformDocumentToUI(apiDoc: DashboardDocument): DashboardDocument {
    return {
      ...apiDoc,
      type: this.getDocumentType(apiDoc.contentType),
      category: this.getDocumentCategory(apiDoc.name),
      domain: 'General',
      created: apiDoc.uploadDate,
      uploadedBy: 'System User',
      uploadedTime: apiDoc.uploadDate,
      metadata: {
        createdAt: apiDoc.uploadDate,
        createdBy: 'System User',
        priority: 'Medium'
      }
    };
  }

  private getDocumentType(contentType: string): string {
    if (contentType?.includes('pdf')) return 'PDF Document';
    if (contentType?.includes('word') || contentType?.includes('document')) return 'Word Document';
    if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return 'Excel Spreadsheet';
    return 'Document';
  }

  private getDocumentCategory(fileName: string): string {
    const name = fileName.toLowerCase();
    if (name.includes('contract') || name.includes('agreement')) return 'Legal';
    if (name.includes('tax') || name.includes('financial')) return 'Financial';
    if (name.includes('medical') || name.includes('health')) return 'Medical';
    return 'General';
  }

  // API Methods
  async getClients(): Promise<DashboardClient[]> {
    console.log('📞 Calling getClients API...');
    try {
      const response: ApiResponse<DashboardClient[]> = await this.apiClient.get('/users/clients');
      console.log('✅ getClients response:', response.data?.length || 0, 'clients');
      
      // Transform API data to match UI expectations
      const transformedClients = response.data.map(client => this.transformClientToUI(client));
      
      console.log('✅ Transformed clients:', transformedClients.length);
      return transformedClients;
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      throw error;
    }
  }

  async getDocuments(): Promise<DashboardDocument[]> {
    console.log('📞 Calling getDocuments API...');
    try {
      const response: ApiResponse<DashboardDocument[]> = await this.apiClient.get('/documents');
      console.log('✅ getDocuments response:', response.data?.length || 0, 'documents');
      
      // Transform API data to match UI expectations
      const transformedDocs = response.data.map(doc => this.transformDocumentToUI(doc));
      
      console.log('✅ Transformed documents:', transformedDocs.length);
      return transformedDocs;
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    console.log('📞 Calling getUserProfile API...');
    try {
      const response: ApiResponse<UserProfile> = await this.apiClient.get('/getUserProfile');
      console.log('✅ getUserProfile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    console.log('📞 Calling getDashboardStats API...');
    try {
      const response: ApiResponse<DashboardStats> = await this.apiClient.get('/dashboard/stats');
      console.log('✅ getDashboardStats response:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Dashboard stats API failed, calculating from available data');
      
      // Fallback implementation - calculate from available data
      try {
        const [, documents] = await Promise.all([
          this.getClients().catch(() => []),
          this.getDocuments().catch(() => [])
        ]);

        const stats: DashboardStats = {
          totalDocuments: documents.length,
          pendingValidation: documents.filter(d => d.status === 'pending').length,
          pendingSigning: documents.filter(d => d.status === 'draft').length,
          pendingApproval: documents.filter(d => d.status === 'pending').length,
          completionPercentage: Math.floor((documents.filter(d => d.status === 'approved').length / Math.max(documents.length, 1)) * 100)
        };

        console.log('✅ getDashboardStats (calculated fallback):', stats);
        return stats;
      } catch (fallbackError) {
        console.error('❌ Error calculating dashboard stats:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    console.log('📞 Calling getRecentActivities API...');
    try {
      const response: ApiResponse<ActivityItem[]> = await this.apiClient.get(`/activities/recent?limit=${limit}`);
      console.log('✅ getRecentActivities response:', response.data?.length || 0, 'activities');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Recent activities API failed, using fallback data');
      
      // Fallback mock implementation
      const activities: ActivityItem[] = [
        {
          id: '1',
          title: 'Document Reviewed',
          description: 'Tax Return 2023 reviewed and approved',
          time: '2 hours ago',
          type: 'review',
          userId: 'user1'
        },
        {
          id: '2',
          title: 'New Client Added',
          description: 'Johnson & Associates LLP added to client database',
          time: '4 hours ago',
          type: 'client',
          userId: 'user2'
        },
        {
          id: '3',
          title: 'Document Uploaded',
          description: 'Medical Consent Form uploaded for Smith Dental',
          time: '1 day ago',
          type: 'upload',
          userId: 'user3'
        },
        {
          id: '4',
          title: 'Signature Completed',
          description: 'Service Agreement signed by XYZ Accounting',
          time: '2 days ago',
          type: 'signature',
          userId: 'user1'
        }
      ];

      console.log('✅ getRecentActivities (fallback):', activities.length);
      return activities.slice(0, limit);
    }
  }

  async getUpcomingDeadlines(limit: number = 10): Promise<DeadlineItem[]> {
    console.log('📞 Calling getUpcomingDeadlines API...');
    try {
      const response: ApiResponse<DeadlineItem[]> = await this.apiClient.get(`/deadlines/upcoming?limit=${limit}`);
      console.log('✅ getUpcomingDeadlines response:', response.data?.length || 0, 'deadlines');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Upcoming deadlines API failed, using fallback data');
      
      // Fallback mock implementation
      const deadlines: DeadlineItem[] = [
        {
          id: '1',
          title: 'Tax Return Filing',
          dueDate: 'March 15, 2024',
          priority: 'high',
          action: 'Submit to IRS'
        },
        {
          id: '2',
          title: 'Legal Review Required',
          dueDate: 'February 28, 2024',
          priority: 'medium',
          action: 'Attorney review needed'
        },
        {
          id: '3',
          title: 'Client Signature Pending',
          dueDate: 'March 5, 2024',
          priority: 'high',
          action: 'Obtain signature'
        }
      ];

      console.log('✅ getUpcomingDeadlines (fallback):', deadlines.length);
      return deadlines.slice(0, limit);
    }
  }

  async createClient(clientData: Partial<DashboardClient>): Promise<DashboardClient> {
    console.log('📞 Calling createClient API...', clientData);
    try {
      const response: ApiResponse<DashboardClient> = await this.apiClient.post('/users/clients', clientData);
      console.log('✅ createClient response:', response.data);
      
      return this.transformClientToUI(response.data);
    } catch (error) {
      console.error('❌ Error creating client:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
