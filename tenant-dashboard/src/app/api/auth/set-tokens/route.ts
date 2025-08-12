import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { access_token, token_type, expires_in } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: "No access token provided" }, { status: 400 });
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Set httpOnly cookies
    const response = NextResponse.json({ success: true });
    
    response.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    response.cookies.set("token_type", token_type, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    // Store expiration time for refresh logic
    response.cookies.set("token_expires_at", expiresAt.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error setting tokens:", error);
    return NextResponse.json({ error: "Failed to set tokens" }, { status: 500 });
  }
}