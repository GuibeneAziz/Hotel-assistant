'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, Waves, Sun, Phone, ArrowRight, Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
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
    
    // Use Next.js router for client-side navigation
    setTimeout(() => {
      router.push(`/hotel/${hotel.id}`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        <div className="particles">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass backdrop-blur-md shadow-glass sticky top-0 z-50 border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-tunisia-blue to-tunisia-gold rounded-full flex items-center justify-center shadow-glow"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Sun className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Tunisia Hotels</h1>
                <p className="text-sm text-gray-300">Your Personal Tourist Assistant</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/login"
                  className="text-sm glass backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all flex items-center space-x-2 border border-white/20"
                >
                  <Settings className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
                <div className="glass backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <p className="text-sm text-gray-300">Local Time</p>
                  <p className="text-lg font-semibold text-tunisia-gold">{currentTime}</p>
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
        className="max-w-7xl mx-auto px-4 py-12 text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Welcome to <span className="bg-gradient-to-r from-tunisia-gold via-yellow-400 to-tunisia-gold bg-clip-text text-transparent animate-gradient-x">Tunisia</span>
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Discover the perfect hotel experience with your personal AI assistant. 
            Choose from our premium selection of hotels and get personalized recommendations, 
            weather updates, and local activities.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {[
            { icon: Waves, text: "Beach Access", color: "text-blue-500" },
            { icon: Sun, text: "Perfect Weather", color: "text-yellow-500" },
            { icon: Phone, text: "24/7 AI Assistant", color: "text-green-500" }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="glass backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="flex items-center space-x-2">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-gray-200 font-medium">{item.text}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Hotels Selection */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="max-w-7xl mx-auto px-4 pb-16 relative z-10"
      >
        <div className="text-center mb-12">
          <motion.h3 
            className="text-3xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            Choose Your Perfect Hotel
          </motion.h3>
          <motion.p 
            className="text-gray-300 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            Each hotel comes with a personalized AI assistant to enhance your stay
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {hotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + index * 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group cursor-pointer"
              onClick={() => handleHotelSelect(hotel)}
            >
              <div className="glass backdrop-blur-md rounded-2xl shadow-glass overflow-hidden hover:shadow-glow-lg transition-all duration-500 border border-white/20 hover-lift">
                {/* Hotel Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${hotel.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Rating Badge */}
                  <motion.div 
                    className="absolute top-4 right-4 glass backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 border border-white/20"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-white">{hotel.rating}</span>
                  </motion.div>

                  {/* Location Badge */}
                  <motion.div 
                    className="absolute top-4 left-4 glass-dark backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 border border-white/10"
                    whileHover={{ scale: 1.1 }}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                    <span className="text-sm text-white font-medium">{hotel.location}</span>
                  </motion.div>
                </div>

                {/* Hotel Info */}
                <div className="p-6 bg-white/80 backdrop-blur-sm">
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">{hotel.name}</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">{hotel.description}</p>

                  {/* Features */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Features:</h5>
                    <div className="flex flex-wrap gap-2">
                      {hotel.features.map((feature, idx) => (
                        <motion.span 
                          key={idx} 
                          className="text-xs bg-gray-100/80 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full border border-gray-200/50"
                          whileHover={{ scale: 1.05 }}
                        >
                          {feature}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Specialties:</h5>
                    <div className="flex flex-wrap gap-2">
                      {hotel.specialties.map((specialty, idx) => (
                        <motion.span 
                          key={idx} 
                          className={`text-xs bg-gradient-to-r ${hotel.color} text-white px-2 py-1 rounded-full shadow-sm`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {specialty}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full bg-gradient-to-r ${hotel.color} text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 touch-target group-hover:shadow-glow transition-all duration-300 relative overflow-hidden`}
                  >
                    <span className="relative z-10">Start Your Experience</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
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
              className="glass backdrop-blur-md rounded-2xl p-8 max-w-md mx-4 text-center border border-white/20"
            >
              <motion.div
                className={`w-16 h-16 bg-gradient-to-r ${selectedHotel.color} rounded-full mx-auto mb-4 flex items-center justify-center shadow-glow`}
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity }
                }}
              >
                <Sun className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Preparing Your Experience</h3>
              <p className="text-gray-200 mb-4">
                Setting up your personal assistant for <strong className="text-white">{selectedHotel.name}</strong>
              </p>
              <div className="flex justify-center">
                <div className="loading-dots text-white text-lg font-semibold">Loading</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="glass backdrop-blur-md border-t border-white/20 text-gray-300 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.p 
            className="text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            © 2024 Tunisia Hotel Assistant. Your perfect tourist experience.
          </motion.p>
        </div>
      </footer>
    </div>
  )
}