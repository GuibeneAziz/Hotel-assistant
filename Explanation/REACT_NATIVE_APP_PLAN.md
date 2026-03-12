# React Native Mobile App Implementation Plan

## 🎯 Goal
Create a React Native mobile app for iOS and Android that connects to your existing Next.js backend.

---

## 📱 Why React Native?

### Advantages:
- ✅ **One codebase** for iOS and Android
- ✅ **Reuse logic** from your Next.js app
- ✅ **Native performance** and feel
- ✅ **Large community** and libraries
- ✅ **Hot reload** for fast development
- ✅ **Push notifications** support
- ✅ **Offline capabilities**

### Your App Will Have:
- 📱 Native mobile experience
- 💬 AI chatbot (same as web)
- 🏨 Hotel selection
- 🔔 Push notifications for events
- 📍 Location-based features
- 📴 Offline mode (cached data)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     React Native Mobile App             │
│  ┌─────────────────────────────────┐   │
│  │  Screens:                       │   │
│  │  - Home (Hotel Selection)       │   │
│  │  - Chat (AI Chatbot)            │   │
│  │  - Profile                      │   │
│  │  - Settings                     │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  API Client (Axios)             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                ↓
         (HTTP/HTTPS)
                ↓
┌─────────────────────────────────────────┐
│     Your Next.js Backend                │
│  ┌─────────────────────────────────┐   │
│  │  API Routes:                    │   │
│  │  - /api/chat                    │   │
│  │  - /api/hotel-settings          │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  Groq AI + Redis Cache          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📦 Setup & Installation

### Prerequisites:
```bash
# Node.js (already installed)
node --version  # Should be 16+

# Install Expo CLI (easiest way to start)
npm install -g expo-cli

# Or use React Native CLI for more control
npm install -g react-native-cli
```

### Option 1: Expo (Recommended for Beginners)

**Pros:**
- ✅ Easiest setup
- ✅ No Xcode/Android Studio needed initially
- ✅ Test on real device instantly
- ✅ Over-the-air updates

**Cons:**
- ❌ Limited native modules
- ❌ Larger app size

```bash
# Create new Expo app
npx create-expo-app hotel-assistant-mobile
cd hotel-assistant-mobile

# Start development
npx expo start
```

### Option 2: React Native CLI (More Control)

**Pros:**
- ✅ Full native access
- ✅ Smaller app size
- ✅ More customization

**Cons:**
- ❌ Requires Xcode (Mac) for iOS
- ❌ Requires Android Studio
- ❌ More complex setup

```bash
# Create new React Native app
npx react-native init HotelAssistant
cd HotelAssistant

# Run on Android
npx react-native run-android

# Run on iOS (Mac only)
npx react-native run-ios
```

---

## 🎨 Project Structure

```
hotel-assistant-mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Hotel selection
│   │   ├── ChatScreen.tsx          # AI chatbot
│   │   ├── ProfileScreen.tsx       # User profile
│   │   └── SettingsScreen.tsx      # App settings
│   ├── components/
│   │   ├── HotelCard.tsx           # Hotel display card
│   │   ├── ChatBubble.tsx          # Chat message bubble
│   │   ├── LoadingSpinner.tsx      # Loading indicator
│   │   └── WeatherWidget.tsx       # Weather display
│   ├── services/
│   │   ├── api.ts                  # API client
│   │   ├── storage.ts              # AsyncStorage wrapper
│   │   └── notifications.ts        # Push notifications
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Navigation setup
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── utils/
│   │   └── helpers.ts              # Utility functions
│   └── constants/
│       └── config.ts               # App configuration
├── assets/
│   ├── images/
│   └── fonts/
├── App.tsx                         # Root component
├── app.json                        # App configuration
└── package.json
```

---

## 🔧 Implementation

### Step 1: Install Dependencies

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# API & Storage
npm install axios
npm install @react-native-async-storage/async-storage

# UI Components
npm install react-native-paper  # Material Design
# OR
npm install native-base         # Alternative UI library

# Icons
npm install react-native-vector-icons

# For Expo:
npx expo install react-native-screens react-native-safe-area-context
```

### Step 2: Create API Service

Create `src/services/api.ts`:

```typescript
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Your Next.js backend URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3002'  // Development
  : 'https://your-production-url.com'  // Production

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  hotelSettings: any
  hotelData: any
  weather: any
  conversationHistory: Message[]
}

interface ChatResponse {
  response: string
  success: boolean
}

// API Functions
export const chatAPI = {
  // Send message to AI
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await api.post<ChatResponse>('/api/chat', data)
      return response.data
    } catch (error) {
      console.error('Chat API error:', error)
      throw error
    }
  },
}

export const hotelAPI = {
  // Get hotel settings
  getSettings: async (): Promise<any> => {
    try {
      // Check cache first
      const cached = await AsyncStorage.getItem('hotel-settings')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 300000) {
          return data
        }
      }

      // Fetch from API
      const response = await api.get('/api/hotel-settings')
      
      // Cache the result
      await AsyncStorage.setItem('hotel-settings', JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      }))
      
      return response.data
    } catch (error) {
      console.error('Hotel settings API error:', error)
      throw error
    }
  },
}

export const weatherAPI = {
  // Get weather data
  getWeather: async (lat: number, lon: number): Promise<any> => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
      )
      return response.data
    } catch (error) {
      console.error('Weather API error:', error)
      throw error
    }
  },
}

export default api
```

### Step 3: Create Home Screen

Create `src/screens/HomeScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { hotelAPI } from '../services/api'

const hotels = [
  {
    id: 'sindbad-hammamet',
    name: 'Sindbad Hotel',
    location: 'Hammamet, Tunisia',
    description: 'Luxury beachfront resort with traditional Tunisian charm',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=400&fit=crop',
    color: '#2563eb',
  },
  {
    id: 'paradise-hammamet',
    name: 'Paradise Beach Hotel',
    location: 'Hammamet, Tunisia',
    description: 'Family-friendly paradise with pristine beaches',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=400&fit=crop',
    color: '#059669',
  },
  {
    id: 'movenpick-sousse',
    name: 'Mövenpick Sousse',
    location: 'Sousse, Tunisia',
    description: 'Premium resort in historic Sousse',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
    color: '#d97706',
  },
]

export default function HomeScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)

  const handleHotelPress = (hotel: any) => {
    navigation.navigate('Chat', { hotel })
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tunisia Hotel Assistant</Text>
        <Text style={styles.subtitle}>Choose your hotel</Text>
      </View>

      {hotels.map((hotel) => (
        <TouchableOpacity
          key={hotel.id}
          style={styles.hotelCard}
          onPress={() => handleHotelPress(hotel)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <Text style={styles.hotelLocation}>{hotel.location}</Text>
            <Text style={styles.hotelDescription}>{hotel.description}</Text>
            <View style={[styles.chatButton, { backgroundColor: hotel.color }]}>
              <Text style={styles.chatButtonText}>Chat Now →</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  hotelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hotelImage: {
    width: '100%',
    height: 200,
  },
  hotelInfo: {
    padding: 16,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  hotelLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  hotelDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
  },
  chatButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
```

### Step 4: Create Chat Screen

Create `src/screens/ChatScreen.tsx`:

```typescript
import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { chatAPI, hotelAPI, weatherAPI } from '../services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatScreen() {
  const route = useRoute()
  const { hotel } = route.params as any
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [hotelSettings, setHotelSettings] = useState<any>(null)
  const [weather, setWeather] = useState<any>(null)
  
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    // Load initial data
    loadHotelData()
    
    // Welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Welcome to ${hotel.name}! I'm your AI concierge. How can I help you today?`,
      timestamp: new Date(),
    }])
  }, [])

  const loadHotelData = async () => {
    try {
      const settings = await hotelAPI.getSettings()
      setHotelSettings(settings[hotel.id])
      
      // Load weather if hotel has coordinates
      if (hotel.coordinates) {
        const weatherData = await weatherAPI.getWeather(
          hotel.coordinates.lat,
          hotel.coordinates.lon
        )
        setWeather(weatherData.current_weather)
      }
    } catch (error) {
      console.error('Error loading hotel data:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    try {
      const response = await chatAPI.sendMessage({
        message: inputText,
        hotelSettings,
        hotelData: hotel,
        weather,
        conversationHistory: messages.slice(-6).map(m => ({
          role: m.role,
          content: m.content,
        })),
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText,
        ]}
      >
        {item.content}
      </Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{hotel.name}</Text>
        <Text style={styles.headerSubtitle}>AI Concierge</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>AI is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about hotel facilities, activities..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginLeft: 8,
    color: '#6b7280',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
```

### Step 5: Setup Navigation

Create `src/navigation/AppNavigator.tsx`:

```typescript
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import HomeScreen from '../screens/HomeScreen'
import ChatScreen from '../screens/ChatScreen'

const Stack = createStackNavigator()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### Step 6: Update App.tsx

```typescript
import React from 'react'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  return <AppNavigator />
}
```

---

## 🚀 Running the App

### Development:

```bash
# For Expo
npx expo start

# Scan QR code with:
# - Expo Go app (iOS/Android)
# - Camera app (iOS)

# For React Native CLI
# Android
npx react-native run-android

# iOS (Mac only)
npx react-native run-ios
```

### Testing on Real Device:

**iOS:**
1. Install "Expo Go" from App Store
2. Scan QR code from terminal
3. App loads on your phone

**Android:**
1. Install "Expo Go" from Play Store
2. Scan QR code from terminal
3. App loads on your phone

---

## 📱 Additional Features to Add

### 1. Push Notifications

```bash
npm install expo-notifications
```

### 2. Offline Mode

```bash
npm install @react-native-async-storage/async-storage
```

### 3. Location Services

```bash
npm install expo-location
```

### 4. Camera (for QR codes)

```bash
npm install expo-camera
```

---

## 🎯 Next Steps

1. **Start with Expo** (easier)
2. **Build Home & Chat screens** (provided above)
3. **Test on real device**
4. **Add more features** (notifications, offline, etc.)
5. **Build for production**

---

## 📚 Resources

- **React Native Docs**: https://reactnative.dev
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **UI Libraries**: 
  - React Native Paper: https://callstack.github.io/react-native-paper/
  - Native Base: https://nativebase.io

---

**Ready to build your mobile app!** 📱✨
