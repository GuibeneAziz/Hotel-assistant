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
    const timeRange = searchParams.get('timeRange') || '7d'

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
      const baseWhere = hotelId 
        ? 'WHERE hotel_id = $1 AND first_visit >= $2'
        : 'WHERE first_visit >= $1'
      const params = hotelId ? [hotelId, startDate] : [startDate]

      // Age distribution
      const ageQuery = `
        SELECT age_range, COUNT(*) as count 
        FROM guest_profiles 
        ${baseWhere}
        GROUP BY age_range 
        ORDER BY count DESC
      `
      const ageResult = await client.query(ageQuery, params)
      const ageDistribution = ageResult.rows.map(row => ({
        name: row.age_range,
        value: parseInt(row.count),
        percentage: 0 // Will calculate after getting total
      }))

      // Calculate percentages
      const totalGuests = ageDistribution.reduce((sum, item) => sum + item.value, 0)
      ageDistribution.forEach(item => {
        item.percentage = totalGuests > 0 ? Math.round((item.value / totalGuests) * 100) : 0
      })

      // Top nationalities
      const nationalityQuery = `
        SELECT nationality, COUNT(*) as count 
        FROM guest_profiles 
        ${baseWhere}
        GROUP BY nationality 
        ORDER BY count DESC 
        LIMIT 10
      `
      const nationalityResult = await client.query(nationalityQuery, params)
      const topNationalities = nationalityResult.rows.map(row => ({
        name: row.nationality,
        value: parseInt(row.count)
      }))

      // Travel purposes
      const purposeQuery = `
        SELECT travel_purpose, COUNT(*) as count 
        FROM guest_profiles 
        ${baseWhere}
        GROUP BY travel_purpose 
        ORDER BY count DESC
      `
      const purposeResult = await client.query(purposeQuery, params)
      const travelPurposes = purposeResult.rows.map(row => ({
        name: row.travel_purpose,
        value: parseInt(row.count)
      }))

      // Group types
      const groupQuery = `
        SELECT group_type, COUNT(*) as count 
        FROM guest_profiles 
        ${baseWhere}
        GROUP BY group_type 
        ORDER BY count DESC
      `
      const groupResult = await client.query(groupQuery, params)
      const groupTypes = groupResult.rows.map(row => ({
        name: row.group_type,
        value: parseInt(row.count)
      }))

      return NextResponse.json({
        success: true,
        data: {
          ageDistribution,
          topNationalities,
          travelPurposes,
          groupTypes,
          totalGuests
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('Analytics demographics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demographics data' },
      { status: 500 }
    )
  }
}