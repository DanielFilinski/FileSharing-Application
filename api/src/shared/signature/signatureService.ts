/**
 * Digital Signatures Service
 * Основной сервис для работы с электронными подписями документов
 */

import { CosmosClient, Container } from '@azure/cosmos';
import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { 
  SignatureRequest, 
  SignatureMethod, 
  Signer, 
  SignatureStatus,
  SignatureEvent,
  OrganizationSignatureSettings,
  SignatureTemplate,
  BulkSignatureRequest,
  SignatureStatistics
} from '../../../src/shared/types/signature';

export class SignatureService {
  private cosmosClient: CosmosClient;
  private signatureRequestsContainer: Container;
  private signatureEventsContainer: Container;
  private signatureSettingsContainer: Container;
  private signatureTemplatesContainer: Container;

  constructor() {
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT!,
      key: process.env.COSMOS_DB_KEY!
    });

    const database = this.cosmosClient.database(process.env.COSMOS_DB_NAME!);
    this.signatureRequestsContainer = database.container('signature-requests');
    this.signatureEventsContainer = database.container('signature-events');
    this.signatureSettingsContainer = database.container('signature-settings');
    this.signatureTemplatesContainer = database.container('signature-templates');
  }

  /**
   * Создание нового запроса на подпись
   */
  async createSignatureRequest(
    documentId: string,
    requesterId: string,
    organizationId: string,
    signers: Omit<Signer, 'id' | 'status' | 'signedAt'>[],
    settings: Partial<SignatureRequest['settings']> = {}
  ): Promise<SignatureRequest> {
    const signatureRequestId = this.generateId('sig');
    
    // Получаем настройки организации
    const orgSettings = await this.getOrganizationSettings(organizationId);
    
    // Создаем запрос
    const signatureRequest: SignatureRequest = {
      id: signatureRequestId,
      documentId,
      organizationId,
      requesterId,
      requestedByUserId: requesterId,
      status: 'pending',
      signatureMethod: orgSettings?.defaultMethod || 'docusign',
      signers: signers.map((signer, index) => ({
        ...signer,
        id: this.generateId('signer'),
        status: 'pending',
        order: signer.order || index + 1,
        emailNotifications: signer.emailNotifications ?? true,
        reminderEnabled: signer.reminderEnabled ?? true,
        authenticationMethods: signer.authenticationMethods || ['email']
      })),
      settings: {
        signingOrder: 'sequential',
        emailNotifications: true,
        reminderSettings: {
          enabled: true,
          intervalDays: 3,
          maxReminders: 3
        },
        expirationDays: 30,
        requireAllSignersToSign: true,
        allowDecline: true,
        allowComments: true,
        downloadable: true,
        printable: true,
        ...settings
      },
      createdAt: new Date().toISOString(),
      documentName: `Document-${documentId}`,
      expiresAt: new Date(Date.now() + (settings.expirationDays || 30) * 24 * 60 * 60 * 1000).toISOString()
    };

    // Сохраняем в базу данных
    await this.signatureRequestsContainer.items.create(signatureRequest);
    
    // Логируем событие
    await this.logSignatureEvent(signatureRequestId, 'created', requesterId);

    return signatureRequest;
  }

  /**
   * Получение запроса на подпись по ID
   */
  async getSignatureRequest(signatureRequestId: string): Promise<SignatureRequest | null> {
    try {
      const { resource } = await this.signatureRequestsContainer
        .item(signatureRequestId, signatureRequestId)
        .read<SignatureRequest>();
      
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Обновление статуса запроса на подпись
   */
  async updateSignatureRequestStatus(
    signatureRequestId: string,
    status: SignatureStatus,
    userId?: string,
    additionalData?: Partial<SignatureRequest>
  ): Promise<SignatureRequest> {
    const existingRequest = await this.getSignatureRequest(signatureRequestId);
    if (!existingRequest) {
      throw new Error(`Signature request ${signatureRequestId} not found`);
    }

    const updatedRequest: SignatureRequest = {
      ...existingRequest,
      ...additionalData,
      status,
      ...(status === 'completed' && { completedAt: new Date().toISOString() }),
      ...(status === 'in-progress' && !existingRequest.sentAt && { sentAt: new Date().toISOString() })
    };

    await this.signatureRequestsContainer
      .item(signatureRequestId, signatureRequestId)
      .replace(updatedRequest);

    // Логируем событие изменения статуса
    await this.logSignatureEvent(
      signatureRequestId, 
      status as any, 
      userId,
      { previousStatus: existingRequest.status, newStatus: status }
    );

    return updatedRequest;
  }

  /**
   * Обновление статуса подписанта
   */
  async updateSignerStatus(
    signatureRequestId: string,
    signerEmail: string,
    status: Signer['status'],
    signatureInfo?: Signer['signatureInfo'],
    declineReason?: string
  ): Promise<SignatureRequest> {
    const signatureRequest = await this.getSignatureRequest(signatureRequestId);
    if (!signatureRequest) {
      throw new Error(`Signature request ${signatureRequestId} not found`);
    }

    // Находим и обновляем подписанта
    const signerIndex = signatureRequest.signers.findIndex(s => s.email === signerEmail);
    if (signerIndex === -1) {
      throw new Error(`Signer ${signerEmail} not found in request ${signatureRequestId}`);
    }

    const updatedSigner = {
      ...signatureRequest.signers[signerIndex],
      status,
      ...(status === 'signed' && { 
        signedAt: new Date().toISOString(),
        signatureInfo 
      }),
      ...(status === 'declined' && { 
        declinedAt: new Date().toISOString(),
        declineReason 
      })
    };

    signatureRequest.signers[signerIndex] = updatedSigner;

    // Проверяем, завершен ли запрос на подпись
    if (this.isSignatureRequestCompleted(signatureRequest)) {
      signatureRequest.status = 'completed';
      signatureRequest.completedAt = new Date().toISOString();
    }

    // Сохраняем обновленный запрос
    await this.signatureRequestsContainer
      .item(signatureRequestId, signatureRequestId)
      .replace(signatureRequest);

    // Логируем событие
    await this.logSignatureEvent(
      signatureRequestId,
      status as any,
      undefined,
      { signerEmail, signatureInfo },
      signerEmail
    );

    return signatureRequest;
  }

  /**
   * Получение запросов на подпись для пользователя
   */
  async getUserSignatureRequests(
    userId: string,
    organizationId: string,
    filters: {
      status?: SignatureStatus[];
      role?: 'requester' | 'signer';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ requests: SignatureRequest[]; total: number }> {
    let query = `
      SELECT * FROM c 
      WHERE c.organizationId = @organizationId
    `;
    const parameters = [{ name: '@organizationId', value: organizationId }];

    // Фильтр по роли
    if (filters.role === 'requester') {
      query += ` AND c.requesterId = @userId`;
      parameters.push({ name: '@userId', value: userId });
    } else if (filters.role === 'signer') {
      query += ` AND EXISTS(SELECT VALUE s FROM s IN c.signers WHERE s.userId = @userId)`;
      parameters.push({ name: '@userId', value: userId });
    }

    // Фильтр по статусу
    if (filters.status && filters.status.length > 0) {
      query += ` AND c.status IN (${filters.status.map((_, i) => `@status${i}`).join(',')})`;
      filters.status.forEach((status, i) => {
        parameters.push({ name: `@status${i}`, value: status });
      });
    }

    query += ` ORDER BY c.createdAt DESC`;

    // Пагинация
    if (filters.limit) {
      query += ` OFFSET ${filters.offset || 0} LIMIT ${filters.limit}`;
    }

    const { resources: requests } = await this.signatureRequestsContainer.items
      .query<SignatureRequest>({ query, parameters })
      .fetchAll();

    // Получаем общее количество (для пагинации)
    const countQuery = query.replace('SELECT * FROM c', 'SELECT VALUE COUNT(1) FROM c')
      .replace(/ OFFSET .+ LIMIT .+$/, '');
    
    const { resources: countResult } = await this.signatureRequestsContainer.items
      .query({ query: countQuery, parameters })
      .fetchAll();

    return {
      requests,
      total: countResult[0] || 0
    };
  }

  /**
   * Получение настроек подписи организации
   */
  async getOrganizationSettings(organizationId: string): Promise<OrganizationSignatureSettings | null> {
    try {
      const { resource } = await this.signatureSettingsContainer
        .item(organizationId, organizationId)
        .read<OrganizationSignatureSettings>();
      
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Сохранение настроек подписи организации
   */
  async saveOrganizationSettings(settings: OrganizationSignatureSettings): Promise<void> {
    const settingsWithTimestamp = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    await this.signatureSettingsContainer.items.upsert(settingsWithTimestamp);
  }

  /**
   * Создание шаблона подписи
   */
  async createSignatureTemplate(template: Omit<SignatureTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>): Promise<SignatureTemplate> {
    const signatureTemplate: SignatureTemplate = {
      ...template,
      id: this.generateId('template'),
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    await this.signatureTemplatesContainer.items.create(signatureTemplate);
    return signatureTemplate;
  }

  /**
   * Получение шаблонов организации
   */
  async getOrganizationTemplates(organizationId: string): Promise<SignatureTemplate[]> {
    const { resources: templates } = await this.signatureTemplatesContainer.items
      .query<SignatureTemplate>({
        query: `SELECT * FROM c WHERE c.organizationId = @organizationId ORDER BY c.createdAt DESC`,
        parameters: [{ name: '@organizationId', value: organizationId }]
      })
      .fetchAll();

    return templates;
  }

  /**
   * Логирование события подписи
   */
  async logSignatureEvent(
    signatureRequestId: string,
    eventType: SignatureEvent['eventType'],
    userId?: string,
    details?: Record<string, any>,
    signerEmail?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const event: SignatureEvent = {
      id: this.generateId('event'),
      signatureRequestId,
      eventType,
      userId,
      signerEmail,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      details
    };

    await this.signatureEventsContainer.items.create(event);
  }

  /**
   * Получение статистики подписей
   */
  async getSignatureStatistics(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<SignatureStatistics> {
    const query = `
      SELECT * FROM c 
      WHERE c.organizationId = @organizationId 
        AND c.createdAt >= @startDate 
        AND c.createdAt <= @endDate
    `;

    const { resources: requests } = await this.signatureRequestsContainer.items
      .query<SignatureRequest>({
        query,
        parameters: [
          { name: '@organizationId', value: organizationId },
          { name: '@startDate', value: startDate },
          { name: '@endDate', value: endDate }
        ]
      })
      .fetchAll();

    return this.calculateStatistics(requests, startDate, endDate, organizationId);
  }

  /**
   * Проверка завершенности запроса на подпись
   */
  private isSignatureRequestCompleted(request: SignatureRequest): boolean {
    if (!request.settings.requireAllSignersToSign) {
      // Если не требуется подпись всех, достаточно одной подписи
      return request.signers.some(s => s.status === 'signed');
    }

    // Проверяем, что все обязательные подписанты подписали
    const requiredSigners = request.signers.filter(s => s.role === 'signer');
    return requiredSigners.every(s => s.status === 'signed');
  }

  /**
   * Расчет статистики
   */
  private calculateStatistics(
    requests: SignatureRequest[], 
    startDate: string, 
    endDate: string,
    organizationId: string
  ): SignatureStatistics {
    const totalRequests = requests.length;
    const completedRequests = requests.filter(r => r.status === 'completed').length;
    const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in-progress').length;
    const expiredRequests = requests.filter(r => r.status === 'expired').length;

    // Статистика по методам
    const byMethod: Record<SignatureMethod, number> = {
      docusign: 0,
      'adobe-sign': 0,
      internal: 0,
      drawn: 0
    };

    requests.forEach(r => {
      byMethod[r.signatureMethod] = (byMethod[r.signatureMethod] || 0) + 1;
    });

    // Время выполнения
    const completedRequestsWithTime = requests.filter(r => r.completedAt && r.createdAt);
    const completionTimes = completedRequestsWithTime.map(r => {
      const created = new Date(r.createdAt).getTime();
      const completed = new Date(r.completedAt!).getTime();
      return (completed - created) / (1000 * 60 * 60); // в часах
    });

    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
      : 0;

    // Подсчет completion rates
    const within24Hours = completedRequestsWithTime.filter(r => {
      const created = new Date(r.createdAt).getTime();
      const completed = new Date(r.completedAt!).getTime();
      return (completed - created) < (24 * 60 * 60 * 1000);
    }).length;

    const within7Days = completedRequestsWithTime.filter(r => {
      const created = new Date(r.createdAt).getTime();
      const completed = new Date(r.completedAt!).getTime();
      return (completed - created) < (7 * 24 * 60 * 60 * 1000);
    }).length;

    const within30Days = completedRequestsWithTime.filter(r => {
      const created = new Date(r.createdAt).getTime();
      const completed = new Date(r.completedAt!).getTime();
      return (completed - created) < (30 * 24 * 60 * 60 * 1000);
    }).length;

    // Top requesters
    const requesterCounts: Record<string, { userId: string; count: number }> = {};
    requests.forEach(r => {
      if (!requesterCounts[r.requesterId]) {
        requesterCounts[r.requesterId] = { userId: r.requesterId, count: 0 };
      }
      requesterCounts[r.requesterId].count++;
    });

    const topRequesters = Object.values(requesterCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(r => ({
        userId: r.userId,
        userName: `User ${r.userId}`, // TODO: получить реальное имя из user service
        requestCount: r.count
      }));

    // Top signers
    const signerCounts: Record<string, { email: string; count: number }> = {};
    requests.forEach(r => {
      r.signers.filter(s => s.status === 'signed').forEach(s => {
        if (!signerCounts[s.email]) {
          signerCounts[s.email] = { email: s.email, count: 0 };
        }
        signerCounts[s.email].count++;
      });
    });

    const topSigners = Object.values(signerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(s => ({
        email: s.email,
        name: s.email.split('@')[0], // TODO: получить реальное имя
        signCount: s.count
      }));

    return {
      organizationId,
      period: { startDate, endDate },
      totalRequests,
      completedRequests,
      pendingRequests,
      expiredRequests,
      byMethod,
      averageCompletionTime,
      completionRates: {
        within24Hours: totalRequests > 0 ? within24Hours / totalRequests : 0,
        within7Days: totalRequests > 0 ? within7Days / totalRequests : 0,
        within30Days: totalRequests > 0 ? within30Days / totalRequests : 0
      },
      topRequesters,
      topSigners
    };
  }

  /**
   * Генерация уникального ID
   */
  private generateId(prefix: string = 'id'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Валидация email адреса
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Получение информации о пользователе из запроса
   */
  static getUserFromRequest(req: HttpRequest): { userId: string; organizationId: string; email?: string } {
    // TODO: Реализовать получение пользователя из JWT токена или сессии
    const userId = req.headers.get('x-user-id') || 'anonymous';
    const organizationId = req.headers.get('x-organization-id') || 'default';
    const email = req.headers.get('x-user-email') || undefined;
    
    return { userId, organizationId, email };
  }

  /**
   * Стандартная обработка ошибок
   */
  static handleError(error: any): HttpResponseInit {
    console.error('SignatureService Error:', error);

    if (error.code === 404) {
      return {
        status: 404,
        jsonBody: { error: 'Resource not found' }
      };
    }

    if (error.code === 400 || error.message.includes('validation')) {
      return {
        status: 400,
        jsonBody: { error: error.message || 'Validation error' }
      };
    }

    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}
