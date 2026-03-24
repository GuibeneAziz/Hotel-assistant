# Complete Code Guide - Tunisia Hotel AI Chatbot

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [File Structure](#file-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [File Relationships](#file-relationships)
7. [How Everything Works Together](#how-everything-works-together)
8. [Development Guide](#development-guide)

---

## 🎯 Project Overview

This is a Next.js hotel management system with an AI-powered chatbot. It consists of:
- **Frontend**: Hotel listing pages and AI chatbot interface
- **Admin Dashboard**: Manage hotel settings, schedules, events
- **AI Service**: Groq-powered chatbot with RAG (Retrieval Augmented Generation)
- **Caching Layer**: Redis (Upstash) for performance optimization
- **Data Storage**: JSON file-based storage (will migrate to PostgreSQL)

**Tech Stack:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Groq AI (Llama 3.3-70b model)
- Redis (Upstash cloud)
- ioredis (Redis client)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Homepage   │───▶│ Hotel Page   │───▶│   Chatbot    │    │
│  │  (page.tsx)  │    │ [id]/page.tsx│    │  Interface   │    │
│  └──────────────┘    └──────────────┘    └──────┬───────┘    │
│                                                   │             │
│  ┌──────────────┐                                │             │
│  │   Admin      │                                │             │
│  │  Dashboard   │                                │             │
│  │(dashboard/)  │                                │             │
│  └──────┬───────┘                                │             │
│         │                                        │             │
└─────────┼────────────────────────────────────────┼─────────────┘
          │                                        │
          │                                        │
┌─────────▼────────────────────────────────────────▼─────────────┐
│                        API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │ Hotel Settings   │              │   Chat API       │        │
│  │     API          │              │  /api/chat       │        │
│  │ /api/hotel-      │              │                  │        │
│  │  settings        │              └────────┬─────────┘        │
│  └────────┬─────────┘                       │                  │
│           │                                 │                  │
└───────────┼─────────────────────────────────┼──────────────────┘
            │                                 │
            │                                 │
┌───────────▼─────────────────────────────────▼──────────────────┐
│                      SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Redis      │    │  AI Service  │    │ RAG Builder  │    │
│  │   Client     │◀───│  (Groq API)  │◀───│  (Knowledge) │    │
│  │ (redis.ts)   │    │(ai-service.ts│    │(rag-knowledge│    │
│  └──────────────┘    └──────────────┘    │    .ts)      │    │
│         ▲                                 └──────────────┘    │
│         │                                                      │
└─────────┼──────────────────────────────────────────────────────┘
          │
          │ Cache Check/Store
          │
┌─────────▼──────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Upstash    │    │ Hotel Data   │    │Hotel Settings│    │
│  │    Redis     │    │  (hotelData  │    │    JSON      │    │
│  │   (Cloud)    │    │    .ts)      │    │    File      │    │
│  └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │   Groq API   │    │ Weather API  │                          │
│  │  (Llama 3.3) │    │(OpenWeather) │                          │
│  └──────────────┘    └──────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
tunisia-hotel-app/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (wraps all pages)
│   ├── page.tsx                 # Homepage (hotel list)
│   ├── globals.css              # Global styles
│   │
│   ├── dashboard/               # Admin Dashboard
│   │   └── page.tsx            # Admin settings page
│   │
│   ├── hotel/                   # Hotel pages
│   │   └── [id]/               # Dynamic route for each hotel
│   │       └── page.tsx        # Hotel detail + chatbot
│   │
│   ├── api/                     # API Routes
│   │   ├── chat/               # AI Chat endpoint
│   │   │   └── route.ts        # POST /api/chat
│   │   │
│   │   └── hotel-settings/     # Settings CRUD
│   │       └── route.ts        # GET/POST /api/hotel-settings
│   │
│   └── components/              # Reusable components
│       └── LoadingSpinner.tsx  # Loading indicator
│
├── lib/                         # Utility libraries
│   ├── ai-service.ts           # Groq AI integration
│   ├── rag-knowledge.ts        # RAG knowledge builder
│   ├── redis.ts                # Redis client & helpers
│   └── hotelData.ts            # Static hotel data
│
├── data/                        # Data storage
│   └── hotel-settings.json     # Dynamic hotel settings
│
├── .env.local                   # Environment variables
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
└── next.config.js              # Next.js config
```

---

## 🔧 Core Components

### 1. **Frontend Pages**

#### `app/page.tsx` - Homepage
- **Purpose**: Display list of available hotels
- **What it does**:
  - Shows hotel cards with images
  - Links to individual hotel pages
  - Entry point for users
- **Dependencies**: `lib/hotelData.ts`

#### `app/hotel/[id]/page.tsx` - Hotel Detail Page
- **Purpose**: Show hotel details + AI chatbot
- **What it does**:
  - Displays hotel information (name, location, description)
  - Shows current weather
  - Renders chatbot interface
  - Handles user messages
  - Calls AI API for responses
- **Dependencies**:
  - `lib/hotelData.ts` - Get hotel info
  - `/api/chat` - Send messages to AI
  - `/api/hotel-settings` - Get dynamic settings
  - Weather API - Get current weather

#### `app/dashboard/page.tsx` - Admin Dashboard
- **Purpose**: Manage hotel settings
- **What it does**:
  - Edit restaurant schedules (breakfast, lunch, dinner)
  - Manage facilities (pool, gym, spa, kids club)
  - Add/remove special events
  - Update contact information
  - Configure amenities (WiFi, parking)
  - Set check-in/check-out times
- **Dependencies**: `/api/hotel-settings`

---

### 2. **API Routes**

#### `app/api/chat/route.ts` - Chat API
- **Purpose**: Handle chatbot messages
- **What it does**:
  1. Receives user message + conversation history
  2. Fetches hotel settings from `/api/hotel-settings`
  3. Gets static hotel data from `lib/hotelData.ts`
  4. Fetches current weather
  5. Builds knowledge base using `lib/rag-knowledge.ts`
  6. Calls `lib/ai-service.ts` to generate AI response
  7. Returns response to frontend
- **Method**: POST
- **Request Body**:
  ```json
  {
    "message": "What time is breakfast?",
    "hotelId": "simbad",
    "conversationHistory": []
  }
  ```
- **Response**:
  ```json
  {
    "response": "Breakfast is served from 7:00 AM to 10:00 AM..."
  }
  ```

#### `app/api/hotel-settings/route.ts` - Settings API
- **Purpose**: CRUD operations for hotel settings
- **What it does**:
  - **GET**: Read settings from `data/hotel-settings.json`
  - **POST**: Update settings and save to JSON file
  - Uses Redis caching for performance
  - Invalidates cache when settings are updated
- **Methods**: GET, POST
- **Caching**: 1 hour TTL

---

### 3. **Service Layer**

#### `lib/ai-service.ts` - AI Service
- **Purpose**: Interface with Groq AI API
- **What it does**:
  1. Receives user message + hotel context
  2. Checks Redis cache for existing response
  3. If cache miss, calls Groq API
  4. Generates response using Llama 3.3-70b model
  5. Caches response in Redis (1 hour)
  6. Returns AI response
- **Key Functions**:
  - `generateResponse()` - Main function
  - `generateCacheKey()` - Create cache key from message
  - `checkAIService()` - Health check
- **Dependencies**:
  - `groq-sdk` - Groq API client
  - `lib/redis.ts` - Caching
  - `.env.local` - API key

#### `lib/rag-knowledge.ts` - RAG Knowledge Builder
- **Purpose**: Convert hotel data into AI-readable format
- **What it does**:
  1. Takes hotel settings, static data, weather
  2. Formats into structured text
  3. Marks services as OPEN/CLOSED
  4. Includes times, prices, locations
  5. Adds weather-based recommendations
  6. Returns formatted knowledge string
- **Key Functions**:
  - `buildHotelKnowledge()` - Build full knowledge base
  - `extractRelevantContext()` - Filter relevant sections
- **Output Example**:
  ```
  === HOTEL INFORMATION ===
  Name: Simbad Hotel
  Location: Hammamet, Tunisia
  
  === RESTAURANT SCHEDULE ===
  Breakfast: OPEN 7:00 AM - 10:00 AM
  Lunch: CURRENTLY CLOSED
  Dinner: OPEN 6:00 PM - 10:00 PM
  
  === FACILITIES ===
  Pool: OPEN 8:00 AM - 8:00 PM
  Gym: OPEN 6:00 AM - 10:00 PM
  ```

#### `lib/redis.ts` - Redis Client
- **Purpose**: Caching layer for performance
- **What it does**:
  - Singleton Redis client (one connection)
  - Helper functions for cache operations
  - Graceful error handling
  - TLS support for Upstash
- **Key Functions**:
  - `getRedisClient()` - Get/create Redis connection
  - `getCached()` - Retrieve cached data
  - `setCache()` - Store data with TTL
  - `deleteCache()` - Remove specific key
  - `deleteCachePattern()` - Remove multiple keys
  - `checkRedisHealth()` - Health check
- **Cache Keys**:
  - `ai:response:{hash}` - AI responses (1 hour)
  - `hotel:settings:all` - Hotel settings (1 hour)

#### `lib/hotelData.ts` - Static Hotel Data
- **Purpose**: Store unchanging hotel information
- **What it contains**:
  - Hotel names, locations, descriptions
  - Images
  - Available activities (water sports, cultural, adventure)
  - Room types
- **Note**: This is static data that doesn't change often

---

### 4. **Data Layer**

#### `data/hotel-settings.json` - Dynamic Settings
- **Purpose**: Store admin-configurable settings
- **What it contains**:
  ```json
  {
    "restaurant": {
      "breakfast": { "available": true, "start": "7:00 AM", "end": "10:00 AM" },
      "lunch": { "available": false },
      "dinner": { "available": true, "start": "6:00 PM", "end": "10:00 PM" }
    },
    "pool": { "available": true, "openTime": "8:00 AM", "closeTime": "8:00 PM" },
    "gym": { "available": true, "openTime": "6:00 AM", "closeTime": "10:00 PM" },
    "spa": { "available": true, "openTime": "9:00 AM", "closeTime": "7:00 PM" },
    "specialEvents": [
      {
        "title": "Beach Volleyball",
        "date": "2025-02-15",
        "time": "3:00 PM",
        "location": "Beach",
        "price": "Free"
      }
    ],
    "wifi": { "available": true, "password": "hotel123" },
    "parking": { "available": true, "price": "Free" },
    "contact": {
      "phone": "+216 12 345 678",
      "email": "info@hotel.com"
    }
  }
  ```

---

## 🔄 Data Flow

### Flow 1: User Asks Question in Chatbot

```
1. User types message in chatbot
   └─▶ app/hotel/[id]/page.tsx (handleSendMessage)

2. Frontend sends POST request
   └─▶ /api/chat (route.ts)

3. Chat API fetches data:
   ├─▶ GET /api/hotel-settings (cached in Redis)
   ├─▶ lib/hotelData.ts (static data)
   └─▶ Weather API (current weather)

4. Build knowledge base
   └─▶ lib/rag-knowledge.ts (buildHotelKnowledge)
       └─▶ Formats all data into structured text

5. Generate AI response
   └─▶ lib/ai-service.ts (generateResponse)
       ├─▶ Check Redis cache (getCached)
       │   └─▶ If HIT: Return cached response (< 50ms)
       │   └─▶ If MISS: Continue to step 6
       │
       ├─▶ Call Groq API with knowledge + message
       │   └─▶ Llama 3.3-70b generates response (~1-2s)
       │
       └─▶ Cache response in Redis (setCache, 1 hour TTL)

6. Return response to frontend
   └─▶ Display in chatbot interface
```

**Performance:**
- First time: ~1-2 seconds (API call)
- Subsequent times: ~10-50ms (cached)
- 95%+ reduction in API calls

---

### Flow 2: Admin Updates Settings

```
1. Admin changes settings in dashboard
   └─▶ app/dashboard/page.tsx (handleSave)

2. Frontend sends POST request
   └─▶ /api/hotel-settings (route.ts)

3. Settings API:
   ├─▶ Validates data
   ├─▶ Writes to data/hotel-settings.json
   ├─▶ Clears Redis cache:
   │   ├─▶ deleteCache('hotel:settings:all')
   │   └─▶ deleteCachePattern('ai:response:*')
   └─▶ Returns success

4. Next chatbot query will:
   ├─▶ Fetch fresh settings (cache miss)
   ├─▶ Build new knowledge base
   └─▶ Generate new AI responses
```

---

### Flow 3: Page Load

```
1. User visits hotel page
   └─▶ app/hotel/[id]/page.tsx

2. Page loads data:
   ├─▶ lib/hotelData.ts (static hotel info)
   ├─▶ GET /api/hotel-settings (dynamic settings)
   │   └─▶ Redis cache check
   │       └─▶ If HIT: Return cached (fast)
   │       └─▶ If MISS: Read JSON file + cache
   │
   └─▶ Weather API (current weather)

3. Render page:
   ├─▶ Hotel banner image
   ├─▶ Hotel information
   ├─▶ Weather widget
   └─▶ Chatbot interface (ready for messages)
```

---

## 🔗 File Relationships

### Dependency Graph

```
app/hotel/[id]/page.tsx
├── lib/hotelData.ts
├── /api/chat
│   ├── /api/hotel-settings
│   │   ├── data/hotel-settings.json
│   │   └── lib/redis.ts
│   ├── lib/hotelData.ts
│   ├── lib/rag-knowledge.ts
│   └── lib/ai-service.ts
│       ├── groq-sdk
│       └── lib/redis.ts
│           └── ioredis
└── Weather API

app/dashboard/page.tsx
└── /api/hotel-settings
    ├── data/hotel-settings.json
    └── lib/redis.ts
```

### Communication Patterns

**1. Frontend ↔ API**
- HTTP requests (fetch)
- JSON data format
- RESTful endpoints

**2. API ↔ Services**
- Direct function calls
- TypeScript imports
- Async/await pattern

**3. Services ↔ External APIs**
- HTTP requests
- API keys from .env.local
- Error handling with try/catch

**4. Services ↔ Redis**
- ioredis client
- TLS encrypted connection
- Automatic reconnection

**5. API ↔ File System**
- fs.readFileSync / fs.writeFileSync
- JSON.parse / JSON.stringify
- Synchronous operations

---

## 🎯 How Everything Works Together

### Example: User Asks "What time is breakfast?"

**Step-by-Step Execution:**

1. **User Input** (`app/hotel/[id]/page.tsx`)
   ```typescript
   const handleSendMessage = async () => {
     // User types "What time is breakfast?"
     const userMessage = "What time is breakfast?"
     
     // Send to API
     const response = await fetch('/api/chat', {
       method: 'POST',
       body: JSON.stringify({
         message: userMessage,
         hotelId: 'simbad',
         conversationHistory: []
       })
     })
   }
   ```

2. **API Receives Request** (`app/api/chat/route.ts`)
   ```typescript
   export async function POST(request: Request) {
     const { message, hotelId, conversationHistory } = await request.json()
     
     // Fetch hotel settings (with caching)
     const settingsResponse = await fetch('/api/hotel-settings')
     const hotelSettings = await settingsResponse.json()
     
     // Get static data
     const hotelData = getHotelById(hotelId)
     
     // Get weather
     const weather = await fetchWeather()
     
     // Continue to step 3...
   }
   ```

3. **Build Knowledge Base** (`lib/rag-knowledge.ts`)
   ```typescript
   const knowledge = buildHotelKnowledge(
     hotelSettings,  // From API
     hotelData,      // From lib
     weather         // From external API
   )
   
   // Output:
   // === RESTAURANT SCHEDULE ===
   // Breakfast: OPEN 7:00 AM - 10:00 AM
   // Lunch: CURRENTLY CLOSED
   // Dinner: OPEN 6:00 PM - 10:00 PM
   ```

4. **Check Cache** (`lib/ai-service.ts` → `lib/redis.ts`)
   ```typescript
   // Generate cache key
   const cacheKey = generateCacheKey(
     "What time is breakfast?",
     knowledge
   )
   // Result: "ai:response:abc123def456..."
   
   // Check Redis
   const cached = await getCached(cacheKey)
   if (cached) {
     console.log('✅ Cache HIT')
     return cached  // Return instantly!
   }
   console.log('❌ Cache MISS')
   // Continue to step 5...
   ```

5. **Call Groq AI** (`lib/ai-service.ts`)
   ```typescript
   const response = await groq.chat.completions.create({
     messages: [
       {
         role: 'system',
         content: `You are a hotel concierge...
         
         HOTEL INFORMATION:
         ${knowledge}  // All the formatted data
         `
       },
       {
         role: 'user',
         content: 'What time is breakfast?'
       }
     ],
     model: 'llama-3.3-70b-versatile'
   })
   
   const aiResponse = response.choices[0].message.content
   // "Breakfast is served from 7:00 AM to 10:00 AM daily..."
   ```

6. **Cache Response** (`lib/redis.ts`)
   ```typescript
   await setCache(cacheKey, aiResponse, 3600)  // 1 hour
   console.log('💾 Cached response')
   ```

7. **Return to Frontend** (`app/api/chat/route.ts`)
   ```typescript
   return NextResponse.json({ response: aiResponse })
   ```

8. **Display in UI** (`app/hotel/[id]/page.tsx`)
   ```typescript
   setMessages([...messages, {
     role: 'assistant',
     content: aiResponse
   }])
   ```

**Total Time:**
- First time: ~1-2 seconds
- Next time: ~10-50ms (from cache)

---

## 🛠️ Development Guide

### Adding a New Feature

**Example: Add "Room Service" to Admin Dashboard**

1. **Update Data Model** (`data/hotel-settings.json`)
   ```json
   {
     "roomService": {
       "available": true,
       "hours": "24/7",
       "phone": "+216 12 345 678"
     }
   }
   ```

2. **Update Admin Dashboard** (`app/dashboard/page.tsx`)
   ```typescript
   const [roomService, setRoomService] = useState({
     available: true,
     hours: '24/7',
     phone: ''
   })
   
   // Add UI controls for room service
   ```

3. **Update RAG Knowledge** (`lib/rag-knowledge.ts`)
   ```typescript
   if (hotelSettings?.roomService?.available) {
     knowledge.push(`Room Service: Available ${hotelSettings.roomService.hours}`)
     knowledge.push(`  Phone: ${hotelSettings.roomService.phone}`)
   }
   ```

4. **Test**
   - Update settings in admin dashboard
   - Ask chatbot "Is room service available?"
   - Verify AI responds with correct information

### Debugging Tips

**1. Check API Responses**
```typescript
// In browser console
fetch('/api/hotel-settings')
  .then(r => r.json())
  .then(console.log)
```

**2. Monitor Redis Cache**
```bash
# Run test script
node test-redis-upstash.js
```

**3. Check AI Service**
```typescript
// In app/api/chat/route.ts
console.log('Knowledge Base:', knowledge)
console.log('AI Response:', aiResponse)
```

**4. View Terminal Logs**
```
✅ Cache HIT: ai:response:abc123...
❌ Cache MISS: ai:response:xyz789...
💾 Cached: ai:response:xyz789... (TTL: 3600s)
```

### Common Issues

**Issue: Chatbot says "Invalid API key"**
- Check `.env.local` has `GROQ_API_KEY`
- Restart server after changing `.env.local`
- Verify API key is valid at console.groq.com

**Issue: Settings not updating**
- Clear Redis cache: `node clear-cache.js`
- Check `data/hotel-settings.json` was updated
- Restart server

**Issue: Slow responses**
- Check Redis connection: `node test-redis-upstash.js`
- Monitor cache hit rate in terminal logs
- Verify Upstash database is active

---

## 📚 Next Steps

**Planned Improvements:**
1. ✅ Redis caching (DONE)
2. 🔄 PostgreSQL database migration (planned)
3. 🔄 React Native mobile app (planned)
4. 🔄 User authentication
5. 🔄 Booking system
6. 🔄 Payment integration

**How to Extend:**
- Add new hotel facilities
- Implement booking system
- Add user accounts
- Create analytics dashboard
- Multi-hotel support
- Email notifications

---

## 🎓 Key Concepts

**RAG (Retrieval Augmented Generation)**
- Combines real data with AI generation
- Prevents AI hallucinations
- Ensures accurate, up-to-date responses

**Caching Strategy**
- Cache AI responses (1 hour)
- Cache hotel settings (1 hour)
- Invalidate on updates
- 95%+ reduction in API calls

**Next.js App Router**
- File-based routing
- Server components by default
- API routes in `/app/api`
- Dynamic routes with `[id]`

---

**Need Help?** Check the other documentation files:
- `AI_SETUP_GUIDE.md` - AI configuration
- `REDIS_SETUP_GUIDE.md` - Redis setup
- `PROJECT_ARCHITECTURE.md` - High-level architecture
- `QUICK_REFERENCE.md` - Quick commands

**Happy Coding! 🚀**
