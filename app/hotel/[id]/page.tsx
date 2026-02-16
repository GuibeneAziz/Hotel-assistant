'use client'

import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, MapPin, Clock, Thermometer, Wind, Droplets, Sun, Moon, Star, Wifi, Car, Utensils, Waves } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'

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

export default function HotelAssistant() {
  const params = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [guestType, setGuestType] = useState<'family' | 'couples' | 'adventure' | 'cultural'>('family')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const hotelId = params.id as string
  const hotel = hotelData[hotelId as keyof typeof hotelData]

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

  // Fetch hotel settings from API
  const [hotelSettings, setHotelSettings] = useState<any>(null)
  
  useEffect(() => {
    const fetchHotelSettings = async () => {
      try {
        const response = await fetch('/api/hotel-settings')
        if (response.ok) {
          const settings = await response.json()
          setHotelSettings(settings[hotelId])
        }
      } catch (error) {
        console.error('Error fetching hotel settings:', error)
      }
    }
    
    if (hotelId) {
      fetchHotelSettings()
    }
  }, [hotelId])

  useEffect(() => {
    if (!hotel) return

    // Welcome message
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `Welcome to ${hotel.name}! I'm your personal AI concierge assistant. I can help you with hotel facilities, local activities, weather updates, and personalized recommendations. How can I assist you today?`,
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-target"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${hotel.color} rounded-full flex items-center justify-center`}>
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{hotel.name}</h1>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {hotel.location}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Guest Type Selector */}
            <div className="flex items-center space-x-2">
              <select
                value={guestType}
                onChange={(e) => setGuestType(e.target.value as any)}
                className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 touch-target"
              >
                <option value="family">👨‍👩‍👧‍👦 Family</option>
                <option value="couples">💑 Couples</option>
                <option value="adventure">🏃‍♂️ Adventure</option>
                {hotelId === 'movenpick-sousse' && <option value="cultural">🏛️ Cultural</option>}
              </select>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hotel Image Banner */}
      <div className="relative h-48 md:h-64">
        <Image
          src={hotel.image}
          alt={hotel.name}
          fill
          priority
          className="object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${hotel.color} opacity-30`} />
        
        {/* Weather Widget */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 min-w-[200px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Weather</span>
              <Sun className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span className="text-lg font-bold">{weather.temperature}°C</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Wind className="w-4 h-4 text-blue-500" />
                <span>{weather.wind_speed} km/h</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>{weather.humidity}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? `bg-gradient-to-r ${hotel.color} text-white`
                      : 'bg-white shadow-md text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white shadow-md p-4 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about hotel facilities, activities, or weather..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-3 bg-gradient-to-r ${hotel.color} text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 touch-target`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}