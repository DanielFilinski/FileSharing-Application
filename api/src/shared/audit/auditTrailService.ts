/**
 * Audit Trail Service
 * Основной сервис для логирования и управления событиями аудита
 */

import { CosmosClient, Container } from '@azure/cosmos';
import { HttpRequest } from '@azure/functions';
import { 
  AuditEvent,
  AuditSession,
  AuditReport,
  AuditEventsQuery,
  AuditEventsResponse,
  AuditStatistics,
  AuditSettings,
  AuditContext,
  AuditEventInput,
  AuditSessionInput,
  AuditCategory,
  AuditSeverity,
  AuditActions,
  AuditReportParameters
} from '../../../src/shared/types/audit';

export class AuditTrailService {
  private cosmosClient: CosmosClient;
  private auditEventsContainer: Container;
  private auditSessionsContainer: Container;
  private auditReportsContainer: Container;
  private auditSettingsContainer: Container;

  constructor() {
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT!,
      key: process.env.COSMOS_DB_KEY!
    });

    const database = this.cosmosClient.database(process.env.COSMOS_DB_NAME!);
    this.auditEventsContainer = database.container('audit-events');
    this.auditSessionsContainer = database.container('audit-sessions');
    this.auditReportsContainer = database.container('audit-reports');
    this.auditSettingsContainer = database.container('audit-settings');
  }

  /**
   * Логирование события аудита
   */
  async logEvent(
    eventInput: AuditEventInput,
    context?: AuditContext
  ): Promise<AuditEvent> {
    try {
      const now = new Date().toISOString();
      const eventId = this.generateEventId();
      
      // Создаем ключ партиции: organizationId/год-месяц
      const partitionKey = this.createPartitionKey(
        eventInput.organizationId || context?.organizationId || 'default',
        new Date(eventInput.timestamp || now)
      );

      const auditEvent: AuditEvent = {
        ...eventInput,
        id: eventId,
        eventId,
        partitionKey,
        serverTimestamp: now,
        
        // Заполняем из контекста если не указано
        userId: eventInput.userId || context?.userId || 'system',
        userName: eventInput.userName || context?.userName || 'System',
        userEmail: eventInput.userEmail || context?.userEmail || '',
        userRole: eventInput.userRole || context?.userRole || 'system',
        organizationId: eventInput.organizationId || context?.organizationId || 'default',
        sessionId: eventInput.sessionId || context?.sessionId,
        ipAddress: eventInput.ipAddress || context?.ipAddress,
        userAgent: eventInput.userAgent || context?.userAgent,
        correlationId: eventInput.correlationId || context?.correlationId,
        
        // Значения по умолчанию
        timestamp: eventInput.timestamp || now,
        metadata: eventInput.metadata || {},
        success: eventInput.success !== undefined ? eventInput.success : true,
        severity: eventInput.severity || 'low',
        sensitive: eventInput.sensitive || false
      };

      // Проверяем настройки аудита для организации
      const settings = await this.getAuditSettings(auditEvent.organizationId);
      if (!this.shouldLogEvent(auditEvent, settings)) {
        console.log(`Audit event skipped due to settings: ${auditEvent.action}`);
        return auditEvent;
      }

      // Сохраняем событие
      await this.auditEventsContainer.items.create(auditEvent);
      
      // Обновляем статистику сессии
      if (auditEvent.sessionId) {
        await this.updateSessionStats(auditEvent.sessionId, auditEvent.organizationId);
      }

      // Отправляем real-time уведомления для критических событий
      if (auditEvent.severity === 'critical' || auditEvent.severity === 'high') {
        await this.sendRealTimeNotification(auditEvent);
      }

      console.log(`Audit event logged: ${auditEvent.action} by ${auditEvent.userName}`);
      return auditEvent;

    } catch (error) {
      console.error('Failed to log audit event:', error);
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  /**
   * Логирование множественных событий (batch)
   */
  async logEvents(
    events: AuditEventInput[],
    context?: AuditContext
  ): Promise<AuditEvent[]> {
    const loggedEvents: AuditEvent[] = [];
    
    // Группируем события по партициям для эффективности
    const eventsByPartition = new Map<string, AuditEventInput[]>();
    
    for (const event of events) {
      const partitionKey = this.createPartitionKey(
        event.organizationId || context?.organizationId || 'default',
        new Date(event.timestamp || new Date().toISOString())
      );
      
      if (!eventsByPartition.has(partitionKey)) {
        eventsByPartition.set(partitionKey, []);
      }
      eventsByPartition.get(partitionKey)!.push(event);
    }

    // Обрабатываем каждую партицию
    for (const [partitionKey, partitionEvents] of eventsByPartition) {
      try {
        for (const event of partitionEvents) {
          const loggedEvent = await this.logEvent(event, context);
          loggedEvents.push(loggedEvent);
        }
      } catch (error) {
        console.error(`Failed to log events for partition ${partitionKey}:`, error);
        // Продолжаем с другими партициями
      }
    }

    return loggedEvents;
  }

  /**
   * Создание или обновление сессии пользователя
   */
  async createOrUpdateSession(
    sessionInput: AuditSessionInput,
    context?: AuditContext
  ): Promise<AuditSession> {
    const now = new Date().toISOString();
    const sessionId = sessionInput.sessionId;
    const organizationId = sessionInput.organizationId || context?.organizationId || 'default';

    try {
      // Пытаемся найти существующую сессию
      const existingSession = await this.getSession(sessionId, organizationId);
      
      if (existingSession) {
        // Обновляем существующую сессию
        const updatedSession: AuditSession = {
          ...existingSession,
          lastActivity: now,
          eventsCount: existingSession.eventsCount + 1,
          ...sessionInput // Переопределяем с входными данными
        };

        await this.auditSessionsContainer
          .item(existingSession.id, organizationId)
          .replace(updatedSession);
          
        return updatedSession;
      } else {
        // Создаем новую сессию
        const newSession: AuditSession = {
          id: this.generateSessionId(),
          partitionKey: organizationId,
          sessionId,
          organizationId,
          startTime: now,
          lastActivity: now,
          eventsCount: 0,
          status: 'active',
          ...sessionInput
        };

        await this.auditSessionsContainer.items.create(newSession);
        return newSession;
      }
    } catch (error) {
      console.error('Failed to create/update session:', error);
      throw new Error(`Session management failed: ${error.message}`);
    }
  }

  /**
   * Завершение сессии пользователя
   */
  async endSession(
    sessionId: string, 
    organizationId: string,
    forcedLogout: boolean = false
  ): Promise<AuditSession | null> {
    try {
      const session = await this.getSession(sessionId, organizationId);
      if (!session) {
        return null;
      }

      const now = new Date().toISOString();
      const startTime = new Date(session.startTime).getTime();
      const endTime = new Date(now).getTime();
      const duration = Math.round((endTime - startTime) / 1000); // в секундах

      const updatedSession: AuditSession = {
        ...session,
        endTime: now,
        duration,
        status: 'completed',
        forcedLogout
      };

      await this.auditSessionsContainer
        .item(session.id, organizationId)
        .replace(updatedSession);

      // Логируем событие завершения сессии
      await this.logEvent({
        category: 'authentication',
        action: forcedLogout ? AuditActions.USER_LOGOUT : AuditActions.SESSION_EXPIRED,
        description: forcedLogout ? 'User logged out' : 'Session expired',
        resourceType: 'session',
        resourceId: sessionId,
        userId: session.userId,
        userName: session.userName,
        userEmail: session.userEmail,
        organizationId,
        sessionId,
        metadata: {
          duration,
          eventsCount: session.eventsCount,
          forcedLogout
        },
        success: true,
        severity: forcedLogout ? 'low' : 'medium',
        sensitive: false
      });

      return updatedSession;
    } catch (error) {
      console.error('Failed to end session:', error);
      throw new Error(`Session termination failed: ${error.message}`);
    }
  }

  /**
   * Поиск событий аудита
   */
  async queryEvents(query: AuditEventsQuery): Promise<AuditEventsResponse> {
    try {
      let sqlQuery = 'SELECT * FROM c WHERE 1=1';
      const parameters: any[] = [];
      let paramIndex = 0;

      // Фильтр по организации
      if (query.organizationId) {
        sqlQuery += ` AND c.organizationId = @orgId${paramIndex}`;
        parameters.push({ name: `@orgId${paramIndex}`, value: query.organizationId });
        paramIndex++;
      }

      // Фильтр по времени
      if (query.startDate) {
        sqlQuery += ` AND c.timestamp >= @startDate${paramIndex}`;
        parameters.push({ name: `@startDate${paramIndex}`, value: query.startDate });
        paramIndex++;
      }

      if (query.endDate) {
        sqlQuery += ` AND c.timestamp <= @endDate${paramIndex}`;
        parameters.push({ name: `@endDate${paramIndex}`, value: query.endDate });
        paramIndex++;
      }

      // Фильтр по пользователям
      if (query.userIds && query.userIds.length > 0) {
        const userParams = query.userIds.map((_, i) => `@userId${paramIndex + i}`).join(',');
        sqlQuery += ` AND c.userId IN (${userParams})`;
        query.userIds.forEach((userId, i) => {
          parameters.push({ name: `@userId${paramIndex + i}`, value: userId });
        });
        paramIndex += query.userIds.length;
      }

      // Фильтр по категориям
      if (query.categories && query.categories.length > 0) {
        const categoryParams = query.categories.map((_, i) => `@category${paramIndex + i}`).join(',');
        sqlQuery += ` AND c.category IN (${categoryParams})`;
        query.categories.forEach((category, i) => {
          parameters.push({ name: `@category${paramIndex + i}`, value: category });
        });
        paramIndex += query.categories.length;
      }

      // Фильтр по действиям
      if (query.actions && query.actions.length > 0) {
        const actionParams = query.actions.map((_, i) => `@action${paramIndex + i}`).join(',');
        sqlQuery += ` AND c.action IN (${actionParams})`;
        query.actions.forEach((action, i) => {
          parameters.push({ name: `@action${paramIndex + i}`, value: action });
        });
        paramIndex += query.actions.length;
      }

      // Фильтр по типам ресурсов
      if (query.resourceTypes && query.resourceTypes.length > 0) {
        const resourceParams = query.resourceTypes.map((_, i) => `@resourceType${paramIndex + i}`).join(',');
        sqlQuery += ` AND c.resourceType IN (${resourceParams})`;
        query.resourceTypes.forEach((resourceType, i) => {
          parameters.push({ name: `@resourceType${paramIndex + i}`, value: resourceType });
        });
        paramIndex += query.resourceTypes.length;
      }

      // Фильтр по успешности
      if (query.onlySuccessful === true) {
        sqlQuery += ' AND c.success = true';
      } else if (query.onlyFailed === true) {
        sqlQuery += ' AND c.success = false';
      }

      // Фильтр по чувствительным данным
      if (query.includeSensitive === false) {
        sqlQuery += ' AND c.sensitive = false';
      }

      // Текстовый поиск
      if (query.searchText) {
        sqlQuery += ` AND (CONTAINS(c.description, @searchText${paramIndex}) OR CONTAINS(c.resourceName, @searchText${paramIndex}))`;
        parameters.push({ name: `@searchText${paramIndex}`, value: query.searchText });
        paramIndex++;
      }

      // Сортировка
      const sortBy = query.sortBy || 'timestamp';
      const sortOrder = query.sortOrder || 'desc';
      sqlQuery += ` ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}`;

      // Пагинация
      if (query.limit) {
        sqlQuery += ` OFFSET ${query.offset || 0} LIMIT ${query.limit}`;
      }

      // Выполняем запрос
      const { resources: events } = await this.auditEventsContainer.items
        .query<AuditEvent>({ query: sqlQuery, parameters })
        .fetchAll();

      // Получаем общее количество для пагинации
      const countQuery = sqlQuery
        .replace('SELECT * FROM c', 'SELECT VALUE COUNT(1) FROM c')
        .replace(/ ORDER BY .+$/, '')
        .replace(/ OFFSET .+ LIMIT .+$/, '');
        
      const { resources: countResult } = await this.auditEventsContainer.items
        .query({ query: countQuery, parameters })
        .fetchAll();

      const total = countResult[0] || 0;
      const hasMore = query.limit ? (query.offset || 0) + events.length < total : false;

      // Создаем сводную информацию
      const summary = this.createEventsSummary(events);

      return {
        events,
        total,
        hasMore,
        summary
      };

    } catch (error) {
      console.error('Failed to query audit events:', error);
      throw new Error(`Audit query failed: ${error.message}`);
    }
  }

  /**
   * Получение статистики аудита
   */
  async getStatistics(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<AuditStatistics> {
    try {
      const query: AuditEventsQuery = {
        organizationId,
        startDate,
        endDate,
        limit: 10000 // Ограничение для производительности
      };

      const { events } = await this.queryEvents(query);
      return this.calculateStatistics(organizationId, startDate, endDate, events);

    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      throw new Error(`Statistics calculation failed: ${error.message}`);
    }
  }

  /**
   * Создание отчета аудита
   */
  async createReport(
    organizationId: string,
    createdBy: string,
    createdByName: string,
    parameters: AuditReportParameters,
    name: string,
    description?: string
  ): Promise<AuditReport> {
    try {
      const reportId = this.generateReportId();
      const now = new Date().toISOString();
      
      const report: AuditReport = {
        id: reportId,
        name,
        description,
        organizationId,
        createdBy,
        createdByName,
        parameters,
        dateRange: {
          startDate: parameters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: parameters.endDate || now
        },
        status: 'pending',
        progress: 0,
        createdAt: now,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней
        metadata: {}
      };

      await this.auditReportsContainer.items.create(report);

      // Асинхронно генерируем отчет
      this.generateReportAsync(report).catch(error => {
        console.error(`Failed to generate report ${reportId}:`, error);
      });

      return report;

    } catch (error) {
      console.error('Failed to create audit report:', error);
      throw new Error(`Report creation failed: ${error.message}`);
    }
  }

  /**
   * Получение настроек аудита
   */
  async getAuditSettings(organizationId: string): Promise<AuditSettings | null> {
    try {
      const { resource } = await this.auditSettingsContainer
        .item(organizationId, organizationId)
        .read<AuditSettings>();
      
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Сохранение настроек аудита
   */
  async saveAuditSettings(settings: AuditSettings): Promise<void> {
    const settingsWithTimestamp = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    await this.auditSettingsContainer.items.upsert(settingsWithTimestamp);
  }

  /**
   * Получение сессии пользователя
   */
  private async getSession(sessionId: string, organizationId: string): Promise<AuditSession | null> {
    try {
      const { resources } = await this.auditSessionsContainer.items
        .query<AuditSession>({
          query: 'SELECT * FROM c WHERE c.sessionId = @sessionId AND c.organizationId = @organizationId',
          parameters: [
            { name: '@sessionId', value: sessionId },
            { name: '@organizationId', value: organizationId }
          ]
        })
        .fetchAll();

      return resources.length > 0 ? resources[0] : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Обновление статистики сессии
   */
  private async updateSessionStats(sessionId: string, organizationId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId, organizationId);
      if (session) {
        const updatedSession: AuditSession = {
          ...session,
          eventsCount: session.eventsCount + 1,
          lastActivity: new Date().toISOString()
        };

        await this.auditSessionsContainer
          .item(session.id, organizationId)
          .replace(updatedSession);
      }
    } catch (error) {
      console.error('Failed to update session stats:', error);
      // Не критично, продолжаем работу
    }
  }

  /**
   * Проверка, нужно ли логировать событие
   */
  private shouldLogEvent(event: AuditEvent, settings: AuditSettings | null): boolean {
    if (!settings || !settings.enabled) {
      return true; // По умолчанию логируем все
    }

    // Проверяем, включена ли категория
    if (!settings.enabledCategories.includes(event.category)) {
      return false;
    }

    // Проверяем настройки для конкретной категории
    const categorySettings = settings.categorySettings[event.category];
    if (categorySettings && !categorySettings.enabled) {
      return false;
    }

    return true;
  }

  /**
   * Отправка real-time уведомлений
   */
  private async sendRealTimeNotification(event: AuditEvent): Promise<void> {
    try {
      // TODO: Реализовать отправку уведомлений через SignalR, email, webhook
      console.log(`Real-time notification: ${event.action} - ${event.description}`);
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
      // Не критично, продолжаем работу
    }
  }

  /**
   * Создание сводки событий
   */
  private createEventsSummary(events: AuditEvent[]) {
    const summary = {
      totalEvents: events.length,
      successfulEvents: events.filter(e => e.success).length,
      failedEvents: events.filter(e => !e.success).length,
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      categoriesCount: {} as Record<AuditCategory, number>
    };

    // Подсчитываем события по категориям
    events.forEach(event => {
      if (!summary.categoriesCount[event.category]) {
        summary.categoriesCount[event.category] = 0;
      }
      summary.categoriesCount[event.category]++;
    });

    return summary;
  }

  /**
   * Расчет статистики
   */
  private calculateStatistics(
    organizationId: string,
    startDate: string,
    endDate: string,
    events: AuditEvent[]
  ): AuditStatistics {
    // Базовая статистика
    const totalEvents = events.length;
    const successfulEvents = events.filter(e => e.success).length;
    const failedEvents = totalEvents - successfulEvents;
    const uniqueUsers = new Set(events.map(e => e.userId)).size;
    const uniqueSessions = new Set(events.map(e => e.sessionId).filter(Boolean)).size;

    // Статистика по категориям
    const byCategory: Record<AuditCategory, any> = {} as any;
    events.forEach(event => {
      if (!byCategory[event.category]) {
        byCategory[event.category] = {
          count: 0,
          successCount: 0,
          uniqueUsers: new Set()
        };
      }
      byCategory[event.category].count++;
      if (event.success) {
        byCategory[event.category].successCount++;
      }
      byCategory[event.category].uniqueUsers.add(event.userId);
    });

    // Преобразуем в финальный формат
    Object.keys(byCategory).forEach(category => {
      const categoryData = byCategory[category as AuditCategory];
      byCategory[category as AuditCategory] = {
        count: categoryData.count,
        successRate: categoryData.count > 0 ? categoryData.successCount / categoryData.count : 0,
        uniqueUsers: categoryData.uniqueUsers.size
      };
    });

    // Топ пользователей
    const userStats = new Map<string, { count: number; name: string; lastActivity: string }>();
    events.forEach(event => {
      const existing = userStats.get(event.userId);
      if (existing) {
        existing.count++;
        if (event.timestamp > existing.lastActivity) {
          existing.lastActivity = event.timestamp;
        }
      } else {
        userStats.set(event.userId, {
          count: 1,
          name: event.userName,
          lastActivity: event.timestamp
        });
      }
    });

    const topUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        userName: stats.name,
        eventsCount: stats.count,
        lastActivity: stats.lastActivity
      }))
      .sort((a, b) => b.eventsCount - a.eventsCount)
      .slice(0, 10);

    // Топ действий
    const actionStats = new Map<string, { count: number; category: AuditCategory; successCount: number }>();
    events.forEach(event => {
      const existing = actionStats.get(event.action);
      if (existing) {
        existing.count++;
        if (event.success) {
          existing.successCount++;
        }
      } else {
        actionStats.set(event.action, {
          count: 1,
          category: event.category,
          successCount: event.success ? 1 : 0
        });
      }
    });

    const topActions = Array.from(actionStats.entries())
      .map(([action, stats]) => ({
        action,
        category: stats.category,
        count: stats.count,
        successRate: stats.count > 0 ? stats.successCount / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Статистика по дням (упрощенная версия)
    const byDay: any[] = []; // TODO: Реализовать группировку по дням

    return {
      organizationId,
      period: { startDate, endDate },
      totalEvents,
      successfulEvents,
      failedEvents,
      uniqueUsers,
      uniqueSessions,
      byCategory,
      byDay,
      topUsers,
      topActions
    };
  }

  /**
   * Асинхронная генерация отчета
   */
  private async generateReportAsync(report: AuditReport): Promise<void> {
    try {
      // Обновляем статус
      await this.updateReportStatus(report.id, 'processing', 10);

      // Получаем события для отчета
      const query: AuditEventsQuery = {
        organizationId: report.organizationId,
        startDate: report.dateRange.startDate,
        endDate: report.dateRange.endDate,
        categories: report.parameters.categories,
        actions: report.parameters.actions,
        userIds: report.parameters.userIds,
        resourceTypes: report.parameters.resourceTypes,
        onlySuccessful: report.parameters.onlySuccessful,
        onlyFailed: report.parameters.onlyFailed,
        searchText: report.parameters.searchText,
        includeSensitive: report.parameters.includeSensitive,
        limit: report.parameters.maxEvents || 10000
      };

      await this.updateReportStatus(report.id, 'processing', 50);

      const { events } = await this.queryEvents(query);

      await this.updateReportStatus(report.id, 'processing', 80);

      // Генерируем файл отчета (заглушка)
      const reportData = this.formatReportData(events, report.parameters);
      
      // TODO: Здесь должна быть реальная генерация файла и загрузка в blob storage
      const downloadUrl = `https://storage.example.com/reports/${report.id}.${report.parameters.format}`;

      await this.updateReportStatus(report.id, 'completed', 100, {
        eventsCount: events.length,
        fileSize: reportData.length,
        downloadUrl
      });

    } catch (error) {
      console.error(`Failed to generate report ${report.id}:`, error);
      await this.updateReportStatus(report.id, 'failed', 0, {}, error.message);
    }
  }

  /**
   * Обновление статуса отчета
   */
  private async updateReportStatus(
    reportId: string,
    status: AuditReport['status'],
    progress: number,
    updates: Partial<AuditReport> = {},
    errorMessage?: string
  ): Promise<void> {
    try {
      const { resource: report } = await this.auditReportsContainer
        .item(reportId, reportId)
        .read<AuditReport>();

      if (report) {
        const updatedReport: AuditReport = {
          ...report,
          ...updates,
          status,
          progress,
          ...(status === 'completed' && { completedAt: new Date().toISOString() }),
          ...(errorMessage && { metadata: { ...report.metadata, errorMessage } })
        };

        await this.auditReportsContainer
          .item(reportId, reportId)
          .replace(updatedReport);
      }
    } catch (error) {
      console.error(`Failed to update report status for ${reportId}:`, error);
    }
  }

  /**
   * Форматирование данных отчета
   */
  private formatReportData(events: AuditEvent[], parameters: AuditReportParameters): string {
    switch (parameters.format) {
      case 'json':
        return JSON.stringify(events, null, 2);
      case 'csv':
        return this.formatAsCSV(events);
      case 'pdf':
        return 'PDF report generation not implemented';
      case 'excel':
        return 'Excel report generation not implemented';
      default:
        return JSON.stringify(events, null, 2);
    }
  }

  /**
   * Форматирование в CSV
   */
  private formatAsCSV(events: AuditEvent[]): string {
    if (events.length === 0) return 'No data';

    const headers = [
      'Timestamp', 'User', 'Action', 'Category', 'Resource Type',
      'Resource Name', 'Success', 'Severity', 'Description'
    ];

    const rows = events.map(event => [
      event.timestamp,
      event.userName,
      event.action,
      event.category,
      event.resourceType,
      event.resourceName || '',
      event.success.toString(),
      event.severity,
      event.description
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Создание ключа партиции
   */
  private createPartitionKey(organizationId: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${organizationId}/${year}-${month}`;
  }

  /**
   * Генерация ID событий
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Генерация ID сессий
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Генерация ID отчетов
   */
  private generateReportId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `report_${timestamp}_${random}`;
  }

  /**
   * Получение контекста из HTTP запроса
   */
  static getContextFromRequest(req: HttpRequest): AuditContext {
    return {
      userId: req.headers.get('x-user-id') || undefined,
      userName: req.headers.get('x-user-name') || undefined,
      userEmail: req.headers.get('x-user-email') || undefined,
      userRole: req.headers.get('x-user-role') || undefined,
      organizationId: req.headers.get('x-organization-id') || undefined,
      sessionId: req.headers.get('x-session-id') || undefined,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      correlationId: req.headers.get('x-correlation-id') || undefined,
      requestId: req.headers.get('x-request-id') || undefined
    };
  }
}
