import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit-helper'

export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotelId')
    const timeRange = searchParams.get('timeRange') || '7d' // 1d, 7d, 30d

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    const client = await pool.connect()
    
    try {
      // Total guests
      const guestQuery = hotelId 
        ? 'SELECT COUNT(*) as total FROM guest_profiles WHERE hotel_id = $1 AND first_visit >= $2'
        : 'SELECT COUNT(*) as total FROM guest_profiles WHERE first_visit >= $1'
      
      const guestParams = hotelId ? [hotelId, startDate] : [startDate]
      const guestResult = await client.query(guestQuery, guestParams)
      const totalGuests = parseInt(guestResult.rows[0]?.total || '0')

      // Total interactions
      const interactionQuery = hotelId
        ? 'SELECT SUM(total_interactions) as total FROM guest_profiles WHERE hotel_id = $1 AND last_visit >= $2'
        : 'SELECT SUM(total_interactions) as total FROM guest_profiles WHERE last_visit >= $1'
      
      const interactionResult = await client.query(interactionQuery, guestParams)
      const totalInteractions = parseInt(interactionResult.rows[0]?.total || '0')

      // Most active hotel (if not filtering by hotel)
      let mostActiveHotel = null
      if (!hotelId) {
        const hotelQuery = `
          SELECT hotel_id, COUNT(*) as guest_count 
          FROM guest_profiles 
          WHERE first_visit >= $1 
          GROUP BY hotel_id 
          ORDER BY guest_count DESC 
          LIMIT 1
        `
        const hotelResult = await client.query(hotelQuery, [startDate])
        mostActiveHotel = hotelResult.rows[0]?.hotel_id || null
      }

      // Top question category
      const categoryQuery = hotelId
        ? 'SELECT category, SUM(question_count) as total FROM question_categories WHERE hotel_id = $1 AND date >= $2 GROUP BY category ORDER BY total DESC LIMIT 1'
        : 'SELECT category, SUM(question_count) as total FROM question_categories WHERE date >= $1 GROUP BY category ORDER BY total DESC LIMIT 1'
      
      const categoryResult = await client.query(categoryQuery, guestParams)
      const topCategory = categoryResult.rows[0]?.category || 'facilities'

      // Average session interactions
      const avgQuery = hotelId
        ? 'SELECT AVG(total_interactions) as avg FROM guest_profiles WHERE hotel_id = $1 AND first_visit >= $2'
        : 'SELECT AVG(total_interactions) as avg FROM guest_profiles WHERE first_visit >= $1'
      
      const avgResult = await client.query(avgQuery, guestParams)
      const avgInteractions = parseFloat(avgResult.rows[0]?.avg || '0').toFixed(1)

      return NextResponse.json({
        success: true,
        data: {
          totalGuests,
          totalInteractions,
          mostActiveHotel,
          topCategory,
          avgInteractions: parseFloat(avgInteractions),
          timeRange
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}