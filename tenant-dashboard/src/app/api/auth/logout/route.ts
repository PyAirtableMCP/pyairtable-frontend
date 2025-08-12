import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    // Clear all auth cookies
    response.cookies.delete("access_token");
    response.cookies.delete("token_type");
    response.cookies.delete("token_expires_at");

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}