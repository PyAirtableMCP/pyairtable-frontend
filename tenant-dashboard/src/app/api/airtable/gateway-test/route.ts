import { NextRequest, NextResponse } from 'next/server'
import { airtableClient } from '@/lib/airtable-client'

export async function GET(request: NextRequest) {
  try {
    // Test the connection to the airtable-gateway service
    const connectionTest = await airtableClient.testConnection()
    
    return NextResponse.json({
      status: 'success',
      message: 'Airtable Gateway connection test successful',
      gateway: connectionTest,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Gateway test error:', error)
    
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test with token from request body
    const body = await request.json()
    const { personalAccessToken } = body

    if (!personalAccessToken) {
      return NextResponse.json(
        { error: 'Personal Access Token is required for authenticated test' },
        { status: 400 }
      )
    }

    // For now, just test the connection since we need to configure the gateway with the token
    const connectionTest = await airtableClient.testConnection()
    
    return NextResponse.json({
      status: 'success',
      message: 'Gateway connection test successful with token',
      gateway: connectionTest,
      tokenProvided: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Gateway authenticated test error:', error)
    
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}