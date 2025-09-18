## Этап 9 — Система подписания документов

Статус: 0% выполнено

### Компоненты и страницы:
- **API подписания:** `/src/entities/signature/api/signatureApi.ts`
- **Хук подписания:** `/src/entities/signature/model/useSignature.ts`
- **Диалог подписи:** `/src/pages/documents/components/SignatureDialog.tsx`
- **Рисованная подпись:** `/src/pages/documents/components/SignatureDrawingCanvas.tsx`
- **Выбор метода:** `/src/pages/documents/components/SignatureMethodSelector.tsx`
- **Загрузка версии:** `/src/pages/documents/components/SignedVersionUpload.tsx`
- **Интеграция:** обновление страниц документов для подписания

- [ ] 4 метода аутентификации подписи
- [ ] Загрузка подписанной версии поверх оригинала
- [ ] Последовательное/одновременное подписание
- [ ] Временные метки и аудит подписей
- [ ] Защита подписанных документов

### Методы подписи из project.md:

#### Этап 4.3 Аутентификация и подписание
- **Электронная подпись:** Цифровые подписи на основе проверки электронной почты
- **Цифровой сертификат:** Подписи с использованием признанных центров сертификации  
- **Рисованная подпись:** Подписи, нарисованные прикосновением/мышью, с проверкой по метке времени
- **Одноразовый пароль:** проверочный код по SMS или электронной почте для утверждения подписи

### API для системы подписания
```typescript
// /src/entities/signature/api/signatureApi.ts
export const signatureApi = {
  // Определение требований к подписи
  async getSignatureRequirements(documentId: string): Promise<SignatureRequirements>,
  
  // Назначение подписывающих лиц
  async assignSigners(documentId: string): Promise<Signer[]>,
  async getPendingSignatures(userId: string): Promise<SignatureTask[]>,
  
  // Методы подписи
  async signWithEmail(documentId: string, email: string): Promise<SignatureResult>,
  async signWithCertificate(documentId: string, certificate: Certificate): Promise<SignatureResult>,
  async signWithDrawing(documentId: string, signatureData: SignatureDrawing): Promise<SignatureResult>,
  async signWithOTP(documentId: string, otp: string): Promise<SignatureResult>,
  
  // Загрузка подписанной версии
  async uploadSignedVersion(documentId: string, signedFile: File): Promise<Document>,
  
  // Проверка и завершение
  async verifySignature(signatureId: string): Promise<VerificationResult>,
  async completeSigningProcess(documentId: string): Promise<void>
};
```

### Хуки для подписания
```typescript
// /src/entities/signature/model/useSignature.ts
export const useSignature = () => {
  // Управление подписями
  // Выбор метода подписи
  // Загрузка подписанных версий
  // Проверка статуса подписи
};
```

### Компоненты UI
```typescript
// /src/pages/documents/components/SignatureDialog.tsx
// /src/pages/documents/components/SignatureDrawingCanvas.tsx
// /src/pages/documents/components/SignatureMethodSelector.tsx
// /src/pages/documents/components/SignedVersionUpload.tsx
```

Источник: детали подписания — `project.md` раздел 3.5.
