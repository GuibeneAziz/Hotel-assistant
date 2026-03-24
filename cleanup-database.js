// Database Cleanup Script
// Drops unused analytics tables: user_satisfaction and activity_interest

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function cleanupDatabase() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Starting database cleanup...\n')
    
    // Check current tables
    console.log('📊 Current analytics tables:')
    const beforeResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%satisfaction%' 
          OR table_name LIKE '%activity_interest%'
          OR table_name LIKE '%guest%'
          OR table_name LIKE '%question%'
          OR table_name LIKE '%topic%')
      ORDER BY table_name
    `)
    beforeResult.rows.forEach(row => console.log(`  - ${row.table_name}`))
    
    // Drop unused tables
    console.log('\n🗑️  Dropping unused tables...')
    await client.query('DROP TABLE IF EXISTS user_satisfaction CASCADE')
    console.log('  ✅ Dropped: user_satisfaction')
    
    await client.query('DROP TABLE IF EXISTS activity_interest CASCADE')
    console.log('  ✅ Dropped: activity_interest')
    
    // Verify remaining tables
    console.log('\n📊 Remaining analytics tables:')
    const afterResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%guest%'
          OR table_name LIKE '%question%'
          OR table_name LIKE '%topic%')
      ORDER BY table_name
    `)
    afterResult.rows.forEach(row => console.log(`  - ${row.table_name}`))
    
    console.log('\n✅ Database cleanup completed successfully!')
    console.log('\n📈 Optimized structure:')
    console.log('  - Hotel Data: 8 tables')
    console.log('  - Analytics: 3 tables (down from 5)')
    console.log('  - Total: 11 tables (down from 13)')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run cleanup
cleanupDatabase()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error)
    process.exit(1)
  })
