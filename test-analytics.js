// Test Analytics System
// Run with: node test-analytics.js

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Kkum2tFlp0zh@ep-rapid-mode-ai3xvoxo-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function testAnalytics() {
  console.log('🧪 Testing Analytics System...\n')

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking if analytics tables exist...')
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('guest_profiles', 'question_categories', 'popular_topics', 'user_satisfaction', 'activity_interest')
      ORDER BY table_name
    `)
    
    console.log(`   ✅ Found ${tablesResult.rows.length} analytics tables:`)
    tablesResult.rows.forEach(row => console.log(`      - ${row.table_name}`))
    console.log()

    // Test 2: Insert test guest profile
    console.log('2️⃣ Testing guest profile insertion...')
    const sessionId = `test_session_${Date.now()}`
    await pool.query(`
      INSERT INTO guest_profiles (
        session_id, hotel_id, age_range, nationality, 
        travel_purpose, group_type, preferred_language
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [sessionId, 'sindbad-hammamet', '26-35', 'French', 'leisure', 'couple', 'en'])
    console.log(`   ✅ Guest profile created with session: ${sessionId}`)
    console.log()

    // Test 3: Insert test question category
    console.log('3️⃣ Testing question category tracking...')
    await pool.query(`
      INSERT INTO question_categories (
        hotel_id, category, subcategory, question_count, date
      )
      VALUES ($1, $2, $3, $4, CURRENT_DATE)
      ON CONFLICT (hotel_id, category, subcategory, date)
      DO UPDATE SET question_count = question_categories.question_count + 1
    `, ['sindbad-hammamet', 'facilities', 'pool_hours', 1])
    console.log('   ✅ Question category tracked')
    console.log()

    // Test 4: Insert test popular topic
    console.log('4️⃣ Testing popular topic tracking...')
    await pool.query(`
      INSERT INTO popular_topics (
        hotel_id, topic, mention_count, date
      )
      VALUES ($1, $2, $3, CURRENT_DATE)
      ON CONFLICT (hotel_id, topic, date)
      DO UPDATE SET mention_count = popular_topics.mention_count + 1
    `, ['sindbad-hammamet', 'pool', 1])
    console.log('   ✅ Popular topic tracked')
    console.log()

    // Test 5: Insert test satisfaction
    console.log('5️⃣ Testing satisfaction tracking...')
    await pool.query(`
      INSERT INTO user_satisfaction (
        hotel_id, session_id, chatbot_rating, found_helpful, feedback_text
      )
      VALUES ($1, $2, $3, $4, $5)
    `, ['sindbad-hammamet', sessionId, 5, true, 'Great chatbot!'])
    console.log('   ✅ Satisfaction feedback saved')
    console.log()

    // Test 6: Insert test activity interest
    console.log('6️⃣ Testing activity interest tracking...')
    await pool.query(`
      INSERT INTO activity_interest (
        hotel_id, activity_type, activity_name, category, view_count, date
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
      ON CONFLICT (hotel_id, activity_type, activity_name, date)
      DO UPDATE SET view_count = activity_interest.view_count + 1
    `, ['sindbad-hammamet', 'hotel_activity', 'Spa Treatment', 'relaxation', 1])
    console.log('   ✅ Activity interest tracked')
    console.log()

    // Test 7: Query analytics
    console.log('7️⃣ Testing analytics queries...')
    
    // Most asked questions
    const questionsResult = await pool.query(`
      SELECT category, subcategory, SUM(question_count) as total
      FROM question_categories
      WHERE hotel_id = 'sindbad-hammamet'
      GROUP BY category, subcategory
      ORDER BY total DESC
      LIMIT 5
    `)
    console.log(`   ✅ Most asked questions (${questionsResult.rows.length} results):`)
    questionsResult.rows.forEach(row => 
      console.log(`      - ${row.category}/${row.subcategory}: ${row.total} times`)
    )
    console.log()

    // Guest demographics
    const demographicsResult = await pool.query(`
      SELECT age_range, COUNT(*) as count
      FROM guest_profiles
      WHERE hotel_id = 'sindbad-hammamet'
      GROUP BY age_range
      ORDER BY count DESC
    `)
    console.log(`   ✅ Guest demographics (${demographicsResult.rows.length} age groups):`)
    demographicsResult.rows.forEach(row => 
      console.log(`      - ${row.age_range}: ${row.count} guests`)
    )
    console.log()

    // Average satisfaction
    const satisfactionResult = await pool.query(`
      SELECT 
        AVG(chatbot_rating) as avg_rating,
        COUNT(*) as total_ratings
      FROM user_satisfaction
      WHERE hotel_id = 'sindbad-hammamet'
    `)
    const satisfaction = satisfactionResult.rows[0]
    console.log(`   ✅ Satisfaction metrics:`)
    console.log(`      - Average rating: ${parseFloat(satisfaction.avg_rating).toFixed(2)}/5`)
    console.log(`      - Total ratings: ${satisfaction.total_ratings}`)
    console.log()

    console.log('✨ All tests passed! Analytics system is working correctly.\n')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

testAnalytics()
