import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import config from "../config";
import { getContainer } from "../shared/db/cosmos";

export async function saveOneDriveDocument(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Save OneDrive document metadata function processed a request.");

  if (req.method !== "POST") {
    return {
      status: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const accessToken: string = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!accessToken) {
    return {
      status: 401,
      body: JSON.stringify({ error: "No access token provided" }),
    };
  }

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
    context.log(`User ${userInfo.displayName} is saving OneDrive document metadata`);
  } catch (e) {
    context.error(e);
    return {
      status: 401,
      body: JSON.stringify({ error: "Invalid access token" }),
    };
  }

  try {
    const documentData = await req.json();
    const container = getContainer('documents');
    
    // Создаем документ с метаданными OneDrive файла
    const document = {
      id: documentData.oneDriveId || `onedrive_${Date.now()}`,
      partitionKey: userInfo.tenantId || 'default',
      name: documentData.name,
      fileName: documentData.name,
      fileSize: documentData.size || 0,
      mimeType: getMimeTypeFromFileName(documentData.name),
      
      // OneDrive specific fields - файл хранится в OneDrive пользователя
      blobUrl: documentData.webUrl, // Используем webUrl как blobUrl для совместимости
      oneDriveId: documentData.oneDriveId,
      oneDriveWebUrl: documentData.webUrl,
      oneDriveDownloadUrl: documentData.downloadUrl,
      uploadSource: documentData.source, // 'device', 'cloud', 'portal'
      
      status: 'draft',
      category: documentData.metadata?.documentType || '',
      tags: documentData.metadata?.documentSubtype ? [documentData.metadata.documentSubtype] : [],
      
      metadata: {
        createdBy: userInfo.displayName,
        createdAt: new Date().toISOString(),
        modifiedBy: userInfo.displayName,
        modifiedAt: new Date().toISOString(),
        userId: userInfo.objectId,
        
        // Metadata from upload form
        documentType: documentData.metadata?.documentType,
        documentSubtype: documentData.metadata?.documentSubtype,
        period: documentData.metadata?.period,
        startDate: documentData.metadata?.startDate,
        endDate: documentData.metadata?.endDate,
        description: documentData.metadata?.description,
        
        // Default values
        priority: 'low' as const,
        isLocked: false,
        version: 1,
        
        // Original source info (if uploaded from cloud/portal)
        originalUrl: documentData.originalUrl,
        originalFileId: documentData.originalFileId
      },
      
      permissions: {
        owners: [userInfo.objectId],
        viewers: [],
        editors: [],
        approvers: []
      }
    };

    const { resource } = await container.items.create(document);
    
    context.log(`OneDrive document metadata saved: ${document.name}`);
    
    return {
      status: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "Document metadata saved successfully",
        document: resource 
      }),
    };
  } catch (error) {
    context.error("Error saving OneDrive document metadata:", error);
    return {
      status: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}

function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

app.http("saveOneDriveDocument", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: saveOneDriveDocument,
});
