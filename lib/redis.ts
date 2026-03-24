import Redis from 'ioredis'

// Singleton pattern for Redis client
let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    // For Upstash or cloud Redis (recommended for production)
    if (process.env.REDIS_URL) {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        tls: {
          rejectUnauthorized: false, // Required for Upstash
        },
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })
    } 
    // For local Redis (development)
    else {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        maxRetriesPerRequest: 3,
      })
    }

    redis.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message)
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    redis.on('ready', () => {
      console.log('✅ Redis is ready to accept commands')
    })
  }

  return redis
}

// Helper function to get cached data
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const cached = await redis.get(key)
    
    if (cached) {
      console.log(`✅ Cache HIT: ${key}`)
      return JSON.parse(cached) as T
    }
    
    console.log(`❌ Cache MISS: ${key}`)
    return null
  } catch (error) {
    console.error('Redis GET error:', error)
    return null // Graceful fallback
  }
}

// Helper function to set cached data
export async function setCache(
  key: string,
  value: any,
  expirationSeconds: number = 3600
): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.setex(key, expirationSeconds, JSON.stringify(value))
    console.log(`💾 Cached: ${key} (TTL: ${expirationSeconds}s)`)
  } catch (error) {
    console.error('Redis SET error:', error)
    // Don't throw - caching failure shouldn't break the app
  }
}

// Helper function to delete cached data
export async function deleteCache(key: string): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(key)
    console.log(`🗑️ Deleted cache: ${key}`)
  } catch (error) {
    console.error('Redis DELETE error:', error)
  }
}

// Helper function to delete multiple keys by pattern
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️ Deleted ${keys.length} cache keys matching: ${pattern}`)
    }
  } catch (error) {
    console.error('Redis DELETE PATTERN error:', error)
  }
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}
