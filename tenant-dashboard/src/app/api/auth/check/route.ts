import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  try {
    // Get the user's session token
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'No valid session found' 
        }, 
        { status: 401 }
      )
    }

    // Return minimal user info for fast auth checks
    return NextResponse.json(
      { 
        authenticated: true,
        user: {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role || 'user',
          tenantId: token.tenantId
        },
        expiresAt: token.exp ? new Date(token.exp * 1000).toISOString() : null
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60' // Cache for 1 minute
        }
      }
    )
  } catch (error) {
    console.error('Error checking auth status:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Auth check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}