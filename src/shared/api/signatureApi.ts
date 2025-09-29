/**
 * Digital Signatures API Client
 * Frontend API client for working with digital signature system
 */

import {
  SignatureRequest,
  Signer,
  SignatureStatus,
  OrganizationSignatureSettings,
  SignatureTemplate,
  SignatureStatistics,
  SignatureMethod
} from '../types/signature';
import { apiClient } from './apiClient';

export interface CreateSignatureRequestData {
  signers: Omit<Signer, 'id' | 'status' | 'signedAt'>[];
  settings?: Partial<SignatureRequest['settings']>;
  subject?: string;
  message?: string;
}

export interface SignatureRequestFilters {
  status?: SignatureStatus[];
  role?: 'requester' | 'signer';
  limit?: number;
  offset?: number;
}

export interface SignatureRequestsResponse {
  requests: SignatureRequest[];
  total: number;
}

class SignatureApiClient {
  /**
   * Creating document signature request
   */
  async createSignatureRequest(documentId: string, data: CreateSignatureRequestData): Promise<SignatureRequest> {
    try {
      const response = await apiClient.post(`/api/documents/${documentId}/sign`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create signature request:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Getting user signature requests
   */
  async getUserSignatureRequests(filters: SignatureRequestFilters = {}): Promise<SignatureRequestsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      if (filters.role) {
        params.append('role', filters.role);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.offset) {
        params.append('offset', filters.offset.toString());
      }

      const response = await apiClient.get(`/api/signature-requests?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get signature requests:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Getting specific signature request
   */
  async getSignatureRequest(requestId: string): Promise<SignatureRequest> {
    try {
      const response = await apiClient.get(`/api/signature-requests/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get signature request:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Updating signature request status
   */
  async updateSignatureRequest(
    requestId: string, 
    data: {
      status: SignatureStatus;
      providerEnvelopeId?: string;
      providerUrl?: string;
    }
  ): Promise<SignatureRequest> {
    try {
      const response = await apiClient.put(`/api/signature-requests/${requestId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update signature request:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Canceling signature request
   */
  async cancelSignatureRequest(requestId: string): Promise<SignatureRequest> {
    try {
      const response = await apiClient.delete(`/api/signature-requests/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to cancel signature request:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Updating signer status
   */
  async updateSignerStatus(
    requestId: string,
    signerEmail: string,
    data: {
      status: Signer['status'];
      signatureInfo?: Signer['signatureInfo'];
      declineReason?: string;
    }
  ): Promise<SignatureRequest> {
    try {
      const encodedEmail = encodeURIComponent(signerEmail);
      const response = await apiClient.post(
        `/api/signature-requests/${requestId}/signers/${encodedEmail}/status`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to update signer status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Getting organization signature settings
   */
  async getSignatureSettings(): Promise<OrganizationSignatureSettings> {
    try {
      const response = await apiClient.get('/api/signature-settings');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get signature settings:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Updating organization signature settings
   */
  async updateSignatureSettings(settings: Partial<OrganizationSignatureSettings>): Promise<OrganizationSignatureSettings> {
    try {
      const response = await apiClient.put('/api/signature-settings', settings);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update signature settings:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получение шаблонов подписи
   */
  async getSignatureTemplates(): Promise<SignatureTemplate[]> {
    try {
      const response = await apiClient.get('/api/signature-templates');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get signature templates:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Создание шаблона подписи
   */
  async createSignatureTemplate(template: {
    name: string;
    signatureMethod: SignatureMethod;
    defaultSettings: any;
    defaultSigners: any[];
  }): Promise<SignatureTemplate> {
    try {
      const response = await apiClient.post('/api/signature-templates', template);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create signature template:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получение статистики подписей
   */
  async getSignatureStatistics(startDate?: string, endDate?: string): Promise<SignatureStatistics> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/api/signature-statistics?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get signature statistics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Utility methods
   */

  /**
   * Получение статуса подписи с цветом для UI
   */
  getStatusColor(status: SignatureStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'informative' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
      case 'pending':
        return 'informative';
      case 'failed':
      case 'cancelled':
        return 'danger';
      case 'expired':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  /**
   * Получение статуса подписанта с цветом для UI
   */
  getSignerStatusColor(status: Signer['status']): 'success' | 'warning' | 'danger' | 'neutral' | 'informative' {
    switch (status) {
      case 'signed':
        return 'success';
      case 'pending':
      case 'sent':
      case 'delivered':
        return 'informative';
      case 'declined':
        return 'danger';
      case 'auto-responded':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  /**
   * Форматирование статуса для отображения
   */
  formatSignatureStatus(status: SignatureStatus): string {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'in-progress':
        return 'В процессе';
      case 'completed':
        return 'Завершено';
      case 'failed':
        return 'Ошибка';
      case 'cancelled':
        return 'Отменено';
      case 'expired':
        return 'Истекло';
      default:
        return status;
    }
  }

  /**
   * Форматирование статуса подписанта для отображения
   */
  formatSignerStatus(status: Signer['status']): string {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'sent':
        return 'Отправлено';
      case 'delivered':
        return 'Доставлено';
      case 'signed':
        return 'Подписано';
      case 'declined':
        return 'Отклонено';
      case 'auto-responded':
        return 'Авто-ответ';
      default:
        return status;
    }
  }

  /**
   * Форматирование роли подписанта для отображения
   */
  formatSignerRole(role: Signer['role']): string {
    switch (role) {
      case 'signer':
        return 'Подписант';
      case 'approver':
        return 'Утверждающий';
      case 'reviewer':
        return 'Рецензент';
      case 'cc':
        return 'Копия';
      case 'witness':
        return 'Свидетель';
      default:
        return role;
    }
  }

  /**
   * Форматирование метода подписи для отображения
   */
  formatSignatureMethod(method: SignatureMethod): string {
    switch (method) {
      case 'docusign':
        return 'DocuSign';
      case 'adobe-sign':
        return 'Adobe Sign';
      case 'internal':
        return 'Внутренняя подпись';
      case 'drawn':
        return 'Рукописная подпись';
      default:
        return method;
    }
  }

  /**
   * Проверка может ли пользователь отменить запрос
   */
  canCancelSignatureRequest(request: SignatureRequest, userId: string): boolean {
    return request.requesterId === userId && 
           ['pending', 'in-progress'].includes(request.status);
  }

  /**
   * Проверка может ли пользователь повторно отправить запрос
   */
  canResendSignatureRequest(request: SignatureRequest, userId: string): boolean {
    return request.requesterId === userId && 
           ['failed', 'expired'].includes(request.status);
  }

  /**
   * Получение следующего подписанта в sequential режиме
   */
  getNextSigner(request: SignatureRequest): Signer | null {
    if (request.settings.signingOrder !== 'sequential') {
      return null;
    }

    const pendingSigners = request.signers
      .filter(s => s.status === 'pending')
      .sort((a, b) => a.order - b.order);

    return pendingSigners.length > 0 ? pendingSigners[0] : null;
  }

  /**
   * Расчет прогресса подписания (в процентах)
   */
  calculateSigningProgress(request: SignatureRequest): number {
    const totalSigners = request.signers.filter(s => s.role === 'signer').length;
    const signedCount = request.signers.filter(s => s.role === 'signer' && s.status === 'signed').length;
    
    if (totalSigners === 0) return 100;
    return Math.round((signedCount / totalSigners) * 100);
  }

  /**
   * Генерация сводки по запросу
   */
  generateSignatureRequestSummary(request: SignatureRequest): {
    totalSigners: number;
    signedCount: number;
    pendingCount: number;
    declinedCount: number;
    progress: number;
    estimatedCompletion?: Date;
  } {
    const signers = request.signers.filter(s => s.role === 'signer');
    const totalSigners = signers.length;
    const signedCount = signers.filter(s => s.status === 'signed').length;
    const pendingCount = signers.filter(s => s.status === 'pending').length;
    const declinedCount = signers.filter(s => s.status === 'declined').length;
    const progress = this.calculateSigningProgress(request);

    // Простая оценка времени завершения (в реальности может быть более сложная логика)
    let estimatedCompletion: Date | undefined;
    if (pendingCount > 0 && request.settings.reminderSettings.enabled) {
      const avgDaysPerReminder = request.settings.reminderSettings.intervalDays;
      const estimatedDays = pendingCount * avgDaysPerReminder;
      estimatedCompletion = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
    }

    return {
      totalSigners,
      signedCount,
      pendingCount,
      declinedCount,
      progress,
      estimatedCompletion
    };
  }

  /**
   * Обработка ошибок API
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.error || error.response.statusText || 'Unknown error';
      const statusCode = error.response.status;
      return new Error(`API Error (${statusCode}): ${message}`);
    }
    
    if (error.request) {
      return new Error('Network error: Unable to reach the server');
    }
    
    return new Error(`Signature API Error: ${error.message}`);
  }
}

// Экспортируем singleton instance
export const signatureApi = new SignatureApiClient();
export default signatureApi;
