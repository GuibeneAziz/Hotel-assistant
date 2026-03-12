-- ============================================
-- FIX: Separate Hotel Activities from Nearby Activities
-- ============================================

-- Drop old activities table
DROP TABLE IF EXISTS activities CASCADE;

-- ============================================
-- 1. HOTEL_ACTIVITIES (Activities inside the hotel)
-- ============================================
CREATE TABLE hotel_activities (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) NOT NULL REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    activity_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,       -- "family", "couples", "relaxation", "sports"
    description TEXT,
    location VARCHAR(100),                -- "Pool Area", "Spa", "Beach"
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(hotel_id, activity_name)
);

CREATE INDEX idx_hotel_activities_hotel ON hotel_activities(hotel_id);
CREATE INDEX idx_hotel_activities_category ON hotel_activities(category);

COMMENT ON TABLE hotel_activities IS 'Activities available inside the hotel premises';

-- ============================================
-- 2. NEARBY_ATTRACTIONS (Activities outside the hotel)
-- ============================================
CREATE TABLE nearby_attractions (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) NOT NULL REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    attraction_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,       -- "cultural", "adventure", "shopping", "nature"
    description TEXT,
    distance VARCHAR(50),                 -- "5 km", "15 minutes drive"
    estimated_duration VARCHAR(50),       -- "2 hours", "Half day", "Full day"
    price_range VARCHAR(50),              -- "Free", "10-20 TND", "50+ TND"
    transportation VARCHAR(100),          -- "Hotel shuttle", "Taxi", "Walking"
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(hotel_id, attraction_name)
);

CREATE INDEX idx_nearby_attractions_hotel ON nearby_attractions(hotel_id);
CREATE INDEX idx_nearby_attractions_category ON nearby_attractions(category);

COMMENT ON TABLE nearby_attractions IS 'Tourist attractions and activities near the hotel';
