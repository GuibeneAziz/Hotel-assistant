// Standardized API Response Types

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  success: false
  error: string
  message?: string
  code?: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

// Chat API Types
export interface ChatRequest {
  message: string
  hotelSettings?: any
  hotelData?: any
  weather?: any
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export interface ChatResponse {
  response: string
  success: boolean
  error?: string
}

// Hotel Settings API Types
export interface HotelSettingsResponse {
  success: boolean
  data?: Record<string, any>
  error?: string
}
