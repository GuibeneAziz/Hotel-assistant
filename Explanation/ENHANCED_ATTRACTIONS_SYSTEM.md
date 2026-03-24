# Enhanced Nearby Attractions System

## Overview

The enhanced attractions system ensures that the chatbot **ONLY** recommends attractions from the database, not from its general AI knowledge. It provides personalized recommendations based on:

- **Guest Profile**: Age, group type (couple/family/solo), travel purpose
- **Weather Conditions**: Current temperature and weather (sunny/rainy)
- **Attraction Targeting**: Each attraction is tagged for specific guest types and weather

## Key Features

### 1. Database-Only Recommendations
- ✅ Chatbot only suggests attractions from the `nearby_attractions` table
- ✅ No more AI "hallucinations" or made-up attractions
- ✅ Complete control over what guests see

### 2. Personalized Matching
- **Guest Type Targeting**: Attractions tagged for couples, families, solo travelers, groups
- **Age Group Targeting**: Different recommendations for young (18-35), middle (36-50), senior (50+)
- **Weather Awareness**: Attractions marked as suitable for sunny, rainy, hot, mild, or cool weather
- **Travel Purpose**: Leisure, business, family, honeymoon travelers get different suggestions

### 3. Smart Scoring System
Each attraction gets a match score (0-100) based on:
- Guest type match (25 points)
- Age group match (15 points)  
- Weather suitability (20 points)
- Temperature match (15 points)
- Travel purpose match (10-15 points)
- Admin priority setting (variable points)

## Database Schema

### Enhanced `nearby_attractions` Table

```sql
CREATE TABLE nearby_attractions (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) NOT NULL,
    
    -- Basic Information
    attraction_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,       -- "cultural", "adventure", "shopping", "nature"
    
    -- Location & Logistics
    distance VARCHAR(50),                 -- "5 km", "15 minutes drive"
    estimated_duration VARCHAR(50),       -- "2 hours", "Half day"
    price_range VARCHAR(50),              -- "Free", "10-20 TND"
    transportation VARCHAR(100),          -- "Hotel shuttle", "Taxi"
    
    -- Guest Type Targeting
    suitable_for_couples BOOLEAN DEFAULT false,
    suitable_for_families BOOLEAN DEFAULT false,
    suitable_for_solo BOOLEAN DEFAULT false,
    suitable_for_groups BOOLEAN DEFAULT false,
    suitable_for_business BOOLEAN DEFAULT false,
    
    -- Age Group Targeting
    suitable_for_young BOOLEAN DEFAULT true,     -- 18-35
    suitable_for_middle BOOLEAN DEFAULT true,    -- 36-50
    suitable_for_senior BOOLEAN DEFAULT true,    -- 50+
    
    -- Weather Conditions
    good_for_sunny BOOLEAN DEFAULT true,
    good_for_rainy BOOLEAN DEFAULT false,
    good_for_windy BOOLEAN DEFAULT true,
    good_for_hot BOOLEAN DEFAULT true,           -- 30°C+
    good_for_mild BOOLEAN DEFAULT true,          -- 20-29°C
    good_for_cool BOOLEAN DEFAULT true,          -- Below 20°C
    
    -- Additional Metadata
    activity_level VARCHAR(20) DEFAULT 'moderate',  -- "low", "moderate", "high"
    requires_booking BOOLEAN DEFAULT false,
    booking_contact VARCHAR(100),
    special_notes TEXT,
    priority_order INTEGER DEFAULT 0,           -- Higher = shown first
    
    UNIQUE(hotel_id, attraction_name)
);
```

## How It Works

### 1. Guest Registration
When guests register, their profile is saved:
```typescript
{
  ageRange: "26-35",
  groupType: "couple", 
  travelPurpose: "leisure"
}
```

### 2. Weather Analysis
Current weather is analyzed:
```typescript
{
  temperature: 28,
  isRainy: false,
  description: "Sunny"
}
```

### 3. Personalized Query
The system queries attractions with matching criteria:
```sql
SELECT * FROM nearby_attractions 
WHERE hotel_id = 'sindbad-hammamet'
  AND suitable_for_couples = true    -- Guest is a couple
  AND suitable_for_young = true      -- Guest is 26-35
  AND good_for_sunny = true          -- Weather is sunny
  AND good_for_mild = true           -- Temperature is 28°C
ORDER BY match_score DESC
```

### 4. Scored Results
Each attraction gets a match score:
- **Medina of Hammamet**: 85% match (perfect for couples, good weather, cultural interest)
- **Quad Biking**: 70% match (good for couples, but high activity level)
- **Beach**: 90% match (perfect weather, suitable for couples, low activity)

### 5. RAG Knowledge Building
Only the top-scored attractions are included in the AI's knowledge base:

```
=== NEARBY ATTRACTIONS ===
IMPORTANT: These are the ONLY nearby attractions available.

Nature Attractions:
  - Hammamet Beach (90% match)
    Beautiful sandy beach perfect for swimming and sunbathing
    Distance: 500 meters
    Duration: 2-4 hours
    Price: Free
    Perfect for current weather conditions

Cultural Attractions:
  - Medina of Hammamet (85% match)
    Historic old town with traditional architecture
    Distance: 2 km
    Duration: 2-3 hours
    Price: 5-15 TND
    Recommended for your travel style
```

## Sample Data Examples

### For Couples (Romantic/Relaxing)
```sql
INSERT INTO nearby_attractions VALUES (
    'sindbad-hammamet', 'Yasmine Hammamet Marina',
    'Modern marina with restaurants and romantic walks',
    'entertainment', '3 km', '2-3 hours', '10-30 TND',
    true,  -- suitable_for_couples
    false, -- suitable_for_families  
    false, -- suitable_for_solo
    false, -- suitable_for_groups
    'low', -- activity_level
    8      -- priority_order
);
```

### For Families (Kid-Friendly)
```sql
INSERT INTO nearby_attractions VALUES (
    'sindbad-hammamet', 'Carthageland Theme Park',
    'Family theme park with rides and entertainment',
    'entertainment', '8 km', 'Full day', '25-35 TND',
    true,  -- suitable_for_couples
    true,  -- suitable_for_families ✓
    false, -- suitable_for_solo
    true,  -- suitable_for_groups
    'high', -- activity_level
    9       -- priority_order
);
```

### Weather-Specific
```sql
-- Good for rainy weather
INSERT INTO nearby_attractions VALUES (
    'sindbad-hammamet', 'Nabeul Pottery Workshop',
    'Indoor pottery workshop and shopping',
    'cultural', '12 km', '2-3 hours', '15-40 TND',
    true,  -- good_for_sunny
    true,  -- good_for_rainy ✓ (indoor activity)
    true,  -- good_for_hot
    true,  -- good_for_mild
    true   -- good_for_cool
);
```

## Setup Instructions

### 1. Run Database Migration
```bash
node scripts/setup-enhanced-attractions.js
```

This will:
- Create the enhanced `nearby_attractions` table
- Insert sample data for all hotels
- Show summary of attractions per hotel

### 2. Verify Installation
1. Restart your Next.js application
2. Go to admin dashboard → "Nearby Attractions" tab
3. Test the chatbot with questions like:
   - "What can we do nearby?"
   - "Any romantic places for couples?"
   - "Activities for rainy weather?"

### 3. Add More Attractions
Currently, attractions are managed through direct database access. To add attractions:

```sql
INSERT INTO nearby_attractions (
    hotel_id, attraction_name, description, category,
    distance, estimated_duration, price_range, transportation,
    suitable_for_couples, suitable_for_families, suitable_for_solo,
    good_for_sunny, good_for_rainy, priority_order
) VALUES (
    'your-hotel-id', 'New Attraction Name',
    'Detailed description of the attraction',
    'cultural', '5 km', '2 hours', '20 TND', 'Taxi',
    true, false, true,  -- Target couples and solo travelers
    true, false, 5      -- Good for sunny weather, priority 5
);
```

## Testing Examples

### Test 1: Couple on Sunny Day
**Guest Profile**: Couple, 28 years old, leisure travel
**Weather**: 26°C, sunny
**Expected**: Beach, marina, romantic restaurants prioritized

### Test 2: Family on Rainy Day  
**Guest Profile**: Family with kids, 35 years old
**Weather**: 18°C, rainy
**Expected**: Indoor attractions, museums, shopping centers

### Test 3: Solo Business Traveler
**Guest Profile**: Solo, 42 years old, business travel
**Weather**: 22°C, mild
**Expected**: Cultural sites, quick activities, business-friendly locations

## Benefits

### For Hotel Managers
- ✅ Complete control over recommendations
- ✅ No surprise suggestions from AI
- ✅ Ability to promote specific attractions
- ✅ Analytics on what guests are interested in

### For Guests
- ✅ Personalized recommendations
- ✅ Weather-appropriate suggestions
- ✅ Accurate information (no AI hallucinations)
- ✅ Relevant to their travel style

### For Developers
- ✅ Predictable AI behavior
- ✅ Easy to debug and maintain
- ✅ Extensible system for new features
- ✅ Clear data lineage

## Future Enhancements

1. **Admin UI**: Visual interface to manage attractions
2. **Booking Integration**: Direct booking links
3. **Real-time Availability**: Check if attractions are open
4. **Guest Feedback**: Rating system for attractions
5. **Seasonal Adjustments**: Automatic seasonal availability
6. **Multi-language**: Descriptions in multiple languages

## Troubleshooting

### Chatbot Still Suggests Unknown Attractions
- Check that the enhanced schema is applied
- Verify sample data is inserted
- Restart the Next.js application
- Check the RAG knowledge includes "STRICT RULE" text

### No Personalized Recommendations
- Ensure guest profile is saved during registration
- Check that attractions have proper targeting flags
- Verify weather data is being passed to the system

### Low Match Scores
- Review attraction targeting settings
- Adjust priority_order values
- Add more attractions for specific guest types

This enhanced system ensures your chatbot provides accurate, personalized, and controllable attraction recommendations!