// Rate Limiting Helper for API Routes
// OWASP: Rate limiting prevents abuse and DDoS attacks

import { NextResponse } from 'next/server'
import { 
  chatRateLimiter, 
  authRateLimiter, 
  apiRateLimiter,
  adminRateLimiter,
  getClientIp,
  type RateLimitResult
} from './rate-limiter'

/**
 * Apply rate limiting to an API route
 * Returns a response if rate limit is exceeded, null otherwise
 */
export async function checkRateLimit(
  request: Request,
  limiterType: 'chat' | 'auth' | 'api' | 'admin'
): Promise<NextResponse | null> {
  const clientIp = getClientIp(request)
  
  // Select appropriate rate limiter
  let limiter
  switch (limiterType) {
    case 'chat':
      limiter = chatRateLimiter
      break
    case 'auth':
      limiter = authRateLimiter
      break
    case 'admin':
      limiter = adminRateLimiter
      break
    default:
      limiter = apiRateLimiter
  }

  const result = await limiter.checkLimit(clientIp)

  if (!result.success) {
    console.warn(`⚠️  Rate limit exceeded: ${clientIp} (${limiterType})`)
    
    const response = NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter
      },
      { status: 429 }
    )

    // Add rate limit headers
    addRateLimitHeaders(response, result)
    
    return response
  }

  return null
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult) {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString())
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }
}
