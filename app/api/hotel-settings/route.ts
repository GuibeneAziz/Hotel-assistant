import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache, deleteCachePattern } from '@/lib/redis'
import type { ApiResponse } from '@/types/api'
import { getAllHotelSettings } from '@/lib/db'

const CACHE_KEY = 'hotel:settings:all'
const CACHE_TTL = 3600 // 1 hour

// GET - Load hotel settings from PostgreSQL
export async function GET() {
  try {
    // Skip cache in development or if cache is stale
    const skipCache = process.env.NODE_ENV === 'development'
    
    if (!skipCache) {
      // Check cache first
      const cached = await getCached(CACHE_KEY)
      if (cached) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: cached
        })
      }
    }

    // Get settings from database
    const settings = await getAllHotelSettings()
    
    // Cache the result
    await setCache(CACHE_KEY, settings, CACHE_TTL)
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings
    })
  } catch (error: any) {
    console.error('Error loading hotel settings:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to load settings',
      message: error.message
    }, { status: 500 })
  }
}

// POST - Save hotel settings (disabled - use database admin tools)
export async function POST(request: NextRequest) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: 'Direct settings modification is disabled',
      message: 'Please use database admin tools to modify hotel settings'
    },
    { status: 403 }
  )
}