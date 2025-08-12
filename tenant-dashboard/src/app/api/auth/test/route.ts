import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8007";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const tokenType = cookieStore.get("token_type")?.value || "bearer";

    if (!accessToken) {
      return NextResponse.json({ 
        error: "No access token",
        authenticated: false 
      }, { status: 401 });
    }

    // Test the token with the backend auth service
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Authorization": `${tokenType} ${accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: "Token validation failed",
        authenticated: false 
      }, { status: 401 });
    }

    const user = await response.json();
    
    return NextResponse.json({
      authenticated: true,
      user: user,
      tokenValid: true,
      message: "JWT authentication working correctly"
    });
  } catch (error) {
    console.error("Error in auth test:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      authenticated: false 
    }, { status: 500 });
  }
}