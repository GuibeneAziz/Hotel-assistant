import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { defaultHotelSettings } from '../../../lib/hotelData'
import { getCached, setCache, deleteCachePattern } from '@/lib/redis'

const DATA_DIR = join(process.cwd(), 'data')
const SETTINGS_FILE = join(DATA_DIR, 'hotel-settings.json')
const CACHE_KEY = 'hotel:settings:all'
const CACHE_TTL = 3600 // 1 hour

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// GET - Load hotel settings
export async function GET() {
  try {
    // Check cache first
    const cached = await getCached(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    await ensureDataDir()
    
    try {
      const data = await readFile(SETTINGS_FILE, 'utf-8')
      const settings = JSON.parse(data)
      
      // Cache the result
      await setCache(CACHE_KEY, settings, CACHE_TTL)
      
      return NextResponse.json(settings)
    } catch (error) {
      // File doesn't exist, return and cache default settings
      await setCache(CACHE_KEY, defaultHotelSettings, CACHE_TTL)
      return NextResponse.json(defaultHotelSettings)
    }
  } catch (error) {
    console.error('Error loading hotel settings:', error)
    return NextResponse.json(defaultHotelSettings)
  }
}

// POST - Save hotel settings
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    
    await ensureDataDir()
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    
    // Invalidate cache when settings are updated
    await deleteCachePattern('hotel:settings:*')
    await deleteCachePattern('ai:response:*') // Also invalidate AI responses
    console.log('🗑️ Cache invalidated: hotel settings & AI responses')
    
    return NextResponse.json({ success: true, message: 'Settings saved successfully' })
  } catch (error) {
    console.error('Error saving hotel settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    )
  }
}