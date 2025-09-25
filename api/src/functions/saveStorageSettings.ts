import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import config from "../config";
import { getContainer } from "../shared/db/cosmos";

/**
 * Saves storage configuration settings to the database
 * Handles both initial setup and updates to existing settings
 */
export async function saveStorageSettings(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Save storage settings function processed a request.");

  // Check request method
  if (req.method !== "POST") {
    return {
      status: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check authorization token
  const accessToken: string = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!accessToken) {
    return {
      status: 401,
      body: JSON.stringify({ error: "No access token provided" }),
    };
  }

  // Initialize authentication
  const oboAuthConfig: OnBehalfOfCredentialAuthConfig = {
    authorityHost: config.authorityHost,
    clientId: config.clientId,
    tenantId: config.tenantId,
    clientSecret: config.clientSecret,
  };

  let oboCredential: OnBehalfOfUserCredential;
  let userInfo: any;

  try {
    oboCredential = new OnBehalfOfUserCredential(accessToken, oboAuthConfig);
    userInfo = await oboCredential.getUserInfo();
    context.log(`User ${userInfo.displayName} is saving storage settings`);
  } catch (e) {
    context.error(e);
    return {
      status: 401,
      body: JSON.stringify({ error: "Invalid access token" }),
    };
  }

  try {
    // Parse request body
    const settings = await req.json();

    // Validate required fields
    const validationErrors = validateStorageSettings(settings);
    if (validationErrors.length > 0) {
      return {
        status: 400,
        body: JSON.stringify({ 
          error: "Validation failed",
          errors: validationErrors,
          success: false
        }),
      };
    }

    // Get database container
    const container = await getContainer();

    // Generate settings document ID
    const organizationId = settings.organizationId || userInfo.tid;
    const settingsId = `storage-settings-${organizationId}`;

    // Check if settings already exist
    let existingSettings = null;
    try {
      const response = await container.item(settingsId, settingsId).read();
      existingSettings = response.resource;
    } catch (error: any) {
      // Document doesn't exist, will create new
      context.log("No existing settings found, creating new document");
    }

    // Prepare settings document
    const settingsDocument = {
      id: settingsId,
      type: "storage-settings",
      organizationId,
      userId: userInfo.oid,
      userName: userInfo.displayName,
      
      // Storage configuration
      storageType: settings.storageType,
      
      // Cloud storage settings
      ...(settings.storageType === 'cloud' && {
        sharePointSettings: {
          email: settings.sharePointEmail,
          // Note: Don't store password in plain text in production
          // Use Azure Key Vault or similar secure storage
          connectionVerified: settings.connectionStatus === 'established',
          lastVerified: settings.connectionStatus === 'established' ? new Date().toISOString() : null
        }
      }),
      
      // Physical storage settings
      ...(settings.storageType === 'physical' && {
        physicalSettings: {
          deviceType: settings.deviceType,
          selectedDeviceId: settings.selectedDeviceId,
          deviceName: settings.selectedDeviceName
        }
      }),
      
      // Storage allocation
      storageAllocation: {
        amount: parseInt(settings.storageAmount),
        unit: settings.storageUnit,
        totalBytes: calculateTotalBytes(settings.storageAmount, settings.storageUnit),
        dmsAllocation: Math.floor(parseInt(settings.storageAmount) / 2),
        portalAllocation: Math.floor(parseInt(settings.storageAmount) / 2)
      },
      
      // Data retention policy
      dataRetention: {
        period: settings.retentionPeriod,
        unit: settings.retentionUnit,
        customPeriod: settings.customRetentionPeriod,
        autoDeleteEnabled: true
      },
      
      // Folder structure configuration
      folderStructure: {
        firmType: settings.firmType,
        selectedTemplate: settings.selectedTemplate,
        timeStructure: settings.timeStructure,
        clientTypes: settings.clientTypes,
        binderStructure: settings.binderStructure,
        customStructure: settings.customStructure
      },
      
      // Metadata
      version: existingSettings ? (existingSettings.version || 1) + 1 : 1,
      createdAt: existingSettings?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: existingSettings?.createdBy || userInfo.oid,
      updatedBy: userInfo.oid,
      
      // Settings state
      isSetupComplete: true,
      isActive: true
    };

    // Save settings to database
    await container.items.upsert(settingsDocument);

    context.log(`Storage settings saved for organization ${organizationId} by ${userInfo.displayName}`);

    // Return success response
    return {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        message: "Storage settings saved successfully",
        settingsId,
        version: settingsDocument.version,
        updatedAt: settingsDocument.updatedAt
      }),
    };

  } catch (error: any) {
    context.error(`Save storage settings error: ${error.message}`);
    return {
      status: 500,
      body: JSON.stringify({ 
        success: false,
        error: "Internal server error while saving settings" 
      }),
    };
  }
}

/**
 * Validates storage settings before saving
 */
function validateStorageSettings(settings: any): string[] {
  const errors: string[] = [];

  // Validate storage type
  if (!settings.storageType || !['cloud', 'physical'].includes(settings.storageType)) {
    errors.push("Storage type must be either 'cloud' or 'physical'");
  }

  // Validate cloud storage settings
  if (settings.storageType === 'cloud') {
    if (!settings.sharePointEmail || !settings.sharePointEmail.includes('@')) {
      errors.push("Valid SharePoint email is required for cloud storage");
    }
    if (settings.connectionStatus !== 'established') {
      errors.push("SharePoint connection must be verified before saving");
    }
  }

  // Validate physical storage settings
  if (settings.storageType === 'physical') {
    if (!settings.deviceType || !['current', 'network'].includes(settings.deviceType)) {
      errors.push("Device type must be specified for physical storage");
    }
  }

  // Validate storage allocation
  if (!settings.storageAmount || parseInt(settings.storageAmount) <= 0) {
    errors.push("Storage amount must be a positive number");
  }

  if (!settings.storageUnit || !['MB', 'GB'].includes(settings.storageUnit)) {
    errors.push("Storage unit must be either 'MB' or 'GB'");
  }

  // Validate retention settings
  if (!settings.retentionPeriod) {
    errors.push("Data retention period is required");
  }

  if (!settings.retentionUnit || !['days', 'months', 'years'].includes(settings.retentionUnit)) {
    errors.push("Retention unit must be 'days', 'months', or 'years'");
  }

  return errors;
}

/**
 * Calculates total bytes from amount and unit
 */
function calculateTotalBytes(amount: string | number, unit: string): number {
  const amountNumber = typeof amount === 'string' ? parseInt(amount) : amount;
  const multiplier = unit.toUpperCase() === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024;
  return amountNumber * multiplier;
}

app.http("saveStorageSettings", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: saveStorageSettings,
});
