'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { 
  Users, MessageSquare, TrendingUp, Globe, 
  ArrowLeft, RefreshCw 
} from 'lucide-react'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

// Color palette for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

interface AnalyticsPageProps {}

export default function AnalyticsPage({}: AnalyticsPageProps) {
  const router = useRouter()
  const [selectedHotel, setSelectedHotel] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
    }
  }, [router])

  // Build API URLs with parameters
  const buildUrl = (endpoint: string) => {
    const params = new URLSearchParams()
    if (selectedHotel !== 'all') params.set('hotelId', selectedHotel)
    params.set('timeRange', timeRange)
    return `/api/analytics/${endpoint}?${params.toString()}`
  }

  // Fetch data using SWR
  const { data: overviewData, error: overviewError, mutate: mutateOverview } = useSWR(
    buildUrl('overview'), 
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )

  const { data: demographicsData, mutate: mutateDemographics } = useSWR(
    buildUrl('demographics'), 
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  )

  const { data: questionsData, mutate: mutateQuestions } = useSWR(
    buildUrl('questions'), 
    fetcher,
    { refreshInterval: 30000 }
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      mutateOverview(),
      mutateDemographics(),
      mutateQuestions()
    ])
    setIsRefreshing(false)
  }

  // Loading state
  if (!overviewData && !overviewError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particles opacity-30">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Header */}
      <header className="glass backdrop-blur-md shadow-glass border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="p-2 glass backdrop-blur-sm rounded-full transition-all duration-300 border border-white/20 hover:bg-white/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-glow"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <TrendingUp className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Analytics Dashboard</h1>
                  <p className="text-gray-600">Real-time insights and guest analytics</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="glass backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Hotel Selector */}
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="glass backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Hotels</option>
                <option value="sindbad-hammamet">Sindbad Hotel</option>
                <option value="paradise-hammamet">Paradise Beach Hotel</option>
                <option value="movenpick-sousse">Mövenpick Sousse</option>
              </select>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-blue-500/25 transition-all shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Overview Cards */}
        {overviewData?.success && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass backdrop-blur-md rounded-xl p-6 border border-white/20 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Guests</p>
                  <p className="text-3xl font-bold text-gray-800">{overviewData.data.totalGuests}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="glass backdrop-blur-md rounded-xl p-6 border border-white/20 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Interactions</p>
                  <p className="text-3xl font-bold text-gray-800">{overviewData.data.totalInteractions}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="glass backdrop-blur-md rounded-xl p-6 border border-white/20 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg. Interactions</p>
                  <p className="text-3xl font-bold text-gray-800">{overviewData.data.avgInteractions}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="glass backdrop-blur-md rounded-xl p-6 border border-white/20 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Top Category</p>
                  <p className="text-2xl font-bold text-gray-800 capitalize">{overviewData.data.topCategory}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Age Distribution */}
          {demographicsData?.success && (
            <motion.div 
              className="glass backdrop-blur-md rounded-xl p-6 border border-white/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Age Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demographicsData.data.ageDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {demographicsData.data.ageDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Top Nationalities */}
          {demographicsData?.success && (
            <motion.div 
              className="glass backdrop-blur-md rounded-xl p-6 border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Nationalities</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demographicsData.data.topNationalities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Question Categories */}
          {questionsData?.success && (
            <motion.div 
              className="glass backdrop-blur-md rounded-xl p-6 border border-white/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Question Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionsData.data.questionCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Questions Over Time */}
          {questionsData?.success && (
            <motion.div 
              className="glass backdrop-blur-md rounded-xl p-6 border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Questions Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={questionsData.data.questionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="questions" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Travel Purposes and Group Types */}
        {demographicsData?.success && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <motion.div 
              className="glass backdrop-blur-md rounded-xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Travel Purposes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demographicsData.data.travelPurposes}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {demographicsData.data.travelPurposes.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div 
              className="glass backdrop-blur-md rounded-xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Group Types</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demographicsData.data.groupTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}