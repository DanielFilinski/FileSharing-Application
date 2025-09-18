# НЕДЕЛЯ 7: ФРОНТ ИНТЕГРАЦИЯ + ОПТИМИЗАЦИЯ

Статус: 0% — тюнинг/кэш/прогрев отсутствуют

## Оптимизации Functions

- [ ] Прогрев (Timer Trigger) для снижения cold start
- [ ] Снижение зависимостей, ленивые импорты SDK
- [ ] Кэш Redis для частых запросов (например, `GET /api/documents`)

## Пример таймера прогрева

```ts
import { app, InvocationContext, Timer } from "@azure/functions";

export async function warmup(_timer: Timer, _ctx: InvocationContext): Promise<void> {
  // Можно дернуть локальные зависимости, прогреть JIT/HTTP-клиенты
}

app.timer("warmup", { schedule: "0 */5 * * * *" }, warmup);
```

## Пример кэша (ioredis)

```ts
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_CONNECTION_STRING!);

export async function getCached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);
  const val = await loader();
  await redis.set(key, JSON.stringify(val), "EX", ttlSeconds);
  return val;
}
```


