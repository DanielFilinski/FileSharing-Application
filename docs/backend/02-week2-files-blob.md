# НЕДЕЛЯ 2: ФАЙЛЫ + AZURE BLOB STORAGE

Статус: 0% — интеграция Blob/Cosmos не реализована

## API (HTTP Triggers)

- POST `/api/documents/upload` — валидация, загрузка в Blob, запись метаданных в Cosmos
- GET `/api/documents/{id}/download` — выдача SAS/стрим
- PUT `/api/documents/{id}` — обновление метаданных
- DELETE `/api/documents/{id}` — soft delete

## Схема документа (Cosmos)

```json
{
  "id": "doc-uuid",
  "name": "document.pdf",
  "blobUrl": "https://...",
  "metadata": {
    "category": "Business",
    "status": "Draft",
    "createdBy": "user-id",
    "createdAt": "2025-01-01"
  }
}
```

## Скетч функции загрузки (TS)

```ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadDocument(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const form = await req.formData();
  const file = form.get("file") as unknown as File;
  if (!file) return { status: 400, jsonBody: { error: "file is required" } };

  // TODO: валидация, категории, автор из токена
  const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
  const container = blobService.getContainerClient(process.env.DOCS_CONTAINER || "documents");
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(file.name);
  await blob.uploadData(Buffer.from(await file.arrayBuffer()), { blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" } });

  // TODO: запись в Cosmos DB
  return { status: 201, jsonBody: { name: file.name, url: blob.url } };
}

app.http("documents-upload", { methods: ["POST"], authLevel: "function", handler: uploadDocument });
```


