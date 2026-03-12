// PostgreSQL Database Helper using pg library
import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Export the pool for direct queries
export default pool

// Helper function to get all hotel settings
export async function getAllHotelSettings() {
  const client = await pool.connect()
  try {
    // Get all hotels
    const hotelsResult = await client.query('SELECT hotel_id, name FROM hotels')
    
    const settings: any = {}
    
    for (const hotel of hotelsResult.rows) {
      const hotelId = hotel.hotel_id
      
      // Initialize settings object
      settings[hotelId] = {
        name: hotel.name,
        restaurant: {
          breakfast: { start: '', end: '', available: false },
          lunch: { start: '', end: '', available: false },
          dinner: { start: '', end: '', available: false }
        },
        spa: { available: false, openTime: '', closeTime: '', treatments: [] },
        pool: { openTime: '', closeTime: '', available: false },
        gym: { openTime: '', closeTime: '', available: false },
        kidsClub: { openTime: '', closeTime: '', available: false, ageRange: '' },
        specialEvents: [],
        contact: { phone: '', email: '', address: '', emergencyPhone: '' },
        wifi: { available: false, password: '', instructions: '' },
        parking: { available: false, price: '', instructions: '' },
        checkIn: { time: '', instructions: '' },
        checkOut: { time: '', instructions: '' },
        hotelActivities: [],
        nearbyAttractions: []
      }
      
      // Get facilities
      const facilitiesResult = await client.query(`
        SELECT facility_type, facility_name, open_time, close_time, is_available, id
        FROM facilities
        WHERE hotel_id = $1
      `, [hotelId])
      
      for (const facility of facilitiesResult.rows) {
        if (facility.facility_type === 'restaurant') {
          const mealType = facility.facility_name // breakfast, lunch, dinner
          if (settings[hotelId].restaurant[mealType]) {
            settings[hotelId].restaurant[mealType] = {
              start: facility.open_time,
              end: facility.close_time,
              available: facility.is_available
            }
          }
        } else if (facility.facility_type === 'spa') {
          settings[hotelId].spa = {
            available: facility.is_available,
            openTime: facility.open_time,
            closeTime: facility.close_time,
            treatments: []
          }
        } else if (facility.facility_type === 'pool') {
          settings[hotelId].pool = {
            openTime: facility.open_time,
            closeTime: facility.close_time,
            available: facility.is_available
          }
        } else if (facility.facility_type === 'gym') {
          settings[hotelId].gym = {
            openTime: facility.open_time,
            closeTime: facility.close_time,
            available: facility.is_available
          }
        } else if (facility.facility_type === 'kids_club') {
          settings[hotelId].kidsClub = {
            openTime: facility.open_time,
            closeTime: facility.close_time,
            available: facility.is_available,
            ageRange: ''
          }
        }
      }
      
      // Get facility attributes (spa treatments, kids club age range)
      const facilityAttrsResult = await client.query(`
        SELECT f.facility_type, fa.attribute_key, fa.attribute_value
        FROM facilities f
        JOIN facility_attributes fa ON f.id = fa.facility_id
        WHERE f.hotel_id = $1
        ORDER BY f.facility_type, fa.attribute_key
      `, [hotelId])
      
      for (const attr of facilityAttrsResult.rows) {
        if (attr.facility_type === 'spa' && attr.attribute_key === 'treatment') {
          settings[hotelId].spa.treatments.push(attr.attribute_value)
        } else if (attr.facility_type === 'kids_club' && attr.attribute_key === 'age_range') {
          settings[hotelId].kidsClub.ageRange = attr.attribute_value
        }
      }
      
      // Get contact info
      const contactResult = await client.query(`
        SELECT phone, email, address, emergency_phone
        FROM contact_info
        WHERE hotel_id = $1
      `, [hotelId])
      
      if (contactResult.rows.length > 0) {
        const contact = contactResult.rows[0]
        settings[hotelId].contact = {
          phone: contact.phone,
          email: contact.email,
          address: contact.address,
          emergencyPhone: contact.emergency_phone
        }
      }
      
      // Get amenities
      const amenitiesResult = await client.query(`
        SELECT amenity_type, is_available, primary_value, instructions
        FROM amenities
        WHERE hotel_id = $1
      `, [hotelId])
      
      for (const amenity of amenitiesResult.rows) {
        if (amenity.amenity_type === 'wifi') {
          settings[hotelId].wifi = {
            available: amenity.is_available,
            password: amenity.primary_value,
            instructions: amenity.instructions
          }
        } else if (amenity.amenity_type === 'parking') {
          settings[hotelId].parking = {
            available: amenity.is_available,
            price: amenity.primary_value,
            instructions: amenity.instructions
          }
        } else if (amenity.amenity_type === 'checkin') {
          settings[hotelId].checkIn = {
            time: amenity.primary_value,
            instructions: amenity.instructions
          }
        } else if (amenity.amenity_type === 'checkout') {
          settings[hotelId].checkOut = {
            time: amenity.primary_value,
            instructions: amenity.instructions
          }
        }
      }
      
      // Get special events
      const eventsResult = await client.query(`
        SELECT id, title, description, event_date, event_time, location, price
        FROM special_events
        WHERE hotel_id = $1
        ORDER BY event_date, event_time
      `, [hotelId])
      
      settings[hotelId].specialEvents = eventsResult.rows.map(event => ({
        id: event.id.toString(),
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        location: event.location,
        price: event.price
      }))
      
      // Get hotel activities (inside hotel)
      const activitiesResult = await client.query(`
        SELECT activity_name, category, description, location, is_available
        FROM hotel_activities
        WHERE hotel_id = $1 AND is_available = true
        ORDER BY category, activity_name
      `, [hotelId])
      
      settings[hotelId].hotelActivities = activitiesResult.rows
      
      // Get nearby attractions (outside hotel)
      const attractionsResult = await client.query(`
        SELECT attraction_name, category, description, distance, estimated_duration, price_range, transportation
        FROM nearby_attractions
        WHERE hotel_id = $1
        ORDER BY category, attraction_name
      `, [hotelId])
      
      settings[hotelId].nearbyAttractions = attractionsResult.rows
    }
    
    return settings
  } finally {
    client.release()
  }
}
