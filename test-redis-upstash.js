// Test script for Upstash Redis
const Redis = require('ioredis')

async function testRedis() {
  console.log('🧪 Testing Upstash Redis Connection...\n')
  
  // Read from .env.local
  const fs = require('fs')
  const envContent = fs.readFileSync('.env.local', 'utf-8')
  const redisUrlMatch = envContent.match(/REDIS_URL=(.+)/)
  
  if (!redisUrlMatch) {
    console.error('❌ REDIS_URL not found in .env.local')
    console.log('\n📝 Please add your Upstash Redis URL to .env.local:')
    console.log('   REDIS_URL=redis://default:password@your-redis.upstash.io:6379\n')
    return
  }
  
  const redisUrl = redisUrlMatch[1].trim()
  console.log('📍 Connecting to:', redisUrl.replace(/:[^:@]+@/, ':****@'), '\n')
  
  const redis = new Redis(redisUrl, {
    retryStrategy: () => null,
    enableReadyCheck: false,
    tls: {
      rejectUnauthorized: false, // Required for Upstash
    },
  })

  try {
    // Test PING
    console.log('1. Testing PING...')
    const pingResult = await redis.ping()
    console.log(`   ✅ PING successful: ${pingResult}\n`)

    // Test SET
    console.log('2. Testing SET...')
    await redis.set('test:key', 'Hello from Tunisia Hotel App!')
    console.log('   ✅ SET successful\n')

    // Test GET
    console.log('3. Testing GET...')
    const value = await redis.get('test:key')
    console.log(`   ✅ GET successful: ${value}\n`)

    // Test SETEX (with expiration)
    console.log('4. Testing SETEX (with 60s expiration)...')
    await redis.setex('test:expire', 60, 'This will expire in 1 minute')
    console.log('   ✅ SETEX successful\n')

    // Test TTL
    console.log('5. Testing TTL...')
    const ttl = await redis.ttl('test:expire')
    console.log(`   ✅ TTL: ${ttl} seconds remaining\n`)

    // Test DELETE
    console.log('6. Testing DELETE...')
    await redis.del('test:key', 'test:expire')
    console.log('   ✅ DELETE successful\n')

    console.log('🎉 All Upstash Redis tests passed!')
    console.log('\n✅ Your Redis caching is ready to use!')
    console.log('   Start your app with: npm run dev\n')
  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message)
    console.error('\n📝 Troubleshooting:')
    console.error('   1. Check your REDIS_URL in .env.local')
    console.error('   2. Make sure you copied the full URL from Upstash')
    console.error('   3. Verify your Upstash database is active\n')
  } finally {
    redis.disconnect()
  }
}

testRedis()
