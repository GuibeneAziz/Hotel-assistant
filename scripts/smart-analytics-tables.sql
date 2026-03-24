-- ============================================
-- SMART ANALYTICS TABLES
-- Track insights, not raw data
-- ============================================

-- Drop old analytics tables if they exist
DROP TABLE IF EXISTS chatbot_interactions CASCADE;
DROP TABLE IF EXISTS activity_analytics CASCADE;
DROP TABLE IF EXISTS facility_inquiries CASCADE;

-- ============================================
-- 1. GUEST_PROFILES (Collect once per user)
-- ============================================
CREATE TABLE guest_profiles (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    hotel_id VARCHAR(50) REFERENCES hotels(hotel_id),
    
    -- Demographics
    age_range VARCHAR(20),              -- "18-25", "26-35", "36-50", "50+"
    nationality VARCHAR(50),
    travel_purpose VARCHAR(50),         -- "leisure", "business", "family", "honeymoon"
    group_type VARCHAR(50),             -- "solo", "couple", "family", "group"
    
    -- Preferences
    preferred_language VARCHAR(10),
    
    -- Metadata
    first_visit TIMESTAMP DEFAULT NOW(),
    last_visit TIMESTAMP DEFAULT NOW(),
    total_interactions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_guest_profiles_hotel ON guest_profiles(hotel_id);
CREATE INDEX idx_guest_profiles_session ON guest_profiles(session_id);

-- ============================================
-- 2. QUESTION_CATEGORIES (Aggregated insights)
-- ============================================
CREATE TABLE question_categories (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) REFERENCES hotels(hotel_id),
    
    -- Category tracking
    category VARCHAR(50) NOT NULL,      -- "facilities", "activities", "dining", "location", "booking"
    subcategory VARCHAR(50),            -- "pool_hours", "spa_prices", "breakfast_time"
    
    -- Aggregated data
    question_count INTEGER DEFAULT 1,
    last_asked TIMESTAMP DEFAULT NOW(),
    
    -- Demographics breakdown
    age_18_25 INTEGER DEFAULT 0,
    age_26_35 INTEGER DEFAULT 0,
    age_36_50 INTEGER DEFAULT 0,
    age_50_plus INTEGER DEFAULT 0,
    
    date DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(hotel_id, category, subcategory, date)
);

CREATE INDEX idx_question_categories_hotel ON question_categories(hotel_id);
CREATE INDEX idx_question_categories_date ON question_categories(date);

-- ============================================
-- 3. POPULAR_TOPICS (Daily aggregated)
-- ============================================
CREATE TABLE popular_topics (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) REFERENCES hotels(hotel_id),
    
    topic VARCHAR(100) NOT NULL,        -- "pool", "spa", "breakfast", "wifi", "parking"
    mention_count INTEGER DEFAULT 1,
    positive_sentiment INTEGER DEFAULT 0,
    negative_sentiment INTEGER DEFAULT 0,
    
    date DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(hotel_id, topic, date)
);

CREATE INDEX idx_popular_topics_hotel ON popular_topics(hotel_id);
CREATE INDEX idx_popular_topics_date ON popular_topics(date);

-- ============================================
-- 4. USER_SATISFACTION (Ratings & feedback)
-- ============================================
CREATE TABLE user_satisfaction (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) REFERENCES hotels(hotel_id),
    session_id VARCHAR(100),
    
    -- Ratings
    chatbot_rating INTEGER CHECK (chatbot_rating BETWEEN 1 AND 5),
    found_helpful BOOLEAN,
    
    -- Feedback
    feedback_text TEXT,
    missing_info TEXT,                  -- What info was the user looking for but didn't find?
    
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_satisfaction_hotel ON user_satisfaction(hotel_id);
CREATE INDEX idx_user_satisfaction_date ON user_satisfaction(DATE(timestamp));

-- ============================================
-- 5. ACTIVITY_INTEREST (Track what guests are interested in)
-- ============================================
CREATE TABLE activity_interest (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) REFERENCES hotels(hotel_id),
    
    activity_type VARCHAR(50),          -- "hotel_activity" or "nearby_attraction"
    activity_name VARCHAR(100),
    category VARCHAR(50),               -- "family", "couples", "adventure", "cultural"
    
    -- Aggregated metrics
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    
    -- Demographics
    popular_with_families INTEGER DEFAULT 0,
    popular_with_couples INTEGER DEFAULT 0,
    popular_with_solo INTEGER DEFAULT 0,
    
    date DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(hotel_id, activity_type, activity_name, date)
);

CREATE INDEX idx_activity_interest_hotel ON activity_interest(hotel_id);
CREATE INDEX idx_activity_interest_date ON activity_interest(date);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE guest_profiles IS 'User demographics collected once per session';
COMMENT ON TABLE question_categories IS 'Aggregated question categories, not individual messages';
COMMENT ON TABLE popular_topics IS 'Daily aggregated topic mentions';
COMMENT ON TABLE user_satisfaction IS 'User ratings and feedback';
COMMENT ON TABLE activity_interest IS 'Aggregated activity interest metrics';
