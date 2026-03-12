'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Globe, Briefcase, Users } from 'lucide-react'

interface GuestRegistrationFormProps {
  hotelId: string
  hotelName: string
  onComplete: (sessionId: string, profile: GuestProfile) => void
}

export interface GuestProfile {
  ageRange: '18-25' | '26-35' | '36-50' | '50+'
  nationality: string
  travelPurpose: 'leisure' | 'business' | 'family' | 'honeymoon'
  groupType: 'solo' | 'couple' | 'family' | 'group'
}

export default function GuestRegistrationForm({ hotelId, hotelName, onComplete }: GuestRegistrationFormProps) {
  const [profile, setProfile] = useState<GuestProfile>({
    ageRange: '26-35',
    nationality: '',
    travelPurpose: 'leisure',
    groupType: 'couple'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Try to save profile to database (optional - don't block if it fails)
      try {
        await fetch('/api/analytics/guest-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            hotelId,
            ...profile
          })
        })
      } catch (apiError) {
        console.log('Analytics API unavailable, continuing anyway:', apiError)
      }

      // Always complete the registration (don't block on API)
      onComplete(sessionId, profile)
    } catch (error) {
      console.error('Error in registration:', error)
      alert('Failed to save your information. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to {hotelName}</h2>
          <p className="text-gray-600 text-sm">
            Help us personalize your experience by sharing a few details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Age Range
            </label>
            <select
              value={profile.ageRange}
              onChange={(e) => setProfile({ ...profile, ageRange: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="18-25">18-25 years</option>
              <option value="26-35">26-35 years</option>
              <option value="36-50">36-50 years</option>
              <option value="50+">50+ years</option>
            </select>
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Nationality
            </label>
            <input
              type="text"
              value={profile.nationality}
              onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
              placeholder="e.g., French, German, American"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Travel Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Travel Purpose
            </label>
            <select
              value={profile.travelPurpose}
              onChange={(e) => setProfile({ ...profile, travelPurpose: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="leisure">Leisure / Vacation</option>
              <option value="business">Business Trip</option>
              <option value="family">Family Vacation</option>
              <option value="honeymoon">Honeymoon / Romance</option>
            </select>
          </div>

          {/* Group Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Traveling With
            </label>
            <select
              value={profile.groupType}
              onChange={(e) => setProfile({ ...profile, groupType: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="solo">Solo Traveler</option>
              <option value="couple">Couple</option>
              <option value="family">Family</option>
              <option value="group">Group / Friends</option>
            </select>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Chat Assistant'}
          </motion.button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your information helps us provide better recommendations and improve our services
        </p>
      </div>
    </motion.div>
  )
}
