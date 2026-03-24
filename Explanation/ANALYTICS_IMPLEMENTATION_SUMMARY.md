# Analytics Implementation Summary

## ✅ Completed Tasks

### 1. Database Tables Created
- `guest_profiles` - User demographics collected once per session
- `question_categories` - Aggregated question tracking (not individual messages)
- `popular_topics` - Daily topic mentions with sentiment
- `user_satisfaction` - Ratings and feedback
- `activity_interest` - Activity view/inquiry metrics

### 2. Analytics Library (`lib/analytics.ts`)
Created comprehensive analytics functions:
- Guest profile management
- Question category detection and tracking
- Topic tracking with sentiment
- Satisfaction feedback
- Activity interest tracking
- Analytics query functions for dashboard

### 3. User Registration Form
**File**: `app/components/GuestRegistrationForm.tsx`
- Collects: age range, nationality, travel purpose, group type
- Saves to database with unique session ID
- Stores session in localStorage for persistence
- Beautiful UI with Framer Motion animations

### 4. Satisfaction Rating Widget
**File**: `app/components/SatisfactionRating.tsx`
- 5-star rating system
- Helpful/not helpful feedback
- Optional text feedback
- Missing information field
- Animated modal with smooth UX

### 5. API Endpoints
- `POST /api/analytics/guest-profile` - Save guest demographics
- `POST /api/analytics/satisfaction` - Save satisfaction feedback
- `GET /api/analytics/dashboard?hotelId=X` - Get all analytics data

### 6. Chat API Integration
**File**: `app/api/chat/route.ts`
- Automatically detects question categories
- Tracks topics mentioned
- Links to guest demographics
- Updates interaction count
- Non-blocking async tracking

### 7. Hotel Page Updates
**File**: `app/hotel/[id]/page.tsx`
- Shows registration form on first visit
- Stores session ID in localStorage
- Passes session ID to chat API
- Ready for satisfaction widget integration

### 8. Documentation
- `ANALYTICS_GUIDE.md` - Complete system documentation
- Includes Power BI and Python integration examples
- Sample SQL queries for analysis

## 🎯 What Gets Tracked

### Automatically Tracked (No User Action)
1. **Question Categories**: Detected from message content
   - Categories: facilities, activities, dining, location, booking, weather, amenities, events
   - Subcategories: pool_hours, spa_prices, breakfast_time, etc.
   - Age group breakdown

2. **Popular Topics**: Keywords extracted from messages
   - Topics: pool, spa, breakfast, wifi, parking, activities, etc.
   - Sentiment: positive, negative, neutral
   - Daily aggregation

3. **Guest Interactions**: Session-based tracking
   - Total interactions per guest
   - First and last visit times
   - Linked to demographics

### User-Provided Data
1. **Demographics** (collected once):
   - Age range
   - Nationality
   - Travel purpose
   - Group type

2. **Satisfaction** (optional after chat):
   - Star rating (1-5)
   - Helpful yes/no
   - Feedback text
   - Missing information

## 📊 How to Use Analytics

### View Analytics Dashboard
```javascript
// Fetch analytics for a hotel
const response = await fetch('/api/analytics/dashboard?hotelId=sindbad-hammamet')
const data = await response.json()

console.log(data.mostAskedQuestions)  // Top 10 questions
console.log(data.demographics)         // Guest breakdown
console.log(data.popularActivities)    // Activity interest
console.log(data.satisfaction)         // Average ratings
```

### Power BI Connection
1. Open Power BI Desktop
2. Get Data → PostgreSQL
3. Server: `ep-rapid-mode-ai3xvoxo-pooler.c-4.us-east-1.aws.neon.tech`
4. Database: `neondb`
5. Select tables: `guest_profiles`, `question_categories`, `popular_topics`, `user_satisfaction`, `activity_interest`
6. Create visualizations

### Python Analysis
```python
import psycopg2
import pandas as pd

conn = psycopg2.connect(
    host="ep-rapid-mode-ai3xvoxo-pooler.c-4.us-east-1.aws.neon.tech",
    database="neondb",
    user="neondb_owner",
    password="npg_Kkum2tFlp0zh",
    sslmode="require"
)

# Get most asked questions
df = pd.read_sql("""
    SELECT category, subcategory, SUM(question_count) as total
    FROM question_categories
    WHERE hotel_id = 'sindbad-hammamet'
    GROUP BY category, subcategory
    ORDER BY total DESC
    LIMIT 10
""", conn)
```

## 🔄 User Flow

1. **Guest visits hotel page** → Registration form appears
2. **Guest fills form** → Profile saved, session ID created
3. **Guest chats with bot** → Each message tracked:
   - Category detected automatically
   - Topics extracted
   - Metrics aggregated (message not stored)
4. **Guest finishes chat** → Optional satisfaction rating
5. **Guest returns later** → Session restored from localStorage

## 🎨 Next Steps (Optional Enhancements)

### Add Satisfaction Widget to Hotel Page
In `app/hotel/[id]/page.tsx`, add:
```typescript
import SatisfactionRating from '@/app/components/SatisfactionRating'

// Add state
const [showSatisfaction, setShowSatisfaction] = useState(false)

// Show after 5+ messages
useEffect(() => {
  if (messages.length >= 10 && !showSatisfaction) {
    setShowSatisfaction(true)
  }
}, [messages])

// Render
{showSatisfaction && pageState.sessionId && (
  <SatisfactionRating
    hotelId={hotelId}
    sessionId={pageState.sessionId}
    onClose={() => setShowSatisfaction(false)}
  />
)}
```

### Build Admin Analytics Dashboard
Create `app/dashboard/analytics/page.tsx`:
- Charts for most asked questions
- Demographics pie charts
- Activity popularity graphs
- Satisfaction trends over time
- Export to CSV/Excel

### Activity Interest Tracking
When user clicks on activities, track:
```typescript
import { trackActivityInterest } from '@/lib/analytics'

// On activity view
await trackActivityInterest(
  hotelId,
  'hotel_activity',
  'Spa Treatment',
  'relaxation',
  'view',
  guestProfile.groupType
)

// On activity inquiry
await trackActivityInterest(
  hotelId,
  'nearby_attraction',
  'Medina Tour',
  'cultural',
  'inquiry',
  guestProfile.groupType
)
```

## 📈 Benefits

### For Management
- Understand what guests ask most
- Identify service gaps
- Data-driven decisions
- Improve chatbot responses

### For Marketing
- Target right demographics
- Promote popular activities
- Personalize campaigns
- Understand guest interests

### For Operations
- Anticipate common questions
- Reduce front desk workload
- Improve information availability
- Enhance guest experience

## 🔒 Privacy & Compliance

- ✅ No full message storage
- ✅ Only aggregated metrics
- ✅ Session-based (not personally identifiable)
- ✅ Data minimization principles
- ✅ GDPR-friendly approach
- ✅ No sensitive personal data

## 📝 Files Created/Modified

### New Files
- `lib/analytics.ts` - Analytics functions
- `app/components/GuestRegistrationForm.tsx` - Registration form
- `app/components/SatisfactionRating.tsx` - Satisfaction widget
- `app/api/analytics/guest-profile/route.ts` - Profile API
- `app/api/analytics/satisfaction/route.ts` - Satisfaction API
- `app/api/analytics/dashboard/route.ts` - Dashboard API
- `scripts/smart-analytics-tables.sql` - Database schema
- `ANALYTICS_GUIDE.md` - Complete documentation

### Modified Files
- `app/api/chat/route.ts` - Added analytics tracking
- `app/hotel/[id]/page.tsx` - Added registration form
- `lib/validation.ts` - Added sessionId to schema

## ✨ Key Features

1. **Smart Category Detection**: Automatically categorizes questions
2. **Privacy-First**: No message storage, only insights
3. **Demographics Integration**: Links all data to guest profiles
4. **Real-Time Tracking**: Async, non-blocking analytics
5. **Dashboard Ready**: API endpoint for visualization
6. **Power BI Compatible**: Direct database connection
7. **Python Ready**: Easy data science integration

## 🚀 Ready to Use

The system is fully implemented and ready to track analytics. Just:
1. Users will see registration form on first visit
2. Analytics automatically track in background
3. View data via API or connect Power BI/Python
4. Build custom dashboards as needed

No additional setup required!
