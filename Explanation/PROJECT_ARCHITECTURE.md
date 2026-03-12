# Tunisia Hotel Assistant - Complete Project Architecture

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [File-by-File Explanation](#file-by-file-explanation)
7. [How Everything Connects](#how-everything-connects)
8. [API Routes](#api-routes)
9. [Potential Improvements](#potential-improvements)

---

## 🎯 Project Overview

This is a **Next.js web application** that provides an AI-powered hotel concierge chatbot for Tunisian hotels. It has two main parts:

1. **Customer-Facing Chatbot**: Guests can chat with an AI assistant about hotel facilities, activities, weather, and special events
2. **Admin Dashboard**: Hotel staff can manage settings, schedules, special events, and amenities

---

## 🛠 Technology Stack

- **Framework**: Next.js 14 (React-based)
- **Language**: TypeScript + JavaScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Image Optimization**: Next.js Image component
- **API**: Next.js API Routes
- **Data Storage**: JSON file (data/hotel-settings.json)

---

## 📁 Project Structure

```
tunisia-hotel-assistant/
├── app/                          # Next.js App Router (main application)
│   ├── api/                      # Backend API routes
│   │   └── hotel-settings/       # Hotel settings API
│   │       └── route.ts          # GET/POST endpoints for settings
│   ├── components/               # Reusable React components
│   │   └── LoadingSpinner.tsx    # Loading animation component
│   ├── dashboard/                # Admin dashboard page
│   │   └── page.tsx              # Admin interface for managing hotels
│   ├── hotel/                    # Hotel chatbot pages
│   │   └── [id]/                 # Dynamic route for each hotel
│   │       └── page.tsx          # Chatbot interface
│   ├── test/                     # Test page
│   │   └── page.tsx              # Simple test page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout (wraps all pages)
│   └── page.tsx                  # Homepage (hotel selection)
├── data/                         # Data storage
│   └── hotel-settings.json       # Hotel configurations & settings
├── lib/                          # Utility libraries
│   └── hotelData.ts              # Hotel data helper functions
├── api/                          # Python API (legacy, not used)
│   ├── hotel_api.py              # Flask API (not currently used)
│   └── requirements.txt          # Python dependencies
├── hotel_chatbot.py              # Streamlit chatbot (legacy, not used)
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Node.js dependencies
└── README.md                     # Project documentation
```

---

## 🧩 Core Components

### 1. **Homepage** (`app/page.tsx`)
- **Purpose**: Landing page where users select a hotel
- **Features**:
  - Displays 3 hotels (Sindbad, Paradise Beach, Mövenpick)
  - Each hotel card shows image, description, rating, features
  - "Chat Now" button → takes user to chatbot
  - "Admin" button → takes admin to dashboard

### 2. **Hotel Chatbot** (`app/hotel/[id]/page.tsx`)
- **Purpose**: Interactive AI concierge for guests
- **Features**:
  - Real-time chat interface
  - Answers questions about:
    - Hotel facilities (pool, gym, spa, restaurant)
    - Activities (family, couples, adventure, cultural)
    - Weather information
    - Special events
    - WiFi, parking, check-in/out times
  - Multilingual support (English, Spanish, French, Arabic, German, Italian)
  - Guest type selector (family, couples, adventure, cultural)
  - Weather widget showing current conditions

### 3. **Admin Dashboard** (`app/dashboard/page.tsx`)
- **Purpose**: Management interface for hotel staff
- **Features**:
  - **Hotel Selector**: Switch between different hotels
  - **Tabbed Interface**:
    - **Facilities**: Manage pool, gym, spa, kids club hours
    - **Restaurant**: Set breakfast, lunch, dinner times
    - **Special Events**: Add/remove events with date, time, location, price
    - **Amenities**: Configure WiFi, parking, check-in/out
    - **Contact**: Update phone, email, emergency contacts
  - **Save Button**: Saves all changes to JSON file via API

### 4. **API Route** (`app/api/hotel-settings/route.ts`)
- **Purpose**: Backend API for reading/writing hotel data
- **Endpoints**:
  - `GET /api/hotel-settings`: Fetch all hotel settings
  - `POST /api/hotel-settings`: Update hotel settings
- **Data Source**: Reads/writes to `data/hotel-settings.json`

---

## 🔄 Data Flow

### Customer Journey:
```
1. User visits homepage (/)
   ↓
2. Selects a hotel (e.g., "Sindbad Hotel")
   ↓
3. Redirected to /hotel/sindbad-hammamet
   ↓
4. Chatbot loads:
   - Fetches hotel settings from API
   - Fetches weather data from Open-Meteo API
   - Displays welcome message
   ↓
5. User types question
   ↓
6. Chatbot analyzes question:
   - Detects language
   - Identifies topic (facilities, activities, weather, events)
   - Fetches relevant data from hotel settings
   ↓
7. Displays response in user's language
```

### Admin Journey:
```
1. Admin clicks "Admin" button on homepage
   ↓
2. Redirected to /dashboard
   ↓
3. Dashboard loads:
   - Fetches current settings from API
   - Displays in editable form
   ↓
4. Admin makes changes:
   - Updates facility hours
   - Adds special event
   - Changes contact info
   ↓
5. Clicks "Save Changes"
   ↓
6. POST request to /api/hotel-settings
   ↓
7. JSON file updated
   ↓
8. Changes immediately available to chatbot
```

---

## 📄 File-by-File Explanation

### **Frontend Files**

#### `app/page.tsx` (Homepage)
```typescript
// What it does:
- Displays 3 hotel cards with images and info
- Each card has "Chat Now" button → /hotel/[hotel-id]
- Admin button → /dashboard
- Uses Framer Motion for animations
- Responsive design with Tailwind CSS
```

#### `app/hotel/[id]/page.tsx` (Chatbot)
```typescript
// What it does:
- Dynamic route: [id] = hotel identifier (sindbad-hammamet, etc.)
- Manages chat state (messages, input, loading)
- Fetches hotel settings from API on load
- Fetches weather data from Open-Meteo API
- Detects user language from message
- Processes questions and generates responses
- Displays chat interface with animations

// Key Functions:
- detectLanguage(): Identifies user's language
- detectActivityKeywords(): Checks if asking about activities
- getHotelInfo(): Returns info about facilities
- getActivityRecommendations(): Suggests activities + events
- getWeatherInfo(): Returns weather data
- handleSendMessage(): Processes user input
```

#### `app/dashboard/page.tsx` (Admin Dashboard)
```typescript
// What it does:
- Loads hotel settings from API
- Displays tabbed interface for different settings
- Allows editing all hotel configurations
- Saves changes back to API
- Shows success/error messages

// Key Features:
- Hotel selector dropdown
- Tabs: Facilities, Restaurant, Events, Amenities, Contact
- Add/remove special events
- Toggle availability of services
- Set operating hours for all facilities
```

#### `app/layout.tsx` (Root Layout)
```typescript
// What it does:
- Wraps entire application
- Loads Inter font from Google Fonts
- Sets metadata (title, description)
- Applies global styles
- Provides consistent layout for all pages
```

### **Backend Files**

#### `app/api/hotel-settings/route.ts` (API)
```typescript
// What it does:
- GET: Reads hotel-settings.json and returns data
- POST: Receives updated settings and writes to JSON file
- Uses Node.js fs module for file operations
- Returns JSON responses

// Endpoints:
GET  /api/hotel-settings  → Returns all hotel data
POST /api/hotel-settings  → Updates hotel data
```

### **Data Files**

#### `data/hotel-settings.json`
```json
// What it stores:
{
  "sindbad-hammamet": {
    "pool": { "available": true, "openTime": "06:00", "closeTime": "22:00" },
    "gym": { "available": true, "openTime": "05:00", "closeTime": "23:00" },
    "spa": { "available": true, "openTime": "09:00", "closeTime": "20:00" },
    "restaurant": {
      "breakfast": { "available": true, "start": "07:00", "end": "10:00" },
      "lunch": { "available": true, "start": "12:00", "end": "15:00" },
      "dinner": { "available": true, "start": "19:00", "end": "22:00" }
    },
    "specialEvents": [
      {
        "id": "...",
        "title": "Beach Party",
        "date": "2026-02-15",
        "time": "20:00",
        "location": "Beach",
        "description": "...",
        "price": "Free"
      }
    ],
    "wifi": { "available": true, "password": "...", "instructions": "..." },
    "parking": { "available": true, "price": "...", "instructions": "..." },
    "checkIn": { "time": "14:00", "instructions": "..." },
    "checkOut": { "time": "12:00", "instructions": "..." },
    "contact": { "phone": "...", "email": "...", "emergency": "..." }
  },
  "paradise-hammamet": { ... },
  "movenpick-sousse": { ... }
}
```

### **Configuration Files**

#### `next.config.js`
```javascript
// What it does:
- Configures Next.js behavior
- Sets up image optimization (WebP format)
- Allows images from Unsplash domains
- Sets cache TTL for images
```

#### `tailwind.config.js`
```javascript
// What it does:
- Configures Tailwind CSS
- Defines custom colors, fonts, animations
- Sets up responsive breakpoints
```

#### `tsconfig.json`
```json
// What it does:
- TypeScript compiler configuration
- Sets module resolution rules
- Enables JSX support
- Configures path aliases
```

#### `package.json`
```json
// What it does:
- Lists all npm dependencies
- Defines scripts (dev, build, start)
- Project metadata

// Key Dependencies:
- next: Framework
- react: UI library
- framer-motion: Animations
- lucide-react: Icons
- tailwindcss: Styling
```

---

## 🔗 How Everything Connects

### Connection Map:
```
Homepage (/)
    ↓
    ├─→ Hotel Chatbot (/hotel/[id])
    │       ↓
    │       ├─→ API Route (/api/hotel-settings) [GET]
    │       │       ↓
    │       │       └─→ hotel-settings.json [READ]
    │       │
    │       └─→ Open-Meteo API (weather data)
    │
    └─→ Admin Dashboard (/dashboard)
            ↓
            ├─→ API Route (/api/hotel-settings) [GET]
            │       ↓
            │       └─→ hotel-settings.json [READ]
            │
            └─→ API Route (/api/hotel-settings) [POST]
                    ↓
                    └─→ hotel-settings.json [WRITE]
```

### Data Synchronization:
1. Admin updates settings in dashboard
2. Dashboard sends POST to API
3. API writes to JSON file
4. Chatbot fetches from API (reads JSON)
5. Chatbot shows updated info to guests

---

## 🚀 API Routes

### GET /api/hotel-settings
**Purpose**: Fetch all hotel configurations

**Request**: None

**Response**:
```json
{
  "sindbad-hammamet": { ... },
  "paradise-hammamet": { ... },
  "movenpick-sousse": { ... }
}
```

### POST /api/hotel-settings
**Purpose**: Update hotel configurations

**Request Body**:
```json
{
  "sindbad-hammamet": { ... },
  "paradise-hammamet": { ... },
  "movenpick-sousse": { ... }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 💡 Potential Improvements

### 1. **Database Integration**
- **Current**: JSON file storage
- **Improvement**: Use PostgreSQL, MongoDB, or Supabase
- **Benefits**: Better scalability, concurrent access, data integrity

### 2. **Authentication**
- **Current**: No login system
- **Improvement**: Add admin authentication (NextAuth.js)
- **Benefits**: Secure admin dashboard, prevent unauthorized changes

### 3. **Real AI Integration**
- **Current**: Rule-based responses
- **Improvement**: Integrate OpenAI GPT or Claude API
- **Benefits**: More natural conversations, better understanding

### 4. **Booking System**
- **Current**: Information only
- **Improvement**: Add room booking functionality
- **Benefits**: Complete hotel management system

### 5. **Analytics Dashboard**
- **Current**: No tracking
- **Improvement**: Track popular questions, user engagement
- **Benefits**: Understand guest needs, improve service

### 6. **Multi-language Admin**
- **Current**: Admin in English only
- **Improvement**: Translate admin interface
- **Benefits**: Easier for non-English staff

### 7. **Image Upload**
- **Current**: Hardcoded Unsplash URLs
- **Improvement**: Allow admins to upload hotel photos
- **Benefits**: Customizable branding

### 8. **Email Notifications**
- **Current**: No notifications
- **Improvement**: Email admins when events are added
- **Benefits**: Better team coordination

### 9. **Mobile App**
- **Current**: Web only
- **Improvement**: React Native mobile app
- **Benefits**: Better mobile experience, push notifications

### 10. **Caching Layer**
- **Current**: Direct API calls
- **Improvement**: Add Redis caching
- **Benefits**: Faster response times, reduced load

---

## 🎓 Key Concepts to Understand

### Next.js App Router
- **File-based routing**: Files in `app/` become routes
- **Dynamic routes**: `[id]` creates variable routes
- **Server Components**: Default, faster initial load
- **Client Components**: Use `'use client'` for interactivity

### React Hooks Used
- `useState`: Manage component state
- `useEffect`: Run code on component mount/update
- `useRef`: Reference DOM elements
- `useParams`: Get URL parameters
- `useRouter`: Navigate programmatically

### TypeScript Benefits
- Type safety prevents bugs
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

### Tailwind CSS
- Utility-first CSS framework
- Classes like `bg-blue-500`, `p-4`, `rounded-lg`
- Responsive: `md:`, `lg:` prefixes
- No custom CSS files needed

---

## 📚 Learning Resources

To understand this project better, learn about:

1. **Next.js**: https://nextjs.org/docs
2. **React**: https://react.dev/learn
3. **TypeScript**: https://www.typescriptlang.org/docs/
4. **Tailwind CSS**: https://tailwindcss.com/docs
5. **Framer Motion**: https://www.framer.com/motion/

---

## 🔍 Quick Reference

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
npm start
```

### Access Points
- Homepage: http://localhost:3000
- Admin: http://localhost:3000/dashboard
- Chatbot: http://localhost:3000/hotel/sindbad-hammamet
- API: http://localhost:3000/api/hotel-settings

---

**Created**: February 2026
**Last Updated**: February 10, 2026
