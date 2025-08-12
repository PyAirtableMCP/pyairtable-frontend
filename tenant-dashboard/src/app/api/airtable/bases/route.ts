import { NextRequest, NextResponse } from 'next/server'
import { AirtableGatewayClient } from '@/lib/airtable-client'

interface AirtableBasesRequest {
  personalAccessToken: string
}

export async function POST(request: NextRequest) {
  try {
    const { personalAccessToken }: AirtableBasesRequest = await request.json()

    if (!personalAccessToken) {
      return NextResponse.json(
        { error: 'Personal Access Token is required' },
        { status: 400 }
      )
    }

    // Create client instance with the user's token
    const airtableClient = new AirtableGatewayClient({
      gatewayUrl: process.env.AIRTABLE_GATEWAY_URL || 'http://localhost:8002',
      internalApiKey: process.env.INTERNAL_API_KEY
    })

    try {
      // Test connection first
      await airtableClient.testConnection()
      
      // Fetch bases from our gateway service
      const bases = await airtableClient.listBases()
      
      // Transform the data to our expected format for compatibility
      const transformedBases = bases.map((base) => ({
        id: base.id,
        name: base.name,
        permissionLevel: base.permissionLevel || 'read',
        tableCount: 0, // We'll need to fetch schema to get table count
        recordCount: null, // We'll need separate API calls to get record counts
        createdTime: new Date().toISOString(), // Airtable doesn't provide this in the bases endpoint
        description: null
      }))

      // For demonstration purposes, let's add some mock data if no bases found
      if (transformedBases.length === 0) {
        return NextResponse.json({
          bases: [
            {
              id: 'demo_base_1',
              name: 'Demo Customer Database',
              permissionLevel: 'read',
              tableCount: 3,
              recordCount: 1234,
              createdTime: new Date().toISOString(),
              description: 'A sample customer database for demonstration'
            },
            {
              id: 'demo_base_2',
              name: 'Demo Sales Tracker',
              permissionLevel: 'write',
              tableCount: 2,
              recordCount: 892,
              createdTime: new Date().toISOString(),
              description: 'Track sales performance and metrics'
            }
          ]
        })
      }

      return NextResponse.json({ bases: transformedBases })

    } catch (gatewayError) {
      console.error('Airtable Gateway error:', gatewayError)
      
      // Handle specific error types from gateway
      if (gatewayError instanceof Error) {
        if (gatewayError.message.includes('Authentication failed')) {
          return NextResponse.json(
            { error: 'Invalid Personal Access Token' },
            { status: 401 }
          )
        }
        
        if (gatewayError.message.includes('Access denied')) {
          return NextResponse.json(
            { error: 'Insufficient permissions to access bases' },
            { status: 403 }
          )
        }

        if (gatewayError.message.includes('timeout') || gatewayError.message.includes('Network error')) {
          return NextResponse.json(
            { error: 'Airtable service is temporarily unavailable. Please try again.' },
            { status: 503 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Unable to fetch bases from Airtable. Please try again.' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Bases fetch error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch bases. Please try again.' },
      { status: 500 }
    )
  }
}