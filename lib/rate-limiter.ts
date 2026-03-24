// Rate Limiting System
// OWASP: Implement rate limiting to prevent abuse and DDoS attacks

import Redis from 'ioredis'

interface RateLimitConfig {
  windowMs: number        // Time window in milliseconds
  maxRequests: number     // Maximum requests per window
  keyPrefix: string       // Redis key prefix
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number  // Seconds until reset
}

/**
 * Rate Limiter using Redis with sliding window algorithm
 * OWASP: Rate limiting is essential for preventing abuse
 */
export class RateLimiter {
  private config: RateLimitConfig
  private redis: Redis | null = null
  private redisAvailable: boolean = true

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Initialize Redis connection
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              this.redisAvailable = false
              console.warn('⚠️  Redis unavailable - rate limiting disabled')
              return null
            }
            return Math.min(times * 100, 3000)
          }
        })
      }
    } catch (error) {
      console.error('Failed to initialize Redis for rate limiting:', error)
      this.redisAvailable = false
    }
  }

  /**
   * Check if request is within rate limit
   * Uses sliding window algorithm for accurate rate limiting
   * @param identifier - Unique identifier (usually IP address)
   * @returns Rate limit result
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    // If Redis is unavailable, allow request (fail open)
    if (!this.redis || !this.redisAvailable) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs)
      }
    }

    const key = `${this.config.keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()
      
      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart)
      
      // Count requests in current window
      pipeline.zcard(key)
      
      // Add current request
      pipeline.zadd(key, now, `${now}`)
      
      // Set expiration
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000))
      
      const results = await pipeline.exec()
      
      if (!results) {
        throw new Error('Pipeline execution failed')
      }

      // Get count before adding current request
      const count = (results[1][1] as number) || 0
      const remaining = Math.max(0, this.config.maxRequests - count - 1)
      const resetTime = new Date(now + this.config.windowMs)

      if (count >= this.config.maxRequests) {
        // Rate limit exceeded
        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(this.config.windowMs / 1000)
        }
      }

      // Within rate limit
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // On error, fail open (allow request)
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs)
      }
    }
  }

  /**
   * Reset rate limit for an identifier
   * Useful for testing or manual intervention
   * @param identifier - Identifier to reset
   */
  async resetLimit(identifier: string): Promise<void> {
    if (!this.redis || !this.redisAvailable) return

    const key = `${this.config.keyPrefix}:${identifier}`
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}

// Predefined rate limiters for different endpoints
// OWASP: Different endpoints should have different rate limits based on sensitivity

/**
 * Rate limiter for chat endpoint
 * 100 requests per 15 minutes per IP
 */
export const chatRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'ratelimit:chat'
})

/**
 * Rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP (strict for security)
 */
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'ratelimit:auth'
})

/**
 * Rate limiter for general API endpoints
 * 50 requests per 15 minutes per IP
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
  keyPrefix: 'ratelimit:api'
})

/**
 * Rate limiter for admin/analytics endpoints
 * 30 requests per 15 minutes per IP
 */
export const adminRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30,
  keyPrefix: 'ratelimit:admin'
})

/**
 * Helper function to get client IP from request
 * Handles various proxy headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers
  
  // Check common proxy headers
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback to a default (not ideal, but prevents errors)
  return 'unknown'
}
