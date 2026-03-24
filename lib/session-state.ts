// Session State Management with Redis
// Manages conversation history and session metadata for WebSocket connections

import { getRedisClient } from './redis'
import type { GuestProfile } from './analytics'

// ============================================
// Types
// ============================================

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface SessionState {
  sessionId: string
  hotelId: string
  conversationHistory: Message[]
  guestProfile: GuestProfile | null
  createdAt: number
  lastActivity: number
}

// ============================================
// Session State Manager Class
// ============================================

export class SessionStateManager {
  private readonly ttl: number = 86400 // 24 hours in seconds

  /**
   * Get session state from Redis
   * Returns null if session doesn't exist or Redis is unavailable
   */
  async getState(sessionId: string): Promise<SessionState | null> {
    try {
      const redis = getRedisClient()
      const key = `session:${sessionId}`
      const data = await redis.get(key)
      
      if (!data) {
        console.log(`📭 Session not found: ${sessionId}`)
        return null
      }
      
      const state = JSON.parse(data) as SessionState
      console.log(`📬 Session loaded: ${sessionId} (${state.conversationHistory.length} messages)`)
      return state
    } catch (error) {
      console.error('Error getting session state:', error)
      // Graceful degradation - return null instead of throwing
      return null
    }
  }

  /**
   * Save session state to Redis with 24-hour TTL
   * Updates lastActivity timestamp automatically
   */
  async setState(state: SessionState): Promise<void> {
    try {
      const redis = getRedisClient()
      const key = `session:${state.sessionId}`
      
      const stateWithActivity = {
        ...state,
        lastActivity: Date.now()
      }
      
      await redis.setex(
        key,
        this.ttl,
        JSON.stringify(stateWithActivity)
      )
      
      console.log(`💾 Session saved: ${state.sessionId} (TTL: ${this.ttl}s)`)
    } catch (error) {
      console.error('Error setting session state:', error)
      // Don't throw - session state failure shouldn't break chat
    }
  }

  /**
   * Update conversation history by appending a new message
   * Maintains only the last 6 messages (3 exchanges)
   */
  async updateHistory(
    sessionId: string,
    message: Message
  ): Promise<void> {
    try {
      const state = await this.getState(sessionId)
      
      if (!state) {
        console.warn(`Cannot update history: session ${sessionId} not found`)
        return
      }
      
      // Append new message and keep last 6 messages
      const history = [...state.conversationHistory, message].slice(-6)
      
      await this.setState({
        ...state,
        conversationHistory: history
      })
      
      console.log(`📝 History updated: ${sessionId} (${history.length} messages)`)
    } catch (error) {
      console.error('Error updating conversation history:', error)
    }
  }

  /**
   * Create a new session state
   * Used when a new WebSocket connection is established
   */
  async createState(
    sessionId: string,
    hotelId: string,
    guestProfile: GuestProfile | null = null
  ): Promise<SessionState> {
    const state: SessionState = {
      sessionId,
      hotelId,
      conversationHistory: [],
      guestProfile,
      createdAt: Date.now(),
      lastActivity: Date.now()
    }
    
    await this.setState(state)
    console.log(`✨ New session created: ${sessionId}`)
    
    return state
  }

  /**
   * Delete session state from Redis
   * Used for cleanup or when session expires
   */
  async deleteState(sessionId: string): Promise<void> {
    try {
      const redis = getRedisClient()
      const key = `session:${sessionId}`
      await redis.del(key)
      console.log(`🗑️ Session deleted: ${sessionId}`)
    } catch (error) {
      console.error('Error deleting session state:', error)
    }
  }

  /**
   * Check if a session exists and is valid
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      const redis = getRedisClient()
      const key = `session:${sessionId}`
      const exists = await redis.exists(key)
      return exists === 1
    } catch (error) {
      console.error('Error checking session existence:', error)
      return false
    }
  }

  /**
   * Get or create session state
   * Convenience method that creates a new session if it doesn't exist
   */
  async getOrCreateState(
    sessionId: string,
    hotelId: string,
    guestProfile: GuestProfile | null = null
  ): Promise<SessionState> {
    const existing = await this.getState(sessionId)
    
    if (existing) {
      return existing
    }
    
    return await this.createState(sessionId, hotelId, guestProfile)
  }

  /**
   * Update guest profile in session state
   */
  async updateGuestProfile(
    sessionId: string,
    guestProfile: GuestProfile
  ): Promise<void> {
    try {
      const state = await this.getState(sessionId)
      
      if (!state) {
        console.warn(`Cannot update profile: session ${sessionId} not found`)
        return
      }
      
      await this.setState({
        ...state,
        guestProfile
      })
      
      console.log(`👤 Guest profile updated: ${sessionId}`)
    } catch (error) {
      console.error('Error updating guest profile:', error)
    }
  }

  /**
   * Get session TTL (time to live) in seconds
   * Returns -1 if session doesn't exist, -2 if no expiration set
   */
  async getSessionTTL(sessionId: string): Promise<number> {
    try {
      const redis = getRedisClient()
      const key = `session:${sessionId}`
      return await redis.ttl(key)
    } catch (error) {
      console.error('Error getting session TTL:', error)
      return -1
    }
  }

  /**
   * Extend session TTL by resetting it to 24 hours
   * Useful when user is actively chatting
   */
  async extendSession(sessionId: string): Promise<void> {
    try {
      const state = await this.getState(sessionId)
      
      if (state) {
        await this.setState(state) // This resets the TTL
        console.log(`⏰ Session TTL extended: ${sessionId}`)
      }
    } catch (error) {
      console.error('Error extending session:', error)
    }
  }
}

// Export singleton instance
export const sessionStateManager = new SessionStateManager()
