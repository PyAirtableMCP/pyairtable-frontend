"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { CookieAuthClient, User } from "./cookie-auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status and fetch user data
  const checkAuth = useCallback(async () => {
    try {
      const authenticated = await CookieAuthClient.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const userData = await CookieAuthClient.getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await CookieAuthClient.login(email, password);
      setUser(result.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await CookieAuthClient.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh authentication - stabilized with useRef to prevent excessive re-creation
  const refreshAuth = useCallback(async () => {
    try {
      const success = await CookieAuthClient.refreshToken();
      if (success) {
        // Call checkAuth directly instead of depending on it in the callback
        try {
          const authenticated = await CookieAuthClient.isAuthenticated();
          setIsAuthenticated(authenticated);

          if (authenticated) {
            const userData = await CookieAuthClient.getCurrentUser();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (checkError) {
          console.error("Error checking auth:", checkError);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error refreshing auth:", error);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []); // Empty dependency array - no dependencies needed

  // Get access token securely from cookies
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth/token", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      console.error("Error fetching access token:", error);
      return null;
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-refresh token every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(() => {
      refreshAuth();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup function with additional safety check
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, refreshAuth]);

  // Listen for focus events to refresh auth when user returns
  useEffect(() => {
    const handleFocus = () => {
      // Check authentication status at focus time to avoid stale closure
      if (document.hasFocus()) {
        refreshAuth();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshAuth]); // Only depend on refreshAuth, which is now stable

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login in a client component
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      return null;
    }

    return <Component {...props} />;
  };
}