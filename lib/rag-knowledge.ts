// RAG Knowledge Base Builder
// Converts hotel data into structured knowledge for AI

export function buildHotelKnowledge(
  hotelSettings: any,
  hotelData: any,
  weather: any
): string {
  const knowledge: string[] = []

  // Hotel Basic Information
  if (hotelData) {
    knowledge.push(`=== HOTEL INFORMATION ===`)
    knowledge.push(`Name: ${hotelData.name}`)
    knowledge.push(`Location: ${hotelData.location}`)
    knowledge.push(`Description: ${hotelData.description}`)
    knowledge.push('')
  }

  // Facilities
  knowledge.push(`=== FACILITIES ===`)
  
  if (hotelSettings?.pool) {
    const status = hotelSettings.pool.available ? 'OPEN' : 'CLOSED'
    knowledge.push(`Pool: ${status}`)
    if (hotelSettings.pool.available) {
      knowledge.push(`  Hours: ${hotelSettings.pool.openTime} - ${hotelSettings.pool.closeTime}`)
    }
  }

  if (hotelSettings?.gym) {
    const status = hotelSettings.gym.available ? 'OPEN' : 'CLOSED'
    knowledge.push(`Gym/Fitness Center: ${status}`)
    if (hotelSettings.gym.available) {
      knowledge.push(`  Hours: ${hotelSettings.gym.openTime} - ${hotelSettings.gym.closeTime}`)
    }
  }

  if (hotelSettings?.spa) {
    const status = hotelSettings.spa.available ? 'OPEN' : 'CLOSED'
    knowledge.push(`Spa: ${status}`)
    if (hotelSettings.spa.available) {
      knowledge.push(`  Hours: ${hotelSettings.spa.openTime} - ${hotelSettings.spa.closeTime}`)
      if (hotelSettings.spa.treatments?.length > 0) {
        knowledge.push(`  Treatments: ${hotelSettings.spa.treatments.join(', ')}`)
      }
    }
  }

  if (hotelSettings?.kidsClub) {
    const status = hotelSettings.kidsClub.available ? 'OPEN' : 'CLOSED'
    knowledge.push(`Kids Club: ${status}`)
    if (hotelSettings.kidsClub.available) {
      knowledge.push(`  Hours: ${hotelSettings.kidsClub.openTime} - ${hotelSettings.kidsClub.closeTime}`)
      knowledge.push(`  Age Range: ${hotelSettings.kidsClub.ageRange}`)
    }
  }

  knowledge.push('')

  // Restaurant Schedule
  if (hotelSettings?.restaurant) {
    knowledge.push(`=== RESTAURANT SCHEDULE ===`)
    const { breakfast, lunch, dinner } = hotelSettings.restaurant
    
    if (breakfast?.available) {
      knowledge.push(`Breakfast: OPEN ${breakfast.start} - ${breakfast.end}`)
    } else {
      knowledge.push(`Breakfast: CURRENTLY CLOSED`)
    }
    
    if (lunch?.available) {
      knowledge.push(`Lunch: OPEN ${lunch.start} - ${lunch.end}`)
    } else {
      knowledge.push(`Lunch: CURRENTLY CLOSED`)
    }
    
    if (dinner?.available) {
      knowledge.push(`Dinner: OPEN ${dinner.start} - ${dinner.end}`)
    } else {
      knowledge.push(`Dinner: CURRENTLY CLOSED`)
    }
    knowledge.push('')
  }

  // Special Events
  if (hotelSettings?.specialEvents?.length > 0) {
    knowledge.push(`=== SPECIAL EVENTS ===`)
    const today = new Date().toISOString().split('T')[0]
    
    // Today's events
    const todayEvents = hotelSettings.specialEvents.filter((e: any) => e.date === today)
    if (todayEvents.length > 0) {
      knowledge.push(`TODAY'S EVENTS:`)
      todayEvents.forEach((event: any) => {
        knowledge.push(`  - ${event.title}`)
        knowledge.push(`    Time: ${event.time}`)
        knowledge.push(`    Location: ${event.location}`)
        knowledge.push(`    Price: ${event.price || 'Free'}`)
        if (event.description) {
          knowledge.push(`    Details: ${event.description}`)
        }
      })
    }
    
    // Upcoming events
    const upcomingEvents = hotelSettings.specialEvents
      .filter((e: any) => e.date > today)
      .slice(0, 5)
    
    if (upcomingEvents.length > 0) {
      knowledge.push(`UPCOMING EVENTS:`)
      upcomingEvents.forEach((event: any) => {
        knowledge.push(`  - ${event.title} on ${event.date}`)
        knowledge.push(`    Time: ${event.time}, Location: ${event.location}`)
        knowledge.push(`    Price: ${event.price || 'Free'}`)
      })
    }
    knowledge.push('')
  }

  // Activities
  if (hotelData?.activities) {
    knowledge.push(`=== ACTIVITIES ===`)
    Object.entries(hotelData.activities).forEach(([type, activities]: [string, any]) => {
      const categoryName = type.charAt(0).toUpperCase() + type.slice(1)
      knowledge.push(`${categoryName} Activities:`)
      activities.forEach((activity: string) => {
        knowledge.push(`  - ${activity}`)
      })
    })
    knowledge.push('')
  }

  // Amenities
  knowledge.push(`=== AMENITIES ===`)
  
  if (hotelSettings?.wifi?.available) {
    knowledge.push(`WiFi: Available`)
    if (hotelSettings.wifi.password) {
      knowledge.push(`  Password: ${hotelSettings.wifi.password}`)
    }
    if (hotelSettings.wifi.instructions) {
      knowledge.push(`  Instructions: ${hotelSettings.wifi.instructions}`)
    }
  }

  if (hotelSettings?.parking?.available) {
    knowledge.push(`Parking: Available`)
    if (hotelSettings.parking.price) {
      knowledge.push(`  Price: ${hotelSettings.parking.price}`)
    }
    if (hotelSettings.parking.instructions) {
      knowledge.push(`  Details: ${hotelSettings.parking.instructions}`)
    }
  }

  knowledge.push('')

  // Check-in/Check-out
  knowledge.push(`=== CHECK-IN/CHECK-OUT ===`)
  if (hotelSettings?.checkIn) {
    knowledge.push(`Check-in: ${hotelSettings.checkIn.time}`)
    if (hotelSettings.checkIn.instructions) {
      knowledge.push(`  ${hotelSettings.checkIn.instructions}`)
    }
  }
  if (hotelSettings?.checkOut) {
    knowledge.push(`Check-out: ${hotelSettings.checkOut.time}`)
    if (hotelSettings.checkOut.instructions) {
      knowledge.push(`  ${hotelSettings.checkOut.instructions}`)
    }
  }
  knowledge.push('')

  // Contact Information
  if (hotelSettings?.contact) {
    knowledge.push(`=== CONTACT INFORMATION ===`)
    if (hotelSettings.contact.phone) {
      knowledge.push(`Phone: ${hotelSettings.contact.phone}`)
    }
    if (hotelSettings.contact.email) {
      knowledge.push(`Email: ${hotelSettings.contact.email}`)
    }
    if (hotelSettings.contact.emergencyPhone) {
      knowledge.push(`Emergency: ${hotelSettings.contact.emergencyPhone}`)
    }
    knowledge.push('')
  }

  // Weather Information
  if (weather) {
    knowledge.push(`=== CURRENT WEATHER ===`)
    knowledge.push(`Temperature: ${weather.temperature}°C (feels like ${weather.feels_like}°C)`)
    knowledge.push(`Conditions: ${weather.description}`)
    knowledge.push(`Humidity: ${weather.humidity}%`)
    knowledge.push(`Wind Speed: ${weather.wind_speed} km/h`)
    
    // Weather-based recommendations
    const isGoodSwimming = weather.temperature >= 25 && !weather.description.includes('rain')
    if (isGoodSwimming) {
      knowledge.push(`Weather Note: Perfect weather for swimming and outdoor activities!`)
    } else if (weather.description.includes('rain')) {
      knowledge.push(`Weather Note: Rainy weather - recommend indoor activities like spa or gym`)
    }
    knowledge.push('')
  }

  return knowledge.join('\n')
}

// Helper function to extract relevant context based on query
export function extractRelevantContext(query: string, fullKnowledge: string): string {
  const queryLower = query.toLowerCase()
  const lines = fullKnowledge.split('\n')
  
  // Keywords to section mapping
  const keywords: { [key: string]: string[] } = {
    'pool': ['FACILITIES', 'pool'],
    'gym': ['FACILITIES', 'gym', 'fitness'],
    'spa': ['FACILITIES', 'spa'],
    'restaurant': ['RESTAURANT'],
    'breakfast': ['RESTAURANT', 'breakfast'],
    'lunch': ['RESTAURANT', 'lunch'],
    'dinner': ['RESTAURANT', 'dinner'],
    'event': ['SPECIAL EVENTS'],
    'activity': ['ACTIVITIES'],
    'wifi': ['AMENITIES', 'wifi'],
    'parking': ['AMENITIES', 'parking'],
    'check': ['CHECK-IN/CHECK-OUT'],
    'contact': ['CONTACT'],
    'weather': ['WEATHER'],
  }
  
  // Find relevant sections
  const relevantSections = new Set<string>()
  for (const [keyword, sections] of Object.entries(keywords)) {
    if (queryLower.includes(keyword)) {
      sections.forEach(section => relevantSections.add(section))
    }
  }
  
  // If no specific keywords, return full knowledge
  if (relevantSections.size === 0) {
    return fullKnowledge
  }
  
  // Extract relevant sections
  const relevantLines: string[] = []
  let inRelevantSection = false
  
  for (const line of lines) {
    if (line.startsWith('===')) {
      inRelevantSection = Array.from(relevantSections).some(section => 
        line.includes(section)
      )
    }
    
    if (inRelevantSection || line.startsWith('===') || line.includes('HOTEL INFORMATION')) {
      relevantLines.push(line)
    }
  }
  
  return relevantLines.length > 0 ? relevantLines.join('\n') : fullKnowledge
}
