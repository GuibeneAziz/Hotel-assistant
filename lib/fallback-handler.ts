// HTTP Fallback Handler
// Transparently routes messages through HTTP when WebSocket is unavailable

import type { ConnectionManager } from './websocket-client'
import type { ChatMessage } from './websocket-types'

interface FallbackMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SendOptions {
  message: string
  sessionId: string
  hotelData: { id: string; name: string }
  weather?: any
}

/**
 * FallbackHandler wraps a ConnectionManager and falls back to the HTTP
 * /api/chat endpoint when WebSocket is unavailable or has failed.
 *
 * Usage:
 *   const handler = new FallbackHandler(connectionManager)
 *   const response = await handler.sendMessage({ message, sessionId, hotelData })
 */
export class FallbackHandler {
  private usingFallback: boolean = false
  private reconnectTimer: ReturnType<typeof setInterval> | null = null
  private conversationHistory: FallbackMessage[] = []
  private readonly reconnectIntervalMs = 60_000 // try to restore WS every 60s

  constructor(private connectionManager: ConnectionManager) {}

  /** True when currently routing through HTTP instead of WebSocket */
  get isFallbackActive(): boolean {
    return this.usingFallback
  }

  /**
   * Enable HTTP fallback mode.
   * Called automatically after repeated WebSocket failures.
   */
  enableHttpFallback(): void {
    if (this.usingFallback) return
    this.usingFallback = true
    console.warn('⚠️  Switched to HTTP fallback mode')
    this.startReconnectTimer()
  }

  /**
   * Disable HTTP fallback and return to WebSocket mode.
   */
  disableHttpFallback(): void {
    this.usingFallback = false
    this.stopReconnectTimer()
    console.log('✅ Restored WebSocket mode')
  }

  /**
   * Send a message, routing through WebSocket or HTTP depending on current mode.
   * Returns the assistant response text (HTTP mode only; WS mode streams via handlers).
   */
  async sendMessage(opts: SendOptions): Promise<string | null> {
    if (this.usingFallback || !this.connectionManager.isConnected) {
      return this.sendViaHttp(opts)
    }
    this.sendViaWebSocket(opts)
    return null // response arrives via WebSocket message handlers
  }

  /**
   * Send via the existing HTTP /api/chat endpoint.
   */
  async sendViaHttp(opts: SendOptions): Promise<string> {
    const { message, sessionId, hotelData, weather } = opts

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        hotelData,
        weather: weather ?? null,
        sessionId,
        conversationHistory: this.conversationHistory.slice(-6),
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    // Keep local history in sync for HTTP mode
    this.conversationHistory.push({ role: 'user', content: message })
    this.conversationHistory.push({ role: 'assistant', content: data.response })
    // Keep last 6 messages
    this.conversationHistory = this.conversationHistory.slice(-6)

    return data.response as string
  }

  /**
   * Send via WebSocket (fire-and-forget; response arrives via onMessage handlers).
   */
  private sendViaWebSocket(opts: SendOptions): void {
    const chatMsg: ChatMessage = {
      type: 'chat_message',
      messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: opts.message,
      sessionId: opts.sessionId,
      hotelData: opts.hotelData,
      timestamp: Date.now(),
    }
    this.connectionManager.send(chatMsg)
  }

  /**
   * Periodically attempt to reconnect WebSocket while in fallback mode.
   */
  private startReconnectTimer(): void {
    this.stopReconnectTimer()
    this.reconnectTimer = setInterval(async () => {
      if (this.connectionManager.isConnected) {
        this.disableHttpFallback()
        return
      }
      try {
        await this.connectionManager.connect()
        this.disableHttpFallback()
      } catch {
        // Still unavailable – keep trying
      }
    }, this.reconnectIntervalMs)
  }

  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /** Clean up timers */
  destroy(): void {
    this.stopReconnectTimer()
  }
}
