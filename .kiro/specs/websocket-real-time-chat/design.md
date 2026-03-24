# Design Document: WebSocket Real-Time Chat

## Overview

This design document specifies the technical implementation for adding WebSocket-based real-time chat functionality to the Tunisia Hotel Assistant application. The system will enable streaming AI responses with sub-100ms latency, typing indicators, instant bidirectional communication, and real-time notifications while maintaining full backward compatibility with the existing HTTP-based chat endpoint.

### Design Goals

1. **Real-Time Streaming**: Enable word-by-word AI response streaming similar to ChatGPT
2. **Low Latency**: Achieve sub-100ms response times for message chunks
3. **Backward Compatibility**: Maintain existing HTTP endpoint as fallback
4. **Serverless Compatible**: Work within Vercel's serverless environment constraints
5. **Security Parity**: Apply same security measures as HTTP endpoint
6. **Zero Downtime**: Enable gradual rollout with feature flags

### Key Constraints

- Must use Next.js 14 API routes (no standalone WebSocket server)
- Must work in Vercel serverless environment
- Must use Redis for state management (no in-memory state)
- Must preserve all existing security measures (rate limiting, input validation)
- Must maintain analytics tracking accuracy
- Must complete within serverless timeout limits (10 seconds)

### Technology Stack

- **WebSocket Protocol**: Native WebSocket API with JSON message format
- **Server Framework**: Next.js 14 API routes with WebSocket upgrade
- **State Management**: Redis for session state and pub/sub
- **AI Service**: Groq SDK with streaming support
- **Rate Limiting**: Existing Redis-backed rate limiter
- **Analytics**: Existing PostgreSQL analytics system
- **Validation**: Existing Zod schemas from lib/validation.ts


## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WebSocket Client (app/hotel/[id]/page.tsx)             │  │
│  │  - Connection Manager                                     │  │
│  │  - Message Handler                                        │  │
│  │  - UI State Manager                                       │  │
│  │  - Fallback Handler                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            │ WebSocket (WSS)                     │
│                            │ or HTTP Fallback                    │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    Next.js Server (Vercel)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WebSocket Handler (app/api/ws/route.ts)                │  │
│  │  - Connection Management                                  │  │
│  │  - Message Routing                                        │  │
│  │  - Session Validation                                     │  │
│  │  - Heartbeat Management                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HTTP Chat Handler (app/api/chat/route.ts)              │  │
│  │  - Existing endpoint (unchanged)                          │  │
│  │  - Fallback for WebSocket failures                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Enhanced AI Service (lib/ai-service.ts)                 │  │
│  │  - Streaming Mode (new)                                   │  │
│  │  - Non-Streaming Mode (existing)                          │  │
│  │  - Response Caching                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    External Services                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Redis     │  │ PostgreSQL  │  │  Groq API   │            │
│  │  - State    │  │ - Analytics │  │ - Streaming │            │
│  │  - Pub/Sub  │  │ - Hotel DB  │  │ - AI Model  │            │
│  │  - Rate     │  │ - Sessions  │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User sends message
       │
       ▼
WebSocket Client validates input
       │
       ▼
Send via WebSocket connection
       │
       ▼
WebSocket Handler receives message
       │
       ├─► Rate Limiter checks (Redis)
       │
       ├─► Input Validation (Zod schema)
       │
       ├─► Session State retrieval (Redis)
       │
       ▼
AI Service (streaming mode)
       │
       ├─► Groq API streaming request
       │
       ▼
Stream chunks back to client
       │
       ├─► Each chunk sent via WebSocket
       │
       ├─► Client renders incrementally
       │
       ▼
Complete message
       │
       ├─► Analytics tracking
       │
       ├─► Session state update (Redis)
       │
       ▼
Done
```


### Serverless Architecture Considerations

**Challenge**: Vercel serverless functions are stateless and short-lived.

**Solution**:
1. **Redis for State**: All connection state stored in Redis, not memory
2. **Stateless Handlers**: Each WebSocket message handled independently
3. **Session Persistence**: Session data persisted to Redis every 30 seconds
4. **Graceful Degradation**: Automatic fallback to HTTP if WebSocket unavailable
5. **Connection Pooling**: Redis connection pooling to handle concurrent requests

**Vercel WebSocket Support**:
- Vercel supports WebSocket connections on Pro/Enterprise plans
- Free tier: Automatic fallback to HTTP polling
- Implementation detects environment and adapts accordingly


## Components and Interfaces

### 1. WebSocket Client Component

**Location**: `app/hotel/[id]/page.tsx` (enhancement to existing component)

**Responsibilities**:
- Establish and maintain WebSocket connection
- Handle connection lifecycle (connect, disconnect, reconnect)
- Send messages and receive chunks
- Display typing indicators
- Fallback to HTTP when needed
- Manage UI state

**Interface**:
```typescript
interface WebSocketClient {
  // Connection management
  connect(): Promise<void>
  disconnect(): void
  reconnect(): void
  
  // Message handling
  sendMessage(message: string): Promise<void>
  onChunk(handler: (chunk: MessageChunk) => void): void
  onComplete(handler: (messageId: string) => void): void
  onError(handler: (error: WebSocketError) => void): void
  
  // State
  connectionState: ConnectionState
  isConnected: boolean
}

type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed'

interface MessageChunk {
  type: 'chunk'
  messageId: string
  chunk: string
  isComplete: boolean
  timestamp: number
}

interface WebSocketError {
  type: 'error'
  code: string
  message: string
  recoverable: boolean
}
```

**State Management**:
```typescript
const [wsState, setWsState] = useState<{
  connection: WebSocket | null
  state: ConnectionState
  reconnectAttempts: number
  useHttpFallback: boolean
}>({
  connection: null,
  state: 'disconnected',
  reconnectAttempts: 0,
  useHttpFallback: false
})
```


### 2. Connection Manager

**Location**: `lib/websocket-client.ts` (new file)

**Responsibilities**:
- WebSocket connection lifecycle management
- Heartbeat ping/pong mechanism
- Exponential backoff reconnection
- Connection state events
- Error handling and recovery

**Interface**:
```typescript
export class ConnectionManager {
  private ws: WebSocket | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts: number = 0
  private readonly maxReconnectAttempts: number = 5
  
  constructor(
    private url: string,
    private sessionId: string,
    private onStateChange: (state: ConnectionState) => void
  ) {}
  
  async connect(): Promise<void>
  disconnect(): void
  send(message: WebSocketMessage): void
  onMessage(handler: (message: WebSocketMessage) => void): void
  
  private startHeartbeat(): void
  private stopHeartbeat(): void
  private scheduleReconnect(): void
  private getReconnectDelay(): number // Exponential backoff
}
```

**Heartbeat Mechanism**:
- Send ping every 30 seconds
- Expect pong within 5 seconds
- If no pong, consider connection dead and reconnect

**Reconnection Strategy**:
```typescript
// Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
const delays = [1000, 2000, 4000, 8000, 16000]
const delay = Math.min(delays[attempt] || 30000, 30000)
```


### 3. WebSocket Server Handler

**Location**: `app/api/ws/route.ts` (new file)

**Responsibilities**:
- Accept WebSocket upgrade requests
- Validate session on connection
- Route messages to appropriate handlers
- Manage active connections
- Broadcast notifications
- Handle disconnections

**Interface**:
```typescript
export async function GET(request: Request) {
  // Check if WebSocket upgrade is requested
  const upgrade = request.headers.get('upgrade')
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 })
  }
  
  // Extract session ID from query params
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('sessionId')
  
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 })
  }
  
  // Validate session
  const session = await validateSession(sessionId)
  if (!session) {
    return new Response('Invalid session', { status: 401 })
  }
  
  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(request)
  
  // Setup handlers
  socket.onopen = () => handleConnection(socket, sessionId)
  socket.onmessage = (event) => handleMessage(socket, sessionId, event)
  socket.onclose = () => handleDisconnection(sessionId)
  socket.onerror = (error) => handleError(sessionId, error)
  
  return response
}

async function handleMessage(
  socket: WebSocket,
  sessionId: string,
  event: MessageEvent
) {
  try {
    const message = JSON.parse(event.data)
    
    // Route based on message type
    switch (message.type) {
      case 'chat_message':
        await handleChatMessage(socket, sessionId, message)
        break
      case 'ping':
        socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        break
      default:
        socket.send(JSON.stringify({ 
          type: 'error', 
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: 'Unknown message type'
        }))
    }
  } catch (error) {
    console.error('Message handling error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      code: 'MESSAGE_PROCESSING_ERROR',
      message: 'Failed to process message'
    }))
  }
}
```


### 4. Enhanced AI Service with Streaming

**Location**: `lib/ai-service.ts` (enhancement to existing file)

**New Function**:
```typescript
export async function* generateResponseStream(
  userMessage: string,
  hotelContext: string,
  conversationHistory: Message[] = []
): AsyncGenerator<string, void, unknown> {
  try {
    const systemPrompt = buildSystemPrompt(hotelContext)
    
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: userMessage },
    ]

    const stream = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 300,
      top_p: 0.9,
      stream: true, // Enable streaming
    })

    // Yield chunks as they arrive
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error: any) {
    console.error('Groq Streaming Error:', error)
    throw new Error(`AI Streaming Error: ${error.message}`)
  }
}

// Keep existing non-streaming function unchanged
export async function generateResponse(
  userMessage: string,
  hotelContext: string,
  conversationHistory: Message[] = []
): Promise<string> {
  // Existing implementation remains unchanged
  // ...
}
```

**Chunk Buffering**:
```typescript
// Buffer chunks to prevent overwhelming client
class ChunkBuffer {
  private buffer: string[] = []
  private lastSendTime: number = 0
  private readonly minInterval: number = 50 // ms
  
  add(chunk: string): void {
    this.buffer.push(chunk)
  }
  
  shouldFlush(): boolean {
    return Date.now() - this.lastSendTime >= this.minInterval
  }
  
  flush(): string {
    const combined = this.buffer.join('')
    this.buffer = []
    this.lastSendTime = Date.now()
    return combined
  }
}
```


### 5. Session State Manager

**Location**: `lib/session-state.ts` (new file)

**Responsibilities**:
- Store and retrieve conversation history
- Manage session metadata
- Handle session expiration
- Persist state to Redis

**Interface**:
```typescript
export interface SessionState {
  sessionId: string
  hotelId: string
  conversationHistory: Message[]
  guestProfile: GuestProfile | null
  createdAt: number
  lastActivity: number
}

export class SessionStateManager {
  private redis: Redis
  private readonly ttl: number = 86400 // 24 hours
  
  constructor() {
    this.redis = getRedisClient()
  }
  
  async getState(sessionId: string): Promise<SessionState | null> {
    const key = `session:${sessionId}`
    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : null
  }
  
  async setState(state: SessionState): Promise<void> {
    const key = `session:${state.sessionId}`
    await this.redis.setex(
      key,
      this.ttl,
      JSON.stringify({
        ...state,
        lastActivity: Date.now()
      })
    )
  }
  
  async updateHistory(
    sessionId: string,
    message: Message
  ): Promise<void> {
    const state = await this.getState(sessionId)
    if (!state) return
    
    // Keep last 6 messages (3 exchanges)
    const history = [...state.conversationHistory, message].slice(-6)
    
    await this.setState({
      ...state,
      conversationHistory: history
    })
  }
  
  async deleteState(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    await this.redis.del(key)
  }
}
```


### 6. Fallback Handler

**Location**: `lib/fallback-handler.ts` (new file)

**Responsibilities**:
- Detect WebSocket failures
- Switch to HTTP mode
- Preserve conversation history
- Attempt periodic reconnection

**Interface**:
```typescript
export class FallbackHandler {
  private useHttp: boolean = false
  private reconnectInterval: NodeJS.Timeout | null = null
  
  constructor(
    private connectionManager: ConnectionManager,
    private onModeChange: (mode: 'websocket' | 'http') => void
  ) {}
  
  enableHttpFallback(): void {
    this.useHttp = true
    this.onModeChange('http')
    this.startReconnectionAttempts()
  }
  
  disableHttpFallback(): void {
    this.useHttp = false
    this.onModeChange('websocket')
    this.stopReconnectionAttempts()
  }
  
  async sendMessage(message: string, context: any): Promise<string> {
    if (this.useHttp) {
      return this.sendViaHttp(message, context)
    } else {
      return this.sendViaWebSocket(message, context)
    }
  }
  
  private async sendViaHttp(message: string, context: any): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...context
      })
    })
    
    const data = await response.json()
    return data.response
  }
  
  private async sendViaWebSocket(
    message: string, 
    context: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Send via WebSocket and collect chunks
      // Implementation details...
    })
  }
  
  private startReconnectionAttempts(): void {
    // Try to reconnect every 60 seconds
    this.reconnectInterval = setInterval(() => {
      this.attemptReconnect()
    }, 60000)
  }
  
  private stopReconnectionAttempts(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }
  
  private async attemptReconnect(): Promise<void> {
    try {
      await this.connectionManager.connect()
      this.disableHttpFallback()
    } catch (error) {
      console.log('Reconnection attempt failed, staying in HTTP mode')
    }
  }
}
```


## Data Models

### WebSocket Message Protocol

All WebSocket messages use JSON format with a `type` field for routing.

#### Client to Server Messages

**1. Chat Message**
```typescript
interface ChatMessage {
  type: 'chat_message'
  messageId: string // Client-generated UUID
  message: string
  sessionId: string
  hotelData: {
    id: string
    name: string
  }
  timestamp: number
}
```

**2. Ping (Heartbeat)**
```typescript
interface PingMessage {
  type: 'ping'
  timestamp: number
}
```

#### Server to Client Messages

**1. Message Chunk**
```typescript
interface ChunkMessage {
  type: 'chunk'
  messageId: string // Correlates with original chat message
  chunk: string // Partial response text
  isComplete: boolean
  timestamp: number
}
```

**2. Typing Indicator**
```typescript
interface TypingMessage {
  type: 'typing_start' | 'typing_end'
  timestamp: number
}
```

**3. Error Message**
```typescript
interface ErrorMessage {
  type: 'error'
  code: string // Error code for programmatic handling
  message: string // Human-readable error message
  recoverable: boolean // Can client retry?
  timestamp: number
}

// Error codes
type ErrorCode = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_MESSAGE'
  | 'SESSION_EXPIRED'
  | 'AI_SERVICE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'
```

**4. Notification**
```typescript
interface NotificationMessage {
  type: 'notification'
  category: 'hotel_update' | 'system'
  title: string
  message: string
  actionRequired: boolean
  timestamp: number
}
```

**5. Pong (Heartbeat Response)**
```typescript
interface PongMessage {
  type: 'pong'
  timestamp: number
}
```


### Connection State Machine

```
┌──────────────┐
│ disconnected │ ◄─────────────────────────┐
└──────┬───────┘                           │
       │ connect()                         │
       ▼                                   │
┌──────────────┐                           │
│  connecting  │                           │
└──────┬───────┘                           │
       │ onopen                            │
       ▼                                   │
┌──────────────┐                           │
│  connected   │ ◄──────────┐              │
└──────┬───────┘            │              │
       │ onerror/onclose    │ reconnect    │
       ▼                    │ success      │
┌──────────────┐            │              │
│ reconnecting │────────────┘              │
└──────┬───────┘                           │
       │ max attempts exceeded             │
       ▼                                   │
┌──────────────┐                           │
│    failed    │───────────────────────────┘
└──────────────┘  fallback to HTTP
```

**Valid State Transitions**:
- `disconnected` → `connecting`
- `connecting` → `connected`
- `connecting` → `failed`
- `connected` → `disconnected`
- `connected` → `reconnecting`
- `reconnecting` → `connected`
- `reconnecting` → `failed`
- `failed` → `disconnected`

**Invalid Transitions** (should never occur):
- `connected` → `connecting`
- `failed` → `connecting`
- `reconnecting` → `disconnected` (without going through failed)


## Sequence Diagrams

### 1. Successful Message Streaming

```
Client          ConnectionMgr    WSHandler       AIService       Groq API
  │                  │               │               │               │
  │ sendMessage()    │               │               │               │
  ├─────────────────►│               │               │               │
  │                  │ send(msg)     │               │               │
  │                  ├──────────────►│               │               │
  │                  │               │ validate      │               │
  │                  │               │ rate limit    │               │
  │                  │               │ check session │               │
  │                  │               │               │               │
  │                  │               │ stream()      │               │
  │                  │               ├──────────────►│               │
  │                  │               │               │ stream API    │
  │                  │               │               ├──────────────►│
  │ typing_start     │               │               │               │
  │◄─────────────────┼───────────────┤               │               │
  │                  │               │               │ chunk 1       │
  │                  │               │               │◄──────────────┤
  │ chunk 1          │               │               │               │
  │◄─────────────────┼───────────────┤               │               │
  │ (render)         │               │               │               │
  │                  │               │               │ chunk 2       │
  │                  │               │               │◄──────────────┤
  │ chunk 2          │               │               │               │
  │◄─────────────────┼───────────────┤               │               │
  │ (render)         │               │               │               │
  │                  │               │               │ ... more      │
  │                  │               │               │               │
  │ chunk N          │               │               │               │
  │ (isComplete)     │               │               │               │
  │◄─────────────────┼───────────────┤               │               │
  │ typing_end       │               │               │               │
  │◄─────────────────┼───────────────┤               │               │
  │                  │               │ track         │               │
  │                  │               │ analytics     │               │
  │                  │               │ update state  │               │
```


### 2. Connection Loss and Reconnection

```
Client          ConnectionMgr    WSHandler       Redis
  │                  │               │               │
  │ (connected)      │               │               │
  │                  │               │               │
  │                  │ ✗ connection  │               │
  │                  │   lost        │               │
  │                  │◄──────────────┤               │
  │ state:           │               │               │
  │ reconnecting     │               │               │
  │◄─────────────────┤               │               │
  │ (show UI)        │               │               │
  │                  │               │               │
  │                  │ wait 1s       │               │
  │                  │ (attempt 1)   │               │
  │                  │               │               │
  │                  │ connect()     │               │
  │                  ├──────────────►│               │
  │                  │ ✗ failed      │               │
  │                  │◄──────────────┤               │
  │                  │               │               │
  │                  │ wait 2s       │               │
  │                  │ (attempt 2)   │               │
  │                  │               │               │
  │                  │ connect()     │               │
  │                  ├──────────────►│               │
  │                  │ ✓ success     │               │
  │                  │◄──────────────┤               │
  │                  │               │ restore       │
  │                  │               │ session       │
  │                  │               ├──────────────►│
  │                  │               │ history       │
  │                  │               │◄──────────────┤
  │ state:           │               │               │
  │ connected        │               │               │
  │◄─────────────────┤               │               │
  │ (hide UI)        │               │               │
```


### 3. Fallback to HTTP

```
Client          ConnectionMgr    FallbackHandler    HTTP API
  │                  │               │                  │
  │ (reconnecting)   │               │                  │
  │                  │               │                  │
  │                  │ attempt 5     │                  │
  │                  │ ✗ failed      │                  │
  │                  │               │                  │
  │                  │ max attempts  │                  │
  │                  │ exceeded      │                  │
  │                  ├──────────────►│                  │
  │                  │               │ enable HTTP      │
  │                  │               │ fallback         │
  │ state: failed    │               │                  │
  │ mode: http       │               │                  │
  │◄─────────────────┼───────────────┤                  │
  │ (show notice)    │               │                  │
  │                  │               │                  │
  │ sendMessage()    │               │                  │
  ├─────────────────►│               │                  │
  │                  │ route to HTTP │                  │
  │                  ├──────────────►│                  │
  │                  │               │ POST /api/chat   │
  │                  │               ├─────────────────►│
  │                  │               │ response         │
  │                  │               │◄─────────────────┤
  │ response         │               │                  │
  │◄─────────────────┼───────────────┤                  │
  │ (no streaming)   │               │                  │
  │                  │               │                  │
  │                  │               │ (60s later)      │
  │                  │               │ attempt WS       │
  │                  │               │ reconnect        │
```


## Integration Points

### 1. Integration with lib/ai-service.ts

**Changes Required**:
- Add new `generateResponseStream()` function for streaming mode
- Keep existing `generateResponse()` function unchanged
- Both functions use same system prompt and parameters
- Streaming function yields chunks as they arrive from Groq API

**Integration Pattern**:
```typescript
// WebSocket handler uses streaming
for await (const chunk of generateResponseStream(message, context, history)) {
  socket.send(JSON.stringify({
    type: 'chunk',
    messageId,
    chunk,
    isComplete: false
  }))
}

// HTTP handler uses non-streaming (unchanged)
const response = await generateResponse(message, context, history)
```

### 2. Integration with lib/analytics.ts

**No Changes Required** - Analytics functions remain unchanged.

**Integration Pattern**:
```typescript
// WebSocket handler calls same analytics functions
const { category, subcategory, topics } = detectQuestionCategory(message)
await trackQuestionCategory(hotelId, category, subcategory, ageRange)
for (const topic of topics) {
  await trackPopularTopic(hotelId, topic)
}
```

**Verification**: Analytics data from WebSocket and HTTP should be indistinguishable.

### 3. Integration with lib/rate-limiter.ts

**No Changes Required** - Rate limiter works with WebSocket connections.

**Integration Pattern**:
```typescript
// Apply rate limiting per session_id
const rateLimitKey = `websocket:${sessionId}`
const result = await chatRateLimiter.checkLimit(rateLimitKey)

if (!result.success) {
  socket.send(JSON.stringify({
    type: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: `Rate limit exceeded. Try again in ${result.retryAfter}s`,
    recoverable: true
  }))
  return
}
```

**Key Difference**: Rate limiting by session_id instead of IP address for WebSocket.

### 4. Integration with lib/redis.ts

**Enhancement Required**: Add pub/sub support for hotel data change notifications.

**New Functions**:
```typescript
export async function subscribeToHotelUpdates(
  hotelId: string,
  callback: (update: HotelUpdate) => void
): Promise<void> {
  const redis = getRedisClient()
  const channel = `hotel:${hotelId}:updates`
  
  await redis.subscribe(channel)
  redis.on('message', (ch, message) => {
    if (ch === channel) {
      callback(JSON.parse(message))
    }
  })
}

export async function publishHotelUpdate(
  hotelId: string,
  update: HotelUpdate
): Promise<void> {
  const redis = getRedisClient()
  const channel = `hotel:${hotelId}:updates`
  await redis.publish(channel, JSON.stringify(update))
}
```

### 5. Integration with lib/validation.ts

**No Changes Required** - Use existing `chatMessageSchema`.

**Integration Pattern**:
```typescript
// Validate WebSocket messages same as HTTP
const validation = validateAndSanitize(chatMessageSchema, messageData)
if (!validation.success) {
  socket.send(JSON.stringify({
    type: 'error',
    code: 'VALIDATION_ERROR',
    message: validation.errors?.join(', '),
    recoverable: false
  }))
  return
}
```


## Database Schema

**No Database Changes Required**

The existing PostgreSQL schema supports WebSocket implementation without modifications:

- **guest_profiles**: Already tracks session_id, used for both HTTP and WebSocket
- **question_categories**: Already tracks analytics, protocol-agnostic
- **popular_topics**: Already tracks topics, protocol-agnostic
- **hotel_settings**: Already stores hotel configuration, no changes needed

**Redis Schema** (Key-Value Store):

```
# Session State
session:{sessionId} → JSON {
  sessionId: string
  hotelId: string
  conversationHistory: Message[]
  guestProfile: GuestProfile | null
  createdAt: number
  lastActivity: number
}
TTL: 86400 seconds (24 hours)

# Rate Limiting (existing)
ratelimit:chat:{sessionId} → Sorted Set of timestamps
TTL: 900 seconds (15 minutes)

# Active Connections (new)
ws:connections:{hotelId} → Set of sessionIds
TTL: None (removed on disconnect)

# Pub/Sub Channels (new)
hotel:{hotelId}:updates → Hotel update notifications
```


## Deployment Architecture

### Vercel Serverless Deployment

**WebSocket Support on Vercel**:
- Vercel Pro/Enterprise: Native WebSocket support
- Vercel Free: No WebSocket support, automatic HTTP fallback

**Environment Detection**:
```typescript
export function isWebSocketSupported(): boolean {
  // Check if running on Vercel with WebSocket support
  const isVercel = process.env.VERCEL === '1'
  const hasWsSupport = process.env.VERCEL_WS_SUPPORT === 'true'
  
  return !isVercel || hasWsSupport
}
```

**Deployment Strategy**:

1. **Phase 1: Feature Flag Disabled** (Week 1)
   - Deploy WebSocket code with feature flag OFF
   - All traffic uses HTTP endpoint
   - Monitor for any regressions

2. **Phase 2: Gradual Rollout** (Week 2-3)
   - Enable feature flag for 10% of users
   - Monitor metrics: latency, error rate, fallback rate
   - Gradually increase to 25%, 50%, 75%

3. **Phase 3: Full Rollout** (Week 4)
   - Enable for 100% of users
   - HTTP endpoint remains as fallback
   - Monitor for 1 week

4. **Phase 4: Optimization** (Week 5+)
   - Tune performance based on metrics
   - Optimize chunk buffering
   - Adjust reconnection strategies

**Feature Flag Implementation**:
```typescript
// Environment variable
ENABLE_WEBSOCKET=true|false

// Runtime check
export function useWebSocket(): boolean {
  return process.env.ENABLE_WEBSOCKET === 'true' && isWebSocketSupported()
}
```

### Redis Configuration

**Production Requirements**:
- Redis instance with pub/sub support
- Minimum 100 MB memory
- Persistence enabled for session state
- TLS/SSL enabled

**Recommended Providers**:
- Upstash (serverless-friendly)
- Redis Cloud
- AWS ElastiCache

### Monitoring and Alerts

**Key Metrics to Track**:
- WebSocket connection success rate
- Average time to first chunk
- Fallback activation rate
- Message processing latency
- Error rate by error code
- Active connections per hotel

**Alert Thresholds**:
- Error rate > 5%: Warning
- Fallback rate > 10%: Warning
- Connection failures > 20%: Critical
- Average latency > 500ms: Warning


## Error Handling

### Error Categories and Recovery Strategies

#### 1. Connection Errors

**Scenarios**:
- Network interruption
- Server restart
- Client navigation
- Timeout

**Recovery**:
```typescript
class ConnectionError extends Error {
  constructor(
    message: string,
    public recoverable: boolean = true,
    public retryDelay: number = 1000
  ) {
    super(message)
  }
}

// Automatic reconnection with exponential backoff
async function handleConnectionError(error: ConnectionError) {
  if (error.recoverable && reconnectAttempts < maxAttempts) {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
    setTimeout(() => reconnect(), delay)
    reconnectAttempts++
  } else {
    enableHttpFallback()
  }
}
```

#### 2. Message Validation Errors

**Scenarios**:
- Invalid JSON
- Missing required fields
- Message too large
- Invalid session ID

**Recovery**:
```typescript
// Send error to client, don't process message
socket.send(JSON.stringify({
  type: 'error',
  code: 'VALIDATION_ERROR',
  message: 'Invalid message format',
  recoverable: false // Client should fix and resend
}))
```

#### 3. Rate Limit Errors

**Scenarios**:
- Too many messages in time window
- Burst protection triggered

**Recovery**:
```typescript
// Don't close connection, just reject message
socket.send(JSON.stringify({
  type: 'error',
  code: 'RATE_LIMIT_EXCEEDED',
  message: `Rate limit exceeded. Try again in ${retryAfter}s`,
  recoverable: true,
  retryAfter
}))
```

#### 4. AI Service Errors

**Scenarios**:
- Groq API timeout
- Groq API rate limit
- Streaming interrupted
- Invalid response

**Recovery**:
```typescript
// Send partial response with error indicator
socket.send(JSON.stringify({
  type: 'chunk',
  messageId,
  chunk: partialResponse,
  isComplete: false
}))

socket.send(JSON.stringify({
  type: 'error',
  code: 'AI_SERVICE_ERROR',
  message: 'AI service encountered an error. Please try again.',
  recoverable: true
}))

// Log for monitoring
console.error('AI Service Error:', {
  sessionId,
  messageId,
  error: error.message
})
```

#### 5. Session State Errors

**Scenarios**:
- Redis unavailable
- Session expired
- Corrupted state

**Recovery**:
```typescript
// Start with empty history, continue processing
if (!sessionState) {
  console.warn('Session state unavailable, starting fresh')
  sessionState = {
    sessionId,
    hotelId,
    conversationHistory: [],
    guestProfile: null,
    createdAt: Date.now(),
    lastActivity: Date.now()
  }
}
```

### Error Response Format

All errors follow consistent format:

```typescript
interface ErrorResponse {
  type: 'error'
  code: ErrorCode
  message: string // User-friendly message
  recoverable: boolean // Can client retry?
  retryAfter?: number // Seconds to wait before retry
  timestamp: number
}

type ErrorCode =
  | 'CONNECTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AI_SERVICE_ERROR'
  | 'SESSION_EXPIRED'
  | 'AUTHENTICATION_ERROR'
  | 'UNKNOWN_ERROR'
```

### Client-Side Error Handling

```typescript
socket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  if (message.type === 'error') {
    handleError(message)
  }
}

function handleError(error: ErrorResponse) {
  // Display user-friendly message
  showErrorNotification(error.message)
  
  // Take appropriate action
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    disableInput(error.retryAfter)
  } else if (error.code === 'SESSION_EXPIRED') {
    redirectToRegistration()
  } else if (error.recoverable) {
    enableRetryButton()
  } else {
    // Non-recoverable, switch to HTTP
    enableHttpFallback()
  }
  
  // Log for debugging
  console.error('WebSocket Error:', error)
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Streaming Equivalence**: Requirements 2.8 and 9.8 both test that streaming produces same result as non-streaming - these can be combined into one comprehensive property.

2. **Analytics Consistency**: Requirements 6.2, 6.3, 6.7, and 6.8 all test analytics consistency between protocols - these can be combined into one property about analytics parity.

3. **Validation Consistency**: Requirements 5.7 and 18.8 both test that validation rules are consistent - these can be combined.

4. **Rate Limit Consistency**: Requirements 4.5, 4.6, 4.7, and 18.7 all test rate limiting consistency - these can be combined into one comprehensive property.

5. **Backward Compatibility**: Requirements 18.1, 18.2, 18.4, 18.5, and 18.6 all test backward compatibility - these can be combined into one property.

6. **Connection State Transitions**: Requirements 1.7 and the state machine validation can be combined into one property about valid state transitions.

7. **Message Protocol Consistency**: Requirements 11.1, 11.3, 11.4, 11.6, and 11.7 all test message format consistency - these can be combined.

The following properties represent the unique, non-redundant correctness guarantees:


### Property 1: Streaming Response Equivalence (Round-Trip)

*For any* valid message M, hotel context H, and conversation history C, concatenating all chunks from streaming mode should produce the same response as non-streaming mode.

```
concat(streamChunks(M, H, C)) = generateResponse(M, H, C)
```

**Validates: Requirements 2.8, 9.8**

**Test Strategy**: Generate random valid messages with various contexts and histories. Compare concatenated streaming output with non-streaming output. They must be identical.

---

### Property 2: Connection State Machine Validity

*For any* sequence of connection events E, all state transitions must follow valid state machine rules.

Valid transitions:
- disconnected → connecting → connected
- connected → disconnected
- connected → reconnecting → connected
- reconnecting → failed → disconnected

Invalid transitions (should never occur):
- connected → connecting
- failed → connecting
- reconnecting → disconnected (without going through failed)

**Validates: Requirements 1.7**

**Test Strategy**: Generate random sequences of connection events (connect, disconnect, error). Verify no invalid state transitions occur.

---

### Property 3: Message Chunk Ordering and Completeness

*For any* streamed message M with chunks [C1, C2, ..., Cn], chunks must arrive in order and when concatenated must equal the complete message.

```
order(receivedChunks) = [C1, C2, ..., Cn] AND
concat(receivedChunks) = M
```

**Validates: Requirements 2.3, 2.5, 2.7**

**Test Strategy**: Stream messages and verify chunks arrive in correct order. Verify final concatenation matches expected complete message.

---

### Property 4: Rate Limiting Consistency Across Protocols

*For any* sequence of messages S and session ID sid, rate limiting behavior must be identical for WebSocket and HTTP protocols.

```
rateLimitResult(S, sid, "websocket") = rateLimitResult(S, sid, "http")
```

**Validates: Requirements 4.5, 4.6, 4.7, 18.7**

**Test Strategy**: Send identical message sequences through both protocols. Verify rate limit triggers at same point and counters match.

---

### Property 5: Analytics Tracking Completeness and Consistency

*For any* message M processed via any protocol, analytics must be tracked exactly once with identical data regardless of protocol.

```
count(analyticsDB, M.sessionId) = count(processedMessages, M.sessionId) AND
analyticsData(M, "websocket") = analyticsData(M, "http")
```

**Validates: Requirements 6.1, 6.2, 6.3, 6.7, 6.8, 18.6**

**Test Strategy**: Send messages through both protocols. Verify analytics records are identical and each message is counted exactly once.

---

### Property 6: Session State Persistence Across Reconnections

*For any* session S with conversation history H, if reconnection occurs within 24 hours, the conversation history must be preserved.

```
getHistory(S, afterReconnect) = H
WHERE reconnectTime - disconnectTime < 24 hours
```

**Validates: Requirements 8.4, 8.8**

**Test Strategy**: Establish session with history, disconnect, reconnect within timeout. Verify history is restored. Test with reconnection after timeout to verify history is cleared.

---

### Property 7: Input Validation and Sanitization Idempotence

*For any* valid message M, sanitizing it multiple times produces the same result as sanitizing once.

```
sanitize(sanitize(M)) = sanitize(M)
```

**Validates: Requirements 5.8**

**Test Strategy**: Generate random valid messages, apply sanitization multiple times. Verify result is identical after first sanitization.

---

### Property 8: Fallback Mode Equivalence

*For any* message M and context C, responses from HTTP fallback mode must be identical to direct HTTP endpoint usage.

```
response(M, C, "http_fallback") = response(M, C, "http_direct")
```

**Validates: Requirements 7.2, 7.7, 7.8**

**Test Strategy**: Send same messages through fallback mode and direct HTTP. Compare responses for equality.

---

### Property 9: Message Protocol Format Consistency

*For any* WebSocket message W, it must be valid JSON with a "type" field, and all required fields for that type must be present.

```
isValidJSON(W) AND
hasField(W, "type") AND
hasRequiredFields(W, W.type)
```

**Validates: Requirements 11.1, 11.3, 11.4, 11.6, 11.7**

**Test Strategy**: Generate random messages of each type. Verify JSON validity and presence of required fields. Test with missing fields to verify rejection.

---

### Property 10: Security Parity Across Protocols

*For any* security measure S (rate limiting, input validation, session validation, message size limits), it must be applied identically to both WebSocket and HTTP protocols.

```
applies(S, "websocket") = applies(S, "http")
```

**Validates: Requirements 15.8**

**Test Strategy**: Attempt security violations (invalid sessions, oversized messages, XSS attempts) through both protocols. Verify identical blocking behavior.

---

### Property 11: Backward Compatibility Preservation

*For any* existing HTTP chat functionality F, it must continue to work identically when WebSocket is enabled or disabled.

```
behavior(F, websocketEnabled=true) = behavior(F, websocketEnabled=false) = behavior(F, beforeWebSocket)
```

**Validates: Requirements 18.1, 18.2, 18.4, 18.5, 18.8**

**Test Strategy**: Run existing HTTP chat tests with WebSocket enabled and disabled. All tests must pass without modification.

---

### Property 12: Typing Indicator State Consistency

*For any* message send operation, typing indicator must appear before first chunk and disappear when streaming completes or errors.

```
typingIndicatorVisible = true BEFORE firstChunk AND
typingIndicatorVisible = false AFTER (streamComplete OR error)
```

**Validates: Requirements 3.1, 3.2, 3.4, 3.7, 3.8**

**Test Strategy**: Send messages and verify typing indicator state transitions. Test with successful completion and with errors.

---

### Property 13: Hotel Data Change Notification Broadcast

*For any* hotel data update U for hotel H, all active WebSocket connections for that hotel must receive a notification.

```
notificationReceived(conn) = true FOR ALL conn IN activeConnections(H)
```

**Validates: Requirements 10.1, 10.8**

**Test Strategy**: Create multiple connections for same hotel. Update hotel data. Verify all connections receive notification.

---

### Property 14: Connection Duplicate Prevention

*For any* session ID sid, there must be at most one active WebSocket connection at any time.

```
count(activeConnections, sid) ≤ 1
```

**Validates: Requirements 1.5**

**Test Strategy**: Attempt to create multiple connections with same session ID. Verify only one connection is active.

---

### Property 15: Heartbeat Ping Periodicity

*For any* active WebSocket connection, heartbeat pings must be sent at 30-second intervals.

```
timeBetweenPings(conn) = 30 seconds (±1 second tolerance)
```

**Validates: Requirements 1.2**

**Test Strategy**: Monitor ping messages on active connection. Verify they occur at correct intervals.


## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

**Library Selection by Language**:
- **TypeScript/JavaScript**: fast-check
- **Python**: Hypothesis
- **Java**: jqwik
- **Go**: gopter

**Configuration Requirements**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: websocket-real-time-chat, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check'

// Feature: websocket-real-time-chat, Property 1: Streaming Response Equivalence
describe('Property 1: Streaming Response Equivalence', () => {
  it('concatenated streaming chunks equal non-streaming response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }), // message
        fc.string({ minLength: 10, maxLength: 1000 }), // hotel context
        async (message, hotelContext) => {
          // Streaming mode
          const chunks: string[] = []
          for await (const chunk of generateResponseStream(message, hotelContext)) {
            chunks.push(chunk)
          }
          const streamedResponse = chunks.join('')
          
          // Non-streaming mode
          const directResponse = await generateResponse(message, hotelContext)
          
          // Must be equal
          expect(streamedResponse).toBe(directResponse)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Testing Strategy

**Focus Areas for Unit Tests**:
1. Specific examples that demonstrate correct behavior
2. Edge cases (empty messages, exactly 1000 characters, exactly 5 reconnection attempts)
3. Error conditions (network failures, invalid JSON, rate limit exceeded)
4. Integration points between components

**Avoid Over-Testing**:
- Don't write many unit tests for scenarios covered by property tests
- Property tests handle comprehensive input coverage
- Unit tests should focus on specific, important cases

### Test Coverage by Component

#### 1. Connection Manager Tests

**Unit Tests**:
- Connection establishment with valid session
- Connection rejection with invalid session
- Heartbeat ping sent every 30 seconds
- Reconnection after connection loss
- Exponential backoff delays (1s, 2s, 4s, 8s, 16s)
- Fallback after 5 failed attempts

**Property Tests**:
- Property 2: Connection state machine validity
- Property 14: Connection duplicate prevention
- Property 15: Heartbeat ping periodicity

#### 2. Message Streaming Tests

**Unit Tests**:
- First chunk arrives within 100ms
- Typing indicator appears before first chunk
- Typing indicator disappears after completion
- Error handling during streaming
- Chunk buffering when arriving too fast

**Property Tests**:
- Property 1: Streaming response equivalence
- Property 3: Message chunk ordering and completeness
- Property 12: Typing indicator state consistency

#### 3. Rate Limiting Tests

**Unit Tests**:
- Exactly 100 messages allowed in 15 minutes
- 101st message rejected with rate limit error
- Connection stays open when rate limited
- Counter resets after 15 minutes

**Property Tests**:
- Property 4: Rate limiting consistency across protocols

#### 4. Input Validation Tests

**Unit Tests**:
- Valid message accepted
- Invalid JSON rejected
- Missing required fields rejected
- Message exceeding 1000 characters rejected
- XSS attempt sanitized

**Property Tests**:
- Property 7: Input validation and sanitization idempotence
- Property 9: Message protocol format consistency

#### 5. Analytics Tracking Tests

**Unit Tests**:
- Analytics called for each message
- Correct category detected
- Language detected correctly
- Analytics failure doesn't break chat

**Property Tests**:
- Property 5: Analytics tracking completeness and consistency

#### 6. Session State Tests

**Unit Tests**:
- Session state stored to Redis
- Session state restored on reconnection
- History limited to last 6 messages
- Session expires after 24 hours

**Property Tests**:
- Property 6: Session state persistence across reconnections

#### 7. Fallback Handler Tests

**Unit Tests**:
- Fallback enabled after 5 failures
- HTTP endpoint used in fallback mode
- Conversation history preserved during switch
- Periodic reconnection attempts every 60 seconds
- Switch back to WebSocket when available

**Property Tests**:
- Property 8: Fallback mode equivalence

#### 8. Security Tests

**Unit Tests**:
- Invalid session rejected
- WSS protocol used in production
- Message size limit enforced (10KB)
- Concurrent connection limit per IP (max 5)
- Idle connection timeout (5 minutes)

**Property Tests**:
- Property 10: Security parity across protocols

#### 9. Backward Compatibility Tests

**Unit Tests**:
- Existing HTTP tests pass unchanged
- HTTP endpoint works with WebSocket enabled
- HTTP endpoint works with WebSocket disabled
- Feature flag controls WebSocket availability

**Property Tests**:
- Property 11: Backward compatibility preservation

#### 10. Hotel Data Notification Tests

**Unit Tests**:
- Notification sent when hotel data changes
- Notification includes change summary
- Notification doesn't interrupt streaming
- Redis pub/sub used for coordination

**Property Tests**:
- Property 13: Hotel data change notification broadcast

### Integration Testing

**End-to-End Scenarios**:
1. Complete chat flow: connect → send message → receive streaming response → disconnect
2. Reconnection flow: connect → disconnect → reconnect → verify history preserved
3. Fallback flow: connect → force failures → verify HTTP fallback → verify reconnection
4. Rate limiting flow: send 101 messages → verify rate limit → wait → verify reset
5. Hotel update flow: connect → update hotel data → verify notification received

### Load Testing

**Performance Requirements**:
- Support 100 concurrent WebSocket connections per server instance
- First chunk latency < 100ms (95th percentile)
- Subsequent chunk latency < 50ms (average)
- Connection establishment < 500ms

**Load Test Scenarios**:
1. Ramp up to 100 concurrent connections
2. Send messages from all connections simultaneously
3. Measure latency distribution
4. Verify no connection drops
5. Verify no memory leaks

### Testing Tools

**Recommended Tools**:
- **Unit Testing**: Jest (TypeScript/JavaScript)
- **Property Testing**: fast-check (TypeScript/JavaScript)
- **Integration Testing**: Playwright or Cypress
- **Load Testing**: k6 or Artillery
- **WebSocket Testing**: ws library for Node.js

### Continuous Integration

**CI Pipeline**:
1. Run unit tests on every commit
2. Run property tests on every commit (100 iterations each)
3. Run integration tests on pull requests
4. Run load tests on staging before production deploy
5. Fail build if any test fails

**Test Execution Time**:
- Unit tests: < 30 seconds
- Property tests: < 2 minutes (100 iterations × 15 properties)
- Integration tests: < 5 minutes
- Load tests: < 10 minutes


## Implementation Plan

### File-by-File Changes

#### New Files to Create

**1. `lib/websocket-client.ts`**
- Purpose: Client-side WebSocket connection management
- Components: ConnectionManager class
- Lines of Code: ~300
- Dependencies: None (browser WebSocket API)

**2. `lib/session-state.ts`**
- Purpose: Session state management with Redis
- Components: SessionStateManager class
- Lines of Code: ~150
- Dependencies: lib/redis.ts

**3. `lib/fallback-handler.ts`**
- Purpose: HTTP fallback logic
- Components: FallbackHandler class
- Lines of Code: ~200
- Dependencies: lib/websocket-client.ts

**4. `app/api/ws/route.ts`**
- Purpose: WebSocket server handler
- Components: GET handler for WebSocket upgrade
- Lines of Code: ~400
- Dependencies: lib/ai-service.ts, lib/session-state.ts, lib/rate-limiter.ts, lib/analytics.ts

**5. `lib/websocket-types.ts`**
- Purpose: TypeScript types for WebSocket messages
- Components: Message type definitions
- Lines of Code: ~100
- Dependencies: None

#### Files to Modify

**1. `lib/ai-service.ts`** (Enhancement)
- Add: `generateResponseStream()` async generator function
- Keep: Existing `generateResponse()` function unchanged
- Changes: ~50 lines added
- Backward Compatible: Yes

**2. `lib/redis.ts`** (Enhancement)
- Add: `subscribeToHotelUpdates()` function
- Add: `publishHotelUpdate()` function
- Changes: ~30 lines added
- Backward Compatible: Yes

**3. `app/hotel/[id]/page.tsx`** (Enhancement)
- Add: WebSocket connection logic
- Add: Streaming message display
- Add: Fallback handler integration
- Modify: Message sending logic to use WebSocket or HTTP
- Changes: ~200 lines added/modified
- Backward Compatible: Yes (feature flag controlled)

**4. `package.json`** (Enhancement)
- Add: `fast-check` for property-based testing
- Add: `ws` for WebSocket testing
- Changes: 2 dependencies added

#### Files Unchanged (Verification Required)

**1. `app/api/chat/route.ts`**
- No changes required
- Must verify: Still works identically
- Test: Run existing tests

**2. `lib/analytics.ts`**
- No changes required
- Must verify: Works with WebSocket messages
- Test: Verify analytics tracking

**3. `lib/rate-limiter.ts`**
- No changes required
- Must verify: Works with session-based rate limiting
- Test: Verify rate limits apply

**4. `lib/validation.ts`**
- No changes required
- Must verify: Validates WebSocket messages
- Test: Verify validation works

### Implementation Phases

#### Phase 1: Core Infrastructure (Week 1)

**Tasks**:
1. Create `lib/websocket-types.ts` with message type definitions
2. Create `lib/session-state.ts` with Redis session management
3. Enhance `lib/redis.ts` with pub/sub support
4. Create `lib/websocket-client.ts` with ConnectionManager
5. Write unit tests for all new components

**Deliverables**:
- All infrastructure files created
- Unit tests passing
- No integration yet

**Validation**:
- Unit tests pass
- Code review completed
- No regressions in existing functionality

#### Phase 2: Server-Side WebSocket (Week 2)

**Tasks**:
1. Create `app/api/ws/route.ts` with WebSocket handler
2. Enhance `lib/ai-service.ts` with streaming support
3. Integrate rate limiting, validation, analytics
4. Write integration tests for WebSocket endpoint
5. Test with mock client

**Deliverables**:
- WebSocket server endpoint functional
- Streaming AI responses working
- All security measures applied

**Validation**:
- Integration tests pass
- Manual testing with WebSocket client tool
- Rate limiting works
- Analytics tracking works

#### Phase 3: Client-Side Integration (Week 3)

**Tasks**:
1. Enhance `app/hotel/[id]/page.tsx` with WebSocket client
2. Create `lib/fallback-handler.ts` with HTTP fallback
3. Add typing indicators and streaming UI
4. Add connection state UI feedback
5. Write end-to-end tests

**Deliverables**:
- Full WebSocket chat working in browser
- Fallback to HTTP working
- UI polished and responsive

**Validation**:
- End-to-end tests pass
- Manual testing in browser
- Fallback mechanism works
- UI looks good

#### Phase 4: Testing and Optimization (Week 4)

**Tasks**:
1. Write property-based tests for all 15 properties
2. Run load tests with 100 concurrent connections
3. Optimize chunk buffering and latency
4. Add monitoring and logging
5. Write deployment documentation

**Deliverables**:
- All property tests passing (100 iterations each)
- Load tests passing
- Performance optimized
- Documentation complete

**Validation**:
- All tests pass
- Performance meets requirements
- Documentation reviewed
- Ready for deployment

#### Phase 5: Deployment (Week 5)

**Tasks**:
1. Deploy with feature flag OFF
2. Monitor for regressions (1 week)
3. Enable for 10% of users
4. Monitor metrics (latency, errors, fallback rate)
5. Gradually increase to 100%

**Deliverables**:
- Production deployment
- Monitoring dashboards
- Metrics collection
- Full rollout

**Validation**:
- No regressions detected
- Metrics within acceptable ranges
- User feedback positive
- Error rate < 5%

### Development Guidelines

**Code Style**:
- Follow existing TypeScript conventions
- Use async/await for asynchronous operations
- Add JSDoc comments for public APIs
- Use descriptive variable names

**Error Handling**:
- Always catch and log errors
- Provide user-friendly error messages
- Don't expose internal details in production
- Use consistent error response format

**Testing**:
- Write tests before implementation (TDD)
- Aim for 80%+ code coverage
- Test edge cases and error conditions
- Use property tests for general correctness

**Performance**:
- Minimize chunk buffering delay
- Use connection pooling for Redis
- Avoid blocking operations
- Profile and optimize hot paths

**Security**:
- Validate all inputs
- Sanitize all outputs
- Use WSS in production
- Apply rate limiting
- Log security events

### Risk Mitigation

**Risk 1: Vercel WebSocket Support**
- Mitigation: Implement HTTP fallback
- Detection: Environment detection on startup
- Recovery: Automatic fallback to HTTP

**Risk 2: Redis Unavailability**
- Mitigation: Graceful degradation (start with empty history)
- Detection: Redis health check
- Recovery: Continue processing, log warning

**Risk 3: Groq API Rate Limits**
- Mitigation: Implement request queuing
- Detection: Monitor API error responses
- Recovery: Show user-friendly message, suggest retry

**Risk 4: High Latency**
- Mitigation: Optimize chunk buffering
- Detection: Monitor latency metrics
- Recovery: Tune buffering parameters

**Risk 5: Memory Leaks**
- Mitigation: Proper cleanup on disconnect
- Detection: Monitor memory usage
- Recovery: Restart server instances


## Migration Strategy

### Zero-Downtime Deployment

**Approach**: Blue-Green Deployment with Feature Flags

**Steps**:

1. **Deploy New Code (Feature Flag OFF)**
   - Deploy all WebSocket code to production
   - Feature flag `ENABLE_WEBSOCKET=false`
   - All traffic uses existing HTTP endpoint
   - Monitor for 24 hours for any regressions

2. **Enable for Internal Testing**
   - Set `ENABLE_WEBSOCKET=true` for internal IPs only
   - Test all functionality in production environment
   - Verify metrics, logs, and monitoring
   - Fix any issues found

3. **Gradual Rollout to Users**
   - Week 1: Enable for 10% of users (random selection)
   - Week 2: Increase to 25% if metrics are good
   - Week 3: Increase to 50% if metrics are good
   - Week 4: Increase to 75% if metrics are good
   - Week 5: Enable for 100% of users

4. **Monitoring During Rollout**
   - Track: WebSocket connection success rate
   - Track: Fallback activation rate
   - Track: Error rate by error code
   - Track: Average latency (first chunk, subsequent chunks)
   - Track: User satisfaction (if available)

5. **Rollback Plan**
   - If error rate > 10%: Pause rollout, investigate
   - If error rate > 20%: Rollback to previous percentage
   - If critical bug found: Set `ENABLE_WEBSOCKET=false` immediately
   - Rollback time: < 5 minutes (feature flag change)

### Feature Flag Implementation

**Environment Variable**:
```bash
# .env.production
ENABLE_WEBSOCKET=true|false
```

**Runtime Check**:
```typescript
// lib/feature-flags.ts
export function isWebSocketEnabled(): boolean {
  const enabled = process.env.ENABLE_WEBSOCKET === 'true'
  const supported = isWebSocketSupported()
  return enabled && supported
}

// Client-side check
if (isWebSocketEnabled()) {
  // Use WebSocket
  initializeWebSocket()
} else {
  // Use HTTP (existing code)
  useHttpChat()
}
```

**Percentage-Based Rollout**:
```typescript
// lib/feature-flags.ts
export function isWebSocketEnabledForUser(sessionId: string): boolean {
  if (!isWebSocketEnabled()) return false
  
  const rolloutPercentage = parseInt(process.env.WEBSOCKET_ROLLOUT_PERCENTAGE || '100')
  const hash = hashCode(sessionId)
  const bucket = hash % 100
  
  return bucket < rolloutPercentage
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
```

### Data Migration

**No Database Migration Required**

The existing PostgreSQL schema supports WebSocket without changes. Redis keys are new and don't conflict with existing keys.

**Redis Key Namespacing**:
- Existing: `ratelimit:chat:*`, `ai:response:*`
- New: `session:*`, `ws:connections:*`, `hotel:*:updates`
- No conflicts, no migration needed

### Backward Compatibility Verification

**Checklist**:
- [ ] All existing HTTP chat tests pass
- [ ] HTTP endpoint works with WebSocket code deployed
- [ ] HTTP endpoint works with `ENABLE_WEBSOCKET=true`
- [ ] HTTP endpoint works with `ENABLE_WEBSOCKET=false`
- [ ] Analytics tracking identical for both protocols
- [ ] Rate limiting identical for both protocols
- [ ] Validation identical for both protocols
- [ ] No breaking changes to API contracts

**Verification Tests**:
```bash
# Run existing test suite
npm test

# Run with WebSocket enabled
ENABLE_WEBSOCKET=true npm test

# Run with WebSocket disabled
ENABLE_WEBSOCKET=false npm test

# All tests should pass in all configurations
```

### Monitoring and Alerting

**Metrics to Track**:
```typescript
// WebSocket-specific metrics
websocket_connections_total
websocket_connections_active
websocket_connection_duration_seconds
websocket_messages_sent_total
websocket_messages_received_total
websocket_errors_total{code}
websocket_fallback_activations_total
websocket_reconnection_attempts_total
websocket_first_chunk_latency_seconds
websocket_chunk_latency_seconds

// Comparison metrics
http_requests_total
http_response_time_seconds
```

**Alerts**:
```yaml
# Alert if WebSocket error rate > 5%
- alert: HighWebSocketErrorRate
  expr: rate(websocket_errors_total[5m]) / rate(websocket_messages_received_total[5m]) > 0.05
  for: 5m
  annotations:
    summary: "High WebSocket error rate"

# Alert if fallback rate > 10%
- alert: HighFallbackRate
  expr: rate(websocket_fallback_activations_total[5m]) / rate(websocket_connections_total[5m]) > 0.10
  for: 5m
  annotations:
    summary: "High WebSocket fallback rate"

# Alert if latency > 500ms
- alert: HighWebSocketLatency
  expr: histogram_quantile(0.95, websocket_first_chunk_latency_seconds) > 0.5
  for: 5m
  annotations:
    summary: "High WebSocket latency"
```

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):
```bash
# 1. Disable WebSocket via feature flag
export ENABLE_WEBSOCKET=false

# 2. Restart application (if needed)
vercel --prod

# 3. Verify HTTP endpoint working
curl https://app.example.com/api/chat

# 4. Monitor error rate
# Should drop to baseline within 5 minutes
```

**Gradual Rollback** (reduce percentage):
```bash
# Reduce rollout percentage
export WEBSOCKET_ROLLOUT_PERCENTAGE=50  # From 75%
export WEBSOCKET_ROLLOUT_PERCENTAGE=25  # From 50%
export WEBSOCKET_ROLLOUT_PERCENTAGE=10  # From 25%
export WEBSOCKET_ROLLOUT_PERCENTAGE=0   # Disable completely
```

### Success Criteria

**Deployment is successful if**:
- Error rate < 5% for WebSocket connections
- Fallback rate < 10% of connections
- 95th percentile first chunk latency < 100ms
- Average subsequent chunk latency < 50ms
- No increase in HTTP endpoint error rate
- All existing tests pass
- User feedback is positive

**Deployment should be rolled back if**:
- Error rate > 10% for 15 minutes
- Fallback rate > 20% for 15 minutes
- Critical bug discovered
- User complaints increase significantly
- HTTP endpoint affected negatively


## Summary

This design document specifies a comprehensive WebSocket-based real-time chat implementation for the Tunisia Hotel Assistant application. The design achieves the following key objectives:

### Key Features

1. **Real-Time Streaming**: Word-by-word AI response streaming with sub-100ms latency
2. **Robust Connection Management**: Automatic reconnection with exponential backoff
3. **HTTP Fallback**: Seamless fallback to existing HTTP endpoint when WebSocket unavailable
4. **Security Parity**: All existing security measures (rate limiting, validation, sanitization) applied to WebSocket
5. **Analytics Preservation**: Identical analytics tracking for both protocols
6. **Zero Downtime**: Feature-flagged gradual rollout with instant rollback capability
7. **Serverless Compatible**: Works in Vercel serverless environment with Redis state management

### Architecture Highlights

- **Client**: ConnectionManager handles lifecycle, FallbackHandler manages HTTP fallback
- **Server**: WebSocket handler in Next.js API route, enhanced AI service with streaming
- **State**: Redis for session state, conversation history, and pub/sub notifications
- **Protocol**: JSON-based message protocol with versioning support
- **Testing**: Dual approach with unit tests and property-based tests (15 properties)

### Implementation Approach

- **5-week implementation plan**: Infrastructure → Server → Client → Testing → Deployment
- **Gradual rollout**: 10% → 25% → 50% → 75% → 100% over 5 weeks
- **Monitoring**: Comprehensive metrics and alerts for error rate, latency, fallback rate
- **Rollback**: < 5 minutes via feature flag, no data migration required

### Correctness Guarantees

The design includes 15 correctness properties verified through property-based testing:

1. Streaming response equivalence (round-trip)
2. Connection state machine validity
3. Message chunk ordering and completeness
4. Rate limiting consistency across protocols
5. Analytics tracking completeness and consistency
6. Session state persistence across reconnections
7. Input validation and sanitization idempotence
8. Fallback mode equivalence
9. Message protocol format consistency
10. Security parity across protocols
11. Backward compatibility preservation
12. Typing indicator state consistency
13. Hotel data change notification broadcast
14. Connection duplicate prevention
15. Heartbeat ping periodicity

### Risk Mitigation

- **Vercel WebSocket support**: Automatic HTTP fallback
- **Redis unavailability**: Graceful degradation with empty history
- **Groq API limits**: Request queuing and user-friendly messages
- **High latency**: Optimized chunk buffering
- **Memory leaks**: Proper cleanup on disconnect

### Success Metrics

- Error rate < 5%
- Fallback rate < 10%
- First chunk latency < 100ms (95th percentile)
- Subsequent chunk latency < 50ms (average)
- 100% backward compatibility maintained
- Zero breaking changes to existing functionality

---

**Document Version**: 1.0  
**Status**: Ready for Review  
**Next Steps**: Review and approval, then proceed to implementation Phase 1

