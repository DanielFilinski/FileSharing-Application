import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import config from "../config";

export async function uploadToOneDrive(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Upload to OneDrive function processed a request.");

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
  let graphClient: Client;

  try {
    oboCredential = new OnBehalfOfUserCredential(accessToken, oboAuthConfig);
    const userInfo = await oboCredential.getUserInfo();
    context.log(`User ${userInfo.displayName} is uploading files to OneDrive`);

    // Создаем Graph client с правами на файлы
    const authProvider = new TokenCredentialAuthenticationProvider(oboCredential, {
      scopes: ["https://graph.microsoft.com/Files.ReadWrite"],
    });

    graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });
  } catch (e) {
    context.error(e);
    return {
      status: 401,
      body: JSON.stringify({ error: "Invalid access token or insufficient permissions" }),
    };
  }

  try {
    const formData = await req.formData();
    const uploadType = formData.get("uploadType") as string; // 'device', 'cloud', 'portal'
    const metadata = JSON.parse(formData.get("metadata") as string || "{}");
    
    let uploadResults: any[] = [];

    if (uploadType === "device") {
      // Загрузка файлов с устройства
      const files = formData.getAll("files") as File[];
      
      for (const file of files) {
        const result = await uploadFileToOneDrive(graphClient, file, metadata, context);
        uploadResults.push(result);
      }
    } else if (uploadType === "cloud") {
      // Загрузка из облака (получаем URL файла)
      const fileUrl = formData.get("fileUrl") as string;
      const fileName = formData.get("fileName") as string;
      
      if (fileUrl && fileName) {
        const result = await uploadFromUrl(graphClient, fileUrl, fileName, metadata, context);
        uploadResults.push(result);
      }
    } else if (uploadType === "portal") {
      // Загрузка с портала Teams (получаем файл по ID)
      const fileId = formData.get("fileId") as string;
      const fileName = formData.get("fileName") as string;
      
      if (fileId && fileName) {
        const result = await uploadFromTeamsPortal(graphClient, fileId, fileName, metadata, context);
        uploadResults.push(result);
      }
    }

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Files uploaded successfully to OneDrive",
        results: uploadResults,
      }),
    };
  } catch (error) {
    context.error("Error uploading files to OneDrive:", error);
    return {
      status: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}

async function uploadFileToOneDrive(
  graphClient: Client,
  file: File,
  metadata: any,
  context: InvocationContext
): Promise<any> {
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const folderPath = `FileSharing-App/${metadata.documentType || 'General'}`;
    
    // Создаем папку если не существует
    try {
      await graphClient.api(`/me/drive/root:/${folderPath}`).get();
    } catch {
      // Папка не существует, создаем
      await graphClient.api('/me/drive/root/children').post({
        name: 'FileSharing-App',
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      });
      
      if (metadata.documentType && metadata.documentType !== 'General') {
        await graphClient.api('/me/drive/root:/FileSharing-App:/children').post({
          name: metadata.documentType,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        });
      }
    }

    // Загружаем файл
    let uploadResult;
    if (fileBuffer.length > 4 * 1024 * 1024) { // > 4MB - используем upload session
      uploadResult = await uploadLargeFile(graphClient, `${folderPath}/${fileName}`, fileBuffer);
    } else {
      // Простая загрузка для небольших файлов
      uploadResult = await graphClient
        .api(`/me/drive/root:/${folderPath}/${fileName}:/content`)
        .put(fileBuffer);
    }

    context.log(`File ${fileName} uploaded to OneDrive successfully`);

    return {
      id: uploadResult.id,
      name: uploadResult.name,
      size: uploadResult.size,
      webUrl: uploadResult.webUrl,
      downloadUrl: uploadResult['@microsoft.graph.downloadUrl'],
      createdDateTime: uploadResult.createdDateTime,
      metadata: metadata,
      source: 'device'
    };
  } catch (error) {
    context.error(`Error uploading file ${file.name}:`, error);
    throw error;
  }
}

async function uploadLargeFile(graphClient: Client, filePath: string, fileBuffer: Buffer): Promise<any> {
  // Создаем upload session для больших файлов
  const uploadSession = await graphClient
    .api(`/me/drive/root:/${filePath}:/createUploadSession`)
    .post({
      item: {
        '@microsoft.graph.conflictBehavior': 'rename'
      }
    });

  const uploadUrl = uploadSession.uploadUrl;
  const chunkSize = 320 * 1024; // 320KB chunks
  let uploadedBytes = 0;

  while (uploadedBytes < fileBuffer.length) {
    const chunk = fileBuffer.slice(uploadedBytes, Math.min(uploadedBytes + chunkSize, fileBuffer.length));
    const contentRange = `bytes ${uploadedBytes}-${uploadedBytes + chunk.length - 1}/${fileBuffer.length}`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': contentRange,
        'Content-Length': chunk.length.toString(),
      },
      body: chunk.buffer,
    });

    if (response.status === 201 || response.status === 200) {
      // Загрузка завершена
      return await response.json();
    } else if (response.status !== 202) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    uploadedBytes += chunk.length;
  }
}

async function uploadFromUrl(
  graphClient: Client,
  fileUrl: string,
  fileName: string,
  metadata: any,
  context: InvocationContext
): Promise<any> {
  try {
    // Скачиваем файл по URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
    }

    const fileBuffer = Buffer.from(await response.arrayBuffer());
    const folderPath = `FileSharing-App/${metadata.documentType || 'General'}`;

    // Загружаем в OneDrive
    let uploadResult;
    if (fileBuffer.length > 4 * 1024 * 1024) {
      uploadResult = await uploadLargeFile(graphClient, `${folderPath}/${fileName}`, fileBuffer);
    } else {
      uploadResult = await graphClient
        .api(`/me/drive/root:/${folderPath}/${fileName}:/content`)
        .put(fileBuffer);
    }

    context.log(`File ${fileName} uploaded from cloud URL to OneDrive successfully`);

    return {
      id: uploadResult.id,
      name: uploadResult.name,
      size: uploadResult.size,
      webUrl: uploadResult.webUrl,
      downloadUrl: uploadResult['@microsoft.graph.downloadUrl'],
      createdDateTime: uploadResult.createdDateTime,
      metadata: metadata,
      source: 'cloud',
      originalUrl: fileUrl
    };
  } catch (error) {
    context.error(`Error uploading file from URL ${fileUrl}:`, error);
    throw error;
  }
}

async function uploadFromTeamsPortal(
  graphClient: Client,
  fileId: string,
  fileName: string,
  metadata: any,
  context: InvocationContext
): Promise<any> {
  try {
    // Получаем файл из Teams/SharePoint по ID
    const fileContent = await graphClient.api(`/drives/{drive-id}/items/${fileId}/content`).get();
    const fileBuffer = Buffer.from(fileContent);
    const folderPath = `FileSharing-App/${metadata.documentType || 'General'}`;

    // Загружаем в OneDrive пользователя
    let uploadResult;
    if (fileBuffer.length > 4 * 1024 * 1024) {
      uploadResult = await uploadLargeFile(graphClient, `${folderPath}/${fileName}`, fileBuffer);
    } else {
      uploadResult = await graphClient
        .api(`/me/drive/root:/${folderPath}/${fileName}:/content`)
        .put(fileBuffer);
    }

    context.log(`File ${fileName} uploaded from Teams portal to OneDrive successfully`);

    return {
      id: uploadResult.id,
      name: uploadResult.name,
      size: uploadResult.size,
      webUrl: uploadResult.webUrl,
      downloadUrl: uploadResult['@microsoft.graph.downloadUrl'],
      createdDateTime: uploadResult.createdDateTime,
      metadata: metadata,
      source: 'portal',
      originalFileId: fileId
    };
  } catch (error) {
    context.error(`Error uploading file from Teams portal ${fileId}:`, error);
    throw error;
  }
}

app.http("uploadToOneDrive", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: uploadToOneDrive,
});
