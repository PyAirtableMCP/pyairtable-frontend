/**
 * Rate Limiting Implementation
 * Provides configurable rate limiting for API endpoints
 */

import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number      // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    firstRequest: number
  }
}

// In-memory store (use Redis in production for distributed systems)
const store: RateLimitStore = {}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000) // Cleanup every minute

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || req.ip || 'unknown'
  
  // Include user agent for additional uniqueness
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 8)
  
  return `${ip}:${userAgentHash}`
}

/**
 * Rate limiting function
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}> {
  const {
    windowMs,
    max,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config

  const key = keyGenerator(req)
  const now = Date.now()
  
  // Get or create rate limit entry
  let entry = store[key]
  
  if (!entry || now >= entry.resetTime) {
    // Create new window
    entry = {
      count: 0,
      resetTime: now + windowMs,
      firstRequest: now
    }
    store[key] = entry
  }

  const remaining = Math.max(0, max - entry.count - 1)
  const reset = Math.ceil(entry.resetTime / 1000) // Convert to seconds

  // Check if limit exceeded
  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    return {
      success: false,
      limit: max,
      remaining: 0,
      reset,
      retryAfter
    }
  }

  // Increment counter
  entry.count++

  return {
    success: true,
    limit: max,
    remaining,
    reset
  }
}

/**
 * Create rate limiter with specific configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: NextRequest) => rateLimit(req, config)
}

/**
 * Predefined rate limiters for common use cases
 */
export const RateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  }),

  // API endpoints
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  }),

  // File upload endpoints
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
  }),

  // Search endpoints
  search: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
  }),

  // Password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
  }),

  // Email verification
  emailVerification: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 emails per hour
  }),
}

/**
 * Rate limit by user ID instead of IP
 */
export function createUserRateLimiter(config: RateLimitConfig) {
  return (req: NextRequest, userId: string) => {
    const configWithUserKey: RateLimitConfig = {
      ...config,
      keyGenerator: () => `user:${userId}`,
    }
    return rateLimit(req, configWithUserKey)
  }
}

/**
 * Rate limit by API key
 */
export function createApiKeyRateLimiter(config: RateLimitConfig) {
  return (req: NextRequest, apiKey: string) => {
    const configWithApiKey: RateLimitConfig = {
      ...config,
      keyGenerator: () => `apikey:${apiKey}`,
    }
    return rateLimit(req, configWithApiKey)
  }
}

/**
 * Sliding window rate limiter for more accurate rate limiting
 */
export class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map()
  
  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  async isAllowed(key: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // Get or create window for this key
    let timestamps = this.windows.get(key) || []
    
    // Remove expired timestamps
    timestamps = timestamps.filter(timestamp => timestamp > windowStart)
    
    const allowed = timestamps.length < this.maxRequests
    const remaining = Math.max(0, this.maxRequests - timestamps.length - (allowed ? 1 : 0))
    const resetTime = timestamps.length > 0 
      ? Math.min(...timestamps) + this.windowMs 
      : now + this.windowMs

    if (allowed) {
      timestamps.push(now)
      this.windows.set(key, timestamps)
    }

    return {
      allowed,
      remaining,
      resetTime
    }
  }

  cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.windowMs
    
    for (const [key, timestamps] of this.windows.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > cutoff)
      
      if (validTimestamps.length === 0) {
        this.windows.delete(key)
      } else {
        this.windows.set(key, validTimestamps)
      }
    }
  }
}

export default rateLimit