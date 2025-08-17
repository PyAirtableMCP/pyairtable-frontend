import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// API Gateway auth endpoint - NO MOCKING POLICY
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔐 Auth login API called with:", { email: body.email, password: "***" })
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // Call API Gateway auth service - NO MOCKING POLICY
    console.log("📞 Calling API Gateway auth service:", `${AUTH_SERVICE_URL}/api/auth/login`)
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    console.log("📥 API Gateway auth service response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Gateway auth service login failed:", response.status, errorText)
      
      // Return appropriate error based on status
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      } else if (response.status >= 500) {
        throw new Error(`Backend auth service unavailable at ${AUTH_SERVICE_URL}. DevOps agent needed.`)
      } else {
        return NextResponse.json(
          { error: "Authentication failed" },
          { status: response.status }
        )
      }
    }

    const authResult = await response.json()
    console.log("✅ API Gateway auth service success")

    // Forward the response from the backend service
    return NextResponse.json(authResult)

  } catch (error) {
    console.error("❌ Auth login error:", error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // Handle service connection errors (fail loudly per NO MOCKING POLICY)
    if (error instanceof Error && error.message.includes("DevOps agent needed")) {
      return NextResponse.json(
        { error: "Backend service unavailable. Please contact support." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}