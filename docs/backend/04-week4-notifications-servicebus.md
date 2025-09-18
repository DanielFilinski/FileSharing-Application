# НЕДЕЛЯ 4: УВЕДОМЛЕНИЯ + AZURE SERVICE BUS

Статус: 0% — Service Bus/SendGrid/Teams интеграции отсутствуют

## Компоненты

- Очереди/топики Service Bus: `notifications-email`, `notifications-teams`, `notifications-push`
- Триггеры очередей для рассылки Email/Teams/Push
- Application Insights корреляция

## Поток событий (пример)

Upload завершён → HTTP-функция публикует событие в Service Bus → триггер читает сообщение → отправляет Email/Teams

## Публикация события (HTTP → Service Bus)

```ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ServiceBusClient } from "@azure/service-bus";

export async function publishNotification(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const body = await req.json();
  const bus = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
  const sender = bus.createSender(process.env.SB_QUEUE_EMAIL || "notifications-email");
  await sender.sendMessages({ body, contentType: "application/json" });
  await sender.close();
  await bus.close();
  return { status: 202, jsonBody: { queued: true } };
}

app.http("publish-notification", { methods: ["POST"], authLevel: "function", handler: publishNotification });
```

## Email обработчик (Service Bus Trigger → SendGrid)

```ts
import { app, InvocationContext } from "@azure/functions";
import sg from "@sendgrid/mail";

sg.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(message: unknown, ctx: InvocationContext): Promise<void> {
  const { to, subject, text, html } = (message as any) ?? {};
  if (!to) return;
  await sg.send({ to, from: process.env.SENDGRID_FROM!, subject, text, html });
}

app.serviceBusQueue("send-email", {
  connection: "SERVICEBUS_CONNECTION",
  queueName: process.env.SB_QUEUE_EMAIL || "notifications-email"
}, sendEmail);
```

## Задачи

- [ ] Деплой Service Bus namespace/queues (Bicep)
- [ ] Конфиг `SERVICEBUS_CONNECTION`, `SENDGRID_API_KEY`, `SENDGRID_FROM`
- [ ] Функции публикации и обработчики Email/Teams/Push
- [ ] Корреляция трейсинга в App Insights


