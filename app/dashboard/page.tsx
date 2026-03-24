'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Save, LogOut, MapPin, Eye, BarChart3 } from 'lucide-react'

interface RestaurantSchedule {
  breakfast: { start: string; end: string; available: boolean }
  lunch: { start: string; end: string; available: boolean }
  dinner: { start: string; end: string; available: boolean }
}

interface SpaSettings {
  available: boolean
  openTime: string
  closeTime: string
  treatments: string[]
}

interface SpecialEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  price?: string
}

interface ContactInfo {
  phone: string
  email: string
  address: string
  emergencyPhone: string
}

interface HotelSettings {
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

const defaultSettings: { [key: string]: HotelSettings } = {
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
      treatments: ['Traditional Hammam', 'Aromatherapy Massage', 'Facial Treatment']
    },
    pool: { openTime: '06:00', closeTime: '22:00', available: true },
    gym: { openTime: '05:00', closeTime: '23:00', available: true },
    kidsClub: { openTime: '09:00', closeTime: '17:00', available: true, ageRange: '4-12' },
    specialEvents: [],
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
      treatments: ['Couples Massage', 'Relaxation Therapy', 'Beauty Treatments']
    },
    pool: { openTime: '06:00', closeTime: '22:00', available: true },
    gym: { openTime: '05:00', closeTime: '23:00', available: true },
    kidsClub: { openTime: '09:00', closeTime: '17:00', available: true, ageRange: '4-12' },
    specialEvents: [],
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
      treatments: ['Traditional Hammam', 'Aromatherapy', 'Hot Stone Massage']
    },
    pool: { openTime: '06:00', closeTime: '22:00', available: true },
    gym: { openTime: '00:00', closeTime: '23:59', available: true },
    kidsClub: { openTime: '09:00', closeTime: '17:00', available: false, ageRange: 'N/A' },
    specialEvents: [],
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

export default function AdminDashboard() {
  const router = useRouter()
  const [selectedHotel, setSelectedHotel] = useState<string>('sindbad-hammamet')
  const [settings, setSettings] = useState<{ [key: string]: HotelSettings }>(defaultSettings)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeTab, setActiveTab] = useState<'services' | 'events' | 'contact' | 'amenities' | 'attractions'>('services')
  const [newEvent, setNewEvent] = useState<Partial<SpecialEvent>>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: ''
  })

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  useEffect(() => {
    const loadSettings = async () => {
      // Load from localStorage only (don't use API - different data structure)
      const savedSettings = localStorage.getItem('hotelSettings')
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (error) {
          console.error('Error loading settings:', error)
        }
      }
    }
    
    loadSettings()
  }, [])

  const saveSettings = async () => {
    setSaveStatus('saving')
    
    try {
      // Save to localStorage only (API is disabled for direct modifications)
      localStorage.setItem('hotelSettings', JSON.stringify(settings))
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('idle')
      alert('Error saving settings. Please try again.')
    }
  }

  const updateHotelSettings = (hotelId: string, updates: Partial<HotelSettings>) => {
    setSettings(prev => ({
      ...prev,
      [hotelId]: { ...prev[hotelId], ...updates }
    }))
  }

  const addSpecialEvent = () => {
    if (!newEvent.title || !newEvent.date) return
    
    const event: SpecialEvent = {
      id: Date.now().toString(),
      title: newEvent.title || '',
      description: newEvent.description || '',
      date: newEvent.date || '',
      time: newEvent.time || '',
      location: newEvent.location || '',
      price: newEvent.price || ''
    }
    
    updateHotelSettings(selectedHotel, {
      specialEvents: [...currentHotel.specialEvents, event]
    })
    
    setNewEvent({ title: '', description: '', date: '', time: '', location: '', price: '' })
  }

  const removeSpecialEvent = (eventId: string) => {
    updateHotelSettings(selectedHotel, {
      specialEvents: currentHotel.specialEvents.filter(event => event.id !== eventId)
    })
  }

  const updateTimeSlot = (service: string, field: string, value: string) => {
    if (service === 'restaurant') {
      const mealType = field.split('.')[0] as 'breakfast' | 'lunch' | 'dinner'
      const timeType = field.split('.')[1] as 'start' | 'end'
      
      updateHotelSettings(selectedHotel, {
        restaurant: {
          ...currentHotel.restaurant,
          [mealType]: {
            ...currentHotel.restaurant[mealType],
            [timeType]: value
          }
        }
      })
    } else {
      updateHotelSettings(selectedHotel, {
        [service]: {
          ...(currentHotel as any)[service],
          [field]: value
        }
      })
    }
  }

  const currentHotel = settings[selectedHotel]

  // Only show loading if currentHotel is undefined
  if (!currentHotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading hotel settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        <div className="particles opacity-30">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      <header className="glass backdrop-blur-md shadow-glass border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-glow"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Settings className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Hotel Admin Dashboard</h1>
                <p className="text-gray-600">Manage your hotel settings and information</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin/analytics')}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-purple-500/25 transition-all shadow-lg"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                  saveStatus === 'saved' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25' 
                    : saveStatus === 'saving'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-blue-500/25 shadow-glow'
                }`}
              >
                <motion.div
                  animate={saveStatus === 'saving' ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: saveStatus === 'saving' ? Infinity : 0, ease: "linear" }}
                >
                  <Save className="w-5 h-5" />
                </motion.div>
                <span>
                  {saveStatus === 'saving' ? 'Saving...' : 
                   saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-red-500/25 transition-all shadow-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Hotel</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(settings).map(([hotelId, hotel], index) => (
              <motion.button
                key={hotelId}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedHotel(hotelId)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedHotel === hotelId
                    ? 'border-blue-500 glass backdrop-blur-md shadow-glow'
                    : 'border-white/20 glass backdrop-blur-sm hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={selectedHotel === hotelId ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </motion.div>
                  <span className="font-semibold text-gray-800">{hotel.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="glass backdrop-blur-md rounded-xl shadow-glass p-6 border border-white/20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex space-x-1 mb-6 glass backdrop-blur-sm p-1 rounded-lg border border-white/20">
            {[
              { id: 'services', label: 'Services & Hours', icon: '🕐' },
              { id: 'events', label: 'Special Events', icon: '🎉' },
              { id: 'contact', label: 'Contact Info', icon: '📞' },
              { id: 'amenities', label: 'Amenities', icon: '🏨' },
              { id: 'attractions', label: 'Nearby Attractions', icon: '🗺️' }
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'glass backdrop-blur-md shadow-glow text-blue-600 font-semibold border border-blue-200/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          {activeTab === 'services' && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Services & Operating Hours</h3>
              
              {/* Restaurant Section */}
              <motion.div 
                className="glass backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>🍽️</span>
                  <span>Restaurant</span>
                </h4>
                <div className="space-y-4">
                  {(['breakfast', 'lunch', 'dinner'] as const).map((meal, index) => (
                    <motion.div 
                      key={meal} 
                      className="glass backdrop-blur-sm p-3 rounded-lg border border-white/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{meal}</span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateHotelSettings(selectedHotel, {
                            restaurant: {
                              ...currentHotel.restaurant,
                              [meal]: { ...currentHotel.restaurant[meal], available: !currentHotel.restaurant[meal].available }
                            }
                          })}
                          className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                            currentHotel.restaurant[meal].available 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-green-400/25' 
                              : 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-red-400/25'
                          }`}
                        >
                          {currentHotel.restaurant[meal].available ? 'Open' : 'Closed'}
                        </motion.button>
                      </div>
                      {currentHotel.restaurant[meal].available && (
                        <motion.div 
                          className="flex space-x-4"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex-1">
                            <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={currentHotel.restaurant[meal].start}
                              onChange={(e) => updateTimeSlot('restaurant', `${meal}.start`, e.target.value)}
                              className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm text-gray-600 mb-1">End Time</label>
                            <input
                              type="time"
                              value={currentHotel.restaurant[meal].end}
                              onChange={(e) => updateTimeSlot('restaurant', `${meal}.end`, e.target.value)}
                              className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Spa Section */}
              <motion.div 
                className="glass backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>🧘</span>
                  <span>Spa</span>
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span>Spa Available</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateHotelSettings(selectedHotel, {
                      spa: { ...currentHotel.spa, available: !currentHotel.spa.available }
                    })}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      currentHotel.spa.available 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-green-400/25' 
                        : 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-red-400/25'
                    }`}
                  >
                    {currentHotel.spa.available ? 'Open' : 'Closed'}
                  </motion.button>
                </div>
                {currentHotel.spa.available && (
                  <motion.div 
                    className="flex space-x-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={currentHotel.spa.openTime}
                        onChange={(e) => updateTimeSlot('spa', 'openTime', e.target.value)}
                        className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={currentHotel.spa.closeTime}
                        onChange={(e) => updateTimeSlot('spa', 'closeTime', e.target.value)}
                        className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Pool Section */}
              <motion.div 
                className="glass backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>🏊</span>
                  <span>Pool</span>
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span>Pool Available</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateHotelSettings(selectedHotel, {
                      pool: { ...currentHotel.pool, available: !currentHotel.pool.available }
                    })}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      currentHotel.pool.available 
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-blue-400/25' 
                        : 'bg-gradient-to-r from-gray-400 to-slate-400 text-white shadow-gray-400/25'
                    }`}
                  >
                    {currentHotel.pool.available ? 'Open' : 'Closed'}
                  </motion.button>
                </div>
                {currentHotel.pool.available && (
                  <motion.div 
                    className="flex space-x-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={currentHotel.pool.openTime}
                        onChange={(e) => updateTimeSlot('pool', 'openTime', e.target.value)}
                        className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={currentHotel.pool.closeTime}
                        onChange={(e) => updateTimeSlot('pool', 'closeTime', e.target.value)}
                        className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Gym Section */}
              <motion.div 
                className="glass backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>💪</span>
                  <span>Gym</span>
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span>Gym Available</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateHotelSettings(selectedHotel, {
                      gym: { ...currentHotel.gym, available: !currentHotel.gym.available }
                    })}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      currentHotel.gym.available 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-green-400/25' 
                        : 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-red-400/25'
                    }`}
                  >
                    {currentHotel.gym.available ? 'Open' : 'Closed'}
                  </motion.button>
                </div>
                {currentHotel.gym.available && (
                  <motion.div 
                    className="flex space-x-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={currentHotel.gym.openTime}
                        onChange={(e) => updateTimeSlot('gym', 'openTime', e.target.value)}
                        className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={currentHotel.gym.closeTime}
                        onChange={(e) => updateTimeSlot('gym', 'closeTime', e.target.value)}
                        className="w-full px-3 py-2 glass backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Special Events Management</h3>
              
              {/* Add New Event */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>➕</span>
                  <span>Add New Event</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Event Title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="px-3 py-2 border rounded-md"
                  />
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="px-3 py-2 border rounded-md"
                  />
                  <input
                    type="time"
                    placeholder="Time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="px-3 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="px-3 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Price (optional)"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
                    className="px-3 py-2 border rounded-md"
                  />
                </div>
                <textarea
                  placeholder="Event Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md mt-4"
                  rows={3}
                />
                <button
                  onClick={addSpecialEvent}
                  disabled={!newEvent.title || !newEvent.date}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Add Event
                </button>
              </div>

              {/* Current Events */}
              <div className="space-y-4">
                <h4 className="font-semibold">Current Events</h4>
                {currentHotel.specialEvents.length === 0 ? (
                  <p className="text-gray-500 italic">No special events scheduled</p>
                ) : (
                  currentHotel.specialEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-lg">{event.title}</h5>
                          <p className="text-gray-600 mt-1">{event.description}</p>
                          <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                            <span>📅 {event.date}</span>
                            {event.time && <span>🕐 {event.time}</span>}
                            {event.location && <span>📍 {event.location}</span>}
                            {event.price && <span>💰 {event.price}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeSpecialEvent(event.id)}
                          className="text-red-500 hover:text-red-700 ml-4"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={currentHotel.contact.phone}
                      onChange={(e) => updateHotelSettings(selectedHotel, {
                        contact: { ...currentHotel.contact, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={currentHotel.contact.email}
                      onChange={(e) => updateHotelSettings(selectedHotel, {
                        contact: { ...currentHotel.contact, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone</label>
                    <input
                      type="tel"
                      value={currentHotel.contact.emergencyPhone}
                      onChange={(e) => updateHotelSettings(selectedHotel, {
                        contact: { ...currentHotel.contact, emergencyPhone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={currentHotel.contact.address}
                  onChange={(e) => updateHotelSettings(selectedHotel, {
                    contact: { ...currentHotel.contact, address: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Hotel Amenities</h3>
              
              {/* WiFi */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>📶</span>
                  <span>WiFi</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>WiFi Available</span>
                    <button
                      onClick={() => updateHotelSettings(selectedHotel, {
                        wifi: { ...currentHotel.wifi, available: !currentHotel.wifi.available }
                      })}
                      className={`px-3 py-1 rounded-full text-sm ${
                        currentHotel.wifi.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {currentHotel.wifi.available ? 'Available' : 'Not Available'}
                    </button>
                  </div>
                  {currentHotel.wifi.available && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="WiFi Password"
                        value={currentHotel.wifi.password || ''}
                        onChange={(e) => updateHotelSettings(selectedHotel, {
                          wifi: { ...currentHotel.wifi, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Connection Instructions"
                        value={currentHotel.wifi.instructions || ''}
                        onChange={(e) => updateHotelSettings(selectedHotel, {
                          wifi: { ...currentHotel.wifi, instructions: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Parking */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>🚗</span>
                  <span>Parking</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Parking Available</span>
                    <button
                      onClick={() => updateHotelSettings(selectedHotel, {
                        parking: { ...currentHotel.parking, available: !currentHotel.parking.available }
                      })}
                      className={`px-3 py-1 rounded-full text-sm ${
                        currentHotel.parking.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {currentHotel.parking.available ? 'Available' : 'Not Available'}
                    </button>
                  </div>
                  {currentHotel.parking.available && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Parking Price"
                        value={currentHotel.parking.price || ''}
                        onChange={(e) => updateHotelSettings(selectedHotel, {
                          parking: { ...currentHotel.parking, price: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Parking Instructions"
                        value={currentHotel.parking.instructions || ''}
                        onChange={(e) => updateHotelSettings(selectedHotel, {
                          parking: { ...currentHotel.parking, instructions: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in/Check-out */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <span>🏨</span>
                    <span>Check-in</span>
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="time"
                      value={currentHotel.checkIn.time}
                      onChange={(e) => updateHotelSettings(selectedHotel, {
                        checkIn: { ...currentHotel.checkIn, time: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Check-in Instructions"
                      value={currentHotel.checkIn.instructions || ''}
                      onChange={(e) => updateHotelSettings(selectedHotel, {
                        checkIn: { ...currentHotel.checkIn, instructions: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <span>🚪</span>
                    <span>Check-out</span>
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="time"
                      value={currentHotel.checkOut.time}
                      onChange={(e) => updateHotelSettings(selectedHotel, {
                        checkOut: { ...currentHotel.checkOut, time: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Check-out Instructions"
                      value={currentHotel.checkOut.instructions || ''}
                      onChange={(e) => updateHotelSettings(selectedHotel, {
                        checkOut: { ...currentHotel.checkOut, instructions: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attractions' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Nearby Attractions Management</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-yellow-800">Important: Database-Only Recommendations</h4>
                    <p className="text-yellow-700 mt-1">
                      The chatbot will ONLY recommend attractions that are added to this list. 
                      It will not suggest any attractions from its general knowledge. 
                      Make sure to add all attractions you want guests to know about.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">🚧 Attractions Management Coming Soon</h4>
                <p className="text-blue-700 mb-3">
                  The enhanced attractions management system is being prepared. This will include:
                </p>
                <ul className="text-blue-700 space-y-1 ml-4">
                  <li>• Add/edit attractions with detailed information</li>
                  <li>• Target specific guest types (couples, families, solo travelers)</li>
                  <li>• Set weather conditions for each attraction</li>
                  <li>• Manage booking requirements and contact information</li>
                  <li>• Prioritize attractions for better recommendations</li>
                </ul>
                <p className="text-blue-700 mt-3">
                  For now, attractions are managed through the database. 
                  Contact your system administrator to add or modify attractions.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Current Attractions Database Schema</h4>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  <p>• attraction_name - Name of the attraction</p>
                  <p>• description - Detailed description</p>
                  <p>• category - cultural, adventure, shopping, nature, entertainment</p>
                  <p>• distance - Distance from hotel</p>
                  <p>• price_range - Cost information</p>
                  <p>• suitable_for_couples/families/solo/groups - Target audience</p>
                  <p>• good_for_sunny/rainy/hot/mild/cool - Weather conditions</p>
                  <p>• requires_booking - Whether booking is needed</p>
                  <p>• priority_order - Display priority (higher = shown first)</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Preview Changes</h3>
              <p className="text-blue-600">See how your changes look to guests</p>
            </div>
            <a
              href={`/hotel/${selectedHotel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Eye className="w-5 h-5" />
              <span>Preview Hotel</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}