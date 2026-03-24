// Clear Redis cache script
const Redis = require('ioredis')
const fs = require('fs')

async function clearCache() {
  console.log('🧹 Clearing Redis cache...\n')
  
  // Read from .env.local
  const envContent = fs.readFileSync('.env.local', 'utf-8')
  const redisUrlMatch = envContent.match(/REDIS_URL=(.+)/)
  
  if (!redisUrlMatch) {
    console.error('❌ REDIS_URL not found in .env.local')
    return
  }
  
  const redisUrl = redisUrlMatch[1].trim()
  
  const redis = new Redis(redisUrl, {
    retryStrategy: () => null,
    enableReadyCheck: false,
    tls: {
      rejectUnauthorized: false,
    },
  })

  try {
    // Get all AI response keys
    const keys = await redis.keys('ai:response:*')
    
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`✅ Cleared ${keys.length} cached AI responses`)
    } else {
      console.log('ℹ️  No cached responses found')
    }
    
    console.log('\n🎉 Cache cleared successfully!')
    console.log('   Restart your app to see the changes\n')
  } catch (error) {
    console.error('\n❌ Failed to clear cache:', error.message)
  } finally {
    redis.disconnect()
  }
}

clearCache()
