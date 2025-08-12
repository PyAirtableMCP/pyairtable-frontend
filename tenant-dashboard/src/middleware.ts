import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Get token from cookies
  const accessToken = req.cookies.get("access_token")?.value
  const tokenExpiresAt = req.cookies.get("token_expires_at")?.value
  
  // Check if token is expired
  const isTokenExpired = tokenExpiresAt ? new Date(tokenExpiresAt) <= new Date() : true
  const hasValidToken = accessToken && !isTokenExpired

  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/workspace',
    '/admin',
    '/api/protected',
    '/settings',
    '/profile'
  ]

  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Allow access to authentication routes
  const authPaths = ['/auth', '/api/auth']
  const isAuthPath = authPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Allow access to public routes
  const publicPaths = ['/', '/about', '/contact', '/privacy', '/terms']
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname)

  // Check authentication for protected routes
  if (isProtectedPath && !hasValidToken) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    
    // Clear expired/invalid cookies
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete("access_token")
    response.cookies.delete("token_type")  
    response.cookies.delete("token_expires_at")
    return response
  }

  // For admin routes, we'd need to decode the JWT to check roles
  // For now, we'll just check for valid token
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!hasValidToken) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete("access_token")
      response.cookies.delete("token_type")
      response.cookies.delete("token_expires_at")
      return response
    }
    
    // TODO: Decode JWT to check role when needed
    // For now, allow access with valid token
  }

  // Add security headers
  const response = NextResponse.next()
  
  // Security headers for all responses
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP header for additional protection
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}