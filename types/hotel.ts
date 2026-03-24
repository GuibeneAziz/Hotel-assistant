// Hotel Settings Types
export interface RestaurantSchedule {
  breakfast: MealTime
  lunch: MealTime
  dinner: MealTime
}

export interface MealTime {
  start: string
  end: string
  available: boolean
}

export interface SpaSettings {
  available: boolean
  openTime: string
  closeTime: string
  treatments: string[]
}

export interface FacilityHours {
  openTime: string
  closeTime: string
  available: boolean
}

export interface KidsClubSettings extends FacilityHours {
  ageRange: string
}

export interface SpecialEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  price?: string
}

export interface ContactInfo {
  phone: string
  email: string
  address: string
  emergencyPhone: string
}

export interface AmenitySettings {
  available: boolean
  password?: string
  instructions?: string
  price?: string
}

export interface CheckInOutSettings {
  time: string
  instructions?: string
}

export interface HotelSettings {
  name: string
  restaurant: RestaurantSchedule
  spa: SpaSettings
  pool: FacilityHours
  gym: FacilityHours
  kidsClub: KidsClubSettings
  specialEvents: SpecialEvent[]
  contact: ContactInfo
  wifi: AmenitySettings
  parking: AmenitySettings
  checkIn: CheckInOutSettings
  checkOut: CheckInOutSettings
}

// Chat Message Types
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

// Weather Types
export interface WeatherData {
  temperature: number
  description: string
  humidity: number
  wind_speed: number
  feels_like: number
}

// Hotel Data Types
export interface HotelCoordinates {
  lat: number
  lon: number
}

export interface FacilityInfo {
  open: string
  close: string
  type?: string
  age_range?: string
}

export interface HotelActivities {
  family?: string[]
  couples?: string[]
  adventure?: string[]
  cultural?: string[]
}

export interface HotelData {
  name: string
  location: string
  description: string
  image: string
  color: string
  coordinates: HotelCoordinates
  facilities: {
    pool?: FacilityInfo
    gym?: FacilityInfo
    spa?: FacilityInfo
    restaurant?: FacilityInfo
    bar?: FacilityInfo
    kids_club?: FacilityInfo
    cultural_center?: FacilityInfo
  }
  activities: HotelActivities
  specialRecommendations?: {
    weather?: string
    localAttractions?: string[]
    culturalExperiences?: string[]
  }
}
