# AI Chatbot Upgrade Plan - RAG Implementation

## 🎯 Goal
Replace keyword-based chatbot with intelligent AI that understands context, handles typos, and works naturally in multiple languages.

---

## 🤖 Recommended Free AI APIs

### Option 1: Groq API (Recommended) ⭐
- **Speed**: Extremely fast (fastest inference)
- **Free Tier**: 14,400 requests/day
- **Models**: Llama 3, Mixtral, Gemma
- **Signup**: https://console.groq.com
- **Best for**: Production-ready, fast responses

### Option 2: Hugging Face Inference API
- **Free Tier**: Rate limited but generous
- **Models**: Many open-source models
- **Signup**: https://huggingface.co
- **Best for**: Experimentation

### Option 3: OpenRouter (Multiple Models)
- **Free Credits**: $1 free credit
- **Models**: Access to many models
- **Signup**: https://openrouter.ai
- **Best for**: Trying different models

**My Recommendation**: Use **Groq** - it's free, fast, and reliable.

---

## 🏗️ Architecture: RAG System

```
User Question
    ↓
1. Detect Language (AI-powered)
    ↓
2. Retrieve Relevant Hotel Data (RAG)
    ↓
3. Build Context with Hotel Info
    ↓
4. Send to AI (Groq/Llama 3)
    ↓
5. AI Generates Natural Response
    ↓
6. Return in User's Language
```

---

## 📦 Required Packages

```bash
npm install groq-sdk
npm install @huggingface/inference  # Alternative
npm install string-similarity        # For fuzzy matching
```

---

## 🔧 Implementation Steps

### Step 1: Get Groq API Key

1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Add to `.env.local`:
```env
GROQ_API_KEY=your_api_key_here
```

### Step 2: Create AI Service

Create `lib/ai-service.ts`:
```typescript
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function generateResponse(
  userMessage: string,
  hotelContext: string,
  conversationHistory: Array<{ role: string; content: string }>
) {
  const systemPrompt = `You are a helpful, friendly hotel concierge AI assistant. 
You have access to hotel information and should provide accurate, helpful responses.
Always be polite and professional. If you don't know something, say so.
Respond in the same language as the user's question.

Hotel Information:
${hotelContext}

Guidelines:
- Be conversational and natural
- Provide specific details from the hotel information
- If asked about activities, suggest based on weather and guest preferences
- Handle typos and understand intent
- Respond in the user's language automatically`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  const response = await groq.chat.completions.create({
    messages: messages as any,
    model: 'llama-3.1-70b-versatile', // Fast and smart
    temperature: 0.7,
    max_tokens: 500,
  })

  return response.choices[0]?.message?.content || 'I apologize, I could not generate a response.'
}
```

### Step 3: Create RAG Knowledge Base

Create `lib/rag-knowledge.ts`:
```typescript
export function buildHotelKnowledge(hotelSettings: any, hotelData: any, weather: any) {
  const knowledge = []

  // Facilities information
  if (hotelSettings?.pool) {
    knowledge.push(`Pool: ${hotelSettings.pool.available ? 'Available' : 'Closed'}, 
      Open ${hotelSettings.pool.openTime} - ${hotelSettings.pool.closeTime}`)
  }

  if (hotelSettings?.gym) {
    knowledge.push(`Gym/Fitness Center: ${hotelSettings.gym.available ? 'Available' : 'Closed'}, 
      Open ${hotelSettings.gym.openTime} - ${hotelSettings.gym.closeTime}`)
  }

  if (hotelSettings?.spa) {
    knowledge.push(`Spa: ${hotelSettings.spa.available ? 'Available' : 'Closed'}, 
      Open ${hotelSettings.spa.openTime} - ${hotelSettings.spa.closeTime}
      Treatments: ${hotelSettings.spa.treatments?.join(', ') || 'Various treatments available'}`)
  }

  // Restaurant schedule
  if (hotelSettings?.restaurant) {
    const { breakfast, lunch, dinner } = hotelSettings.restaurant
    if (breakfast?.available) {
      knowledge.push(`Breakfast: ${breakfast.start} - ${breakfast.end}`)
    }
    if (lunch?.available) {
      knowledge.push(`Lunch: ${lunch.start} - ${lunch.end}`)
    }
    if (dinner?.available) {
      knowledge.push(`Dinner: ${dinner.start} - ${dinner.end}`)
    }
  }

  // Special events
  if (hotelSettings?.specialEvents?.length > 0) {
    const today = new Date().toISOString().split('T')[0]
    const upcomingEvents = hotelSettings.specialEvents
      .filter((e: any) => e.date >= today)
      .slice(0, 5)
    
    if (upcomingEvents.length > 0) {
      knowledge.push('Special Events:')
      upcomingEvents.forEach((event: any) => {
        knowledge.push(`- ${event.title} on ${event.date} at ${event.time} 
          Location: ${event.location}, Price: ${event.price || 'Free'}
          ${event.description || ''}`)
      })
    }
  }

  // Amenities
  if (hotelSettings?.wifi?.available) {
    knowledge.push(`WiFi: Available, Password: ${hotelSettings.wifi.password || 'Ask at reception'}`)
  }

  if (hotelSettings?.parking?.available) {
    knowledge.push(`Parking: Available, Price: ${hotelSettings.parking.price || 'Contact reception'}`)
  }

  // Check-in/out
  if (hotelSettings?.checkIn) {
    knowledge.push(`Check-in time: ${hotelSettings.checkIn.time}`)
  }
  if (hotelSettings?.checkOut) {
    knowledge.push(`Check-out time: ${hotelSettings.checkOut.time}`)
  }

  // Contact information
  if (hotelSettings?.contact) {
    knowledge.push(`Contact: Phone ${hotelSettings.contact.phone}, Email ${hotelSettings.contact.email}`)
  }

  // Activities
  if (hotelData?.activities) {
    Object.entries(hotelData.activities).forEach(([type, activities]: [string, any]) => {
      knowledge.push(`${type.charAt(0).toUpperCase() + type.slice(1)} Activities: ${activities.join(', ')}`)
    })
  }

  // Weather
  if (weather) {
    knowledge.push(`Current Weather: ${weather.temperature}°C, ${weather.description}, 
      Humidity: ${weather.humidity}%, Wind: ${weather.wind_speed} km/h`)
  }

  // Hotel basic info
  knowledge.push(`Hotel Name: ${hotelData?.name}`)
  knowledge.push(`Location: ${hotelData?.location}`)
  knowledge.push(`Description: ${hotelData?.description}`)

  return knowledge.join('\n')
}
```

### Step 4: Create API Route for AI

Create `app/api/chat/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { generateResponse } from '@/lib/ai-service'
import { buildHotelKnowledge } from '@/lib/rag-knowledge'

export async function POST(request: Request) {
  try {
    const { message, hotelSettings, hotelData, weather, conversationHistory } = await request.json()

    // Build knowledge base from hotel data
    const hotelKnowledge = buildHotelKnowledge(hotelSettings, hotelData, weather)

    // Generate AI response
    const aiResponse = await generateResponse(
      message,
      hotelKnowledge,
      conversationHistory || []
    )

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response', details: error.message },
      { status: 500 }
    )
  }
}
```

### Step 5: Update Chatbot to Use AI

Update `app/hotel/[id]/page.tsx` - replace `handleSendMessage`:
```typescript
const handleSendMessage = async () => {
  if (!inputMessage.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage,
    timestamp: new Date()
  }

  setMessages(prev => [...prev, userMessage])
  setInputMessage('')
  setIsLoading(true)

  try {
    // Call AI API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: inputMessage,
        hotelSettings,
        hotelData: hotel,
        weather,
        conversationHistory: messages.slice(-6).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      })
    })

    const data = await response.json()

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.response || 'I apologize, I could not generate a response.',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMessage])
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'I apologize, I encountered an error. Please try again.',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, errorMessage])
  } finally {
    setIsLoading(false)
  }
}
```

---

## 🎨 Enhanced Features

### 1. Conversation Memory
The AI remembers the last 6 messages for context.

### 2. Automatic Language Detection
The AI automatically detects and responds in the user's language.

### 3. Typo Tolerance
The AI understands intent even with typos:
- "pool ours" → understands "pool hours"
- "resturant time" → understands "restaurant times"

### 4. Context Understanding
- "What time does it open?" → AI knows what "it" refers to from context
- "Is there anything fun today?" → AI checks special events for today

### 5. Natural Conversations
```
User: "Hi, I'm traveling with kids"
AI: "Welcome! We have a great kids club open 9am-5pm for ages 4-12..."

User: "What about the pool?"
AI: "Our pool is perfect for families! It's open 6am-10pm..."

User: "Any events today?"
AI: "Yes! We have [event details]..."
```

---

## 💰 Cost Estimation

### Groq (Recommended)
- **Free Tier**: 14,400 requests/day
- **Average conversation**: 10 messages
- **Daily capacity**: ~1,440 conversations
- **Cost**: $0 (FREE)

### Fallback Plan
If you exceed limits, implement:
1. Rate limiting per user
2. Caching common responses
3. Hybrid: AI for complex, rules for simple

---

## 🚀 Quick Setup Commands

```bash
# 1. Install dependencies
npm install groq-sdk

# 2. Create .env.local file
echo "GROQ_API_KEY=your_key_here" > .env.local

# 3. Get API key from https://console.groq.com

# 4. Restart dev server
npm run dev
```

---

## 🔒 Security & Best Practices

1. **API Key**: Never expose in frontend, only use in API routes
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Input Validation**: Sanitize user input
4. **Error Handling**: Graceful fallbacks
5. **Monitoring**: Log API usage

---

## 📊 Comparison: Before vs After

| Feature | Before (Keywords) | After (AI + RAG) |
|---------|------------------|------------------|
| Context Understanding | ❌ No | ✅ Yes |
| Typo Tolerance | ❌ No | ✅ Yes |
| Natural Language | ❌ Limited | ✅ Full |
| Multi-language | ⚠️ Hardcoded | ✅ Automatic |
| Conversation Memory | ❌ No | ✅ Yes |
| Intent Recognition | ❌ No | ✅ Yes |
| Flexibility | ❌ Rigid | ✅ Adaptive |

---

## 🎯 Next Steps

1. **Get Groq API Key** (5 minutes)
2. **Install packages** (1 minute)
3. **Create AI service files** (10 minutes)
4. **Update chatbot** (5 minutes)
5. **Test and refine** (ongoing)

**Ready to implement?** I can start right now!
