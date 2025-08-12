import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8007";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const tokenType = cookieStore.get("token_type")?.value || "bearer";

    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    // Call backend auth service to get user profile
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Authorization": `${tokenType} ${accessToken}`,
      },
    });

    if (!response.ok) {
      // Token might be expired, clear cookies
      const errorResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      errorResponse.cookies.delete("access_token");
      errorResponse.cookies.delete("token_type");
      errorResponse.cookies.delete("token_expires_at");
      return errorResponse;
    }

    const user = await response.json();
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}