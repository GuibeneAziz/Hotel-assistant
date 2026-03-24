import { NextResponse } from 'next/server'
import { generateResponse } from '@/lib/ai-service'
import { buildHotelKnowledge, buildPersonalizedHotelKnowledge, extractRelevantContext } from '@/lib/rag-knowledge'
import { chatMessageSchema, validateAndSanitize } from '@/lib/validation'
import type { ApiResponse, ChatResponse } from '@/types/api'
import { 
  detectQuestionCategory, 
  trackQuestionCategory, 
  trackPopularTopic,
  getGuestProfile,
  createOrUpdateGuestProfile
} from '@/lib/analytics'
import { checkRateLimit } from '@/lib/rate-limit-helper'

export async function POST(request: Request) {
  try {
    console.log('🔍 Chat API called')
    
    // OWASP: Rate limiting prevents API abuse
    const rateLimitResponse = await checkRateLimit(request, 'chat')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    console.log('📝 Request body keys:', Object.keys(body))

    // Validate and sanitize input with Zod
    // OWASP: Always validate and sanitize user input
    const validation = validateAndSanitize(chatMessageSchema, body)
    
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.errors)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid request data',
        message: validation.errors?.join(', ')
      }, { status: 400 })
    }

    const { message, hotelSettings, hotelData, weather, conversationHistory, sessionId } = validation.data!
    console.log('✅ Validation passed, message length:', message.length)

    // Get guest profile for analytics (if available)
    let guestProfile = null
    if (sessionId) {
      try {
        guestProfile = await getGuestProfile(sessionId)
        
        // Update interaction count
        if (guestProfile) {
          await createOrUpdateGuestProfile({
            sessionId: guestProfile.session_id,
            hotelId: guestProfile.hotel_id,
            ageRange: guestProfile.age_range,
            nationality: guestProfile.nationality,
            travelPurpose: guestProfile.travel_purpose,
            groupType: guestProfile.group_type
          })
        }
      } catch (analyticsError) {
        console.error('Analytics error (non-blocking):', analyticsError instanceof Error ? analyticsError.message : analyticsError)
        // Don't throw - analytics errors shouldn't break chat
        guestProfile = null
      }
    }

    // Track analytics (async, don't wait)
    // Get hotel ID from guest profile (saved during registration)
    if (guestProfile && guestProfile.hotel_id) {
      trackAnalytics(message, guestProfile.hotel_id, guestProfile.age_range).catch(err => {
        console.error('Analytics tracking error (non-blocking):', err.message)
        // Don't throw - analytics errors shouldn't break chat
      })
    }

    // Build complete hotel knowledge base (personalized if guest profile available)
    console.log('🏨 Building hotel knowledge...')
    let fullKnowledge: string
    
    if (guestProfile && guestProfile.hotel_id) {
      // Build personalized knowledge with tailored attractions
      const guestProfileData = {
        ageRange: guestProfile.age_range as any,
        groupType: guestProfile.group_type as any,
        travelPurpose: guestProfile.travel_purpose as any
      }
      
      fullKnowledge = await buildPersonalizedHotelKnowledge(
        hotelSettings,
        hotelData,
        weather,
        guestProfileData,
        guestProfile.hotel_id
      )
      console.log('🎯 Personalized knowledge built for guest profile')
    } else {
      // Build standard knowledge
      fullKnowledge = buildHotelKnowledge(hotelSettings, hotelData, weather)
      console.log('📚 Standard knowledge built')
    }
    
    console.log('📚 Knowledge built, length:', fullKnowledge.length)
    
    // Extract relevant context for efficiency (optional optimization)
    const relevantContext = extractRelevantContext(message, fullKnowledge)
    console.log('🎯 Relevant context extracted, length:', relevantContext.length)

    // Generate AI response with context
    console.log('🤖 Calling AI service...')
    const aiResponse = await generateResponse(
      message,
      relevantContext,
      conversationHistory || []
    )
    console.log('✅ AI response generated, length:', aiResponse.length)

    return NextResponse.json<ChatResponse>({ 
      success: true,
      response: aiResponse
    })
    
  } catch (error: any) {
    console.error('Chat API Error:', {
      message: error.message,
      // Don't log stack traces in production
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
    
    // OWASP: Sanitize error messages - don't expose internal details
    const isProduction = process.env.NODE_ENV === 'production'
    const errorMessage = isProduction 
      ? 'An error occurred processing your request'
      : error.message || 'Failed to generate response'
    
    return NextResponse.json<ChatResponse>(
      { 
        success: false,
        error: errorMessage,
        response: `I apologize, but I encountered an error. Please try again.`
      },
      { status: 500 }
    )
  }
}

// Analytics tracking helper
async function trackAnalytics(message: string, hotelId: string, ageRange?: string) {
  // Detect question category and language
  const { category, subcategory, topics, language } = detectQuestionCategory(message)
  
  // Track question category
  await trackQuestionCategory(hotelId, category, subcategory, ageRange)
  
  // Track popular topics
  for (const topic of topics) {
    await trackPopularTopic(hotelId, topic)
  }
  
  // Log detected language for monitoring
  console.log(`📊 Analytics: category=${category}, language=${language}`)
}

// Health check endpoint
export async function GET() {
  try {
    const hasApiKey = !!process.env.GROQ_API_KEY
    const hasRedis = !!process.env.REDIS_URL
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        status: 'ok',
        aiConfigured: hasApiKey,
        redisConfigured: hasRedis,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { 
        success: false,
        error: 'Service unavailable'
      },
      { status: 500 }
    )
  }
}
