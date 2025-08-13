export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

class AuthManager {
  private static readonly ACCESS_TOKEN_KEY = "auth_token"
  private static readonly REFRESH_TOKEN_KEY = "refresh_token"
  private static readonly TOKEN_EXPIRES_KEY = "token_expires"
  private static readonly USER_KEY = "auth_user"

  /**
   * Store authentication tokens securely
   */
  static setTokens(tokens: AuthTokens): void {
    if (typeof window === "undefined") return

    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken)
    localStorage.setItem(this.TOKEN_EXPIRES_KEY, tokens.expiresAt.toString())
  }

  /**
   * Get the current access token
   */
  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  /**
   * Get the refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  /**
   * Check if the current token is expired
   */
  static isTokenExpired(): boolean {
    if (typeof window === "undefined") return true

    const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY)
    if (!expiresAt) return true

    return Date.now() >= parseInt(expiresAt, 10)
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getAccessToken()
    return !!token && !this.isTokenExpired()
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  static getTimeUntilExpiry(): number {
    if (typeof window === "undefined") return 0

    const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY)
    if (!expiresAt) return 0

    return Math.max(0, parseInt(expiresAt, 10) - Date.now())
  }

  /**
   * Store user information
   */
  static setUser(user: AuthUser): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  /**
   * Get current user information
   */
  static getUser(): AuthUser | null {
    if (typeof window === "undefined") return null

    const userData = localStorage.getItem(this.USER_KEY)
    if (!userData) return null

    try {
      return JSON.parse(userData)
    } catch {
      return null
    }
  }

  /**
   * Clear all authentication data
   */
  static logout(): void {
    if (typeof window === "undefined") return

    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  /**
   * Parse JWT token to extract claims
   */
  static parseTokenClaims(token: string): Record<string, any> | null {
    try {
      const payload = token.split(".")[1]
      const decoded = atob(payload)
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }

  /**
   * Validate token format (basic check)
   */
  static isValidTokenFormat(token: string): boolean {
    return token.split(".").length === 3
  }

  /**
   * Schedule automatic token refresh
   */
  static scheduleTokenRefresh(refreshCallback: () => Promise<void>): () => void {
    const timeUntilExpiry = this.getTimeUntilExpiry()
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000) // 5 minutes before expiry

    const timeoutId = setTimeout(() => {
      if (this.isAuthenticated()) {
        refreshCallback()
      }
    }, refreshTime)

    // Return cleanup function
    return () => clearTimeout(timeoutId)
  }
}

/**
 * Authentication utilities
 */
export const auth = {
  setTokens: AuthManager.setTokens,
  getAccessToken: AuthManager.getAccessToken,
  getRefreshToken: AuthManager.getRefreshToken,
  isTokenExpired: AuthManager.isTokenExpired,
  isAuthenticated: AuthManager.isAuthenticated,
  getTimeUntilExpiry: AuthManager.getTimeUntilExpiry,
  setUser: AuthManager.setUser,
  getUser: AuthManager.getUser,
  logout: AuthManager.logout,
  parseTokenClaims: AuthManager.parseTokenClaims,
  isValidTokenFormat: AuthManager.isValidTokenFormat,
  scheduleTokenRefresh: AuthManager.scheduleTokenRefresh,
}

export default auth