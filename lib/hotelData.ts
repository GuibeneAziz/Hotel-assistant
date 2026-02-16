// Hotel data management utilities
export interface RestaurantSchedule {
  breakfast: { start: string; end: string; available: boolean }
  lunch: { start: string; end: string; available: boolean }
  dinner: { start: string; end: string; available: boolean }
}

export interface SpaSettings {
  available: boolean
  openTime: string
  closeTime: string
  treatments: string[]
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

export interface HotelSettings {
  name: string
  restaurant: RestaurantSchedule
  spa: SpaSettings
  pool: { openTime: string; closeTime: string; available: boolean }
  gym: { openTime: string; closeTime: string; available: boolean }
  kidsClub: { openTime: string; closeTime: string; available: boolean; ageRange: string }
  specialEvents: SpecialEvent[]
  contact: ContactInfo
  wifi: { available: boolean; password?: string; instructions?: string }
  parking: { available: boolean; price?: string; instructions?: string }
  checkIn: { time: string; instructions?: string }
  checkOut: { time: string; instructions?: string }
}

export const defaultHotelSettings: { [key: string]: HotelSettings } = {
  'sindbad-hammamet': {
    name: 'Sindbad Hotel',
    restaurant: {
      breakfast: { start: '07:00', end: '10:00', available: true },
      lunch: { start: '12:00', end: '15:00', available: true },
      dinner: { start: '19:00', end: '22:00', available: true }
    },
    spa: {
      available: true,
      openTime: '09:00',
      closeTime: '20:00',
      treatments: ['Traditional Hammam', 'Aromatherapy Massage', 'Facial Treatment', 'Body Scrub']
    },
    pool: { openTime: '06:00', closeTime: '22:00', available: true },
    gym: { openTime: '05:00', closeTime: '23:00', available: true },
    kidsClub: { openTime: '09:00', closeTime: '17:00', available: true, ageRange: '4-12' },
    specialEvents: [
      {
        id: '1',
        title: 'Traditional Music Night',
        description: 'Enjoy authentic Tunisian music and dance performances',
        date: '2024-02-10',
        time: '20:00',
        location: 'Main Terrace',
        price: 'Free'
      }
    ],
    contact: {
      phone: '+216 72 280 122',
      email: 'info@sindbad-hammamet.com',
      address: 'Zone Touristique, Hammamet 8050, Tunisia',
      emergencyPhone: '+216 72 280 100'
    },
    wifi: { available: true, password: 'SindbadGuest2024', instructions: 'Connect to "Sindbad_WiFi" network' },
    parking: { available: true, price: 'Free', instructions: 'Parking available in front of hotel' },
    checkIn: { time: '15:00', instructions: 'Early check-in available upon request' },
    checkOut: { time: '12:00', instructions: 'Late check-out available until 14:00 for additional fee' }
  },
  'paradise-hammamet': {
    name: 'Paradise Beach Hotel',
    restaurant: {
      breakfast: { start: '07:00', end: '10:30', available: true },
      lunch: { start: '12:30', end: '15:30', available: true },
      dinner: { start: '18:30', end: '22:30', available: true }
    },
    spa: {
      available: true,
      openTime: '09:00',
      closeTime: '20:00',
      treatments: ['Couples Massage', 'Relaxation Therapy', 'Beauty Treatments', 'Hot Stone Massage']
    },
    pool: { openTime: '06:00', closeTime: '22:00', available: true },
    gym: { openTime: '05:00', closeTime: '23:00', available: true },
    kidsClub: { openTime: '09:00', closeTime: '17:00', available: true, ageRange: '4-12' },
    specialEvents: [
      {
        id: '2',
        title: 'Family Beach Games',
        description: 'Fun activities for the whole family on the beach',
        date: '2024-02-11',
        time: '15:00',
        location: 'Private Beach',
        price: 'Free'
      }
    ],
    contact: {
      phone: '+216 72 285 200',
      email: 'info@paradise-hammamet.com',
      address: 'Avenue des Nations Unies, Hammamet 8050, Tunisia',
      emergencyPhone: '+216 72 285 100'
    },
    wifi: { available: true, password: 'Paradise2024', instructions: 'Connect to "Paradise_WiFi" network' },
    parking: { available: true, price: 'Free', instructions: 'Valet parking available' },
    checkIn: { time: '14:00', instructions: 'Welcome drink included with check-in' },
    checkOut: { time: '12:00', instructions: 'Express check-out available at reception' }
  },
  'movenpick-sousse': {
    name: 'Mövenpick Sousse',
    restaurant: {
      breakfast: { start: '06:30', end: '10:00', available: true },
      lunch: { start: '12:00', end: '15:00', available: true },
      dinner: { start: '19:00', end: '23:00', available: true }
    },
    spa: {
      available: true,
      openTime: '08:00',
      closeTime: '21:00',
      treatments: ['Traditional Hammam', 'Aromatherapy', 'Hot Stone Massage', 'Facial Treatments', 'Reflexology']
    },
    pool: { openTime: '06:00', closeTime: '22:00', available: true },
    gym: { openTime: '00:00', closeTime: '23:59', available: true },
    kidsClub: { openTime: '09:00', closeTime: '17:00', available: false, ageRange: 'N/A' },
    specialEvents: [
      {
        id: '3',
        title: 'Medina Cultural Tour',
        description: 'Guided tour of the UNESCO World Heritage Medina of Sousse',
        date: '2024-02-12',
        time: '09:00',
        location: 'Hotel Lobby',
        price: '25 TND per person'
      },
      {
        id: '4',
        title: 'Cooking Class: Tunisian Cuisine',
        description: 'Learn to cook traditional Tunisian dishes with our chef',
        date: '2024-02-13',
        time: '16:00',
        location: 'Restaurant Kitchen',
        price: '40 TND per person'
      }
    ],
    contact: {
      phone: '+216 73 246 111',
      email: 'info@movenpick-sousse.com',
      address: 'Avenue Hedi Chaker, Sousse 4000, Tunisia',
      emergencyPhone: '+216 73 246 100'
    },
    wifi: { available: true, password: 'Movenpick2024', instructions: 'Connect to "Movenpick_WiFi" network' },
    parking: { available: true, price: '10 TND/day', instructions: 'Secure underground parking' },
    checkIn: { time: '15:00', instructions: 'Mobile check-in available via app' },
    checkOut: { time: '11:00', instructions: 'Express check-out via TV or mobile app' }
  }
}

// Utility functions for data management
export const getHotelSettings = (hotelId: string): HotelSettings | null => {
  if (typeof window === 'undefined') return defaultHotelSettings[hotelId] || null
  
  try {
    const savedSettings = localStorage.getItem('hotelSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      return settings[hotelId] || defaultHotelSettings[hotelId] || null
    }
  } catch (error) {
    console.error('Error loading hotel settings:', error)
  }
  
  return defaultHotelSettings[hotelId] || null
}

export const saveHotelSettings = (settings: { [key: string]: HotelSettings }) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('hotelSettings', JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving hotel settings:', error)
  }
}

export const getAllHotelSettings = (): { [key: string]: HotelSettings } => {
  if (typeof window === 'undefined') return defaultHotelSettings
  
  try {
    const savedSettings = localStorage.getItem('hotelSettings')
    if (savedSettings) {
      return { ...defaultHotelSettings, ...JSON.parse(savedSettings) }
    }
  } catch (error) {
    console.error('Error loading hotel settings:', error)
  }
  
  return defaultHotelSettings
}