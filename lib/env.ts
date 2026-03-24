// Environment Variables Validation
// OWASP: Validate all configuration at startup, fail fast on errors

interface EnvConfig {
  GROQ_API_KEY: string
  REDIS_URL: string
  NODE_ENV: string
  JWT_SECRET: string
  ADMIN_USERNAME: string
  ADMIN_PASSWORD_HASH: string
  ALLOWED_ORIGINS?: string[]
  ENABLE_RATE_LIMITING: boolean
}

export function validateEnv(): EnvConfig {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required API keys
  if (!process.env.GROQ_API_KEY) {
    errors.push('GROQ_API_KEY is missing')
  }

  if (!process.env.REDIS_URL) {
    errors.push('REDIS_URL is missing')
  }

  // Check required security variables
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is missing - CRITICAL SECURITY ISSUE')
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long')
  } else if (process.env.JWT_SECRET === 'tunisia-hotels-secret-key-change-in-production') {
    errors.push('JWT_SECRET is using default value - MUST be changed for security')
  }

  if (!process.env.ADMIN_USERNAME) {
    errors.push('ADMIN_USERNAME is missing')
  }

  if (!process.env.ADMIN_PASSWORD_HASH) {
    errors.push('ADMIN_PASSWORD_HASH is missing - use scripts/hash-password.js to generate')
  } else if (!process.env.ADMIN_PASSWORD_HASH.startsWith('$2')) {
    errors.push('ADMIN_PASSWORD_HASH appears invalid (should be bcrypt hash starting with $2)')
  }

  // Validate format of API keys
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith('gsk_')) {
    warnings.push('GROQ_API_KEY appears to be invalid (should start with "gsk_")')
  }

  if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://')) {
    warnings.push('REDIS_URL appears to be invalid (should start with "redis://")')
  }

  // Parse optional configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : undefined

  const enableRateLimiting = process.env.ENABLE_RATE_LIMITING !== 'false'

  // Display warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:')
    warnings.forEach(warning => console.warn(`   - ${warning}`))
  }

  // Fail on errors
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:')
    errors.forEach(error => console.error(`   - ${error}`))
    console.error('\n💡 See .env.local.example for required variables')
    throw new Error(`Environment validation failed: ${errors.join(', ')}`)
  }

  console.log('✅ Environment variables validated successfully')

  return {
    GROQ_API_KEY: process.env.GROQ_API_KEY!,
    REDIS_URL: process.env.REDIS_URL!,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET!,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME!,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH!,
    ALLOWED_ORIGINS: allowedOrigins,
    ENABLE_RATE_LIMITING: enableRateLimiting
  }
}

// Get validated environment variables
export function getEnv(): EnvConfig {
  return validateEnv()
}

// Check if running in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// Check if running in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
}
