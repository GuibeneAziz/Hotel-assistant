'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, MapPin, Thermometer, Wind, Droplets, Sun, UserPlus } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import GuestRegistrationForm, { GuestProfile } from '@/app/components/GuestRegistrationForm'

// Note: WeatherWidget and ActivityRecommendations components can be created later for additional features

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface WeatherData {
  temperature: number
  description: string
  humidity: number
  wind_speed: number
  feels_like: number
}

interface Activity {
  name: string
  category: string[]
  suitable_for: boolean
}

interface HotelPageState {
  showRegistration: boolean
  sessionId: string | null
  guestProfile: GuestProfile | null
}

const hotelData = {
  'sindbad-hammamet': {
    name: 'Sindbad Hotel',
    location: 'Hammamet, Tunisia',
    description: 'Luxury beachfront resort with traditional Tunisian charm',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=400&fit=crop',
    color: 'from-blue-600 to-cyan-500',
    coordinates: { lat: 36.4, lon: 10.6167 },
    facilities: {
      pool: { open: '06:00', close: '22:00', type: 'outdoor' },
      gym: { open: '05:00', close: '23:00' },
      spa: { open: '09:00', close: '20:00' },
      restaurant: { open: '07:00', close: '23:00' },
      bar: { open: '10:00', close: '02:00' },
      kids_club: { open: '09:00', close: '17:00', age_range: '4-12' }
    },
    activities: {
      family: ['Traditional craft workshops', 'Cultural shows', 'Kids animation', 'Beach games', 'Storytelling sessions'],
      couples: ['Romantic dinner on terrace', 'Couples spa treatments', 'Sunset horseback riding', 'Private beach cabana', 'Wine tasting'],
      adventure: ['Jet skiing', 'Parasailing', 'Quad biking', 'Scuba diving', 'Desert safari', 'Kitesurfing']
    }
  },
  'paradise-hammamet': {
    name: 'Paradise Beach Hotel',
    location: 'Hammamet, Tunisia',
    description: 'Family-friendly paradise with pristine beaches',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=400&fit=crop',
    color: 'from-emerald-600 to-teal-500',
    coordinates: { lat: 36.4, lon: 10.6167 },
    facilities: {
      pool: { open: '06:00', close: '22:00', type: 'outdoor' },
      gym: { open: '05:00', close: '23:00' },
      spa: { open: '09:00', close: '20:00' },
      restaurant: { open: '07:00', close: '23:00' },
      bar: { open: '10:00', close: '02:00' },
      kids_club: { open: '09:00', close: '17:00', age_range: '4-12' }
    },
    activities: {
      family: ['Kids club', 'Pool games', 'Mini golf', 'Beach volleyball', 'Family movie nights'],
      couples: ['Romantic dinner', 'Couples massage', 'Sunset cruise', 'Private beach area', 'Cocktail making class'],
      adventure: ['Jet skiing', 'Parasailing', 'Scuba diving', 'Quad biking', 'Desert safari']
    }
  },
  'movenpick-sousse': {
    name: 'Mövenpick Sousse',
    location: 'Sousse, Tunisia',
    description: 'Premium resort in historic Sousse with cultural experiences',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
    color: 'from-amber-600 to-orange-500',
    coordinates: { lat: 35.8256, lon: 10.6411 },
    facilities: {
      pool: { open: '06:00', close: '22:00', type: 'outdoor' },
      gym: { open: '05:00', close: '23:00' },
      spa: { open: '09:00', close: '20:00' },
      restaurant: { open: '07:00', close: '23:00' },
      bar: { open: '10:00', close: '02:00' },
      cultural_center: { open: '08:00', close: '18:00' }
    },
    activities: {
      family: ['Medina tours', 'Traditional pottery classes', 'Cultural shows', 'Beach activities', 'Historical site visits'],
      couples: ['Romantic medina walk', 'Traditional hammam', 'Rooftop dining', 'Cultural performances', 'Sunset at ribat'],
      adventure: ['Jet skiing', 'Parasailing', 'Sahara excursions', 'Archaeological tours', 'Camel trekking'],
      cultural: ['Medina of Sousse tours', 'Great Mosque visits', 'Ribat fortress', 'Archaeological museum', 'Traditional markets', 'Local artisan workshops']
    },
    specialRecommendations: {
      weather: 'Perfect Mediterranean climate year-round',
      localAttractions: ['UNESCO World Heritage Medina', 'Ribat of Sousse', 'Great Mosque', 'Archaeological Museum'],
      culturalExperiences: ['Traditional music performances', 'Local cooking classes', 'Artisan workshops', 'Historical guided tours']
    }
  }
}

// Default hotel settings with contact information
function getDefaultHotelSettings(hotelId: string) {
  const baseSettings = {
    restaurant: {
      breakfast: { start: '07:00', end: '10:00', available: true },
      lunch: { start: '12:00', end: '15:00', available: true },
      dinner: { start: '19:00', end: '22:00', available: true }
    },
    spa: {
      available: false, // Default to closed until admin configures
      openTime: '09:00',
      closeTime: '20:00',
      treatments: ['Traditional Hammam', 'Aromatherapy Massage', 'Facial Treatment']
    },
    pool: { openTime: '06:00', closeTime: '22:00', available: true },
    gym: { openTime: '05:00', closeTime: '23:00', available: true },
    kidsClub: { openTime: '09:00', closeTime: '17:00', available: true, ageRange: '4-12' },
    specialEvents: [],
    wifi: { available: true, password: 'Ask at reception', instructions: 'Connect to hotel WiFi network' },
    parking: { available: true, price: 'Free', instructions: 'Parking available at hotel' },
    checkIn: { time: '15:00', instructions: 'Check-in available at reception' },
    checkOut: { time: '12:00', instructions: 'Check-out at reception' }
  }

  // Hotel-specific contact information
  const hotelContacts = {
    'sindbad-hammamet': {
      phone: '+216 72 280 122',
      email: 'info@sindbad-hammamet.com',
      address: 'Zone Touristique, Hammamet 8050, Tunisia',
      emergencyPhone: '+216 72 280 100'
    },
    'paradise-hammamet': {
      phone: '+216 72 285 200',
      email: 'info@paradise-hammamet.com',
      address: 'Avenue des Nations Unies, Hammamet 8050, Tunisia',
      emergencyPhone: '+216 72 285 100'
    },
    'movenpick-sousse': {
      phone: '+216 73 246 111',
      email: 'info@movenpick-sousse.com',
      address: 'Avenue Hedi Chaker, Sousse 4000, Tunisia',
      emergencyPhone: '+216 73 246 100'
    }
  }

  return {
    name: hotelData[hotelId as keyof typeof hotelData]?.name || 'Hotel',
    contact: hotelContacts[hotelId as keyof typeof hotelContacts] || {
      phone: '+216 70 000 000',
      email: 'info@hotel.com',
      address: 'Tunisia',
      emergencyPhone: '+216 70 000 000'
    },
    ...baseSettings
  }
}

export default function HotelAssistant() {
  const params = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Registration state
  const [pageState, setPageState] = useState<HotelPageState>({
    showRegistration: true,
    sessionId: null,
    guestProfile: null
  })

  const hotelId = params.id as string
  const hotel = hotelData[hotelId as keyof typeof hotelData]

  // Always show registration form on every visit (no session persistence)
  // Removed localStorage check to ensure fresh registration each time

  const handleRegistrationComplete = (sessionId: string, profile: GuestProfile) => {
    setPageState({
      showRegistration: false,
      sessionId,
      guestProfile: profile
    })
  }

  const fetchWeather = async () => {
    if (!hotel) return
    
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${hotel.coordinates.lat}&longitude=${hotel.coordinates.lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
      )
      const data = await response.json()
      const current = data.current_weather

      const weatherData = {
        temperature: current.temperature,
        description: getWeatherDescription(current.weathercode),
        humidity: data.hourly.relative_humidity_2m[0],
        wind_speed: current.windspeed,
        feels_like: current.temperature + 2
      }
      
      setWeather(weatherData)
    } catch (error) {
      console.error('Weather fetch failed:', error)
    }
  }

  // Fetch hotel settings from localStorage (same as dashboard)
  const [hotelSettings, setHotelSettings] = useState<any>(null)
  
  useEffect(() => {
    const fetchHotelSettings = async () => {
      try {
        // Load from localStorage (same source as dashboard)
        const savedSettings = localStorage.getItem('hotelSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          setHotelSettings(settings[hotelId])
        } else {
          // Provide default settings if none exist
          setHotelSettings(getDefaultHotelSettings(hotelId))
        }
      } catch (error) {
        console.error('Error fetching hotel settings:', error)
        // Fallback to default settings
        setHotelSettings(getDefaultHotelSettings(hotelId))
      }
    }
    
    if (hotelId) {
      fetchHotelSettings()
    }
  }, [hotelId])

  useEffect(() => {
    if (!hotel) return

    // Welcome message with clear limitations
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `Welcome to ${hotel.name}! I'm your personal AI information assistant. I can help you with:

✅ Hotel facilities and schedules
✅ Local activities and attractions  
✅ Weather updates
✅ Hotel amenities and services

ℹ️ Note: I'm an information assistant only. For bookings, reservations, or arrangements, please contact our front desk.

How can I help you today?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])

    // Fetch weather
    fetchWeather()
  }, [hotel])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getWeatherDescription = (code: number): string => {
    const codes: { [key: number]: string } = {
      0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
      45: 'fog', 51: 'light drizzle', 61: 'slight rain', 63: 'moderate rain',
      65: 'heavy rain', 71: 'slight snow', 80: 'rain showers', 95: 'thunderstorm'
    }
    return codes[code] || 'unknown'
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Call AI API with hotel context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          hotelSettings,
          hotelData: hotel,
          weather,
          sessionId: pageState.sessionId,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, I could not generate a response. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, I encountered an error connecting to the AI service. Please try again in a moment.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading Hotel...</h1>
        </div>
      </div>
    )
  }

  // Show registration form first
  if (pageState.showRegistration) {
    return (
      <GuestRegistrationForm
        hotelId={hotelId}
        hotelName={hotel.name}
        onComplete={handleRegistrationComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        <div className="particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle opacity-30" />
          ))}
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass backdrop-blur-md shadow-glass sticky top-0 z-50 border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.push('/')}
                className="p-2 glass backdrop-blur-sm rounded-full transition-all duration-300 border border-white/20 hover:bg-white/20 touch-target"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </motion.button>
              <div className="flex items-center space-x-3">
                <motion.div 
                  className={`w-12 h-12 bg-gradient-to-r ${hotel.color} rounded-full flex items-center justify-center shadow-glow`}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{hotel.name}</h1>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {hotel.location}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hotel Image Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src={hotel.image}
          alt={hotel.name}
          fill
          priority
          className="object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${hotel.color} opacity-30`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Weather Widget */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 glass backdrop-blur-md rounded-xl p-4 min-w-[200px] border border-white/20 shadow-glass"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Current Weather</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sun className="w-5 h-5 text-yellow-300" />
              </motion.div>
            </div>
            <div className="space-y-1">
              <motion.div 
                className="flex items-center justify-between"
                whileHover={{ scale: 1.05 }}
              >
                <Thermometer className="w-4 h-4 text-red-400" />
                <span className="text-lg font-bold text-white">{weather.temperature}°C</span>
              </motion.div>
              <motion.div 
                className="flex items-center justify-between text-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Wind className="w-4 h-4 text-blue-400" />
                <span className="text-white/90">{weather.wind_speed} km/h</span>
              </motion.div>
              <motion.div 
                className="flex items-center justify-between text-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-white/90">{weather.humidity}%</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative z-10">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div
                  className={`max-w-[80%] p-4 rounded-2xl relative ${
                    message.role === 'user'
                      ? `bg-gradient-to-r ${hotel.color} text-white shadow-lg`
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Message Avatar */}
                  {message.role === 'assistant' && (
                    <motion.div 
                      className="absolute -left-3 top-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Sun className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  
                  {/* Message Decoration */}
                  {message.role === 'user' && (
                    <div className="absolute -right-1 top-4 w-0 h-0 border-l-8 border-l-current border-t-4 border-t-transparent border-b-4 border-b-transparent opacity-80"></div>
                  )}
                  {message.role === 'assistant' && (
                    <div className="absolute -left-1 top-4 w-0 h-0 border-r-8 border-r-gray-200 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Typing Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative">
                {/* Assistant Avatar */}
                <div className="absolute -left-3 top-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sun className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
                
                {/* Typing Animation */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Assistant is typing</span>
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about hotel facilities, activities, or weather..."
                className="w-full bg-white border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 touch-target text-gray-800 placeholder-gray-500"
              />
              {/* Input Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-300 pointer-events-none focus-within:opacity-100"></div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-3 bg-gradient-to-r ${hotel.color} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-target relative overflow-hidden`}
            >
              <motion.div
                animate={isLoading ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
              >
                <Send className="w-5 h-5" />
              </motion.div>
              
              {/* Button Ripple Effect */}
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full"
                initial={{ scale: 0, opacity: 1 }}
                whileTap={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </div>
          <motion.p 
            className="text-xs text-gray-500 mt-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            ℹ️ Information assistant only • For bookings, contact front desk
          </motion.p>
        </div>
      </div>
    </div>
  )
}