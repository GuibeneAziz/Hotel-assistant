import { NextResponse } from 'next/server'
import { generateResponse } from '@/lib/ai-service'
import { buildHotelKnowledge, extractRelevantContext } from '@/lib/rag-knowledge'

export async function POST(request: Request) {
  try {
    const { message, hotelSettings, hotelData, weather, conversationHistory } = await request.json()

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      )
    }

    // Build complete hotel knowledge base
    const fullKnowledge = buildHotelKnowledge(hotelSettings, hotelData, weather)
    
    // Extract relevant context for efficiency (optional optimization)
    const relevantContext = extractRelevantContext(message, fullKnowledge)

    // Generate AI response with context
    const aiResponse = await generateResponse(
      message,
      relevantContext,
      conversationHistory || []
    )

    return NextResponse.json({ 
      response: aiResponse,
      success: true 
    })
    
  } catch (error: any) {
    console.error('Chat API Error Details:', {
      message: error.message,
      stack: error.stack,
      error: error,
    })
    
    // Return user-friendly error message
    const errorMessage = error.message || 'Failed to generate response'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        response: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        success: false
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const hasApiKey = !!process.env.GROQ_API_KEY
    
    return NextResponse.json({
      status: 'ok',
      aiConfigured: hasApiKey,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Service unavailable' },
      { status: 500 }
    )
  }
}
