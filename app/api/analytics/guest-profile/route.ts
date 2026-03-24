import { NextResponse } from 'next/server'
import { createOrUpdateGuestProfile } from '@/lib/analytics'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, hotelId, ageRange, nationality, travelPurpose, groupType } = body

    // Validate required fields
    if (!sessionId || !hotelId || !ageRange || !nationality || !travelPurpose || !groupType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save guest profile
    await createOrUpdateGuestProfile({
      sessionId,
      hotelId,
      ageRange,
      nationality,
      travelPurpose,
      groupType
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving guest profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
