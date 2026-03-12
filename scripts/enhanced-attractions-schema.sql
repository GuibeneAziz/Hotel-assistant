-- ============================================
-- ENHANCED NEARBY ATTRACTIONS SYSTEM
-- Personalized recommendations based on guest type and weather
-- ============================================

-- Drop existing table to recreate with enhanced structure
DROP TABLE IF EXISTS nearby_attractions CASCADE;

-- ============================================
-- ENHANCED NEARBY_ATTRACTIONS TABLE
-- ============================================
CREATE TABLE nearby_attractions (
    id SERIAL PRIMARY KEY,
    hotel_id VARCHAR(50) NOT NULL REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    
    -- Basic Information
    attraction_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,       -- "cultural", "adventure", "shopping", "nature", "entertainment"
    
    -- Location & Logistics
    distance VARCHAR(50),                 -- "5 km", "15 minutes drive"
    estimated_duration VARCHAR(50),       -- "2 hours", "Half day", "Full day"
    price_range VARCHAR(50),              -- "Free", "10-20 TND", "50+ TND"
    transportation VARCHAR(100),          -- "Hotel shuttle", "Taxi", "Walking", "Public transport"
    
    -- Guest Type Targeting (Boolean flags for each type)
    suitable_for_couples BOOLEAN DEFAULT false,
    suitable_for_families BOOLEAN DEFAULT false,
    suitable_for_solo BOOLEAN DEFAULT false,
    suitable_for_groups BOOLEAN DEFAULT false,
    suitable_for_business BOOLEAN DEFAULT false,
    
    -- Age Group Targeting
    suitable_for_young BOOLEAN DEFAULT true,     -- 18-35
    suitable_for_middle BOOLEAN DEFAULT true,    -- 36-50
    suitable_for_senior BOOLEAN DEFAULT true,    -- 50+
    
    -- Weather Conditions (when this attraction is recommended)
    good_for_sunny BOOLEAN DEFAULT true,
    good_for_rainy BOOLEAN DEFAULT false,
    good_for_windy BOOLEAN DEFAULT true,
    good_for_hot BOOLEAN DEFAULT true,           -- 30°C+
    good_for_mild BOOLEAN DEFAULT true,          -- 20-29°C
    good_for_cool BOOLEAN DEFAULT true,          -- Below 20°C
    
    -- Activity Level
    activity_level VARCHAR(20) DEFAULT 'moderate',  -- "low", "moderate", "high"
    
    -- Time of Day
    good_for_morning BOOLEAN DEFAULT true,
    good_for_afternoon BOOLEAN DEFAULT true,
    good_for_evening BOOLEAN DEFAULT false,
    
    -- Seasonal Availability
    available_spring BOOLEAN DEFAULT true,
    available_summer BOOLEAN DEFAULT true,
    available_autumn BOOLEAN DEFAULT true,
    available_winter BOOLEAN DEFAULT true,
    
    -- Additional Metadata
    requires_booking BOOLEAN DEFAULT false,
    booking_contact VARCHAR(100),
    special_notes TEXT,
    
    -- Admin fields
    is_active BOOLEAN DEFAULT true,
    priority_order INTEGER DEFAULT 0,           -- Higher number = higher priority
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(hotel_id, attraction_name)
);

-- Indexes for efficient querying
CREATE INDEX idx_nearby_attractions_hotel ON nearby_attractions(hotel_id);
CREATE INDEX idx_nearby_attractions_category ON nearby_attractions(category);
CREATE INDEX idx_nearby_attractions_couples ON nearby_attractions(suitable_for_couples);
CREATE INDEX idx_nearby_attractions_families ON nearby_attractions(suitable_for_families);
CREATE INDEX idx_nearby_attractions_solo ON nearby_attractions(suitable_for_solo);
CREATE INDEX idx_nearby_attractions_active ON nearby_attractions(is_active);
CREATE INDEX idx_nearby_attractions_priority ON nearby_attractions(priority_order DESC);

COMMENT ON TABLE nearby_attractions IS 'Enhanced nearby attractions with personalization and weather awareness';