'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, Wifi, Car, Utensils, Waves, Sun, Phone, ArrowRight, Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Hotel {
  id: string
  name: string
  location: string
  city: string
  description: string
  image: string
  rating: number
  features: string[]
  specialties: string[]
  color: string
}

const hotels: Hotel[] = [
  {
    id: 'sindbad-hammamet',
    name: 'Sindbad Hotel',
    location: 'Hammamet',
    city: 'Hammamet',
    description: 'Luxury beachfront resort with traditional Tunisian charm and modern amenities',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    rating: 4.5,
    features: ['Beach Access', 'Spa & Wellness', 'Multiple Restaurants', 'Kids Club'],
    specialties: ['Traditional Architecture', 'Beachfront Location', 'Cultural Activities'],
    color: 'from-blue-600 to-cyan-500'
  },
  {
    id: 'paradise-hammamet',
    name: 'Paradise Beach Hotel',
    location: 'Hammamet',
    city: 'Hammamet',
    description: 'Family-friendly paradise with pristine beaches and endless entertainment',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
    rating: 4.7,
    features: ['Private Beach', 'Water Sports', 'Family Activities', 'All-Inclusive'],
    specialties: ['Family Entertainment', 'Water Activities', 'Kids Programs'],
    color: 'from-emerald-600 to-teal-500'
  },
  {
    id: 'movenpick-sousse',
    name: 'Mövenpick Sousse',
    location: 'Sousse',
    city: 'Sousse',
    description: 'Premium resort in historic Sousse with cultural experiences and luxury amenities',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    rating: 4.8,
    features: ['Historic Location', 'Luxury Spa', 'Fine Dining', 'Cultural Tours'],
    specialties: ['Historic Medina Tours', 'Local Experiences', 'Premium Service'],
    color: 'from-amber-600 to-orange-500'
  }
]

export default function HomePage() {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const [currentTime, setCurrentTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Africa/Tunis'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleHotelSelect = (hotel: Hotel) => {
    setIsLoading(true)
    setSelectedHotel(hotel)
    
    // Simulate loading and redirect to hotel assistant
    setTimeout(() => {
      window.location.href = `/hotel/${hotel.id}`
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-tunisia-blue to-tunisia-gold rounded-full flex items-center justify-center">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Tunisia Hotels</h1>
                <p className="text-sm text-gray-600">Your Personal Tourist Assistant</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <a
                  href="/dashboard"
                  className="text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Admin</span>
                </a>
                <div>
                  <p className="text-sm text-gray-600">Local Time</p>
                  <p className="text-lg font-semibold text-tunisia-blue">{currentTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Welcome Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-7xl mx-auto px-4 py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-tunisia-blue to-tunisia-gold">Tunisia</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the perfect hotel experience with your personal AI assistant. 
            Choose from our premium selection of hotels and get personalized recommendations, 
            weather updates, and local activities.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <Waves className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">Beach Access</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <Sun className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-700">Perfect Weather</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <Phone className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">24/7 AI Assistant</span>
          </div>
        </motion.div>
      </motion.section>

      {/* Hotels Selection */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="max-w-7xl mx-auto px-4 pb-16"
      >
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-4">Choose Your Perfect Hotel</h3>
          <p className="text-gray-600 text-lg">Each hotel comes with a personalized AI assistant to enhance your stay</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {hotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group cursor-pointer"
              onClick={() => handleHotelSelect(hotel)}
            >
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Hotel Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${hotel.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold">{hotel.rating}</span>
                  </div>

                  {/* Location Badge */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-white" />
                    <span className="text-sm text-white font-medium">{hotel.location}</span>
                  </div>
                </div>

                {/* Hotel Info */}
                <div className="p-6">
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">{hotel.name}</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">{hotel.description}</p>

                  {/* Features */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Features:</h5>
                    <div className="flex flex-wrap gap-2">
                      {hotel.features.map((feature, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Specialties:</h5>
                    <div className="flex flex-wrap gap-2">
                      {hotel.specialties.map((specialty, idx) => (
                        <span key={idx} className={`text-xs bg-gradient-to-r ${hotel.color} text-white px-2 py-1 rounded-full`}>
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full bg-gradient-to-r ${hotel.color} text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 touch-target group-hover:shadow-lg transition-all`}
                  >
                    <span>Start Your Experience</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && selectedHotel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${selectedHotel.color} rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce-gentle`}>
                <Sun className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Preparing Your Experience</h3>
              <p className="text-gray-600 mb-4">
                Setting up your personal assistant for <strong>{selectedHotel.name}</strong>
              </p>
              <div className="flex justify-center">
                <div className="loading-dots text-tunisia-blue text-lg font-semibold">Loading</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            © 2024 Tunisia Hotel Assistant. Powered by AI for the perfect tourist experience.
          </p>
        </div>
      </footer>
    </div>
  )
}