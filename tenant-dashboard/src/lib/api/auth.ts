import { apiClient } from "./client";
import { ApiResponse } from "@/types";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Backend service URLs - REAL SERVICES RUNNING AT CORRECT PORTS!
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8007";
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

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
    
    // Use sessionStorage for better security and automatic cleanup
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    
    const expiryTime = Date.now() + tokens.expiresIn * 1000;
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiryTime = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return Date.now() > parseInt(expiryTime) - 60000; // 1 minute buffer
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
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
      throw new Error(`JWT decode failed: ${error instanceof Error ? error.message : 'Invalid token format'}`);
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
      if (!response.ok) {
        throw new Error(`Auth check failed: HTTP ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Auth status check failed:', error);
      throw new Error(`Backend auth service unavailable. DevOps agent needed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getCurrentUser(): Promise<AuthUser> {
    try {
      const response = await fetch("/api/auth/profile", { 
        credentials: "include" 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get user profile: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.user && !data.id) {
        throw new Error('Invalid user data received from auth service');
      }
      return data.user || data;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw new Error(`Backend auth service unavailable. DevOps agent needed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Specialized Auth API Client for direct auth service communication
class AuthApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = AUTH_SERVICE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const result = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store tokens after successful login
    if (result.access_token) {
      TokenManager.setTokens({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expiresIn: result.expires_in || 3600,
        tokenType: 'Bearer',
      });
    }
    
    return result;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(): Promise<TokenRefreshResponse> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const result = await this.request<any>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (result.access_token) {
      TokenManager.setTokens({
        accessToken: result.access_token,
        refreshToken: result.refresh_token || refreshToken,
        expiresIn: result.expires_in || 3600,
        tokenType: 'Bearer',
      });
    }

    return result;
  }

  async logout(): Promise<{ message: string }> {
    try {
      const result = await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
      return result;
    } finally {
      TokenManager.clearTokens();
    }
  }
}

const authApiClient = new AuthApiClient();

// Auth API service
export const authApi = {
  // Authentication - Use direct auth service
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    try {
      const result = await authApiClient.login(credentials);
      return { data: result, success: true };
    } catch (error) {
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    try {
      const result = await authApiClient.register(data);
      return { data: result, success: true };
    } catch (error) {
      throw error;
    }
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    try {
      const result = await authApiClient.logout();
      return { data: result, success: true };
    } catch (error) {
      throw error;
    }
  },

  // Token management - Use direct auth service
  refreshToken: async (): Promise<ApiResponse<TokenRefreshResponse>> => {
    try {
      const result = await authApiClient.refreshToken();
      return { data: result, success: true };
    } catch (error) {
      throw error;
    }
  },

  verifyToken: (token: string): Promise<ApiResponse<{ valid: boolean }>> =>
    apiClient.post("/auth/verify", { token }),

  // Password management - Use API Gateway
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