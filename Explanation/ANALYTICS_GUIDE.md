# Analytics System Guide

## Overview

This analytics system tracks **insights, not raw data**. Instead of storing every chatbot message, we aggregate meaningful metrics that help you understand guest behavior and improve your service.

## What We Track

### 1. Guest Demographics (Collected Once)
When guests first access the chatbot, they fill out a registration form:
- Age range (18-25, 26-35, 36-50, 50+)
- Nationality
- Travel purpose (leisure, business, family, honeymoon)
- Group type (solo, couple, family, group)

**Storage**: `guest_profiles` table
**Purpose**: Understand your audience and personalize recommendations

### 2. Question Categories (Aggregated)
Instead of storing full messages, we track:
- Category (facilities, activities, dining, location, booking, weather, amenities, events)
- Subcategory (pool_hours, spa_prices, breakfast_time, etc.)
- Count per day
- Demographics breakdown (which age groups ask what)

**Storage**: `question_categories` table
**Purpose**: Identify most asked questions and improve information availability

### 3. Popular Topics (Daily Aggregated)
Track which topics guests mention most:
- Topic keywords (pool, spa, breakfast, wifi, parking, etc.)
- Mention count per day
- Sentiment (positive/negative/neutral)

**Storage**: `popular_topics` table
**Purpose**: Understand what matters most to guests

### 4. User Satisfaction
After chat sessions, guests can rate their experience:
- Chatbot rating (1-5 stars)
- Was it helpful? (yes/no)
- Optional feedback text
- What information was missing?

**Storage**: `user_satisfaction` table
**Purpose**: Measure chatbot effectiveness and identify gaps

### 5. Activity Interest (Aggregated)
Track which activities guests are interested in:
- Activity type (hotel_activity or nearby_attraction)
- Activity name
- View count vs inquiry count
- Popular with which group types (families, couples, solo)

**Storage**: `activity_interest` table
**Purpose**: Understand which activities to promote and invest in

## How It Works

### User Flow

1. **Guest arrives** → Registration form appears
2. **Guest fills form** → Profile saved to database
3. **Guest chats** → Each message is analyzed:
   - Category detected automatically
   - Topics extracted
   - Metrics aggregated (not stored verbatim)
4. **Guest finishes** → Optional satisfaction rating

### Automatic Tracking

The system automatically:
- Detects question categories from message content
- Extracts relevant topics
- Aggregates data by day
- Links to guest demographics for insights

### Privacy-Friendly

- No full message storage
- Only aggregated metrics
- Session-based (not personally identifiable)
- Compliant with data minimization principles

## API Endpoints

### 1. Save Guest Profile
```
POST /api/analytics/guest-profile
Body: {
  sessionId: string,
  hotelId: string,
  ageRange: string,
  nationality: string,
  travelPurpose: string,
  groupType: string
}
```

### 2. Save Satisfaction Feedback
```
POST /api/analytics/satisfaction
Body: {
  hotelId: string,
  sessionId: string,
  chatbotRating: number (1-5),
  foundHelpful: boolean,
  feedbackText?: string,
  missingInfo?: string
}
```

### 3. Get Analytics Dashboard
```
GET /api/analytics/dashboard?hotelId=sindbad-hammamet
Response: {
  mostAskedQuestions: [...],
  demographics: [...],
  popularActivities: [...],
  satisfaction: { avg_rating, total_ratings, helpful_count }
}
```

## Analytics Functions

Located in `lib/analytics.ts`:

### Guest Profile
- `createOrUpdateGuestProfile(profile)` - Save/update guest profile
- `getGuestProfile(sessionId)` - Retrieve guest profile

### Question Tracking
- `trackQuestionCategory(hotelId, category, subcategory, ageRange)` - Track question
- `detectQuestionCategory(message)` - Auto-detect category from message

### Topic Tracking
- `trackPopularTopic(hotelId, topic, sentiment)` - Track topic mention

### Satisfaction
- `trackUserSatisfaction(feedback)` - Save satisfaction rating

### Activity Interest
- `trackActivityInterest(hotelId, activityType, activityName, category, interactionType, groupType)` - Track activity interest

### Analytics Queries
- `getMostAskedQuestions(hotelId, limit)` - Get top questions
- `getGuestDemographics(hotelId)` - Get demographic breakdown
- `getPopularActivities(hotelId, limit)` - Get popular activities
- `getAverageSatisfaction(hotelId)` - Get satisfaction metrics

## Database Tables

### guest_profiles
- Stores one record per unique session
- Tracks total interactions and visit times
- Links demographics to all other analytics

### question_categories
- One record per category/subcategory/day
- Aggregates question counts
- Breaks down by age range

### popular_topics
- One record per topic/day
- Tracks mention count and sentiment
- Helps identify trending topics

### user_satisfaction
- One record per feedback submission
- Stores ratings and optional text feedback
- Measures chatbot effectiveness

### activity_interest
- One record per activity/day
- Tracks views vs inquiries
- Shows which groups are interested

## Integration with Power BI / Python

### Power BI Connection

1. **Direct Query** (Recommended for real-time):
```
Data Source: PostgreSQL
Server: ep-rapid-mode-ai3xvoxo-pooler.c-4.us-east-1.aws.neon.tech
Database: neondb
Authentication: Database (username/password)
```

2. **Import Mode** (For faster dashboards):
- Connect to database
- Import tables: guest_profiles, question_categories, popular_topics, user_satisfaction, activity_interest
- Set up scheduled refresh

### Python Analysis

```python
import psycopg2
import pandas as pd

# Connect to database
conn = psycopg2.connect(
    host="ep-rapid-mode-ai3xvoxo-pooler.c-4.us-east-1.aws.neon.tech",
    database="neondb",
    user="neondb_owner",
    password="npg_Kkum2tFlp0zh",
    sslmode="require"
)

# Query most asked questions
df = pd.read_sql("""
    SELECT 
        category, 
        subcategory, 
        SUM(question_count) as total_count
    FROM question_categories
    WHERE hotel_id = 'sindbad-hammamet'
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY category, subcategory
    ORDER BY total_count DESC
    LIMIT 10
""", conn)

print(df)
```

### Example Queries

**Most Asked Questions by Age Group**:
```sql
SELECT 
    category,
    subcategory,
    age_18_25,
    age_26_35,
    age_36_50,
    age_50_plus,
    question_count
FROM question_categories
WHERE hotel_id = 'sindbad-hammamet'
    AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY question_count DESC;
```

**Guest Demographics**:
```sql
SELECT 
    age_range,
    nationality,
    travel_purpose,
    group_type,
    COUNT(*) as guest_count
FROM guest_profiles
WHERE hotel_id = 'sindbad-hammamet'
GROUP BY age_range, nationality, travel_purpose, group_type
ORDER BY guest_count DESC;
```

**Popular Activities**:
```sql
SELECT 
    activity_name,
    category,
    SUM(view_count) as total_views,
    SUM(inquiry_count) as total_inquiries,
    SUM(popular_with_families) as family_interest,
    SUM(popular_with_couples) as couple_interest
FROM activity_interest
WHERE hotel_id = 'sindbad-hammamet'
    AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY activity_name, category
ORDER BY total_inquiries DESC;
```

**Satisfaction Trends**:
```sql
SELECT 
    DATE(timestamp) as date,
    AVG(chatbot_rating) as avg_rating,
    COUNT(*) as total_ratings,
    SUM(CASE WHEN found_helpful THEN 1 ELSE 0 END) as helpful_count
FROM user_satisfaction
WHERE hotel_id = 'sindbad-hammamet'
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date;
```

## Benefits

### For Hotel Management
- Understand guest needs and preferences
- Identify service gaps
- Optimize staff training
- Improve information availability
- Data-driven decision making

### For Marketing
- Target right demographics
- Promote popular activities
- Understand guest interests
- Personalize campaigns

### For Operations
- Anticipate common questions
- Improve chatbot responses
- Reduce front desk workload
- Enhance guest experience

## Next Steps

1. ✅ Database tables created
2. ✅ Analytics functions implemented
3. ✅ Guest registration form added
4. ✅ Chat API tracking integrated
5. ✅ Satisfaction rating widget created
6. 🔄 Build analytics dashboard in admin panel
7. 🔄 Connect to Power BI for visualization
8. 🔄 Set up automated reports

## Notes

- All analytics are aggregated daily
- No personally identifiable information stored
- Session IDs are random, not linked to real identities
- Data retention: Consider archiving data older than 1 year
- Performance: Indexes created on all query columns
