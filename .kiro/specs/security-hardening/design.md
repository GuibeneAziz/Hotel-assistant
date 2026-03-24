# Design Document: Security Hardening

## Overview

This design document outlines the implementation of comprehensive security measures for the Tunisia Hotel Assistant application. The security hardening will be implemented through a layered approach: middleware for rate limiting and security headers, enhanced input validation, secure credential management, and proper error handling. All implementations follow OWASP Top 10 best practices and are designed to integrate seamlessly with the existing Next.js application without breaking functionality.

The design prioritizes defense in depth, where multiple security layers protect the application. Each layer is independent and provides value even if other layers fail.

## Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Next.js Middleware (Rate Limiting + Headers)  │
│  - Rate limit check (Redis-backed)                      │
│  - Security headers injection                           │
│  - CORS validation                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: API Route Handler                             │
│  - Input validation (Zod schemas)                       │
│  - Input sanitization                                   │
│  - Authentication check (for protected routes)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Business Logic                                │
│  - Parameterized database queries                       │
│  - Secure data processing                               │
│  - Output encoding                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Response                                      │
│  - Error sanitization                                   │
│  - Security logging                                     │
│  - Secure headers                                       │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Rate Limiting**: Redis with sliding window algorithm
- **Input Validation**: Zod schemas (already in use, enhanced)
- **Input Sanitization**: DOMPurify for HTML, custom sanitizers for SQL
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT**: jsonwebtoken library with HS256
- **Security Headers**: Custom Next.js middleware
- **Logging**: Console with structured format (production: integrate with logging service)

## Components and Interfaces

### 1. Rate Limiting Middleware

**File**: `lib/rate-limiter.ts`

```typescript
interface RateLimitConfig {
  windowMs: number        // Time window in milliseconds
  maxRequests: number     // Maximum requests per window
  keyPrefix: string       // Redis key prefix
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
}

class RateLimiter {
  constructor(config: RateLimitConfig)
  
  // Check if request is within rate limit
  async checkLimit(identifier: string): Promise<RateLimitResult>
  
  // Reset rate limit for identifier
  async resetLimit(identifier: string): Promise<void>
}

// Predefined rate limiters for different endpoints
export const chatRateLimiter: RateLimiter
export const authRateLimiter: RateLimiter
export const apiRateLimiter: RateLimiter
```

**Implementation Details**:
- Uses Redis INCR with EXPIRE for atomic operations
- Sliding window algorithm for accurate rate limiting
- Falls back gracefully if Redis is unavailable
- Returns `Retry-After` header value in seconds

### 2. Security Middleware

**File**: `middleware.ts` (Next.js middleware at root)

```typescript
export function middleware(request: NextRequest): NextResponse {
  // 1. Apply rate limiting based on path
  // 2. Add security headers to response
  // 3. Validate CORS for API routes
  // 4. Log security events
}

export const config = {
  matcher: '/api/:path*'  // Apply to all API routes
}
```

**Security Headers Applied**:
```typescript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  // In production only:
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

### 3. Enhanced Input Validation

**File**: `lib/validation.ts` (enhance existing)

```typescript
// Add sanitization functions
export function sanitizeHtml(input: string): string
export function sanitizeString(input: string): string
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: boolean; data?: T; errors?: string[] }

// Enhanced schemas with sanitization
export const secureStringSchema: z.ZodString
export const secureEmailSchema: z.ZodString
export const securePasswordSchema: z.ZodString
```

**Sanitization Rules**:
- Strip all HTML tags from user input (except where explicitly allowed)
- Escape special characters: `< > & " ' / \`
- Trim whitespace
- Limit string lengths
- Validate against regex patterns for specific formats

### 4. Secure Environment Configuration

**File**: `lib/env.ts` (enhance existing)

```typescript
interface SecureEnvConfig {
  // API Keys
  GROQ_API_KEY: string
  
  // Database
  DATABASE_URL: string
  REDIS_URL: string
  
  // Security
  JWT_SECRET: string
  ADMIN_USERNAME: string
  ADMIN_PASSWORD_HASH: string  // Hashed password
  
  // Configuration
  NODE_ENV: string
  ALLOWED_ORIGINS?: string[]
  ENABLE_RATE_LIMITING: boolean
}

export function validateSecureEnv(): SecureEnvConfig
export function getSecureEnv(): SecureEnvConfig

// Validation rules
- JWT_SECRET: minimum 32 characters, alphanumeric + special chars
- ADMIN_PASSWORD_HASH: bcrypt hash format
- GROQ_API_KEY: starts with 'gsk_'
- DATABASE_URL: valid PostgreSQL connection string
- REDIS_URL: valid Redis connection string
```

### 5. Password Hashing Utility

**File**: `lib/password.ts` (new)

```typescript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string>

// Verify password against hash (constant-time comparison)
export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean>

// Validate password strength
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
}

// Password requirements:
// - Minimum 12 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
```

### 6. Security Logging

**File**: `lib/security-logger.ts` (new)

```typescript
interface SecurityEvent {
  type: 'rate_limit' | 'auth_failure' | 'validation_error' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metadata: Record<string, any>
  timestamp: Date
  ip?: string
  endpoint?: string
}

export function logSecurityEvent(event: SecurityEvent): void

// Specific logging functions
export function logRateLimitExceeded(ip: string, endpoint: string): void
export function logAuthFailure(ip: string, username?: string): void
export function logValidationError(endpoint: string, errors: string[]): void
export function logSuspiciousActivity(description: string, metadata: any): void
```

### 7. Enhanced JWT Handling

**File**: `lib/jwt.ts` (new)

```typescript
interface JWTPayload {
  username: string
  role: 'admin' | 'user'
  timestamp: number
  sessionId: string
}

// Generate JWT with secure defaults
export function generateToken(payload: Omit<JWTPayload, 'timestamp'>): string

// Verify and decode JWT
export function verifyToken(token: string): JWTPayload | null

// Refresh token (generate new with extended expiry)
export function refreshToken(oldToken: string): string | null

// Configuration
const JWT_CONFIG = {
  algorithm: 'HS256',
  expiresIn: '24h',
  issuer: 'tunisia-hotel-assistant',
  audience: 'tunisia-hotel-api'
}
```

### 8. CORS Configuration

**File**: `lib/cors.ts` (new)

```typescript
interface CORSConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
}

export function getCORSConfig(): CORSConfig

export function validateOrigin(origin: string): boolean

export function getCORSHeaders(origin: string): Record<string, string>
```

## Data Models

### Rate Limit Storage (Redis)

```
Key Pattern: ratelimit:{endpoint}:{identifier}
Value: Request count (integer)
TTL: Window duration (e.g., 900 seconds for 15 minutes)

Example:
Key: "ratelimit:chat:192.168.1.100"
Value: 45
TTL: 600 seconds remaining
```

### Security Log Entry

```typescript
{
  timestamp: "2026-03-09T10:30:00.000Z",
  type: "auth_failure",
  severity: "medium",
  message: "Failed login attempt",
  metadata: {
    ip: "192.168.1.100",
    username: "admin",
    endpoint: "/api/admin/login"
  }
}
```

### Environment Variables

```bash
# Required Security Variables
JWT_SECRET=<minimum-32-char-random-string>
ADMIN_USERNAME=<admin-username>
ADMIN_PASSWORD_HASH=<bcrypt-hash>

# Optional Security Variables
ALLOWED_ORIGINS=https://example.com,https://app.example.com
ENABLE_RATE_LIMITING=true
RATE_LIMIT_SKIP_SUCCESSFUL=false

# Existing Variables (enhanced validation)
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NODE_ENV=production
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Rate Limit Enforcement

*For any* client identifier and endpoint configuration, when the number of requests within the time window exceeds the configured maximum, the rate limiter should reject subsequent requests until the window resets.

**Validates: Requirements 1.2, 1.3, 1.4, 2.1, 2.2**

### Property 2: Input Sanitization Idempotence

*For any* string input, sanitizing it multiple times should produce the same result as sanitizing it once (idempotence property).

**Validates: Requirements 3.2, 3.3**

### Property 3: Password Hash Verification

*For any* valid password string, hashing the password and then verifying it against the hash should always return true, while verifying any different password should return false.

**Validates: Requirements 12.1, 12.2**

### Property 4: JWT Token Round-Trip

*For any* valid JWT payload, generating a token from the payload and then verifying and decoding that token should return an equivalent payload.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Security Headers Presence

*For any* API response, all required security headers should be present with correct values.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 6: Environment Validation Completeness

*For any* required environment variable, if it is missing or invalid at startup, the system should refuse to start and provide a clear error message.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

### Property 7: Error Message Sanitization

*For any* error that occurs in production mode, the error response should not contain stack traces, database schema details, or internal implementation details.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 8: Rate Limit Reset

*For any* client identifier, after the rate limit window expires, the request count should reset to zero and new requests should be allowed.

**Validates: Requirements 1.1, 1.5**

### Property 9: Input Validation Rejection

*For any* input that violates the schema constraints, the validation function should reject it and return specific error messages without processing the invalid data.

**Validates: Requirements 3.1, 3.5**

### Property 10: CORS Origin Validation

*For any* request origin, if it is not in the allowed origins list, the CORS headers should not be added to the response in production mode.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 11: Secure Random Generation

*For any* session ID generation, the generated ID should be cryptographically secure and have sufficient entropy (minimum 128 bits).

**Validates: Requirements 13.1**

### Property 12: SQL Injection Prevention

*For any* user input used in database queries, the query should use parameterized statements and never concatenate user input directly into SQL strings.

**Validates: Requirements 3.6, 9.3**

## Error Handling

### Error Classification

1. **Client Errors (4xx)**
   - 400 Bad Request: Invalid input, validation failures
   - 401 Unauthorized: Missing or invalid authentication
   - 403 Forbidden: Insufficient permissions
   - 429 Too Many Requests: Rate limit exceeded

2. **Server Errors (5xx)**
   - 500 Internal Server Error: Unexpected errors (sanitized message)
   - 503 Service Unavailable: Redis or database unavailable

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string          // Generic error message for client
  message?: string       // Specific details (only if safe to expose)
  code?: string         // Error code for client handling
  retryAfter?: number   // For rate limiting (seconds)
}
```

### Error Handling Strategy

1. **Catch all errors** at the API route level
2. **Log detailed errors** server-side with security logger
3. **Return sanitized errors** to client based on environment:
   - Production: Generic messages only
   - Development: Detailed messages for debugging
4. **Never expose**:
   - Stack traces
   - Database errors
   - File paths
   - Internal configuration
   - API keys or secrets

### Example Error Handling

```typescript
try {
  // Business logic
} catch (error) {
  // Log detailed error server-side
  logSecurityEvent({
    type: 'validation_error',
    severity: 'low',
    message: error.message,
    metadata: { stack: error.stack, endpoint: '/api/chat' }
  })
  
  // Return sanitized error to client
  return NextResponse.json({
    success: false,
    error: isProduction() 
      ? 'An error occurred processing your request'
      : error.message
  }, { status: 500 })
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific security functions and edge cases:

1. **Rate Limiter Tests**
   - Test single request within limit
   - Test exact limit boundary
   - Test exceeding limit
   - Test window expiration and reset
   - Test Redis unavailability fallback

2. **Input Sanitization Tests**
   - Test HTML tag stripping
   - Test special character escaping
   - Test SQL injection patterns blocked
   - Test XSS payload neutralization
   - Test empty and null inputs

3. **Password Hashing Tests**
   - Test correct password verification
   - Test incorrect password rejection
   - Test password strength validation
   - Test minimum length enforcement

4. **JWT Tests**
   - Test token generation
   - Test token verification
   - Test expired token rejection
   - Test invalid signature rejection
   - Test malformed token handling

5. **Environment Validation Tests**
   - Test missing required variables
   - Test invalid variable formats
   - Test weak JWT secret rejection
   - Test valid configuration acceptance

### Property-Based Tests

Property-based tests will verify universal correctness properties across many generated inputs:

1. **Property Test: Rate Limit Enforcement**
   - Generate random request sequences
   - Verify limit is enforced correctly
   - Verify reset after window expiration

2. **Property Test: Sanitization Idempotence**
   - Generate random strings with special characters
   - Verify sanitize(sanitize(x)) === sanitize(x)

3. **Property Test: Password Round-Trip**
   - Generate random valid passwords
   - Verify hash then verify always succeeds
   - Generate random different passwords
   - Verify verification fails for wrong password

4. **Property Test: JWT Round-Trip**
   - Generate random valid payloads
   - Verify encode then decode returns equivalent payload

5. **Property Test: Security Headers**
   - Generate random API requests
   - Verify all required headers present in responses

6. **Property Test: Error Sanitization**
   - Generate random errors
   - Verify production responses contain no sensitive data

### Integration Tests

1. **End-to-End Rate Limiting**
   - Make multiple requests to API
   - Verify rate limit kicks in
   - Verify Retry-After header

2. **Authentication Flow**
   - Test login with valid credentials
   - Test login with invalid credentials
   - Test protected endpoint access with token
   - Test protected endpoint access without token

3. **CORS Validation**
   - Test requests from allowed origins
   - Test requests from disallowed origins
   - Verify appropriate headers

### Security Testing

1. **Penetration Testing Scenarios**
   - SQL injection attempts
   - XSS payload injection
   - CSRF token bypass attempts
   - Rate limit bypass attempts
   - JWT token manipulation

2. **Dependency Scanning**
   - Run `npm audit` regularly
   - Check for known vulnerabilities
   - Update dependencies with security patches

### Testing Configuration

- **Property tests**: Minimum 100 iterations per test
- **Test framework**: Jest for unit tests, fast-check for property tests
- **Coverage target**: 90% for security-critical code
- **CI/CD**: Run security tests on every commit

### Test Tagging

Each property-based test must include a comment tag:

```typescript
// Feature: security-hardening, Property 1: Rate Limit Enforcement
test('rate limiter enforces limits correctly', async () => {
  // Property-based test implementation
})
```

## Implementation Notes

### Phase 1: Foundation (Non-Breaking)
1. Add new security utilities (rate-limiter, password, jwt, security-logger)
2. Enhance environment validation
3. Add security headers middleware
4. No changes to existing API behavior

### Phase 2: Rate Limiting
1. Implement rate limiting middleware
2. Apply to all endpoints with appropriate limits
3. Test thoroughly in development
4. Deploy with monitoring

### Phase 3: Enhanced Validation
1. Add sanitization to existing validation
2. Update all API routes to use enhanced validation
3. Test with various payloads

### Phase 4: Authentication Hardening
1. Implement password hashing
2. Update admin login to use bcrypt
3. Enhance JWT handling
4. Require strong JWT secret

### Phase 5: Monitoring & Documentation
1. Implement security logging
2. Create SECURITY.md documentation
3. Update .env.example with all security variables
4. Add inline comments explaining security measures

### Backward Compatibility

- All changes are additive or enhance existing functionality
- Existing API contracts remain unchanged
- Environment variables are validated but existing ones still work
- Rate limiting can be disabled via environment variable for testing
- Development mode provides detailed errors for debugging

### Performance Considerations

- Rate limiting adds ~5-10ms per request (Redis lookup)
- Input sanitization adds ~1-2ms per request
- Password hashing is intentionally slow (~100-200ms) for security
- Security headers add negligible overhead (<1ms)
- Overall impact: <20ms per request, acceptable for security benefits
