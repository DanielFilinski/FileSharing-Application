/**
 * Audit Trail API Client
 * Frontend API клиент для работы с системой аудита
 */

import {
  AuditEvent,
  AuditEventsQuery,
  AuditEventsResponse,
  AuditStatistics,
  AuditSettings,
  AuditReport,
  AuditReportParameters,
  AuditSession,
  AuditCategory,
  AuditSeverity,
  AuditEventInput
} from '../types/audit';
import { apiClient } from './apiClient';

export interface CreateAuditReportRequest {
  name: string;
  description?: string;
  parameters: AuditReportParameters;
}

class AuditApiClient {
  /**
   * Получение событий аудита с фильтрацией и пагинацией
   */
  async getEvents(query: Partial<AuditEventsQuery> = {}): Promise<AuditEventsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.startDate) params.append('startDate', query.startDate);
      if (query.endDate) params.append('endDate', query.endDate);
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.offset) params.append('offset', query.offset.toString());
      if (query.categories) params.append('categories', query.categories.join(','));
      if (query.actions) params.append('actions', query.actions.join(','));
      if (query.userIds) params.append('userIds', query.userIds.join(','));
      if (query.resourceTypes) params.append('resourceTypes', query.resourceTypes.join(','));
      if (query.severities) params.append('severities', query.severities.join(','));
      if (query.searchText) params.append('searchText', query.searchText);
      if (query.onlySuccessful !== undefined) params.append('onlySuccessful', query.onlySuccessful.toString());
      if (query.onlyFailed !== undefined) params.append('onlyFailed', query.onlyFailed.toString());
      if (query.includeSensitive !== undefined) params.append('includeSensitive', query.includeSensitive.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await apiClient.get(`/api/audit/events?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Failed to get audit events:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Расширенный поиск событий аудита
   */
  async searchEvents(query: AuditEventsQuery): Promise<AuditEventsResponse> {
    try {
      const response = await apiClient.post('/api/audit/events/search', query);
      return response;
    } catch (error: any) {
      console.error('Failed to search audit events:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Создание события аудита (для тестирования или особых случаев)
   */
  async createEvent(event: AuditEventInput): Promise<AuditEvent> {
    try {
      const response = await apiClient.post('/api/audit/events', event);
      return response;
    } catch (error: any) {
      console.error('Failed to create audit event:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получение статистики аудита
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<AuditStatistics> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/api/audit/analytics/summary?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Failed to get audit statistics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получение настроек аудита
   */
  async getSettings(): Promise<AuditSettings> {
    try {
      const response = await apiClient.get('/api/audit/settings');
      return response;
    } catch (error: any) {
      console.error('Failed to get audit settings:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Обновление настроек аудита
   */
  async updateSettings(settings: Partial<AuditSettings>): Promise<AuditSettings> {
    try {
      const response = await apiClient.put('/api/audit/settings', settings);
      return response;
    } catch (error: any) {
      console.error('Failed to update audit settings:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Создание отчета аудита
   */
  async createReport(request: CreateAuditReportRequest): Promise<AuditReport> {
    try {
      const response = await apiClient.post('/api/audit/reports', request);
      return response;
    } catch (error: any) {
      console.error('Failed to create audit report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получение списка отчетов
   */
  async getReports(): Promise<AuditReport[]> {
    try {
      const response = await apiClient.get('/api/audit/reports');
      return response;
    } catch (error: any) {
      console.error('Failed to get audit reports:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Скачивание отчета
   */
  async downloadReport(reportId: string): Promise<Blob> {
    try {
      // TODO: Implement proper blob download
      const response = await apiClient.get(`/api/audit/reports/${reportId}/download`);
      return new Blob([JSON.stringify(response)], { type: 'application/json' });
    } catch (error: any) {
      console.error('Failed to download audit report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Utility methods
   */

  /**
   * Форматирование категории для отображения
   */
  formatCategory(category: AuditCategory): string {
    const categoryLabels: Record<AuditCategory, string> = {
      authentication: 'Аутентификация',
      authorization: 'Авторизация',
      document: 'Документы',
      signature: 'Подписи',
      chat: 'Сообщения',
      user_management: 'Управление пользователями',
      system: 'Система',
      search: 'Поиск',
      export: 'Экспорт',
      settings: 'Настройки'
    };

    return categoryLabels[category] || category;
  }

  /**
   * Форматирование уровня серьезности
   */
  formatSeverity(severity: AuditSeverity): string {
    const severityLabels: Record<AuditSeverity, string> = {
      low: 'Низкая',
      medium: 'Средняя',
      high: 'Высокая',
      critical: 'Критическая'
    };

    return severityLabels[severity] || severity;
  }

  /**
   * Получение цвета для уровня серьезности
   */
  getSeverityColor(severity: AuditSeverity): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (severity) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  /**
   * Получение цвета для статуса успешности
   */
  getSuccessColor(success: boolean): 'success' | 'danger' {
    return success ? 'success' : 'danger';
  }

  /**
   * Форматирование временной метки для отображения
   */
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Форматирование даты для фильтров
   */
  formatDateForFilter(date: Date): string {
    return date.toISOString();
  }

  /**
   * Создание быстрых фильтров по времени
   */
  getQuickTimeFilters(): Array<{ label: string; startDate: string; endDate?: string }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        label: 'Последний час',
        startDate: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      },
      {
        label: 'Сегодня',
        startDate: today.toISOString()
      },
      {
        label: 'Вчера',
        startDate: yesterday.toISOString(),
        endDate: today.toISOString()
      },
      {
        label: 'Последние 7 дней',
        startDate: thisWeek.toISOString()
      },
      {
        label: 'Этот месяц',
        startDate: thisMonth.toISOString()
      },
      {
        label: 'Последние 30 дней',
        startDate: last30Days.toISOString()
      }
    ];
  }

  /**
   * Экспорт событий в CSV
   */
  exportToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return 'Нет данных для экспорта';

    const headers = [
      'Время',
      'Пользователь',
      'Категория',
      'Действие',
      'Описание',
      'Ресурс',
      'Успешно',
      'Серьезность'
    ];

    const rows = events.map(event => [
      this.formatTimestamp(event.timestamp),
      event.userName,
      this.formatCategory(event.category),
      event.action,
      event.description,
      event.resourceName || event.resourceId,
      event.success ? 'Да' : 'Нет',
      this.formatSeverity(event.severity)
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Создание URL для скачивания CSV
   */
  createCSVDownloadUrl(events: AuditEvent[], filename: string = 'audit_events.csv'): string {
    const csv = this.exportToCSV(events);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  }

  /**
   * Группировка событий по дням для графиков
   */
  groupEventsByDay(events: AuditEvent[]): Array<{ date: string; count: number; successCount: number }> {
    const grouped = new Map<string, { count: number; successCount: number }>();

    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      const existing = grouped.get(date);
      
      if (existing) {
        existing.count++;
        if (event.success) existing.successCount++;
      } else {
        grouped.set(date, {
          count: 1,
          successCount: event.success ? 1 : 0
        });
      }
    });

    return Array.from(grouped.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Проверка доступности экспорта для пользователя
   */
  canExportData(settings: AuditSettings): boolean {
    return settings.exportSettings.allowUserExports;
  }

  /**
   * Проверка доступа к чувствительным данным
   */
  canAccessSensitiveData(settings: AuditSettings): boolean {
    return settings.securitySettings.allowSensitiveDataExport;
  }

  /**
   * Получение максимального диапазона для экспорта
   */
  getMaxExportRange(settings: AuditSettings): number {
    return settings.exportSettings.maxExportDays || 90;
  }

  /**
   * Валидация диапазона дат для экспорта
   */
  validateExportDateRange(startDate: string, endDate: string, settings: AuditSettings): string | null {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const maxDays = this.getMaxExportRange(settings);

    if (start > end) {
      return 'Дата начала должна быть раньше даты окончания';
    }

    if (end > now) {
      return 'Дата окончания не может быть в будущем';
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > maxDays) {
      return `Максимальный период для экспорта: ${maxDays} дней`;
    }

    return null;
  }

  /**
   * Обработка ошибок API
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.error || error.response.statusText || 'Unknown error';
      const statusCode = error.response.status;
      return new Error(`Audit API Error (${statusCode}): ${message}`);
    }
    
    if (error.request) {
      return new Error('Network error: Unable to reach the audit service');
    }
    
    return new Error(`Audit API Error: ${error.message}`);
  }
}

// Экспортируем singleton instance
export const auditApi = new AuditApiClient();
export default auditApi;
