"use client";

// Cookie-based authentication utilities for JWT tokens
export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Go service response format
interface GoAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

// Auth API client with cookie support
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8082";

export class CookieAuthClient {
  // Login and store tokens in httpOnly cookies
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Important: include cookies in request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(errorData.detail || "Login failed");
    }

    const goResponse: GoAuthResponse = await response.json();

    // Convert Go service response to expected format
    const user: User = {
      id: parseInt(goResponse.user.id),
      email: goResponse.user.email,
      first_name: null,
      last_name: null,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const data: LoginResponse = {
      access_token: goResponse.token,
      token_type: "Bearer",
      expires_in: 86400, // 24 hours default
      user: user
    };

    // Store JWT token in localStorage
    if (typeof window !== "undefined" && data.access_token) {
      localStorage.setItem("jwt_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
    }

    // Also store tokens in httpOnly cookies via API route (for backward compatibility)
    try {
      await fetch("/api/auth/set-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: data.access_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
        }),
        credentials: "include",
      });
    } catch (error) {
      console.warn("Failed to set cookies, continuing with localStorage only:", error);
    }

    return data;
  }

  // Get current user profile
  static async getCurrentUser(): Promise<User | null> {
    // Check localStorage first
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user_data");
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error("Error parsing user data from localStorage:", error);
        }
      }
    }

    try {
      const response = await fetch("/api/auth/profile", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  // Logout and clear cookies
  static async logout(): Promise<void> {
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_data");
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  // Refresh access token
  static async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    // Check localStorage first
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        return true; // Basic check - could be enhanced with token validation
      }
    }

    try {
      const response = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}