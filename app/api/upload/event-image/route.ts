import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { ApiResponse } from '@/types/api'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Only JPEG, PNG, WebP and GIF images are allowed' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'File size must be under 5 MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Sanitize filename and make it unique
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeName = `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'events')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, safeName), buffer)

    const publicUrl = `/uploads/events/${safeName}`

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { url: publicUrl }
    })
  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
