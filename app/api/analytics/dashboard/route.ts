import { NextResponse } from 'next/server'
import {
  getMostAskedQuestions,
  getGuestDemographics,
  getPopularActivities,
  getAverageSatisfaction
} from '@/lib/analytics'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotelId')

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required' },
        { status: 400 }
      )
    }

    // Fetch all analytics data in parallel
    const [mostAskedQuestions, demographics, popularActivities, satisfaction] = await Promise.all([
      getMostAskedQuestions(hotelId, 10),
      getGuestDemographics(hotelId),
      getPopularActivities(hotelId, 10),
      getAverageSatisfaction(hotelId)
    ])

    return NextResponse.json({
      success: true,
      data: {
        mostAskedQuestions,
        demographics,
        popularActivities,
        satisfaction
      }
    })
  } catch (error: any) {
    console.error('Error fetching analytics dashboard:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
