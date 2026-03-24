// WebSocket Message Type Definitions
// Defines all message types for WebSocket communication between client and server

// ============================================
// Connection State Types
// ============================================

export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed'

// ============================================
// Error Code Types
// ============================================

export type ErrorCode =
  | 'CONNECTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AI_SERVICE_ERROR'
  | 'SESSION_EXPIRED'
  | 'AUTHENTICATION_ERROR'
  | 'UNKNOWN_ERROR'

// ============================================
// Client to Server Messages
// ============================================

/**
 * Chat message sent from client to server
 * Contains the user's message and context needed for AI response
 */
export interface ChatMessage {
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

/**
 * Heartbeat ping message to keep connection alive
 */
export interface PingMessage {
  type: 'ping'
  timestamp: number
}

// Union type for all client-to-server messages
export type ClientMessage = ChatMessage | PingMessage

// ============================================
// Server to Client Messages
// ============================================

/**
 * Message chunk streamed from server to client
 * Part of an AI response being delivered incrementally
 */
export interface ChunkMessage {
  type: 'chunk'
  messageId: string // Correlates with original chat message
  chunk: string // Partial response text
  isComplete: boolean
  timestamp: number
}

/**
 * Typing indicator messages
 */
export interface TypingStartMessage {
  type: 'typing_start'
  timestamp: number
}

export interface TypingEndMessage {
  type: 'typing_end'
  timestamp: number
}

export type TypingMessage = TypingStartMessage | TypingEndMessage

/**
 * Error message sent when something goes wrong
 */
export interface ErrorMessage {
  type: 'error'
  code: ErrorCode
  message: string // Human-readable error message
  recoverable: boolean // Can client retry?
  retryAfter?: number // Seconds to wait before retry (for rate limits)
  timestamp: number
}

/**
 * Notification message for hotel data changes or system events
 */
export interface NotificationMessage {
  type: 'notification'
  category: 'hotel_update' | 'system'
  title: string
  message: string
  actionRequired: boolean
  timestamp: number
}

/**
 * Heartbeat pong response
 */
export interface PongMessage {
  type: 'pong'
  timestamp: number
}

// Union type for all server-to-client messages
export type ServerMessage = 
  | ChunkMessage 
  | TypingMessage 
  | ErrorMessage 
  | NotificationMessage 
  | PongMessage

// ============================================
// WebSocket Message (Union of all types)
// ============================================

export type WebSocketMessage = ClientMessage | ServerMessage

// ============================================
// Helper Type Guards
// ============================================

export function isClientMessage(message: WebSocketMessage): message is ClientMessage {
  return message.type === 'chat_message' || message.type === 'ping'
}

export function isServerMessage(message: WebSocketMessage): message is ServerMessage {
  return message.type === 'chunk' 
    || message.type === 'typing_start' 
    || message.type === 'typing_end'
    || message.type === 'error' 
    || message.type === 'notification' 
    || message.type === 'pong'
}

export function isChatMessage(message: WebSocketMessage): message is ChatMessage {
  return message.type === 'chat_message'
}

export function isChunkMessage(message: WebSocketMessage): message is ChunkMessage {
  return message.type === 'chunk'
}

export function isErrorMessage(message: WebSocketMessage): message is ErrorMessage {
  return message.type === 'error'
}

export function isTypingMessage(message: WebSocketMessage): message is TypingMessage {
  return message.type === 'typing_start' || message.type === 'typing_end'
}

export function isNotificationMessage(message: WebSocketMessage): message is NotificationMessage {
  return message.type === 'notification'
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validates that a message has all required fields for its type
 */
export function hasRequiredFields(message: any): boolean {
  if (!message || typeof message !== 'object' || !message.type) {
    return false
  }

  switch (message.type) {
    case 'chat_message':
      return !!(
        message.messageId &&
        message.message &&
        message.sessionId &&
        message.hotelData &&
        message.hotelData.id &&
        message.timestamp
      )
    
    case 'ping':
      return !!message.timestamp
    
    case 'chunk':
      return !!(
        message.messageId &&
        message.chunk !== undefined &&
        message.isComplete !== undefined &&
        message.timestamp
      )
    
    case 'typing_start':
    case 'typing_end':
      return !!message.timestamp
    
    case 'error':
      return !!(
        message.code &&
        message.message &&
        message.recoverable !== undefined &&
        message.timestamp
      )
    
    case 'notification':
      return !!(
        message.category &&
        message.title &&
        message.message &&
        message.actionRequired !== undefined &&
        message.timestamp
      )
    
    case 'pong':
      return !!message.timestamp
    
    default:
      return false
  }
}

/**
 * Validates that a message is valid JSON
 */
export function isValidJSON(data: string): boolean {
  try {
    JSON.parse(data)
    return true
  } catch {
    return false
  }
}
