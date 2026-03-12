// Personalized Attractions System
// Get attractions based on guest profile and weather conditions

import pool from './db'

export interface GuestProfile {
  ageRange: '18-25' | '26-35' | '36-50' | '50+'
  groupType: 'solo' | 'couple' | 'family' | 'group'
  travelPurpose: 'leisure' | 'business' | 'family' | 'honeymoon'
}

export interface WeatherConditions {
  temperature: number
  description: string
  isRainy: boolean
  isWindy: boolean
}

export interface PersonalizedAttraction {
  id: number
  attraction_name: string
  description: string
  category: string
  distance: string
  estimated_duration: string
  price_range: string
  transportation: string
  activity_level: string
  requires_booking: boolean
  booking_contact?: string
  special_notes?: string
  match_score: number  // How well this matches the guest profile (0-100)
  weather_suitable: boolean
}

/**
 * Get personalized attractions for a guest based on their profile and current weather
 */
export async function getPersonalizedAttractions(
  hotelId: string,
  guestProfile: GuestProfile,
  weather: WeatherConditions,
  limit: number = 10
): Promise<PersonalizedAttraction[]> {
  const client = await pool.connect()
  
  try {
    // Build dynamic WHERE clause based on guest profile
    const conditions: string[] = ['hotel_id = $1', 'is_active = true']
    const params: any[] = [hotelId]
    
    // Guest type targeting
    if (guestProfile.groupType === 'couple') {
      conditions.push('suitable_for_couples = true')
    } else if (guestProfile.groupType === 'family') {
      conditions.push('suitable_for_families = true')
    } else if (guestProfile.groupType === 'solo') {
      conditions.push('suitable_for_solo = true')
    } else if (guestProfile.groupType === 'group') {
      conditions.push('suitable_for_groups = true')
    }
    
    // Age group targeting
    if (guestProfile.ageRange === '18-25' || guestProfile.ageRange === '26-35') {
      conditions.push('suitable_for_young = true')
    } else if (guestProfile.ageRange === '36-50') {
      conditions.push('suitable_for_middle = true')
    } else if (guestProfile.ageRange === '50+') {
      conditions.push('suitable_for_senior = true')
    }
    
    // Weather conditions
    if (weather.isRainy) {
      conditions.push('good_for_rainy = true')
    } else {
      conditions.push('good_for_sunny = true')
    }
    
    // Temperature conditions
    if (weather.temperature >= 30) {
      conditions.push('good_for_hot = true')
    } else if (weather.temperature >= 20) {
      conditions.push('good_for_mild = true')
    } else {
      conditions.push('good_for_cool = true')
    }
    
    const query = `
      SELECT 
        id, attraction_name, description, category,
        distance, estimated_duration, price_range, transportation,
        activity_level, requires_booking, booking_contact, special_notes,
        priority_order,
        
        -- Calculate match score based on multiple factors
        (
          CASE 
            WHEN $2 = 'couple' AND suitable_for_couples THEN 25
            WHEN $2 = 'family' AND suitable_for_families THEN 25
            WHEN $2 = 'solo' AND suitable_for_solo THEN 25
            WHEN $2 = 'group' AND suitable_for_groups THEN 25
            ELSE 0
          END +
          CASE 
            WHEN $3 IN ('18-25', '26-35') AND suitable_for_young THEN 15
            WHEN $3 = '36-50' AND suitable_for_middle THEN 15
            WHEN $3 = '50+' AND suitable_for_senior THEN 15
            ELSE 0
          END +
          CASE 
            WHEN $4 = true AND good_for_rainy THEN 20
            WHEN $4 = false AND good_for_sunny THEN 20
            ELSE 0
          END +
          CASE 
            WHEN $5 >= 30 AND good_for_hot THEN 15
            WHEN $5 >= 20 AND $5 < 30 AND good_for_mild THEN 15
            WHEN $5 < 20 AND good_for_cool THEN 15
            ELSE 0
          END +
          CASE 
            WHEN $6 = 'leisure' AND category IN ('nature', 'entertainment') THEN 10
            WHEN $6 = 'business' AND category IN ('cultural', 'shopping') THEN 10
            WHEN $6 = 'family' AND category IN ('entertainment', 'nature') THEN 10
            WHEN $6 = 'honeymoon' AND category IN ('nature', 'cultural') AND suitable_for_couples THEN 15
            ELSE 5
          END +
          (priority_order * 2)
        ) as match_score,
        
        -- Weather suitability check
        CASE 
          WHEN $4 = true AND good_for_rainy THEN true
          WHEN $4 = false AND good_for_sunny THEN true
          ELSE false
        END as weather_suitable
        
      FROM nearby_attractions
      WHERE ${conditions.join(' AND ')}
      ORDER BY match_score DESC, priority_order DESC, attraction_name
      LIMIT $${params.length + 7}
    `
    
    // Add parameters for the query
    params.push(
      guestProfile.groupType,           // $2
      guestProfile.ageRange,            // $3
      weather.isRainy,                  // $4
      weather.temperature,              // $5
      guestProfile.travelPurpose,       // $6
      limit                             // $7
    )
    
    const result = await client.query(query, params)
    
    return result.rows.map(row => ({
      id: row.id,
      attraction_name: row.attraction_name,
      description: row.description,
      category: row.category,
      distance: row.distance,
      estimated_duration: row.estimated_duration,
      price_range: row.price_range,
      transportation: row.transportation,
      activity_level: row.activity_level,
      requires_booking: row.requires_booking,
      booking_contact: row.booking_contact,
      special_notes: row.special_notes,
      match_score: parseInt(row.match_score),
      weather_suitable: row.weather_suitable
    }))
    
  } finally {
    client.release()
  }
}

/**
 * Get all attractions for a hotel (for admin management)
 */
export async function getAllAttractions(hotelId: string): Promise<any[]> {
  const client = await pool.connect()
  
  try {
    const result = await client.query(`
      SELECT * FROM nearby_attractions
      WHERE hotel_id = $1
      ORDER BY priority_order DESC, category, attraction_name
    `, [hotelId])
    
    return result.rows
  } finally {
    client.release()
  }
}

/**
 * Add or update an attraction
 */
export async function upsertAttraction(attraction: any): Promise<void> {
  const client = await pool.connect()
  
  try {
    await client.query(`
      INSERT INTO nearby_attractions (
        hotel_id, attraction_name, description, category,
        distance, estimated_duration, price_range, transportation,
        suitable_for_couples, suitable_for_families, suitable_for_solo, suitable_for_groups,
        suitable_for_business, suitable_for_young, suitable_for_middle, suitable_for_senior,
        good_for_sunny, good_for_rainy, good_for_windy, good_for_hot, good_for_mild, good_for_cool,
        activity_level, good_for_morning, good_for_afternoon, good_for_evening,
        requires_booking, booking_contact, special_notes, priority_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      )
      ON CONFLICT (hotel_id, attraction_name)
      DO UPDATE SET
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        distance = EXCLUDED.distance,
        estimated_duration = EXCLUDED.estimated_duration,
        price_range = EXCLUDED.price_range,
        transportation = EXCLUDED.transportation,
        suitable_for_couples = EXCLUDED.suitable_for_couples,
        suitable_for_families = EXCLUDED.suitable_for_families,
        suitable_for_solo = EXCLUDED.suitable_for_solo,
        suitable_for_groups = EXCLUDED.suitable_for_groups,
        suitable_for_business = EXCLUDED.suitable_for_business,
        suitable_for_young = EXCLUDED.suitable_for_young,
        suitable_for_middle = EXCLUDED.suitable_for_middle,
        suitable_for_senior = EXCLUDED.suitable_for_senior,
        good_for_sunny = EXCLUDED.good_for_sunny,
        good_for_rainy = EXCLUDED.good_for_rainy,
        good_for_windy = EXCLUDED.good_for_windy,
        good_for_hot = EXCLUDED.good_for_hot,
        good_for_mild = EXCLUDED.good_for_mild,
        good_for_cool = EXCLUDED.good_for_cool,
        activity_level = EXCLUDED.activity_level,
        good_for_morning = EXCLUDED.good_for_morning,
        good_for_afternoon = EXCLUDED.good_for_afternoon,
        good_for_evening = EXCLUDED.good_for_evening,
        requires_booking = EXCLUDED.requires_booking,
        booking_contact = EXCLUDED.booking_contact,
        special_notes = EXCLUDED.special_notes,
        priority_order = EXCLUDED.priority_order,
        updated_at = NOW()
    `, [
      attraction.hotel_id, attraction.attraction_name, attraction.description, attraction.category,
      attraction.distance, attraction.estimated_duration, attraction.price_range, attraction.transportation,
      attraction.suitable_for_couples, attraction.suitable_for_families, attraction.suitable_for_solo, attraction.suitable_for_groups,
      attraction.suitable_for_business, attraction.suitable_for_young, attraction.suitable_for_middle, attraction.suitable_for_senior,
      attraction.good_for_sunny, attraction.good_for_rainy, attraction.good_for_windy, attraction.good_for_hot, attraction.good_for_mild, attraction.good_for_cool,
      attraction.activity_level, attraction.good_for_morning, attraction.good_for_afternoon, attraction.good_for_evening,
      attraction.requires_booking, attraction.booking_contact, attraction.special_notes, attraction.priority_order
    ])
  } finally {
    client.release()
  }
}

/**
 * Helper function to determine weather conditions from weather data
 */
export function parseWeatherConditions(weather: any): WeatherConditions {
  const description = weather?.description?.toLowerCase() || ''
  
  return {
    temperature: weather?.temperature || 25,
    description: weather?.description || 'Clear',
    isRainy: description.includes('rain') || description.includes('shower') || description.includes('drizzle'),
    isWindy: (weather?.wind_speed || 0) > 20
  }
}