'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Eye, MapPin } from 'lucide-react'

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
  const [selectedHotel, setSelectedHotel] = useState<string>('sindbad-hammamet')
  const [settings, setSettings] = useState<{ [key: string]: HotelSettings }>(defaultSettings)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeTab, setActiveTab] = useState<'services' | 'events' | 'contact' | 'amenities'>('services')
  const [newEvent, setNewEvent] = useState<Partial<SpecialEvent>>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: ''
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from API first
        const response = await fetch('/api/hotel-settings')
        if (response.ok) {
          const apiSettings = await response.json()
          setSettings(apiSettings)
          return
        }
      } catch (error) {
        console.error('Error loading from API:', error)
      }
      
      // Fallback to localStorage
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
      // Save to localStorage for immediate UI updates
      localStorage.setItem('hotelSettings', JSON.stringify(settings))
      
      // Save to backend API for chatbot access
      const response = await fetch('/api/hotel-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        throw new Error('Failed to save to server')
      }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Hotel Admin Dashboard</h1>
                <p className="text-gray-600">Manage your hotel settings and information</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                saveStatus === 'saved' 
                  ? 'bg-green-500 text-white' 
                  : saveStatus === 'saving'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Save className="w-5 h-5" />
              <span>
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Hotel</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(settings).map(([hotelId, hotel]) => (
              <motion.button
                key={hotelId}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedHotel(hotelId)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedHotel === hotelId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">{hotel.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'services', label: 'Services & Hours', icon: '🕐' },
              { id: 'events', label: 'Special Events', icon: '🎉' },
              { id: 'contact', label: 'Contact Info', icon: '📞' },
              { id: 'amenities', label: 'Amenities', icon: '🏨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'services' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Services & Operating Hours</h3>
              
              {/* Restaurant Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>🍽️</span>
                  <span>Restaurant</span>
                </h4>
                <div className="space-y-4">
                  {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                    <div key={meal} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{meal}</span>
                        <button
                          onClick={() => updateHotelSettings(selectedHotel, {
                            restaurant: {
                              ...currentHotel.restaurant,
                              [meal]: { ...currentHotel.restaurant[meal], available: !currentHotel.restaurant[meal].available }
                            }
                          })}
                          className={`px-3 py-1 rounded-full text-sm ${
                            currentHotel.restaurant[meal].available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {currentHotel.restaurant[meal].available ? 'Open' : 'Closed'}
                        </button>
                      </div>
                      {currentHotel.restaurant[meal].available && (
                        <div className="flex space-x-4">
                          <div className="flex-1">
                            <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={currentHotel.restaurant[meal].start}
                              onChange={(e) => updateTimeSlot('restaurant', `${meal}.start`, e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm text-gray-600 mb-1">End Time</label>
                            <input
                              type="time"
                              value={currentHotel.restaurant[meal].end}
                              onChange={(e) => updateTimeSlot('restaurant', `${meal}.end`, e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Spa Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>🧘</span>
                  <span>Spa</span>
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span>Spa Available</span>
                  <button
                    onClick={() => updateHotelSettings(selectedHotel, {
                      spa: { ...currentHotel.spa, available: !currentHotel.spa.available }
                    })}
                    className={`px-3 py-1 rounded-full text-sm ${
                      currentHotel.spa.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {currentHotel.spa.available ? 'Open' : 'Closed'}
                  </button>
                </div>
                {currentHotel.spa.available && (
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={currentHotel.spa.openTime}
                        onChange={(e) => updateTimeSlot('spa', 'openTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={currentHotel.spa.closeTime}
                        onChange={(e) => updateTimeSlot('spa', 'closeTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pool Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>🏊</span>
                  <span>Pool</span>
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span>Pool Available</span>
                  <button
                    onClick={() => updateHotelSettings(selectedHotel, {
                      pool: { ...currentHotel.pool, available: !currentHotel.pool.available }
                    })}
                    className={`px-3 py-1 rounded-full text-sm ${
                      currentHotel.pool.available ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {currentHotel.pool.available ? 'Open' : 'Closed'}
                  </button>
                </div>
                {currentHotel.pool.available && (
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={currentHotel.pool.openTime}
                        onChange={(e) => updateTimeSlot('pool', 'openTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={currentHotel.pool.closeTime}
                        onChange={(e) => updateTimeSlot('pool', 'closeTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Gym Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>💪</span>
                  <span>Gym</span>
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span>Gym Available</span>
                  <button
                    onClick={() => updateHotelSettings(selectedHotel, {
                      gym: { ...currentHotel.gym, available: !currentHotel.gym.available }
                    })}
                    className={`px-3 py-1 rounded-full text-sm ${
                      currentHotel.gym.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {currentHotel.gym.available ? 'Open' : 'Closed'}
                  </button>
                </div>
                {currentHotel.gym.available && (
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={currentHotel.gym.openTime}
                        onChange={(e) => updateTimeSlot('gym', 'openTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={currentHotel.gym.closeTime}
                        onChange={(e) => updateTimeSlot('gym', 'closeTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
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
        </div>

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