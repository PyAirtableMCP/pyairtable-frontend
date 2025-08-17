import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

// Generate cryptographically secure nonce for CSP (Edge-compatible)
function generateNonce(): string {
  // Use Web Crypto API which is available in Edge Runtime
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

// Rate limiting function
function isRateLimited(ip: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)
  
  if (!userLimit || now - userLimit.lastReset > windowMs) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return false
  }
  
  if (userLimit.count >= limit) {
    return true
  }
  
  userLimit.count++
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip heavy operations for static assets and API routes that don't need auth
  const skipAuthPaths = [
    '/api/health',
    '/api/test-auth', // Skip the problematic test route
    '/_next',
    '/static',
    '/favicon.ico',
    '/manifest.json'
  ]
  
  const shouldSkipAuth = skipAuthPaths.some(path => pathname.startsWith(path))
  
  // Get client IP for rate limiting (only for API routes)
  if (req.nextUrl.pathname.startsWith('/api/') && !shouldSkipAuth) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    if (isRateLimited(ip, 100, 15 * 60 * 1000)) { // 100 requests per 15 minutes
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '900', // 15 minutes in seconds
        },
      })
    }
  }
  
  // Only get token for protected routes to avoid unnecessary NextAuth calls
  let token = null
  const protectedPaths = ['/dashboard', '/workspace', '/workspaces', '/admin', '/settings', '/profile', '/chat', '/cost']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath && !shouldSkipAuth) {
    token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "next-auth.session-token"
    })
  }

  // Check authentication for protected routes
  if (isProtectedPath && !token) {
    const signInUrl = new URL('/auth/login', req.url)
    signInUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Define admin-only routes
  const adminPaths = ['/admin']
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))

  // Check if user has admin role for admin routes
  if (isAdminPath && token?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Skip heavy security headers for static assets to improve performance
  if (shouldSkipAuth) {
    return response
  }
  
  // Security headers (only for non-static routes)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Generate nonce only when needed
  const nonce = generateNonce()
  
  // More permissive CSP for development to avoid blocking Next.js scripts
  const isDevelopment = process.env.NODE_ENV === 'development'
  const scriptSrc = isDevelopment 
    ? `'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic' https://js.sentry-cdn.com https://browser.sentry-cdn.com`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://js.sentry-cdn.com https://browser.sentry-cdn.com`
  
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src ${scriptSrc}; object-src 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.pyairtable.com https://sentry.io https://o4508074849124352.ingest.us.sentry.io wss: ws: localhost:*; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
  )
  
  // Additional security headers
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  
  // Set the nonce for scripts
  response.headers.set('X-CSP-Nonce', nonce)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}