# НЕДЕЛЯ 5: РЕАЛТАЙМ ЧАТ + AZURE SIGNALR SERVICE

Статус: 0% — SignalR не интегрирован

## Компоненты

- SignalR Service (hub: `documents`)
- Функция `negotiate` для выдачи токена клиенту
- HTTP для публикации сообщений + запись в CosmosDB

## Вариант A: Через bindings (предпочтительно)

Требуется расширение `Microsoft.Azure.WebJobs.Extensions.SignalRService` и соответствующие bindings.

```ts
// Псевдо-схема: negotiate
// В function.json: input binding signalRConnectionInfo, output binding $return (signalR)
// В v4-программной модели используйте generic input/output bindings
```

## Вариант B: Через REST API SignalR (без bindings)

```ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import crypto from "crypto";
import fetch from "node-fetch";

function buildAuthToken(url: string, key: string): string {
  const ttl = Math.floor(Date.now() / 1000) + 60;
  const hmac = crypto.createHmac("sha256", Buffer.from(key, "base64"));
  hmac.update(`${url}\n${ttl}`);
  const sig = encodeURIComponent(hmac.digest("base64"));
  return `SharedAccessSignature sr=${encodeURIComponent(url)}&sig=${sig}&se=${ttl}`;
}

export async function postMessage(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const body = await req.json();
  const hub = process.env.SIGNALR_HUB || "documents";
  const endpoint = process.env.SIGNALR_ENDPOINT!; // e.g. https://<name>.service.signalr.net
  const key = process.env.SIGNALR_ACCESS_KEY!;
  const url = `${endpoint}/api/v1/hubs/${hub}`;
  const auth = buildAuthToken(url, key);
  await fetch(`${url}/:send`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ target: "newMessage", arguments: [body] })
  });
  return { status: 202 };
}

app.http("chat-post", { methods: ["POST"], authLevel: "function", handler: postMessage });
```

## Задачи

- [ ] Деплой SignalR Service, задать `SINGLE_ENDPOINT`, `ACCESS_KEY`
- [ ] Реализовать `negotiate` (через binding или REST `/negotiate` конечную точку)
- [ ] Хранение истории сообщений в Cosmos (партиция по `documentId`)
- [ ] Сегментация по группам: `group=document:<id>`


