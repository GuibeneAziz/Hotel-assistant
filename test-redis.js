// Test script to verify Redis connection
const Redis = require('ioredis')

async function testRedis() {
  console.log('🧪 Testing Redis Connection...\n')
  
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryStrategy: () => null, // Don't retry for test
  })

  try {
    // Test PING
    console.log('1. Testing PING...')
    const pingResult = await redis.ping()
    console.log(`   ✅ PING successful: ${pingResult}\n`)

    // Test SET
    console.log('2. Testing SET...')
    await redis.set('test:key', 'Hello Redis!')
    console.log('   ✅ SET successful\n')

    // Test GET
    console.log('3. Testing GET...')
    const value = await redis.get('test:key')
    console.log(`   ✅ GET successful: ${value}\n`)

    // Test SETEX (with expiration)
    console.log('4. Testing SETEX (with 10s expiration)...')
    await redis.setex('test:expire', 10, 'This will expire')
    console.log('   ✅ SETEX successful\n')

    // Test TTL
    console.log('5. Testing TTL...')
    const ttl = await redis.ttl('test:expire')
    console.log(`   ✅ TTL: ${ttl} seconds remaining\n`)

    // Test DELETE
    console.log('6. Testing DELETE...')
    await redis.del('test:key', 'test:expire')
    console.log('   ✅ DELETE successful\n')

    console.log('🎉 All Redis tests passed!')
    console.log('\n✅ Redis is working correctly!')
    console.log('   You can now use caching in your application.\n')
  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message)
    console.error('\n📝 Make sure Redis is running:')
    console.error('   - Windows: redis-server.exe')
    console.error('   - Or use Upstash (cloud Redis): https://upstash.com\n')
  } finally {
    redis.disconnect()
  }
}

testRedis()
