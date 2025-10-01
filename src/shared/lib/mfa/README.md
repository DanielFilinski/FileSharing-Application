# Multi-Factor Authentication (MFA) Module

Полная система двухфакторной аутентификации для FileSharing Application.

## Обзор

Модуль предоставляет комплексное решение для MFA с поддержкой:
- **TOTP** (Time-based OTP) - Google/Microsoft Authenticator
- **SMS OTP** - верификация через SMS
- **Email OTP** - верификация через email
- **Backup Codes** - резервные коды для восстановления доступа

## Архитектура

```
┌─────────────────────────────────────────┐
│          MFA Manager                     │
│   (Главный координатор)                 │
└────────┬──────────────┬─────────────────┘
         │              │
    ┌────▼────┐    ┌────▼────┐
    │  TOTP   │    │   OTP   │
    │ Service │    │ Service │
    └─────────┘    └─────────┘
         │              │
         └──────┬───────┘
                │
        ┌───────▼────────┐
        │  Key Storage   │
        │   (Cosmos DB)  │
        └────────────────┘
```

## Компоненты

### Frontend Services

**`totpService.ts`** - TOTP операции
- Генерация Base32 секретов
- Создание QR кодов
- Генерация/верификация 6-значных кодов
- Генерация backup кодов

**`otpService.ts`** - OTP для SMS/Email
- Генерация временных кодов
- Управление жизненным циклом OTP
- Ограничение попыток
- Автоматическая очистка

**`mfaManager.ts`** - Главный менеджер
- Управление настройками пользователей
- Координация всех методов
- Верификация кодов
- Блокировка аккаунтов

### Backend API

**`api/src/functions/mfa.ts`** - Azure Functions:
- `POST /api/mfa/totp/setup` - настройка TOTP
- `POST /api/mfa/totp/verify-setup` - верификация настройки
- `POST /api/mfa/verify` - верификация при входе
- `GET /api/mfa/settings/{userId}` - получение настроек

### React Components

**`MFASettings.tsx`** - Главная страница настроек
**`TOTPSetup.tsx`** - Диалог настройки TOTP
**`MFAVerification.tsx`** - Компонент верификации при входе
**`BackupCodesDialog.tsx`** - Отображение backup кодов

### React Hook

**`useMFA.ts`** - Hook для управления MFA в React компонентах

## Использование

### Базовая настройка

```typescript
import { useMFA } from '@/shared/hooks/useMFA';
import { MFASettings } from '@/components/MFA';

function SecuritySettings() {
  const userId = 'user123';
  const userEmail = 'user@example.com';

  return <MFASettings userId={userId} userEmail={userEmail} />;
}
```

### Настройка TOTP

```typescript
const {
  setupTOTP,
  verifyTOTPSetup,
  totpSetupData,
} = useMFA({ userId: 'user123' });

// Инициировать настройку
const setupData = await setupTOTP('user@example.com');
console.log('QR Code:', setupData.qrCodeUrl);
console.log('Secret:', setupData.secret);
console.log('Backup Codes:', setupData.backupCodes);

// Верифицировать код из приложения
const verified = await verifyTOTPSetup('123456');
if (verified) {
  console.log('TOTP активирован!');
}
```

### Верификация при входе

```typescript
import { MFAVerification } from '@/components/MFA';

function LoginFlow() {
  const [showMFA, setShowMFA] = useState(false);
  const { verifyMFA } = useMFA({ userId: 'user123' });

  const handleMFAVerify = async (method, code) => {
    const result = await verifyMFA(method, code);
    
    if (result.verified) {
      // Успешный вход - сохранить sessionToken
      localStorage.setItem('mfa_token', result.sessionToken);
      return result;
    }
    
    return result;
  };

  return (
    <MFAVerification
      isOpen={showMFA}
      method="totp"
      availableMethods={['totp', 'backup_code']}
      onVerify={handleMFAVerify}
      onSuccess={(token) => {
        console.log('MFA успешно пройдена:', token);
        setShowMFA(false);
      }}
    />
  );
}
```

### Генерация Backup Codes

```typescript
const { generateBackupCodes, backupCodes } = useMFA({ userId: 'user123' });

// Сгенерировать новые коды
const codes = await generateBackupCodes();
console.log('Backup codes:', codes.codes);

// Показать пользователю
<BackupCodesDialog
  isOpen={true}
  backupCodes={backupCodes}
  onClose={() => {}}
/>
```

## API Reference

### MFAManager

#### `setupTOTP(userId: string, userEmail: string): Promise<TOTPSetupData>`
Создает TOTP секрет и возвращает QR код

#### `verifyTOTPSetup(userId: string, code: string): Promise<boolean>`
Верифицирует код при первоначальной настройке

#### `verifyMFA(request: MFAVerificationRequest): Promise<MFAVerificationResult>`
Верифицирует MFA код при входе

#### `generateBackupCodes(userId: string): Promise<BackupCodesResult>`
Генерирует 10 резервных кодов

### useMFA Hook

```typescript
const {
  // State
  settings,              // Настройки пользователя
  isLoading,            // Загрузка
  error,                // Ошибка
  
  // TOTP
  totpSetupData,        // Данные для настройки TOTP
  isSettingUpTOTP,      // Процесс настройки
  
  // Actions
  setupTOTP,            // Начать настройку TOTP
  verifyTOTPSetup,      // Верифицировать настройку
  verifyMFA,            // Верифицировать при входе
  generateBackupCodes,  // Сгенерировать backup коды
  disableMethod,        // Отключить метод
  
  // Utilities
  isMFAEnabled,         // MFA включена?
  hasMethod,            // Метод активен?
} = useMFA({ userId });
```

## Безопасность

### Хранение секретов
- TOTP секреты шифруются перед сохранением в БД
- Backup коды хешируются (SHA-256)
- OTP коды хешируются в памяти

### Защита от атак
- **Ограничение попыток**: 3 попытки перед блокировкой
- **Блокировка**: 15 минут после превышения лимита
- **Истечение OTP**: 5 минут для SMS/Email кодов
- **Time window**: ±30 секунд для TOTP

### Алгоритмы
- **TOTP**: RFC 6238 (HMAC-SHA1)
- **OTP**: Криптографически безопасные случайные числа
- **Backup Codes**: 8 символов (Base36)

## Настройки по умолчанию

```typescript
{
  totpIssuer: 'FileSharing',
  totpPeriod: 30,              // секунд
  totpDigits: 6,
  otpLength: 6,
  otpExpiry: 300,              // 5 минут
  maxAttempts: 3,
  lockoutDuration: 900,        // 15 минут
  backupCodesCount: 10,
}
```

## Типы ошибок

```typescript
enum MFAErrorType {
  INVALID_CODE,              // Неверный код
  EXPIRED_CODE,              // Код истек
  TOO_MANY_ATTEMPTS,         // Слишком много попыток
  ACCOUNT_LOCKED,            // Аккаунт заблокирован
  METHOD_NOT_ENABLED,        // Метод не включен
  SETUP_INCOMPLETE,          // Настройка не завершена
  SEND_FAILED,               // Не удалось отправить
}
```

## Интеграция с Settings

Добавить в страницу настроек безопасности:

```typescript
import { MFASettings } from '@/components/MFA';

<SettingsSection title="Security">
  <MFASettings 
    userId={currentUser.id} 
    userEmail={currentUser.email} 
  />
</SettingsSection>
```

## Тестирование

### Проверка TOTP генерации
```typescript
import { totpService } from '@/shared/lib/mfa';

const secret = totpService.generateSecret();
const code = await totpService.generateTOTP(secret);
const verified = await totpService.verifyTOTP(secret, code);
console.assert(verified === true);
```

### Проверка OTP
```typescript
import { otpService } from '@/shared/lib/mfa';

const { code, record } = await otpService.createOTP('user123', 'sms');
const result = await otpService.verifyOTP('user123', code, 'sms');
console.assert(result.verified === true);
```

## Требования

- React 18+
- @fluentui/react-components
- Azure Functions v4
- Cosmos DB

## Совместимость

- ✅ Google Authenticator
- ✅ Microsoft Authenticator
- ✅ Authy
- ✅ 1Password
- ✅ Любое TOTP-совместимое приложение

## Roadmap

- [ ] SMS интеграция (Azure Communication Services)
- [ ] Email интеграция (SendGrid/Azure)
- [ ] WebAuthn/FIDO2 поддержка
- [ ] Биометрическая аутентификация
- [ ] Recovery через email
- [ ] Trusted devices

## Лицензия

Proprietary - FileSharing Application

## Поддержка

При возникновении проблем обратитесь к команде разработки FileSharing.

