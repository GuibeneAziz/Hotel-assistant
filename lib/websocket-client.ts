// WebSocket Client Connection Manager
// Handles WebSocket connection lifecycle, reconnection, and heartbeat

import type {
  ConnectionState,
  WebSocketMessage,
  ClientMessage,
  ServerMessage,
  PingMessage,
  PongMessage
} from './websocket-types'

// ============================================
// Connection Manager Class
// ============================================

export class ConnectionManager {
  private ws: WebSocket | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts: number = 0
  private readonly maxReconnectAttempts: number = 5
  private readonly heartbeatIntervalMs: number = 30000 // 30 seconds
  private readonly heartbeatTimeoutMs: number = 5000 // 5 seconds
  private lastPongTime: number = 0
  private messageHandlers: Set<(message: ServerMessage) => void> = new Set()
  private stateChangeHandlers: Set<(state: ConnectionState) => void> = new Set()
  private currentState: ConnectionState = 'disconnected'

  constructor(
    private url: string,
    private sessionId: string
  ) {}

  /**
   * Get current connection state
   */
  get state(): ConnectionState {
    return this.currentState
  }

  /**
   * Check if currently connected
   */
  get isConnected(): boolean {
    return this.currentState === 'connected' && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Establish WebSocket connection
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Already connected')
      return
    }

    this.setState('connecting')

    try {
      // Build WebSocket URL with session ID
      const wsUrl = `${this.url}?sessionId=${encodeURIComponent(this.sessionId)}`
      
      this.ws = new WebSocket(wsUrl)

      // Set up event handlers
      this.ws.onopen = () => this.handleOpen()
      this.ws.onmessage = (event) => this.handleMessage(event)
      this.ws.onclose = (event) => this.handleClose(event)
      this.ws.onerror = (error) => this.handleError(error)

      // Wait for connection to open or fail
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 5000)

        const onOpen = () => {
          clearTimeout(timeout)
          resolve()
        }

        const onError = () => {
          clearTimeout(timeout)
          reject(new Error('Connection failed'))
        }

        this.ws!.addEventListener('open', onOpen, { once: true })
        this.ws!.addEventListener('error', onError, { once: true })
      })
    } catch (error) {
      console.error('Connection error:', error)
      this.setState('disconnected')
      throw error
    }
  }

  /**
   * Close WebSocket connection gracefully
   */
  disconnect(): void {
    this.stopHeartbeat()
    this.stopReconnect()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.setState('disconnected')
    console.log('Disconnected')
  }

  /**
   * Send a message via WebSocket
   */
  send(message: ClientMessage): void {
    if (!this.isConnected) {
      throw new Error('Not connected')
    }

    try {
      this.ws!.send(JSON.stringify(message))
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * Register a message handler
   */
  onMessage(handler: (message: ServerMessage) => void): () => void {
    this.messageHandlers.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  /**
   * Register a state change handler
   */
  onStateChange(handler: (state: ConnectionState) => void): () => void {
    this.stateChangeHandlers.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.stateChangeHandlers.delete(handler)
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.setState('failed')
      return
    }

    this.setState('reconnecting')
    this.reconnectAttempts++

    const delay = this.getReconnectDelay()
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect()
        this.reconnectAttempts = 0 // Reset on successful connection
      } catch (error) {
        console.error('Reconnection failed:', error)
        this.reconnect() // Try again
      }
    }, delay)
  }

  /**
   * Calculate reconnection delay with exponential backoff
   * Returns: 1s, 2s, 4s, 8s, 16s, max 30s
   */
  private getReconnectDelay(): number {
    const delays = [1000, 2000, 4000, 8000, 16000]
    const delay = delays[this.reconnectAttempts - 1] || 30000
    return Math.min(delay, 30000)
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.lastPongTime = Date.now()

    this.heartbeatInterval = setInterval(() => {
      // Check if we received a pong recently
      const timeSinceLastPong = Date.now() - this.lastPongTime
      
      if (timeSinceLastPong > this.heartbeatIntervalMs + this.heartbeatTimeoutMs) {
        console.warn('Heartbeat timeout - connection appears dead')
        this.handleClose({ code: 1006, reason: 'Heartbeat timeout' } as CloseEvent)
        return
      }

      // Send ping
      try {
        const ping: PingMessage = {
          type: 'ping',
          timestamp: Date.now()
        }
        this.send(ping)
      } catch (error) {
        console.error('Error sending ping:', error)
      }
    }, this.heartbeatIntervalMs)
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.reconnectAttempts = 0
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected')
    this.setState('connected')
    this.startHeartbeat()
    this.reconnectAttempts = 0
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as ServerMessage

      // Handle pong messages internally
      if (message.type === 'pong') {
        this.lastPongTime = Date.now()
        return
      }

      // Notify all message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          console.error('Error in message handler:', error)
        }
      })
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`)
    this.stopHeartbeat()

    // Don't reconnect if it was a normal closure
    if (event.code === 1000) {
      this.setState('disconnected')
      return
    }

    // Attempt reconnection for abnormal closures
    this.reconnect()
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error)
    // Error will be followed by close event, which handles reconnection
  }

  /**
   * Set connection state and notify handlers
   */
  private setState(state: ConnectionState): void {
    if (this.currentState === state) {
      return
    }

    this.currentState = state
    console.log(`Connection state: ${state}`)

    // Notify all state change handlers
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(state)
      } catch (error) {
        console.error('Error in state change handler:', error)
      }
    })
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disconnect()
    this.messageHandlers.clear()
    this.stateChangeHandlers.clear()
  }
}
