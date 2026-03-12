# Redis Caching Implementation Plan

## 🎯 Goal
Add Redis caching layer to improve performance and reduce API calls to Groq.

---

## 📊 Why Redis Caching?

### Current Issues:
- ❌ Every chat message calls Groq API (costs time)
- ❌ Same questions asked repeatedly hit API
- ❌ Hotel settings fetched on every page load
- ❌ Weather data fetched multiple times

### With Redis:
- ✅ Cache AI responses for common questions
- ✅ Cache hotel settings (update only when admin changes)
- ✅ Cache weather data (refresh every 30 min)
- ✅ Reduce Groq API calls by 60-80%
- ✅ Faster response times (< 50ms from cache)

---

## 🏗️ Architecture

```
User Question
    ↓
Check Redis Cache
    ↓
┌─────────────────┐
│ Cache Hit?      │
└─────────────────┘
    ↓           ↓
   YES         NO
    ↓           ↓
Return      Call Groq API
Cached          ↓
Response    Store in Redis
    ↓           ↓
    └───────────┘
         ↓
    Return to User
```

---

## 📦 Installation

### Option 1: Local Redis (Development)

**Windows:**
```bash
# Using Chocolatey
choco install redis-64

# Or download from:
# https://github.com/microsoftarchive/redis/releases
```

**Start Redis:**
```bash
redis-server
```

### Option 2: Cloud Redis (Production) - FREE Options

**Upstash (Recommended):**
- Free tier: 10,000 commands/day
- Serverless (no server to manage)
- Global edge network
- Sign up: https://upstash.com

**Redis Cloud:**
- Free tier: 30MB storage
- Sign up: https://redis.com/try-free

---

## 🔧 Implementation Steps

### Step 1: Install Redis Client

```bash
npm install ioredis
npm install @types/ioredis --save-dev
```

### Step 2: Create Redis Client

Create `lib/redis.ts`:

```typescript
import Redis from 'ioredis'

// Singleton pattern for Redis client
let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    // For Upstash (recommended for production)
    if (process.env.REDIS_URL) {
      redis = new Redis(process.env.REDIS_URL)
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
      console.error('Redis Client Error:', err)
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })
  }

  return redis
}

// Helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

export async function setCache(
  key: string,
  value: any,
  expirationSeconds: number = 3600
): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.setex(key, expirationSeconds, JSON.stringify(value))
  } catch (error) {
    console.error('Redis SET error:', error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(key)
  } catch (error) {
    console.error('Redis DELETE error:', error)
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis DELETE PATTERN error:', error)
  }
}
```

### Step 3: Add Caching to AI Service

Update `lib/ai-service.ts`:

```typescript
import Groq from 'groq-sdk'
import { getCached, setCache } from './redis'
import crypto from 'crypto'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Generate cache key from message and context
function generateCacheKey(
  userMessage: string,
  hotelContext: string
): string {
  const content = `${userMessage}:${hotelContext}`
  return `ai:response:${crypto.createHash('md5').update(content).digest('hex')}`
}

export async function generateResponse(
  userMessage: string,
  hotelContext: string,
  conversationHistory: Message[] = []
): Promise<string> {
  try {
    // Check cache first (only for messages without history)
    if (conversationHistory.length === 0) {
      const cacheKey = generateCacheKey(userMessage, hotelContext)
      const cached = await getCached<string>(cacheKey)
      
      if (cached) {
        console.log('✅ Cache hit for:', userMessage.substring(0, 50))
        return cached
      }
    }

    // API key check
    const apiKey = process.env.GROQ_API_KEY || ''
    console.log('API Key Check:', {
      exists: !!apiKey,
      length: apiKey.length,
      preview: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'none'
    })
    
    const systemPrompt = `You are a helpful, friendly hotel concierge AI assistant for a luxury hotel in Tunisia.

IMPORTANT INSTRUCTIONS:
- Provide accurate, helpful responses based on the hotel information provided
- Be polite, professional, and conversational
- Respond in the SAME LANGUAGE as the user's question (English, French, Spanish, Arabic, German, Italian, etc.)
- If you don't know something, politely say so and offer to help with something else
- Handle typos and understand the user's intent
- Keep responses concise but informative (2-4 sentences usually)
- When suggesting activities, consider the weather and guest preferences
- Always mention specific times, prices, and locations when available

HOTEL INFORMATION:
${hotelContext}

Remember: Respond naturally in the user's language and be helpful!`

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: userMessage },
    ]

    const response = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      stream: false,
    })

    const aiResponse = response.choices[0]?.message?.content || 
      'I apologize, I could not generate a response. Please try again.'

    // Cache the response (only for messages without history)
    if (conversationHistory.length === 0) {
      const cacheKey = generateCacheKey(userMessage, hotelContext)
      await setCache(cacheKey, aiResponse, 3600) // Cache for 1 hour
      console.log('💾 Cached response for:', userMessage.substring(0, 50))
    }

    return aiResponse
    
  } catch (error: any) {
    console.error('Groq API Error Details:', {
      message: error.message,
      status: error.status,
      error: error,
    })
    
    if (error.message?.includes('API key') || error.status === 401) {
      throw new Error('Invalid API key. Please check your Groq API key in .env.local')
    }
    
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.')
    }
    
    throw new Error(`AI Error: ${error.message || 'Unknown error occurred'}`)
  }
}

export async function checkAIService(): Promise<boolean> {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured')
      return false
    }
    return true
  } catch (error) {
    console.error('AI Service health check failed:', error)
    return false
  }
}
```

### Step 4: Add Caching to Hotel Settings API

Update `app/api/hotel-settings/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { defaultHotelSettings } from '../../../lib/hotelData'
import { getCached, setCache, deleteCachePattern } from '@/lib/redis'

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'hotel-settings.json')
const CACHE_KEY = 'hotel:settings:all'
const CACHE_TTL = 3600 // 1 hour

export async function GET() {
  try {
    // Check cache first
    const cached = await getCached(CACHE_KEY)
    if (cached) {
      console.log('✅ Cache hit: hotel settings')
      return NextResponse.json(cached)
    }

    // Read from file
    const data = await readFile(DATA_FILE, 'utf-8')
    const settings = JSON.parse(data)

    // Cache the result
    await setCache(CACHE_KEY, settings, CACHE_TTL)
    console.log('💾 Cached: hotel settings')

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error reading hotel settings:', error)
    
    // Return default settings if file doesn't exist
    await setCache(CACHE_KEY, defaultHotelSettings, CACHE_TTL)
    return NextResponse.json(defaultHotelSettings)
  }
}

export async function POST(request: Request) {
  try {
    const settings = await request.json()

    // Ensure data directory exists
    try {
      await mkdir(DATA_DIR, { recursive: true })
    } catch (err) {
      // Directory might already exist
    }

    // Write to file
    await writeFile(DATA_FILE, JSON.stringify(settings, null, 2), 'utf-8')

    // Invalidate cache
    await deleteCachePattern('hotel:settings:*')
    await deleteCachePattern('ai:response:*') // Invalidate AI responses too
    console.log('🗑️ Cache invalidated: hotel settings & AI responses')

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    })
  } catch (error) {
    console.error('Error saving hotel settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
```

### Step 5: Add Weather Caching

Update `app/hotel/[id]/page.tsx`:

```typescript
import { getCached, setCache } from '@/lib/redis'

// In the component
const fetchWeather = async () => {
  if (!hotel) return
  
  // Check cache first
  const cacheKey = `weather:${hotel.coordinates.lat}:${hotel.coordinates.lon}`
  const cached = await getCached<WeatherData>(cacheKey)
  
  if (cached) {
    console.log('✅ Cache hit: weather')
    setWeather(cached)
    return
  }
  
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${hotel.coordinates.lat}&longitude=${hotel.coordinates.lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
    )
    const data = await response.json()
    const current = data.current_weather

    const weatherData = {
      temperature: current.temperature,
      description: getWeatherDescription(current.weathercode),
      humidity: data.hourly.relative_humidity_2m[0],
      wind_speed: current.windspeed,
      feels_like: current.temperature + 2
    }
    
    setWeather(weatherData)
    
    // Cache for 30 minutes
    await setCache(cacheKey, weatherData, 1800)
    console.log('💾 Cached: weather')
  } catch (error) {
    console.error('Weather fetch failed:', error)
  }
}
```

### Step 6: Environment Variables

Update `.env.local`:

```env
# Groq API
GROQ_API_KEY=your_groq_key_here

# Redis Configuration
# For Upstash (recommended for production)
REDIS_URL=redis://default:your_password@your-redis.upstash.io:6379

# OR for local Redis (development)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
```

---

## 📊 Caching Strategy

### Cache Keys Structure:
```
ai:response:{hash}           - AI responses (1 hour)
hotel:settings:all           - Hotel settings (1 hour)
hotel:settings:{hotelId}     - Specific hotel (1 hour)
weather:{lat}:{lon}          - Weather data (30 min)
```

### Cache Invalidation:
```
Admin updates settings → Invalidate hotel:* and ai:*
Weather updates → Auto-expire after 30 min
AI responses → Auto-expire after 1 hour
```

---

## 🚀 Testing

### Test Redis Connection:

Create `test-redis.js`:

```javascript
const Redis = require('ioredis')

async function testRedis() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379
  })

  try {
    // Test SET
    await redis.set('test:key', 'Hello Redis!')
    console.log('✅ SET successful')

    // Test GET
    const value = await redis.get('test:key')
    console.log('✅ GET successful:', value)

    // Test EXPIRE
    await redis.expire('test:key', 10)
    console.log('✅ EXPIRE successful')

    // Test DELETE
    await redis.del('test:key')
    console.log('✅ DELETE successful')

    console.log('\n🎉 Redis is working perfectly!')
  } catch (error) {
    console.error('❌ Redis error:', error)
  } finally {
    redis.disconnect()
  }
}

testRedis()
```

Run:
```bash
node test-redis.js
```

---

## 📈 Performance Improvements

### Before Redis:
```
User asks: "What time does pool open?"
→ Call Groq API: ~1-2 seconds
→ Total: 1-2 seconds
```

### After Redis:
```
First time:
→ Call Groq API: ~1-2 seconds
→ Cache response
→ Total: 1-2 seconds

Subsequent times:
→ Get from Redis: ~10-50ms
→ Total: 10-50ms (20-200x faster!)
```

### Expected Results:
- ✅ 60-80% reduction in Groq API calls
- ✅ 95% faster response for cached queries
- ✅ Lower costs (fewer API calls)
- ✅ Better user experience

---

## 🔒 Security Considerations

1. **Redis Password**: Always use password in production
2. **SSL/TLS**: Use encrypted connections (Upstash provides this)
3. **Key Expiration**: Always set TTL to prevent memory issues
4. **Error Handling**: Graceful fallback if Redis is down

---

## 💰 Cost Analysis

### Upstash Free Tier:
- 10,000 commands/day
- Enough for ~1,000 conversations/day
- Cost: $0

### Redis Cloud Free Tier:
- 30MB storage
- Enough for ~10,000 cached responses
- Cost: $0

### Groq API Savings:
- Without cache: 1,000 messages = 1,000 API calls
- With cache (80% hit rate): 1,000 messages = 200 API calls
- Savings: 800 API calls/day

---

## 🎯 Quick Start Commands

```bash
# 1. Install Redis client
npm install ioredis @types/ioredis

# 2. Start local Redis (development)
redis-server

# 3. Add Redis URL to .env.local
echo "REDIS_URL=redis://localhost:6379" >> .env.local

# 4. Restart Next.js
npm run dev

# 5. Test caching
# Ask same question twice in chatbot
# Second time should be instant!
```

---

## 📚 Resources

- **ioredis Docs**: https://github.com/redis/ioredis
- **Upstash**: https://upstash.com
- **Redis Commands**: https://redis.io/commands
- **Best Practices**: https://redis.io/docs/manual/patterns/

---

**Ready to implement? This will significantly improve your app's performance!** 🚀
