import { apiClient } from "./client";
import { ApiResponse } from "@/types";

// Auth-related types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: string;
  tenantId?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface TokenRefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface TwoFactorVerify {
  code: string;
  backupCode?: string;
}

// Token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  static setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    
    const expiryTime = Date.now() + tokens.expiresIn * 1000;
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return Date.now() > parseInt(expiryTime) - 60000; // 1 minute buffer
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static hasValidToken(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }
}

// Authentication utilities
export class AuthUtils {
  // JWT token operations
  static decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  static isJWTExpired(token: string): boolean {
    const decoded = this.decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  }

  static getTokenExpiry(token: string): Date | null {
    const decoded = this.decodeJWT(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  }

  // Auth state checks
  static async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/check", { 
        credentials: "include" 
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await fetch("/api/auth/profile", { 
        credentials: "include" 
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Logout utility
  static async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      TokenManager.clearTokens();
      
      // Clear any cached user data
      if (typeof window !== 'undefined') {
        // Clear NextAuth session
        await import('next-auth/react').then(({ signOut }) => signOut());
      }
    }
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push("Password must be at least 8 characters long");
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push("Password must contain at least one lowercase letter");
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push("Password must contain at least one uppercase letter");
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push("Password must contain at least one number");
    } else {
      score += 1;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push("Password must contain at least one special character");
    } else {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  // Email validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Auth API service
export const authApi = {
  // Authentication
  login: (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post("/auth/login", credentials),

  register: (data: RegisterData): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post("/auth/register", data),

  logout: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post("/auth/logout"),

  // Token management
  refreshToken: (): Promise<ApiResponse<TokenRefreshResponse>> =>
    apiClient.post("/auth/refresh"),

  verifyToken: (token: string): Promise<ApiResponse<{ valid: boolean }>> =>
    apiClient.post("/auth/verify", { token }),

  // Password management
  requestPasswordReset: (data: PasswordResetRequest): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post("/auth/password/reset", data),

  confirmPasswordReset: (data: PasswordResetConfirm): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post("/auth/password/confirm", data),

  changePassword: (data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> =>
    apiClient.put("/auth/password/change", data),

  // Email verification
  requestEmailVerification: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post("/auth/email/verify/request"),

  verifyEmail: (token: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post("/auth/email/verify", { token }),

  // Two-factor authentication
  setupTwoFactor: (): Promise<ApiResponse<TwoFactorSetup>> =>
    apiClient.post("/auth/2fa/setup"),

  verifyTwoFactor: (data: TwoFactorVerify): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post("/auth/2fa/verify", data),

  disableTwoFactor: (password: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post("/auth/2fa/disable", { password }),

  generateBackupCodes: (): Promise<ApiResponse<{ backupCodes: string[] }>> =>
    apiClient.post("/auth/2fa/backup-codes"),

  // Profile management
  getProfile: (): Promise<ApiResponse<AuthUser>> =>
    apiClient.get("/auth/profile"),

  updateProfile: (data: Partial<AuthUser>): Promise<ApiResponse<AuthUser>> =>
    apiClient.put("/auth/profile", data),

  // Session management
  getSessions: (): Promise<ApiResponse<any[]>> =>
    apiClient.get("/auth/sessions"),

  revokeSession: (sessionId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/auth/sessions/${sessionId}`),

  revokeAllSessions: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete("/auth/sessions/all"),
};

// Export utilities for backward compatibility and easy access
export { TokenManager };
export default authApi;