import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const expiresAt = cookieStore.get("token_expires_at")?.value;

    if (!accessToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Check if token is expired
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete("access_token");
      response.cookies.delete("token_type");
      response.cookies.delete("token_expires_at");
      return response;
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Error checking auth status:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}