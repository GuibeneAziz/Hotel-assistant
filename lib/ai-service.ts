import Groq from 'groq-sdk'
import { getCached, setCache } from './redis'
import crypto from 'crypto'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Generate cache key from message and context
function generateCacheKey(
  userMessage: string,
  hotelContext: string
): string {
  const content = `${userMessage.toLowerCase().trim()}:${hotelContext}`
  return `ai:response:${crypto.createHash('md5').update(content).digest('hex')}`
}

export async function generateResponse(
  userMessage: string,
  hotelContext: string,
  conversationHistory: Message[] = []
): Promise<string> {
  try {
    // Check cache first (only for messages without conversation history)
    // This caches common questions like "pool hours", "restaurant times", etc.
    if (conversationHistory.length === 0) {
      const cacheKey = generateCacheKey(userMessage, hotelContext)
      const cached = await getCached<string>(cacheKey)
      
      if (cached) {
        return cached
      }
    }

    // Debug: Log API key info (first/last 4 chars only for security)
    const apiKey = process.env.GROQ_API_KEY || ''
    console.log('API Key Check:', {
      exists: !!apiKey,
      length: apiKey.length,
      preview: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'none'
    })
    
    const systemPrompt = `You are a helpful, friendly hotel concierge AI assistant for a luxury hotel in Tunisia.

IMPORTANT INSTRUCTIONS:
- Provide accurate, helpful responses based on the hotel information provided
- Be polite, professional, and conversational
- Respond in the SAME LANGUAGE as the user's question (English, French, Spanish, Arabic, German, Italian, etc.)
- If you don't know something, politely say so and offer to help with something else
- Handle typos and understand the user's intent
- Keep responses concise but informative (2-4 sentences usually)
- When suggesting activities, consider the weather and guest preferences
- Always mention specific times, prices, and locations when available

HANDLING CLOSED SERVICES:
- When a service is marked as "CURRENTLY CLOSED" or "CLOSED", clearly apologize and inform the guest
- Example: "I apologize, but breakfast is currently closed. It will be available from [time] to [time]."
- Example: "I'm sorry, the pool is currently closed for maintenance."
- Never say you "don't know" about a service that is explicitly marked as CLOSED
- Always be empathetic and offer alternatives when possible

HOTEL INFORMATION:
${hotelContext}

Remember: Respond naturally in the user's language and be helpful!`

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage },
    ]

    const response = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.3-70b-versatile', // Updated to current model
      temperature: 0.7, // Balanced creativity
      max_tokens: 500, // Reasonable response length
      top_p: 1,
      stream: false,
    })

    const aiResponse = response.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.'

    // Cache the response (only for messages without conversation history)
    if (conversationHistory.length === 0) {
      const cacheKey = generateCacheKey(userMessage, hotelContext)
      await setCache(cacheKey, aiResponse, 3600) // Cache for 1 hour
    }

    return aiResponse
  } catch (error: any) {
    console.error('Groq API Error Details:', {
      message: error.message,
      status: error.status,
      error: error,
    })
    
    // Provide helpful error messages
    if (error.message?.includes('API key') || error.status === 401) {
      throw new Error('Invalid API key. Please check your Groq API key in .env.local')
    }
    
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.')
    }
    
    throw new Error(`AI Error: ${error.message || 'Unknown error occurred'}`)
  }
}

// Health check function
export async function checkAIService(): Promise<boolean> {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured')
      return false
    }
    return true
  } catch (error) {
    console.error('AI Service health check failed:', error)
    return false
  }
}
