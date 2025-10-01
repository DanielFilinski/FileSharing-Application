# End-to-End Encryption (E2EE) Module

Модуль для реализации end-to-end шифрования сообщений в chat системе приложения FileSharing.

## Обзор

Модуль обеспечивает полное end-to-end шифрование сообщений чата с использованием современных криптографических алгоритмов:

- **AES-GCM (256-bit)** - для шифрования сообщений
- **RSA-OAEP (2048-bit)** - для обмена сессионными ключами
- **IndexedDB** - для безопасного хранения ключей на стороне клиента
- **Web Crypto API** - встроенный браузерный API для криптографических операций

## Архитектура

```
┌─────────────────────────────────────────────────┐
│              E2EE Manager                        │
│  (Высокоуровневый API для приложения)            │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
┌────────▼──────┐  ┌──────▼─────────┐
│ E2EE Crypto   │  │  Key Mgmt      │
│ Service       │  │  Service       │
│ (Web Crypto)  │  │  (IndexedDB)   │
└───────────────┘  └────────────────┘
         │                │
         └────────┬───────┘
                  │
        ┌─────────▼──────────┐
        │ Key Rotation       │
        │ Service            │
        └────────────────────┘
```

## Основные компоненты

### 1. E2EECryptoService
Отвечает за криптографические операции:
- Генерация ключевых пар (RSA)
- Генерация сессионных ключей (AES)
- Шифрование/расшифровка сообщений
- Обмен ключами

### 2. KeyManagementService
Управляет хранением ключей:
- Хранение в IndexedDB
- Извлечение ключей
- Управление публичными ключами других пользователей
- Очистка устаревших ключей

### 3. E2EEManager
Координирует работу всех сервисов:
- Инициализация E2EE для пользователя
- Включение E2EE для чата
- Шифрование/расшифровка сообщений
- Управление статусом E2EE

### 4. KeyRotationService
Автоматическая ротация ключей:
- Планирование ротации
- Автоматическая ротация по расписанию
- Принудительная ротация

## Использование

### Базовая инициализация

```typescript
import { e2eeManager } from '@/shared/lib/encryption';

// Инициализация E2EE для пользователя
const initResult = await e2eeManager.initializeForUser('user123');

if (initResult.success) {
  console.log('E2EE initialized:', initResult.publicKeyJWK);
}
```

### Включение E2EE для чата

```typescript
// Включить E2EE для конкретного чата
const status = await e2eeManager.enableForChat(
  'chat-doc-123',
  ['user1', 'user2', 'user3'] // ID участников
);

console.log('E2EE Status:', status);
```

### Шифрование сообщения

```typescript
// Зашифровать сообщение
const result = await e2eeManager.encryptMessage(
  'chat-doc-123',
  'Привет, это секретное сообщение!'
);

if (result.success && result.encrypted) {
  // Отправить зашифрованное сообщение на сервер
  const encryptedMessage = result.encrypted;
  console.log('Encrypted:', encryptedMessage);
}
```

### Расшифровка сообщения

```typescript
// Расшифровать сообщение
const decryptResult = await e2eeManager.decryptMessage(
  'chat-doc-123',
  encryptedMessage
);

if (decryptResult.success && decryptResult.plaintext) {
  console.log('Decrypted:', decryptResult.plaintext);
}
```

### Использование с React Hook

```typescript
import { useE2EEChat } from '@/shared/hooks/useE2EEChat';

function ChatComponent({ chatId, userId }) {
  const {
    isE2EEEnabled,
    isInitializing,
    encryptMessage,
    decryptMessage,
    enableE2EE,
  } = useE2EEChat({
    chatId,
    userId,
    enabled: true,
  });

  const handleSendMessage = async (text: string) => {
    const encrypted = await encryptMessage(text);
    
    if (encrypted) {
      // Отправить зашифрованное сообщение
      await sendToServer(encrypted);
    }
  };

  return (
    <div>
      {isE2EEEnabled && <LockIcon />}
      {/* UI компоненты */}
    </div>
  );
}
```

### Ротация ключей

```typescript
import { keyRotationService } from '@/shared/lib/encryption';

// Запустить автоматическую ротацию
keyRotationService.start();

// Запланировать ротацию для чата (каждые 30 дней)
keyRotationService.scheduleRotation('chat-doc-123', 30, true);

// Принудительная ротация
const result = await keyRotationService.forceRotation('chat-doc-123');
console.log('Rotation result:', result);

// Остановить сервис
keyRotationService.stop();
```

## API Reference

### E2EEManager

#### `initializeForUser(userId: string): Promise<E2EEInitResult>`
Инициализирует E2EE для пользователя, генерирует или восстанавливает ключевую пару.

#### `enableForChat(chatId: string, participantIds: string[]): Promise<E2EEStatus>`
Включает E2EE для конкретного чата.

#### `encryptMessage(chatId: string, plaintext: string): Promise<EncryptionResult>`
Шифрует сообщение для чата.

#### `decryptMessage(chatId: string, encrypted: EncryptedMessage): Promise<DecryptionResult>`
Расшифровывает сообщение из чата.

#### `shareSessionKey(chatId: string, recipientUserId: string): Promise<EncryptedSessionKey | null>`
Делится сессионным ключом с новым участником.

### KeyRotationService

#### `start(): void`
Запускает сервис автоматической ротации ключей.

#### `stop(): void`
Останавливает сервис.

#### `scheduleRotation(chatId: string, intervalDays?: number, autoRotate?: boolean): KeyRotationSchedule`
Планирует ротацию ключа для чата.

#### `forceRotation(chatId: string): Promise<KeyRotationResult>`
Принудительно выполняет ротацию ключа.

## Безопасность

### Хранение ключей

- **Приватные ключи** хранятся только в IndexedDB клиента и никогда не передаются на сервер
- **Публичные ключи** хранятся на сервере для обмена между пользователями
- **Сессионные ключи** шифруются публичным ключом получателя перед передачей

### Алгоритмы

- **AES-GCM-256**: Authenticated encryption для сообщений
- **RSA-OAEP-2048**: Асимметричное шифрование для обмена ключами
- **SHA-256**: Хеширование для ключевых операций

### Рекомендации

1. **Ротация ключей**: Регулярно ротируйте сессионные ключи (рекомендуется каждые 30 дней)
2. **Проверка браузера**: Проверяйте поддержку Web Crypto API перед использованием
3. **Обработка ошибок**: Всегда обрабатывайте ошибки шифрования/расшифровки
4. **Очистка**: Очищайте ключи при выходе пользователя

## Backend Integration

Модуль интегрируется с backend через следующие endpoints:

### POST `/api/e2ee/keys/public`
Сохранение публичного ключа пользователя.

### GET `/api/e2ee/keys/public/{userId}`
Получение публичного ключа пользователя.

### POST `/api/e2ee/keys/public/batch`
Получение публичных ключей нескольких пользователей.

### POST `/api/e2ee/keys/session/share`
Передача зашифрованного сессионного ключа другому пользователю.

### GET `/api/e2ee/keys/session/shared`
Получение зашифрованных сессионных ключей для текущего пользователя.

## Требования браузера

- Web Crypto API (window.crypto.subtle)
- IndexedDB
- Поддержка AES-GCM
- Поддержка RSA-OAEP
- ES2020+

### Поддерживаемые браузеры

- ✅ Chrome 60+
- ✅ Firefox 65+
- ✅ Safari 11.1+
- ✅ Edge 79+

## Troubleshooting

### "Browser not supported"
Убедитесь, что браузер поддерживает Web Crypto API. Проверьте:
```typescript
if (!window.crypto || !window.crypto.subtle) {
  console.error('Web Crypto API not supported');
}
```

### "Session key not found"
Сессионный ключ для чата не найден. Убедитесь, что E2EE включен для чата:
```typescript
await e2eeManager.enableForChat(chatId, participantIds);
```

### "Decryption failed"
Возможные причины:
1. Неверный сессионный ключ
2. Сообщение зашифровано другим ключом
3. Поврежденные данные

Решение:
```typescript
// Попробуйте получить актуальный сессионный ключ
const status = await e2eeManager.enableForChat(chatId, participantIds);
```

## Тестирование

```typescript
import { E2EECryptoService } from '@/shared/lib/encryption';

// Проверка поддержки
const capabilities = await E2EECryptoService.checkCapabilities();
console.log('Supported:', capabilities.supported);
console.log('Algorithms:', capabilities.algorithms);

// Тест шифрования
const service = new E2EECryptoService();
const sessionKey = await service.generateSessionKey();
const encrypted = await service.encryptMessage('Test message', sessionKey.key);
const decrypted = await service.decryptMessage(encrypted.encrypted!, sessionKey.key);
console.assert(decrypted.plaintext === 'Test message');
```

## Производительность

- Генерация RSA ключа: ~2-5 секунд
- Генерация AES ключа: ~10-50 мс
- Шифрование сообщения: ~1-10 мс
- Расшифровка сообщения: ~1-10 мс

## Лицензия

Proprietary - FileSharing Application

## Авторы

Разработано командой FileSharing для Microsoft Teams App.

## Дополнительные ресурсы

- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM Specification](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [RSA-OAEP Specification](https://tools.ietf.org/html/rfc3447)

