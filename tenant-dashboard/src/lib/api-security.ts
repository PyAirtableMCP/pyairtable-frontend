/**
 * API Security Middleware
 * Implements CSRF protection, request validation, and API security measures
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { SecurityHeaders, csrfManager, SecurityUtils } from './security'
import { rateLimit } from './rate-limit'

export interface SecurityConfig {
  requireAuth?: boolean
  requireCSRF?: boolean
  allowedMethods?: string[]
  maxBodySize?: number
  contentTypes?: string[]
  rateLimitConfig?: {
    windowMs: number
    max: number
  }
}

/**
 * API Security Wrapper
 * Provides comprehensive security for API routes
 */
export function withApiSecurity(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  config: SecurityConfig = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      requireAuth = true,
      requireCSRF = true,
      allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      maxBodySize = 1024 * 1024, // 1MB
      contentTypes = ['application/json', 'multipart/form-data'],
      rateLimitConfig = { windowMs: 15 * 60 * 1000, max: 100 }
    } = config

    try {
      // 1. Method validation
      if (!allowedMethods.includes(req.method)) {
        return new NextResponse(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405,
            headers: {
              'Allow': allowedMethods.join(', '),
              ...SecurityHeaders.getSecurityHeaders()
            }
          }
        )
      }

      // 2. Rate limiting
      const rateLimitResult = await rateLimit(req, rateLimitConfig)
      if (!rateLimitResult.success) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests',
            retryAfter: rateLimitResult.retryAfter 
          }),
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
              ...SecurityHeaders.getSecurityHeaders()
            }
          }
        )
      }

      // 3. Content-Type validation
      if (req.method !== 'GET' && req.headers.get('content-type')) {
        const contentType = req.headers.get('content-type')?.split(';')[0]
        if (contentType && !contentTypes.includes(contentType)) {
          return new NextResponse(
            JSON.stringify({ error: 'Unsupported content type' }),
            { 
              status: 415,
              headers: SecurityHeaders.getSecurityHeaders()
            }
          )
        }
      }

      // 4. Body size validation
      if (req.method !== 'GET') {
        const contentLength = req.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > maxBodySize) {
          return new NextResponse(
            JSON.stringify({ error: 'Request body too large' }),
            { 
              status: 413,
              headers: SecurityHeaders.getSecurityHeaders()
            }
          )
        }
      }

      // 5. Authentication check
      if (requireAuth) {
        const token = await getToken({ 
          req, 
          secret: process.env.NEXTAUTH_SECRET 
        })
        
        if (!token) {
          return new NextResponse(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              status: 401,
              headers: SecurityHeaders.getSecurityHeaders()
            }
          )
        }
      }

      // 6. CSRF protection for state-changing operations
      if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers.get('x-csrf-token') || 
                         req.headers.get('x-xsrf-token')
        const sessionId = req.headers.get('x-session-id') || 
                         req.cookies.get('session-id')?.value

        if (!csrfToken || !sessionId) {
          return new NextResponse(
            JSON.stringify({ error: 'CSRF token required' }),
            { 
              status: 403,
              headers: SecurityHeaders.getSecurityHeaders()
            }
          )
        }

        if (!csrfManager.validateToken(sessionId, csrfToken)) {
          return new NextResponse(
            JSON.stringify({ error: 'Invalid CSRF token' }),
            { 
              status: 403,
              headers: SecurityHeaders.getSecurityHeaders()
            }
          )
        }
      }

      // 7. CORS headers
      const origin = req.headers.get('origin')
      const corsHeaders = SecurityHeaders.getCORSHeaders(origin || undefined)

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...SecurityHeaders.getSecurityHeaders()
          }
        })
      }

      // 8. Execute the handler
      const response = await handler(req)
      
      // 9. Add security headers to response
      Object.entries({
        ...corsHeaders,
        ...SecurityHeaders.getSecurityHeaders()
      }).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response

    } catch (error) {
      console.error('API Security Error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Internal server error',
          requestId: SecurityUtils.generateSecureToken(16)
        }),
        { 
          status: 500,
          headers: SecurityHeaders.getSecurityHeaders()
        }
      )
    }
  }
}

/**
 * Input validation middleware
 */
export function validateInput<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  sanitizer?: (data: T) => T
): { isValid: boolean; data?: T; errors?: string[] } {
  try {
    if (!validator(data)) {
      return { isValid: false, errors: ['Invalid input format'] }
    }

    const cleanData = sanitizer ? sanitizer(data) : data
    return { isValid: true, data: cleanData }
  } catch (error) {
    return { isValid: false, errors: ['Validation error'] }
  }
}

/**
 * Secure JSON parser with validation
 */
export async function parseSecureJSON<T>(
  req: NextRequest,
  maxSize: number = 1024 * 1024
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const text = await req.text()
    
    if (text.length > maxSize) {
      return { success: false, error: 'Request body too large' }
    }

    // Basic JSON bomb protection
    if (text.includes('"').length > 1000) {
      return { success: false, error: 'Request contains too many quotes' }
    }

    const data = JSON.parse(text) as T
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Invalid JSON' }
  }
}

/**
 * API Response helper with security headers
 */
export class SecureResponse {
  static json(data: any, status: number = 200, additionalHeaders: Record<string, string> = {}) {
    return new NextResponse(
      JSON.stringify(data),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...SecurityHeaders.getSecurityHeaders(),
          ...additionalHeaders
        }
      }
    )
  }

  static error(message: string, status: number = 400, code?: string) {
    return this.json(
      { 
        error: message, 
        code,
        timestamp: new Date().toISOString(),
        requestId: SecurityUtils.generateSecureToken(16)
      },
      status
    )
  }

  static success(data: any, message?: string) {
    return this.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    })
  }
}

export default withApiSecurity