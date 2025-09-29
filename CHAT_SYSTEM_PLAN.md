# Chat System Implementation Plan - Система чата для документов

## 📋 Анализ требований из PROGECT.md

### Ключевые требования:
- **CHAT-01**: Чаты специфичные для каждого документа
- **CHAT-03**: Возможность ссылаться и выделять конкретные разделы документа
- **CHAT-02**: Визуальное различение между Service Provider и End User сообщениями
- **CHAT-04**: Интеграция с этапами workflow документов
- **CHATS-02**: Комплексное логирование всех активностей сообщений для аудита

### Основная цель:
Создать систему чата где можно:
1. Обсуждать документ
2. Выделять фрагменты документа
3. Упоминать сноски и ссылки на эти фрагменты в чате

## 🏗️ Архитектура системы

### Backend Components:
1. **Chat Message Service** - управление сообщениями
2. **Document Fragment Service** - работа с фрагментами документов
3. **Real-time Communication** - WebSocket/SignalR для live updates
4. **Notification Service** - уведомления о новых сообщениях

### Frontend Components:
1. **Chat Widget** - основной интерфейс чата
2. **Document Fragment Selector** - выделение фрагментов документа
3. **Message Composer** - создание сообщений с упоминаниями
4. **Fragment Reference Display** - отображение ссылок на фрагменты

## 📊 Data Models

### Chat Message Model:
```typescript
interface ChatMessage {
  id: string;
  documentId: string;
  senderId: string;
  senderName: string;
  senderRole: 'service_provider' | 'end_user';
  content: string;
  messageType: 'text' | 'system' | 'fragment_reference';
  
  // Fragment references
  fragmentReferences?: DocumentFragment[];
  
  // Metadata
  timestamp: string;
  editedAt?: string;
  replyToMessageId?: string;
  
  // Status
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
}
```

### Document Fragment Model:
```typescript
interface DocumentFragment {
  id: string;
  documentId: string;
  
  // Selection details
  selectionType: 'text' | 'paragraph' | 'section' | 'page';
  startPosition: number;
  endPosition: number;
  selectedText: string;
  
  // Context
  pageNumber?: number;
  sectionTitle?: string;
  
  // Display
  highlightColor: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  
  // Reference info
  referenceTitle?: string;
  referenceDescription?: string;
}
```

### Chat Thread Model:
```typescript
interface ChatThread {
  id: string;
  documentId: string;
  documentName: string;
  
  // Participants
  participants: ChatParticipant[];
  
  // Status
  isActive: boolean;
  lastActivity: string;
  
  // Settings
  settings: {
    allowFragmentHighlighting: boolean;
    notificationsEnabled: boolean;
    retentionDays: number;
  };
}
```

## 🔧 Implementation Plan

### Phase 1: Core Infrastructure & Types
**Цель:** Создать основу системы чата

#### 1.1 Создать типы и интерфейсы
- [x] Определить TypeScript типы для чата
- [ ] Создать типы для фрагментов документов
- [ ] Определить API контракты

#### 1.2 Database Schema (CosmosDB)
```sql
-- Chat containers
chat-threads: partitionKey = /documentId
chat-messages: partitionKey = /threadId  
document-fragments: partitionKey = /documentId
chat-participants: partitionKey = /threadId
```

### Phase 2: Backend API Development
**Цель:** Реализовать серверную часть системы чата

#### 2.1 Chat Message API (Azure Functions)
- [ ] `POST /api/chat/threads/{threadId}/messages` - отправка сообщения
- [ ] `GET /api/chat/threads/{threadId}/messages` - получение сообщений
- [ ] `PUT /api/chat/messages/{messageId}` - редактирование сообщения
- [ ] `DELETE /api/chat/messages/{messageId}` - удаление сообщения

#### 2.2 Document Fragment API
- [ ] `POST /api/documents/{documentId}/fragments` - создание фрагмента
- [ ] `GET /api/documents/{documentId}/fragments` - получение фрагментов
- [ ] `PUT /api/fragments/{fragmentId}` - обновление фрагмента
- [ ] `DELETE /api/fragments/{fragmentId}` - удаление фрагмента

#### 2.3 Chat Thread Management API
- [ ] `POST /api/documents/{documentId}/chat` - создание чата для документа
- [ ] `GET /api/documents/{documentId}/chat` - получение чата документа
- [ ] `POST /api/chat/threads/{threadId}/participants` - добавление участников

### Phase 3: Real-time Communication
**Цель:** Обеспечить мгновенную доставку сообщений

#### 3.1 SignalR Integration
- [ ] Настроить Azure SignalR Service
- [ ] Создать Chat Hubs для real-time коммуникации
- [ ] Реализовать подписку на события чата

#### 3.2 Event Handlers
- [ ] `onMessageSent` - уведомления о новых сообщениях
- [ ] `onFragmentCreated` - уведомления о новых фрагментах
- [ ] `onParticipantJoined` - подключение участников

### Phase 4: Frontend Components
**Цель:** Создать пользовательский интерфейс

#### 4.1 Chat Widget Component
```typescript
// src/components/Chat/ChatWidget.tsx
interface ChatWidgetProps {
  documentId: string;
  currentUser: User;
  onFragmentSelect?: (fragment: DocumentFragment) => void;
}
```

**Функциональность:**
- [ ] Отображение списка сообщений
- [ ] Поле ввода нового сообщения
- [ ] Индикаторы typing/online статуса
- [ ] Поддержка emoji и форматирования

#### 4.2 Document Fragment Selector
```typescript
// src/components/Chat/FragmentSelector.tsx
interface FragmentSelectorProps {
  documentContent: string;
  existingFragments: DocumentFragment[];
  onFragmentCreate: (fragment: DocumentFragment) => void;
}
```

**Функциональность:**
- [ ] Выделение текста мышью
- [ ] Создание всплывающих подсказок для выделения
- [ ] Визуальное отображение существующих фрагментов
- [ ] Цветовое кодирование фрагментов

#### 4.3 Fragment Reference Component
```typescript
// src/components/Chat/FragmentReference.tsx
interface FragmentReferenceProps {
  fragment: DocumentFragment;
  onFragmentClick: (fragmentId: string) => void;
}
```

**Функциональность:**
- [ ] Отображение превью фрагмента в сообщении
- [ ] Ссылка для перехода к фрагменту в документе
- [ ] Контекстная информация (страница, раздел)

#### 4.4 Message Composer
```typescript
// src/components/Chat/MessageComposer.tsx
interface MessageComposerProps {
  onSendMessage: (message: string, fragments?: DocumentFragment[]) => void;
  availableFragments: DocumentFragment[];
}
```

**Функциональность:**
- [ ] Rich text editor с поддержкой @mentions фрагментов
- [ ] Автокомплит для ссылок на фрагменты
- [ ] Превью сообщения перед отправкой
- [ ] Drag & drop для файлов

### Phase 5: Document Integration
**Цель:** Интегрировать чат с системой документооборота

#### 5.1 Document Viewer Integration
- [ ] Добавить кнопку "Open Chat" в документ
- [ ] Интегрировать выделение фрагментов в PDF viewer
- [ ] Синхронизировать scroll позиции между чатом и документом

#### 5.2 Workflow Integration
- [ ] Автоматические сообщения при изменении статуса документа
- [ ] Уведомления о дедлайнах в чате
- [ ] Интеграция с системой approval

### Phase 6: Security & Audit
**Цель:** Обеспечить безопасность и соответствие требованиям аудита

#### 6.1 Security Implementation
- [ ] End-to-end шифрование сообщений
- [ ] Аутентификация и авторизация для чата
- [ ] Rate limiting для предотвращения спама
- [ ] Input sanitization и XSS protection

#### 6.2 Audit Integration
- [ ] Логирование всех действий в чате через Audit Trail
- [ ] Экспорт чатов для соответствия нормам
- [ ] Data retention policies
- [ ] GDPR compliance features

### Phase 7: Advanced Features
**Цель:** Расширенная функциональность

#### 7.1 Enhanced Chat Features
- [ ] Message reactions (emoji)
- [ ] Message threading/replies
- [ ] File attachments и image preview
- [ ] Voice messages (optional)

#### 7.2 Search & Analytics
- [ ] Полнотекстовый поиск по сообщениям
- [ ] Фильтрация по типу сообщений и участникам
- [ ] Аналитика активности чата
- [ ] Export chat history в различных форматах

## 🚀 Technical Implementation Details

### Database Schema (CosmosDB)

#### Chat Threads Container
```json
{
  "id": "thread-{documentId}",
  "documentId": "doc-123",
  "documentName": "Contract_2024.pdf",
  "participants": [
    {
      "userId": "user-456",
      "role": "service_provider",
      "joinedAt": "2024-01-15T10:00:00Z",
      "permissions": ["read", "write", "create_fragments"]
    }
  ],
  "settings": {
    "allowFragmentHighlighting": true,
    "notificationsEnabled": true,
    "retentionDays": 365
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "lastActivity": "2024-01-15T15:30:00Z",
  "isActive": true
}
```

#### Chat Messages Container
```json
{
  "id": "msg-789",
  "threadId": "thread-doc-123",
  "senderId": "user-456",
  "senderName": "John Doe",
  "senderRole": "service_provider",
  "content": "Please review section 3.2 regarding payment terms",
  "messageType": "text",
  "fragmentReferences": [
    {
      "fragmentId": "frag-101",
      "referenceText": "payment terms",
      "contextPreview": "Payment shall be made within 30 days..."
    }
  ],
  "timestamp": "2024-01-15T15:30:00Z",
  "isRead": false,
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "messageLength": 45
  }
}
```

#### Document Fragments Container
```json
{
  "id": "frag-101",
  "documentId": "doc-123",
  "selectionType": "paragraph",
  "startPosition": 1520,
  "endPosition": 1680,
  "selectedText": "Payment shall be made within 30 days of invoice date",
  "pageNumber": 3,
  "sectionTitle": "3.2 Payment Terms",
  "highlightColor": "#ffeb3b",
  "createdBy": "user-456",
  "createdAt": "2024-01-15T15:25:00Z",
  "referenceTitle": "Payment Terms Section",
  "referenceDescription": "30-day payment requirement",
  "isActive": true
}
```

### API Endpoints

#### Chat Messages API
```typescript
// Get messages for a thread
GET /api/chat/threads/{threadId}/messages?limit=50&offset=0

// Send new message
POST /api/chat/threads/{threadId}/messages
{
  "content": "Message text",
  "messageType": "text",
  "fragmentReferences": ["frag-101"],
  "replyToMessageId": "msg-456"
}

// Edit message
PUT /api/chat/messages/{messageId}
{
  "content": "Updated message text"
}
```

#### Document Fragments API
```typescript
// Create fragment
POST /api/documents/{documentId}/fragments
{
  "selectionType": "paragraph",
  "startPosition": 1520,
  "endPosition": 1680,
  "selectedText": "Selected text content",
  "pageNumber": 3,
  "highlightColor": "#ffeb3b",
  "referenceTitle": "Custom title"
}

// Get fragments
GET /api/documents/{documentId}/fragments?includeInactive=false
```

### Real-time Events (SignalR)

```typescript
// Client subscription
connection.on("MessageReceived", (message: ChatMessage) => {
  // Handle new message
});

connection.on("FragmentCreated", (fragment: DocumentFragment) => {
  // Handle new fragment highlight
});

connection.on("TypingIndicator", (userId: string, isTyping: boolean) => {
  // Show/hide typing indicator
});
```

## 📱 UI/UX Design Principles

### Chat Widget Layout
```
┌─────────────────────────────────────┐
│ Document Chat                    [×]│
├─────────────────────────────────────┤
│ Messages Area                       │
│ ┌─────────────────────────────────┐ │
│ │ [SP] John: Please review this   │ │
│ │     section about payment terms │ │
│ │     📄 [Payment Terms Section]  │ │
│ │                          15:30  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [EU] Alice: I'll check with     │ │
│ │             finance team        │ │
│ │                          15:35  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Type your message...        ] [>] │
│ 📎 @fragment                      │
└─────────────────────────────────────┘
```

### Fragment Selection UI
- Выделение текста приводит к появлению tooltip
- Опции: "Create Reference", "Highlight", "Cancel"
- Цветовые индикаторы для разных типов фрагментов

### Message Formatting
- Support для Markdown (bold, italic, links)
- @fragment mentions с автокомплитом
- Emoji picker
- File attachment drag & drop zone

## 🔄 Integration Points

### Existing Systems Integration

#### Document Management System
```typescript
// Extend existing document API
interface Document {
  // ... existing fields
  chatThreadId?: string;
  hasActiveChat: boolean;
  fragmentCount: number;
}
```

#### Audit Trail Integration
```typescript
// Log all chat activities
await auditTrailService.logEvent({
  category: 'chat',
  action: 'message_sent',
  resourceType: 'chat_message',
  resourceId: messageId,
  description: `Message sent in document chat`,
  metadata: {
    documentId,
    threadId,
    messageLength: message.content.length,
    hasFragmentReferences: message.fragmentReferences.length > 0
  }
}, auditContext);
```

#### Notification System Integration
```typescript
// Send notifications for chat events
await notificationService.sendNotification({
  type: 'chat_message',
  recipientId: participantId,
  title: `New message in ${documentName}`,
  message: `${senderName}: ${messagePreview}`,
  actionUrl: `/documents/${documentId}/chat`
});
```

## 🎯 Success Metrics

### Functional KPIs
- [ ] Chat response time < 2 seconds
- [ ] Fragment highlight accuracy > 95%
- [ ] Message delivery success rate > 99.9%
- [ ] Support для 50+ concurrent users per document

### User Experience KPIs  
- [ ] Fragment selection time < 5 seconds
- [ ] Message composition time < 30 seconds
- [ ] Chat loading time < 1 second
- [ ] Mobile responsiveness score > 90%

### Business KPIs
- [ ] Reduction in email communication by 60%
- [ ] Faster document review cycle by 40%
- [ ] Improved user satisfaction scores
- [ ] Reduced support tickets related to document questions

## 📋 Testing Strategy

### Unit Tests
- [ ] Chat message validation
- [ ] Fragment selection logic
- [ ] Real-time connection handling
- [ ] Message formatting and sanitization

### Integration Tests
- [ ] End-to-end message flow
- [ ] Fragment creation and reference
- [ ] Multiple user scenarios
- [ ] Document viewer integration

### Performance Tests
- [ ] Load testing with 100+ concurrent users
- [ ] Memory usage with large chat histories
- [ ] Fragment highlight rendering performance
- [ ] Real-time message latency testing

## 🚢 Deployment Strategy

### Infrastructure Requirements
- [ ] Azure SignalR Service for real-time communication
- [ ] CosmosDB scaling for chat data
- [ ] CDN для chat assets
- [ ] Load balancer configuration

### Feature Flags
- [ ] Enable/disable chat per document type
- [ ] Fragment highlighting toggle
- [ ] Real-time notifications control
- [ ] Advanced features rollout control

### Monitoring & Alerting
- [ ] Chat system health dashboards
- [ ] Message delivery monitoring
- [ ] User engagement analytics
- [ ] Error rate alerting

## 📚 Documentation Requirements

### User Documentation
- [ ] Chat usage guide for Service Providers
- [ ] End User tutorial for document discussions
- [ ] Fragment highlighting best practices
- [ ] Troubleshooting guide

### Developer Documentation
- [ ] API reference documentation
- [ ] Integration guidelines
- [ ] Security implementation guide
- [ ] Deployment and maintenance procedures

---

**Приоритет реализации:** High Priority
**Предполагаемое время реализации:** 8-10 недель
**Ресурсы:** 2-3 разработчика (Frontend + Backend + Integration)

Эта система обеспечит эффективную коммуникацию между Service Providers и End Users с возможностью контекстного обсуждения конкретных частей документов, что значительно улучшит процесс review и approval документов.
