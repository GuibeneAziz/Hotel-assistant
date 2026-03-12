// Force clear specific cache keys
const Redis = require('ioredis')
require('dotenv').config({ path: '.env.local' })

if (!process.env.REDIS_URL) {
  console.error('❌ Error: REDIS_URL not found in environment variables')
  console.error('Make sure .env.local exists and contains REDIS_URL')
  process.exit(1)
}

const client = new Redis(process.env.REDIS_URL)

async function clearCache() {
  try {
    console.log('🔗 Connected to Redis')
    
    // Delete specific keys
    await client.del('hotel:settings:all')
    console.log('✅ Deleted: hotel:settings:all')
    
    // Delete all AI response caches
    const keys = await client.keys('ai:response:*')
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`✅ Deleted ${keys.length} AI response caches`)
    }
    
    console.log('🎉 Cache cleared successfully!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.quit()
  }
}

clearCache()
