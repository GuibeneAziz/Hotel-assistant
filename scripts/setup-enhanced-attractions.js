// Setup Enhanced Attractions System
// Run this script to create the enhanced attractions table and sample data

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function setupEnhancedAttractions() {
  console.log('🔍 Database URL:', process.env.DATABASE_URL ? 'Found' : 'Missing')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? {
      rejectUnauthorized: false
    } : false
  })

  const client = await pool.connect()

  try {
    console.log('🚀 Setting up enhanced attractions system...')

    // Read and execute schema
    console.log('📋 Creating enhanced attractions table...')
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'enhanced-attractions-schema.sql'), 
      'utf8'
    )
    await client.query(schemaSQL)
    console.log('✅ Enhanced attractions table created')

    // Read and execute sample data
    console.log('📝 Inserting sample attractions data...')
    const sampleDataSQL = fs.readFileSync(
      path.join(__dirname, 'sample-enhanced-attractions.sql'), 
      'utf8'
    )
    await client.query(sampleDataSQL)
    console.log('✅ Sample attractions data inserted')

    // Verify the data
    const result = await client.query(`
      SELECT hotel_id, COUNT(*) as attraction_count 
      FROM nearby_attractions 
      GROUP BY hotel_id 
      ORDER BY hotel_id
    `)

    console.log('\n📊 Attractions Summary:')
    result.rows.forEach(row => {
      console.log(`  ${row.hotel_id}: ${row.attraction_count} attractions`)
    })

    console.log('\n🎉 Enhanced attractions system setup complete!')
    console.log('\nNext steps:')
    console.log('1. Restart your Next.js application')
    console.log('2. Test the chatbot with attraction questions')
    console.log('3. Check the admin dashboard "Nearby Attractions" tab')

  } catch (error) {
    console.error('❌ Error setting up enhanced attractions:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the setup
if (require.main === module) {
  setupEnhancedAttractions().catch(console.error)
}

module.exports = { setupEnhancedAttractions }