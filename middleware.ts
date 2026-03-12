// Next.js Middleware for Security Headers
// OWASP: Apply security headers to all API routes
// Note: Rate limiting is handled in API routes due to Edge Runtime limitations

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security middleware applied to all API routes
 * Adds security headers to protect against common vulnerabilities
 */
export async function middleware(request: NextRequest) {
  // Continue to the API route
  const response = NextResponse.next()

  // Add security headers to all responses
  addSecurityHeaders(response)

  return response
}

/**
 * Add security headers to response
 * OWASP: Security headers protect against common web vulnerabilities
 */
function addSecurityHeaders(response: NextResponse) {
  const isProduction = process.env.NODE_ENV === 'production'

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Restrict feature access
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self';"
  )

  // HSTS - only in production
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

// Configure middleware to run on API routes only
export const config = {
  matcher: '/api/:path*'
}
