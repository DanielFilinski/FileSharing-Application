import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../lib/cosmosClient';
import { getUserInfoFromToken } from '../lib/authHelper';

/**
 * Azure Function для сохранения настроек валидации документов
 * Реализует API endpoint для стадий 4.1-4.3 согласно техническому описанию
 */
export async function saveValidationSettings(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return {
      status: 200,
      headers: corsHeaders,
    };
  }

  // Проверка авторизации
  const userInfo = getUserInfoFromToken(req);
  if (!userInfo) {
    return {
      status: 401,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required'
      }),
    };
  }

  // Проверка прав доступа (в реальном приложении интегрировать с RBAC)
  const hasValidationConfigPermission = true; // TODO: Реализовать проверку Permission.VALIDATION_CONFIG
  if (!hasValidationConfigPermission) {
    return {
      status: 403,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Forbidden',
        message: 'Insufficient permissions to configure validation settings'
      }),
    };
  }

  try {
    // Парсинг данных из запроса
    const validationSettings = await req.json();
    context.log('Received validation settings:', validationSettings);

    // Валидация настроек
    const validationErrors = validateValidationSettings(validationSettings);
    if (validationErrors.length > 0) {
      return {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Validation failed",
          errors: validationErrors,
          success: false
        }),
      };
    }

    // Получение контейнера базы данных
    const container = await getContainer();

    // Генерация ID документа настроек
    const organizationId = validationSettings.organizationId || userInfo.tid;
    const settingsId = `validation-settings-${organizationId}`;

    // Проверка существующих настроек
    let existingSettings = null;
    try {
      const response = await container.item(settingsId, settingsId).read();
      existingSettings = response.resource;
    } catch (error: any) {
      // Документ не существует, создастся новый
      context.log("No existing validation settings found, creating new document");
    }

    // Подготовка документа настроек
    const settingsDocument = {
      id: settingsId,
      type: 'validation-settings',
      organizationId: organizationId,
      manualValidationNeeded: validationSettings.manualValidationNeeded,
      validationAssignment: validationSettings.validationAssignment,
      validatorsByOffice: validationSettings.validatorsByOffice || [],
      validatorsByDocument: validationSettings.validatorsByDocument || [],
      validatorsByDepartment: validationSettings.validatorsByDepartment || [],
      validatorsByEmployee: validationSettings.validatorsByEmployee || [],
      metadata: {
        createdAt: existingSettings?.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: existingSettings?.metadata?.createdBy || userInfo.oid,
        updatedBy: userInfo.oid,
        version: existingSettings?.metadata?.version ? existingSettings.metadata.version + 1 : 1
      }
    };

    // Сохранение в базе данных
    const result = await container.items.upsert(settingsDocument);
    context.log(`Validation settings saved successfully with id: ${settingsId}`);

    // Логирование изменений для аудита
    await logValidationSettingsChange(
      container,
      organizationId,
      userInfo.oid,
      existingSettings,
      settingsDocument,
      context
    );

    return {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true,
        message: 'Validation settings saved successfully',
        settings: result.resource,
        organizationId: organizationId
      }),
    };

  } catch (error: any) {
    context.error('Error saving validation settings:', error);
    
    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to save validation settings',
        details: error.message,
        success: false
      }),
    };
  }
}

/**
 * Валидация настроек валидации перед сохранением
 */
function validateValidationSettings(settings: any): string[] {
  const errors: string[] = [];

  // Обязательные поля
  if (!settings.organizationId) {
    errors.push("Organization ID is required");
  }

  if (typeof settings.manualValidationNeeded !== 'boolean') {
    errors.push("Manual validation flag must be a boolean value");
  }

  // Валидация для случая ручной валидации
  if (settings.manualValidationNeeded) {
    if (!settings.validationAssignment) {
      errors.push("Validation assignment type is required when manual validation is enabled");
    }

    const validAssignmentTypes = ['by_office', 'by_document', 'by_department', 'by_employee'];
    if (settings.validationAssignment && !validAssignmentTypes.includes(settings.validationAssignment)) {
      errors.push(`Invalid validation assignment type. Must be one of: ${validAssignmentTypes.join(', ')}`);
    }

    // Валидация конкретных типов назначения
    switch (settings.validationAssignment) {
      case 'by_office':
        if (!Array.isArray(settings.validatorsByOffice) || settings.validatorsByOffice.length === 0) {
          errors.push("At least one office validator must be specified");
        } else {
          // Проверка каждого валидатора офиса
          settings.validatorsByOffice.forEach((validator: any, index: number) => {
            if (!validator.officeId) {
              errors.push(`Office validator ${index + 1}: Office ID is required`);
            }
            if (!validator.officeName) {
              errors.push(`Office validator ${index + 1}: Office name is required`);
            }
            if (!Array.isArray(validator.validatorIds) || validator.validatorIds.length === 0) {
              errors.push(`Office validator ${index + 1}: At least one validator must be assigned`);
            }
          });
        }
        break;

      case 'by_document':
        if (!Array.isArray(settings.validatorsByDocument) || settings.validatorsByDocument.length === 0) {
          errors.push("At least one document type validator must be specified");
        } else {
          settings.validatorsByDocument.forEach((validator: any, index: number) => {
            if (!validator.documentTypeId) {
              errors.push(`Document validator ${index + 1}: Document type ID is required`);
            }
            if (!validator.documentTypeName) {
              errors.push(`Document validator ${index + 1}: Document type name is required`);
            }
            if (!Array.isArray(validator.validatorIds) || validator.validatorIds.length === 0) {
              errors.push(`Document validator ${index + 1}: At least one validator must be assigned`);
            }
          });
        }
        break;

      case 'by_department':
        if (!Array.isArray(settings.validatorsByDepartment) || settings.validatorsByDepartment.length === 0) {
          errors.push("At least one department validator must be specified");
        } else {
          settings.validatorsByDepartment.forEach((validator: any, index: number) => {
            if (!validator.departmentId) {
              errors.push(`Department validator ${index + 1}: Department ID is required`);
            }
            if (!validator.departmentName) {
              errors.push(`Department validator ${index + 1}: Department name is required`);
            }
            if (!Array.isArray(validator.validatorIds) || validator.validatorIds.length === 0) {
              errors.push(`Department validator ${index + 1}: At least one validator must be assigned`);
            }
          });
        }
        break;

      case 'by_employee':
        if (!Array.isArray(settings.validatorsByEmployee) || settings.validatorsByEmployee.length === 0) {
          errors.push("At least one employee validator must be specified");
        } else {
          settings.validatorsByEmployee.forEach((validator: any, index: number) => {
            if (!validator.userId) {
              errors.push(`Employee validator ${index + 1}: User ID is required`);
            }
            if (!validator.userName) {
              errors.push(`Employee validator ${index + 1}: User name is required`);
            }
            if (!validator.email || !validator.email.includes('@')) {
              errors.push(`Employee validator ${index + 1}: Valid email address is required`);
            }
          });
        }
        break;
    }
  }

  return errors;
}

/**
 * Логирование изменений настроек валидации для аудита
 */
async function logValidationSettingsChange(
  container: any,
  organizationId: string,
  userId: string,
  oldSettings: any,
  newSettings: any,
  context: InvocationContext
): Promise<void> {
  try {
    const auditLogId = `validation-audit-${organizationId}-${Date.now()}`;
    
    const auditLog = {
      id: auditLogId,
      type: 'validation-settings-change',
      organizationId: organizationId,
      userId: userId,
      timestamp: new Date().toISOString(),
      changes: {
        manualValidationChanged: oldSettings?.manualValidationNeeded !== newSettings.manualValidationNeeded,
        assignmentTypeChanged: oldSettings?.validationAssignment !== newSettings.validationAssignment,
        validatorsChanged: {
          offices: (oldSettings?.validatorsByOffice?.length || 0) !== (newSettings.validatorsByOffice?.length || 0),
          documents: (oldSettings?.validatorsByDocument?.length || 0) !== (newSettings.validatorsByDocument?.length || 0),
          departments: (oldSettings?.validatorsByDepartment?.length || 0) !== (newSettings.validatorsByDepartment?.length || 0),
          employees: (oldSettings?.validatorsByEmployee?.length || 0) !== (newSettings.validatorsByEmployee?.length || 0)
        }
      },
      previousSettings: oldSettings ? {
        manualValidationNeeded: oldSettings.manualValidationNeeded,
        validationAssignment: oldSettings.validationAssignment
      } : null,
      newSettings: {
        manualValidationNeeded: newSettings.manualValidationNeeded,
        validationAssignment: newSettings.validationAssignment
      }
    };

    await container.items.create(auditLog);
    context.log(`Audit log created: ${auditLogId}`);
    
  } catch (error: any) {
    context.error('Error creating audit log:', error);
    // Не бросаем ошибку, чтобы не нарушить основной процесс сохранения
  }
}
