# Analytics System - Complete Technical Explanation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [Data Flow](#data-flow)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [How Data is Collected](#how-data-is-collected)
7. [How Data is Retrieved](#how-data-is-retrieved)

---

## System Overview

The analytics system tracks guest interactions, demographics, and question patterns across all hotels. It's designed to provide real-time insights without storing raw chat messages (privacy-focused).

### Key Principles:
- **Privacy First**: We track insights, not raw conversations
- **Aggregated Data**: Daily aggregations reduce database size
- **Real-time Updates**: Data updates as guests interact
- **Multi-hotel Support**: Filter by specific hotel or view all hotels

---

## Database Architecture

### 5 Core Tables

#### 1. **guest_profiles** - Guest Demographics
Stores information about each unique guest session.

```sql
CREATE TABLE guest_profiles (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,  -- Unique per browser session
    hotel_id VARCHAR(50),                      -- Which hotel they're chatting with
    
    -- Demographics (collected during registration)
    age_range VARCHAR(20),                     -- "18-25", "26-35", "36-50", "50+"
    nationality VARCHAR(50),                   -- "France", "Germany", "USA", etc.
    travel_purpose VARCHAR(50),                -- "leisure", "business", "family", "honeymoon"
    group_type VARCHAR(50),                    -- "solo", "couple", "family", "group"
    
    -- Preferences
    preferred_language VARCHAR(10),            -- "en", "fr", "ar", etc.
    
    -- Metadata
    first_visit TIMESTAMP,                     -- When they first registered
    last_visit TIMESTAMP,                      -- Last interaction time
    total_interactions INTEGER,                -- How many messages they sent
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Track who is using the chatbot and their basic demographics.

**When Data is Added**: 
- During guest registration (GuestRegistrationForm.tsx)
- Updated on every chat message (increments total_interactions)

---

#### 2. **question_categories** - Question Analytics
Aggregates questions by category and tracks which age groups ask what.

```sql
CREATE TABLE question_categories (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50),
    
    -- Category tracking
    category VARCHAR(50),                      -- "facilities", "activities", "dining", etc.
    subcategory VARCHAR(50),                   -- "pool_hours", "spa_prices", "breakfast_time"
    
    -- Aggregated counts
    question_count INTEGER DEFAULT 1,          -- Total questions in this category
    last_asked TIMESTAMP,                      -- Most recent question time
    
    -- Age breakdown (which age groups ask this question)
    age_18_25 INTEGER DEFAULT 0,
    age_26_35 INTEGER DEFAULT 0,
    age_36_50 INTEGER DEFAULT 0,
    age_50_plus INTEGER DEFAULT 0,
    
    date DATE DEFAULT CURRENT_DATE,            -- Which day this data is for
    
    UNIQUE(hotel_id, category, subcategory, date)  -- One row per category per day
);
```

**Purpose**: Understand what guests are asking about and which age groups are interested in what.

**When Data is Added**: 
- Every time a guest sends a message
- Uses AI to detect question category (detectQuestionCategory function)
- Increments counters for that category and age group

**Example Data**:
```
hotel_id: "sindbad-hammamet"
category: "facilities"
subcategory: "pool_hours"
question_count: 45
age_18_25: 12
age_26_35: 20
age_36_50: 10
age_50_plus: 3
date: 2026-03-12
```

---

#### 3. **popular_topics** - Topic Mentions & Sentiment
Tracks which topics are mentioned and whether sentiment is positive/negative.

```sql
CREATE TABLE popular_topics (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50),
    
    topic VARCHAR(100),                        -- "pool", "spa", "breakfast", "wifi"
    mention_count INTEGER DEFAULT 1,           -- How many times mentioned
    positive_sentiment INTEGER DEFAULT 0,      -- Positive mentions
    negative_sentiment INTEGER DEFAULT 0,      -- Negative mentions
    
    date DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(hotel_id, topic, date)
);
```


**Purpose**: Track trending topics and guest satisfaction.

**When Data is Added**: 
- Every chat message is analyzed for topics
- Sentiment analysis determines if mention is positive/negative
- Used for satisfaction tracking

---

#### 4. **user_satisfaction** - Ratings & Feedback
Stores explicit user ratings and feedback.

```sql
CREATE TABLE user_satisfaction (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50),
    session_id VARCHAR(100),
    
    chatbot_rating INTEGER CHECK (chatbot_rating BETWEEN 1 AND 5),
    found_helpful BOOLEAN,
    feedback_text TEXT,
    missing_info TEXT,
    
    timestamp TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Collect direct feedback from users.

**When Data is Added**: 
- When users submit feedback forms (not yet implemented in UI)
- Future feature for rating chatbot responses

---

#### 5. **activity_interest** - Activity Tracking
Tracks which activities guests are interested in.

```sql
CREATE TABLE activity_interest (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50),
    
    activity_type VARCHAR(50),                 -- "hotel_activity" or "nearby_attraction"
    activity_name VARCHAR(100),
    category VARCHAR(50),
    
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    
    -- Demographics breakdown
    popular_with_families INTEGER DEFAULT 0,
    popular_with_couples INTEGER DEFAULT 0,
    popular_with_solo INTEGER DEFAULT 0,
    
    date DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(hotel_id, activity_type, activity_name, date)
);
```

**Purpose**: Understand which activities guests are interested in.

**When Data is Added**: 
- When guests ask about specific activities
- Future feature for tracking activity bookings

---

## Data Flow

### Complete Journey: From Guest Message to Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. GUEST SENDS MESSAGE                        │
│  Guest types: "What time does the pool open?"                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. CHAT API RECEIVES REQUEST                        │
│  File: app/api/chat/route.ts                                    │
│  - Validates input (Zod schema)                                 │
│  - Applies rate limiting                                        │
│  - Extracts sessionId from request                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           3. RETRIEVE GUEST PROFILE FROM DATABASE                │
│  Function: getGuestProfile(sessionId)                           │
│  Query: SELECT * FROM guest_profiles WHERE session_id = ?       │
│                                                                  │
│  Returns guest data:                                            │
│  - hotel_id: "sindbad-hammamet"                                 │
│  - age_range: "26-35"                                           │
│  - nationality: "France"                                        │
│  - travel_purpose: "leisure"                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         4. UPDATE GUEST INTERACTION COUNT                        │
│  Function: createOrUpdateGuestProfile()                         │
│  Query: UPDATE guest_profiles SET                               │
│         total_interactions = total_interactions + 1,            │
│         last_visit = NOW()                                      │
│         WHERE session_id = ?                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         5. ANALYZE MESSAGE FOR CATEGORY & TOPICS                 │
│  Function: detectQuestionCategory(message)                      │
│                                                                  │
│  Input: "What time does the pool open?"                         │
│                                                                  │
│  AI Detection Process:                                          │
│  - Scans for keywords: "pool", "swimming", "piscine", etc.     │
│  - Detects language: English                                    │
│  - Maps to category structure                                   │
│                                                                  │
│  Output:                                                        │
│  {                                                              │
│    category: "facilities",                                      │
│    subcategory: "pool_hours",                                   │
│    topics: ["pool"],                                            │
│    language: "en"                                               │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         6. TRACK QUESTION CATEGORY IN DATABASE                   │
│  Function: trackQuestionCategory()                              │
│  Query: INSERT INTO question_categories                         │
│         (hotel_id, category, subcategory, question_count,       │
│          age_26_35, date)                                       │
│         VALUES ('sindbad-hammamet', 'facilities',               │
│                 'pool_hours', 1, 1, '2026-03-12')               │
│         ON CONFLICT (hotel_id, category, subcategory, date)     │
│         DO UPDATE SET                                           │
│           question_count = question_count + 1,                  │
│           age_26_35 = age_26_35 + 1                             │
│                                                                  │
│  Result: Increments counters for this category and age group    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            7. TRACK POPULAR TOPICS IN DATABASE                   │
│  Function: trackPopularTopic()                                  │
│  Query: INSERT INTO popular_topics                              │
│         (hotel_id, topic, mention_count, date)                  │
│         VALUES ('sindbad-hammamet', 'pool', 1, '2026-03-12')    │
│         ON CONFLICT (hotel_id, topic, date)                     │
│         DO UPDATE SET                                           │
│           mention_count = mention_count + 1                     │
│                                                                  │
│  Result: Tracks that "pool" was mentioned today                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              8. GENERATE AI RESPONSE                             │
│  - Build hotel knowledge base                                   │
│  - Extract relevant context                                     │
│  - Call AI service (Groq)                                       │
│  - Return response to guest                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Data is Collected

### 1. Guest Registration (First Time)
**File**: `app/components/GuestRegistrationForm.tsx`

When a guest first visits, they fill out a registration form:


```typescript
// Guest fills out form with:
const guestData = {
  ageRange: "26-35",
  nationality: "France",
  travelPurpose: "leisure",
  groupType: "couple"
}

// This data is sent to API and stored in guest_profiles table
await createOrUpdateGuestProfile({
  sessionId: generateSessionId(),  // Unique browser session ID
  hotelId: "sindbad-hammamet",
  ageRange: guestData.ageRange,
  nationality: guestData.nationality,
  travelPurpose: guestData.travelPurpose,
  groupType: guestData.groupType
})
```

**Database Result**:
```sql
INSERT INTO guest_profiles (
  session_id, hotel_id, age_range, nationality, 
  travel_purpose, group_type, first_visit, last_visit, total_interactions
) VALUES (
  'abc123xyz', 'sindbad-hammamet', '26-35', 'France',
  'leisure', 'couple', NOW(), NOW(), 1
);
```

---

### 2. Every Chat Message
**File**: `app/api/chat/route.ts`

Every time a guest sends a message, analytics are tracked:

```typescript
// Step 1: Get guest profile
const guestProfile = await getGuestProfile(sessionId)

// Step 2: Update interaction count
await createOrUpdateGuestProfile({
  sessionId: guestProfile.session_id,
  hotelId: guestProfile.hotel_id,
  ageRange: guestProfile.age_range,
  nationality: guestProfile.nationality,
  travelPurpose: guestProfile.travel_purpose,
  groupType: guestProfile.group_type
})
// This increments total_interactions by 1

// Step 3: Detect question category
const { category, subcategory, topics } = detectQuestionCategory(message)

// Step 4: Track in database
await trackQuestionCategory(
  guestProfile.hotel_id,
  category,
  subcategory,
  guestProfile.age_range
)

// Step 5: Track topics
for (const topic of topics) {
  await trackPopularTopic(guestProfile.hotel_id, topic)
}
```

---

### 3. Category Detection Logic
**File**: `lib/analytics.ts`

The system uses keyword matching to detect categories:

```typescript
export function detectQuestionCategory(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // Multilingual keyword matching
  const keywords = {
    pool: ['pool', 'swimming', 'piscine', 'schwimmbad', 'مسبح'],
    spa: ['spa', 'massage', 'hammam', 'سبا'],
    breakfast: ['breakfast', 'petit déjeuner', 'frühstück', 'فطور'],
    wifi: ['wifi', 'internet', 'password', 'واي فاي'],
    // ... more keywords
  }
  
  // Check each keyword
  if (lowerMessage.includes('pool')) {
    return {
      category: 'facilities',
      subcategory: 'pool_hours',
      topics: ['pool'],
      language: detectLanguage(message)
    }
  }
  
  // Default fallback
  return {
    category: 'general',
    subcategory: 'general_inquiry',
    topics: ['general'],
    language: 'en'
  }
}
```

---

## How Data is Retrieved

### API Endpoints Structure

The analytics dashboard calls 3 main API endpoints:

1. **Overview API** - `/api/analytics/overview`
2. **Demographics API** - `/api/analytics/demographics`
3. **Questions API** - `/api/analytics/questions`

---

### 1. Overview API
**File**: `app/api/analytics/overview/route.ts`

**Purpose**: Get high-level KPIs (total guests, interactions, top category)

**Request**:
```
GET /api/analytics/overview?hotelId=sindbad-hammamet&timeRange=7d
```

**Query Parameters**:
- `hotelId` (optional): Filter by specific hotel, or "all" for all hotels
- `timeRange`: "1d", "7d", or "30d"

**SQL Queries Executed**:

```sql
-- 1. Total Guests
SELECT COUNT(*) as total 
FROM guest_profiles 
WHERE hotel_id = 'sindbad-hammamet' 
  AND first_visit >= '2026-03-05'  -- 7 days ago

-- 2. Total Interactions
SELECT SUM(total_interactions) as total 
FROM guest_profiles 
WHERE hotel_id = 'sindbad-hammamet' 
  AND last_visit >= '2026-03-05'

-- 3. Top Question Category
SELECT category, SUM(question_count) as total 
FROM question_categories 
WHERE hotel_id = 'sindbad-hammamet' 
  AND date >= '2026-03-05'
GROUP BY category 
ORDER BY total DESC 
LIMIT 1

-- 4. Average Interactions per Guest
SELECT AVG(total_interactions) as avg 
FROM guest_profiles 
WHERE hotel_id = 'sindbad-hammamet' 
  AND first_visit >= '2026-03-05'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalGuests": 145,
    "totalInteractions": 892,
    "topCategory": "facilities",
    "avgInteractions": 6.2,
    "timeRange": "7d"
  }
}
```

---

### 2. Demographics API
**File**: `app/api/analytics/demographics/route.ts`

**Purpose**: Get guest demographic breakdowns

**Request**:
```
GET /api/analytics/demographics?hotelId=sindbad-hammamet&timeRange=7d
```

**SQL Queries Executed**:

```sql
-- 1. Age Distribution
SELECT age_range, COUNT(*) as count 
FROM guest_profiles 
WHERE hotel_id = 'sindbad-hammamet' 
  AND first_visit >= '2026-03-05'
GROUP BY age_range 
ORDER BY count DESC

-- 2. Top Nationalities
SELECT nationality, COUNT(*) as count 
FROM guest_profiles 
WHERE hotel_id = 'sindbad-hammamet' 
  AND first_visit >= '2026-03-05'
GROUP BY nationality 
ORDER BY count DESC 
LIMIT 10

-- 3. Travel Purposes
SELECT travel_purpose, COUNT(*) as count 
FROM guest_profiles 
WHERE hotel_id = 'sindbad-hammamet' 
  AND first_visit >= '2026-03-05'
GROUP BY travel_purpose 
ORDER BY count DESC

-- 4. Group Types
SELECT group_type, COUNT(*) as count 
FROM guest_profiles 
WHERE hotel_id = 'sindbad-hammamet' 
  AND first_visit >= '2026-03-05'
GROUP BY group_type 
ORDER BY count DESC
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ageDistribution": [
      { "name": "26-35", "value": 58, "percentage": 40 },
      { "name": "36-50", "value": 45, "percentage": 31 },
      { "name": "18-25", "value": 30, "percentage": 21 },
      { "name": "50+", "value": 12, "percentage": 8 }
    ],
    "topNationalities": [
      { "name": "France", "value": 42 },
      { "name": "Germany", "value": 35 },
      { "name": "UK", "value": 28 }
    ],
    "travelPurposes": [
      { "name": "leisure", "value": 89 },
      { "name": "family", "value": 34 },
      { "name": "business", "value": 15 }
    ],
    "groupTypes": [
      { "name": "couple", "value": 67 },
      { "name": "family", "value": 45 },
      { "name": "solo", "value": 23 }
    ]
  }
}
```

---

### 3. Questions API
**File**: `app/api/analytics/questions/route.ts`

**Purpose**: Get question analytics and trends

**Request**:
```
GET /api/analytics/questions?hotelId=sindbad-hammamet&timeRange=7d
```

**SQL Queries Executed**:

```sql
-- 1. Question Categories
SELECT category, SUM(question_count) as total 
FROM question_categories 
WHERE hotel_id = 'sindbad-hammamet' 
  AND date >= '2026-03-05'
GROUP BY category 
ORDER BY total DESC

-- 2. Top Subcategories
SELECT subcategory, SUM(question_count) as total 
FROM question_categories 
WHERE hotel_id = 'sindbad-hammamet' 
  AND date >= '2026-03-05'
GROUP BY subcategory 
ORDER BY total DESC 
LIMIT 10

-- 3. Questions Over Time (Daily Trend)
SELECT date, SUM(question_count) as total 
FROM question_categories 
WHERE hotel_id = 'sindbad-hammamet' 
  AND date >= '2026-03-05'
GROUP BY date 
ORDER BY date ASC
```

**Response**:
```json
{
  "success": true,
  "data": {
    "questionCategories": [
      { "name": "facilities", "value": 234 },
      { "name": "dining", "value": 189 },
      { "name": "activities", "value": 156 }
    ],
    "topSubcategories": [
      { "name": "pool_hours", "value": 89 },
      { "name": "breakfast_time", "value": 67 },
      { "name": "wifi_password", "value": 54 }
    ],
    "questionsOverTime": [
      { "date": "2026-03-05", "questions": 98 },
      { "date": "2026-03-06", "questions": 112 },
      { "date": "2026-03-07", "questions": 105 }
    ]
  }
}
```

---

## Frontend Integration

### Analytics Dashboard Component
**File**: `app/admin/analytics/page.tsx`

The dashboard uses **SWR** (stale-while-revalidate) for data fetching:

```typescript
// Build API URL with filters
const buildUrl = (endpoint: string) => {
  const params = new URLSearchParams()
  if (selectedHotel !== 'all') params.set('hotelId', selectedHotel)
  params.set('timeRange', timeRange)
  return `/api/analytics/${endpoint}?${params.toString()}`
}

// Fetch data with auto-refresh
const { data: overviewData, mutate: mutateOverview } = useSWR(
  buildUrl('overview'), 
  fetcher,
  { refreshInterval: 30000 }  // Auto-refresh every 30 seconds
)

const { data: demographicsData } = useSWR(
  buildUrl('demographics'), 
  fetcher,
  { refreshInterval: 60000 }  // Auto-refresh every 60 seconds
)

const { data: questionsData } = useSWR(
  buildUrl('questions'), 
  fetcher,
  { refreshInterval: 30000 }
)
```

### Data Visualization with Recharts

```typescript
// Pie Chart - Age Distribution
<PieChart>
  <Pie
    data={demographicsData.data.ageDistribution}
    dataKey="value"
    label={({ name, value }) => `${name}: ${value}`}
  >
    {demographicsData.data.ageDistribution.map((_, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>

// Bar Chart - Question Categories
<BarChart data={questionsData.data.questionCategories}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="value" fill="#10B981" />
</BarChart>

// Line Chart - Questions Over Time
<LineChart data={questionsData.data.questionsOverTime}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="questions" stroke="#8B5CF6" />
</LineChart>
```

---

## Table Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│     hotels      │
│─────────────────│
│ hotel_id (PK)   │◄─────────┐
│ name            │          │
└─────────────────┘          │
                             │
                             │ Foreign Key
                             │
┌─────────────────────────────┴───────────────────────────┐
│                    guest_profiles                       │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ session_id (UNIQUE)                                     │
│ hotel_id (FK) ──────────────────────────────────────────┘
│ age_range                                               │
│ nationality                                             │
│ travel_purpose                                          │
│ group_type                                              │
│ total_interactions                                      │
│ first_visit                                             │
│ last_visit                                              │
└─────────────────────────────────────────────────────────┘
                             │
                             │ Used for filtering
                             │
┌─────────────────────────────┴───────────────────────────┐
│                 question_categories                     │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ hotel_id (FK) ──────────────────────────────────────────┘
│ category                                                │
│ subcategory                                             │
│ question_count                                          │
│ age_18_25                                               │
│ age_26_35                                               │
│ age_36_50                                               │
│ age_50_plus                                             │
│ date                                                    │
│ UNIQUE(hotel_id, category, subcategory, date)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   popular_topics                        │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ hotel_id (FK) ──────────────────────────────────────────┐
│ topic                                                   │
│ mention_count                                           │
│ positive_sentiment                                      │
│ negative_sentiment                                      │
│ date                                                    │
│ UNIQUE(hotel_id, topic, date)                          │
└─────────────────────────────────────────────────────────┘
```

### Key Relationships:

1. **hotels → guest_profiles**: One hotel has many guest profiles
2. **hotels → question_categories**: One hotel has many question records
3. **hotels → popular_topics**: One hotel has many topic mentions
4. **guest_profiles.age_range** is used to increment age columns in **question_categories**

---

## Key Features

### 1. Privacy-Focused Design
- **No raw messages stored**: Only categories and counts
- **Aggregated data**: Daily summaries instead of individual records
- **Session-based**: Uses session IDs, not personal identifiers

### 2. Efficient Queries
- **Indexed columns**: hotel_id, date, session_id all have indexes
- **UPSERT operations**: Uses `ON CONFLICT DO UPDATE` to avoid duplicates
- **Date-based partitioning**: Data grouped by date for fast queries

### 3. Real-time Updates
- **Auto-refresh**: Dashboard refreshes every 30-60 seconds
- **SWR caching**: Reduces API calls with smart caching
- **Non-blocking**: Analytics errors don't break chat functionality

### 4. Multi-language Support
- **Keyword detection**: Supports English, French, Arabic, German, Spanish, Italian
- **Language tracking**: Detects and logs guest language preferences

---

## Example: Complete Data Flow

Let's trace a real example from start to finish:

### Scenario: French guest asks about pool hours

**1. Guest Registration**:
```json
{
  "ageRange": "26-35",
  "nationality": "France",
  "travelPurpose": "leisure",
  "groupType": "couple"
}
```

**Database Insert**:
```sql
INSERT INTO guest_profiles 
VALUES ('session_abc123', 'sindbad-hammamet', '26-35', 'France', 
        'leisure', 'couple', 'fr', NOW(), NOW(), 1);
```

---

**2. Guest Sends Message**: "À quelle heure ouvre la piscine?"

**Category Detection**:
```typescript
detectQuestionCategory("À quelle heure ouvre la piscine?")
// Returns:
{
  category: "facilities",
  subcategory: "pool_hours",
  topics: ["pool"],
  language: "fr"
}
```

---

**3. Track Question Category**:
```sql
INSERT INTO question_categories 
  (hotel_id, category, subcategory, question_count, age_26_35, date)
VALUES 
  ('sindbad-hammamet', 'facilities', 'pool_hours', 1, 1, '2026-03-12')
ON CONFLICT (hotel_id, category, subcategory, date)
DO UPDATE SET
  question_count = question_categories.question_count + 1,
  age_26_35 = question_categories.age_26_35 + 1;
```

---

**4. Track Popular Topic**:
```sql
INSERT INTO popular_topics 
  (hotel_id, topic, mention_count, date)
VALUES 
  ('sindbad-hammamet', 'pool', 1, '2026-03-12')
ON CONFLICT (hotel_id, topic, date)
DO UPDATE SET
  mention_count = popular_topics.mention_count + 1;
```

---

**5. Update Guest Profile**:
```sql
UPDATE guest_profiles 
SET 
  total_interactions = total_interactions + 1,
  last_visit = NOW()
WHERE session_id = 'session_abc123';
```

---

**6. Admin Views Dashboard**:

The admin opens `/admin/analytics` and sees:

- **Total Guests**: 145 (from guest_profiles count)
- **Total Interactions**: 892 (from SUM of total_interactions)
- **Top Category**: "facilities" (from question_categories aggregation)
- **Age Distribution**: Pie chart showing 26-35 age group is 40%
- **Top Questions**: "pool_hours" is #1 with 89 questions
- **Questions Over Time**: Line chart showing daily trends

All this data comes from the 3 API endpoints querying the 5 analytics tables!

---

## Summary

The analytics system is a complete pipeline:

1. **Collection**: Guest registration + chat messages
2. **Processing**: AI categorization + keyword detection
3. **Storage**: 5 PostgreSQL tables with smart aggregation
4. **Retrieval**: 3 API endpoints with filtering
5. **Visualization**: React dashboard with Recharts

The key insight is that we track **patterns and insights**, not raw data, making it privacy-friendly, efficient, and actionable for hotel managers.
