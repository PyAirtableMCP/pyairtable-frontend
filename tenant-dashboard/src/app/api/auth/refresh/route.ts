import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8007";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    // For now, we'll just validate the current token with the profile endpoint
    // In a full implementation, you'd have a dedicated refresh endpoint
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // Token is invalid, clear cookies
      const errorResponse = NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
      errorResponse.cookies.delete("access_token");
      errorResponse.cookies.delete("token_type");
      errorResponse.cookies.delete("token_expires_at");
      return errorResponse;
    }

    // Token is still valid
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }
}