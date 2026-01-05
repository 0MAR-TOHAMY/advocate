"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UserPreferences {
  language?: "ar" | "en";
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  autoArchive?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  avatarUrl?: string;
  coverUrl?: string;
  role?: string;
  permissions?: string[];
  firmId?: string;
  firmName?: string;
  firmNameAr?: string;
  createdAt?: string;
  lastLoginAt?: string;
  lastSignedIn?: string;
  isVerified?: boolean;
  googleId?: string;
  loginMethod?: string;
  primaryColor?: string;
  secondaryColor?: string;
  storageUsedBytes?: string;
  maxStorageBytes?: string;
  preferences?: UserPreferences;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

  // Check if current route is public
  const isPublicRoute = useCallback(() => {
    if (!pathname) return false;

    // Remove locale prefix (e.g., /ar or /en) to get the actual route
    const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, '') || '/';

    // Check if it's the home page
    if (pathWithoutLocale === '/') return true;

    // Check if the path starts with any public route
    return publicRoutes.some(route => pathWithoutLocale.startsWith(route));
  }, [pathname]);

  // Parse access token expiry time (15 minutes default)
  const getTokenExpiryTime = () => {
    const expiresIn = process.env.NEXT_PUBLIC_JWT_ACCESS_EXPIRES || "15m";
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  };

  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    console.log("Attempting to refresh access token...");

    refreshPromiseRef.current = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to refresh token");
        }

        console.log("Access token refreshed successfully");
        return true;
      } catch (error) {
        console.error("Token refresh failed:", error);
        if (!isPublicRoute()) {
          setUser(null);
          const lang = pathname?.split("/")[1] || "ar";
          router.push(`/${lang}/login`);
        }
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [pathname, router, isPublicRoute]);

  // Authenticated fetch with automatic token refresh
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const fetchOptions: RequestInit = {
      ...options,
      credentials: "include",
    };

    let response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      console.warn("401 Unauthorized detected in authenticatedFetch, attempting refresh...");
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log("Refresh successful, retrying request...");
        response = await fetch(url, fetchOptions);
      }
    }

    return response;
  }, [refreshAccessToken]);

  // Fetch user data
  const fetchUser = useCallback(async (force = false) => {
    console.log("fetchUser called, force:", force, "pathname:", pathname, "isPublicRoute:", isPublicRoute());

    // Skip fetching user on public routes unless forced (e.g., after login)
    if (!force && isPublicRoute()) {
      console.log("Skipping fetchUser - public route");
      setLoading(false);
      return;
    }

    console.log("Fetching user data from /api/auth/me");
    try {
      const res = await authenticatedFetch("/api/auth/me");

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      console.log("User data fetched successfully:", data.user);
      setUser(data.user);
      setError(null);
      return data.user;
    } catch (error: any) {
      console.error("Fetch user error:", error);
      setUser(null);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, isPublicRoute, pathname]);

  // Setup automatic token refresh
  const setupTokenRefresh = useCallback(() => {
    // Skip setup on public routes
    if (isPublicRoute()) {
      return;
    }

    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Refresh token 1 minute before expiry
    const expiryTime = getTokenExpiryTime();
    const refreshTime = expiryTime - 60 * 1000; // 1 minute before expiry

    refreshIntervalRef.current = setInterval(() => {
      refreshAccessToken();
    }, refreshTime);

    console.log(`Token refresh scheduled every ${refreshTime / 1000} seconds`);
  }, [refreshAccessToken, isPublicRoute]);

  // Initialize auth state
  useEffect(() => {
    console.log("Auth initialization useEffect triggered, pathname:", pathname);
    // Only fetch user if not on a public route
    if (!isPublicRoute()) {
      console.log("Not a public route, calling fetchUser");
      fetchUser();
    } else {
      console.log("Public route detected, skipping fetchUser");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Depend on pathname to trigger on route changes

  // Setup token refresh when user is authenticated
  useEffect(() => {
    if (user) {
      setupTokenRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, setupTokenRefresh]);

  // Login function
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Fetch user data after successful login (force = true to bypass public route check)
      return await fetchUser(true);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      const lang = pathname?.split("/")[1] || "ar";
      router.push(`/${lang}/login`);
    }
  }, [pathname, router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  // Update user data locally (optimistic update)
  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (prefs: UserPreferences) => {
    try {
      const res = await authenticatedFetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        throw new Error("Failed to update preferences");
      }

      // Update local state
      setUser((prev) => (prev ? { ...prev, preferences: prefs } : null));
    } catch (error: any) {
      throw error;
    }
  }, [authenticatedFetch]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    updateUser,
    updatePreferences,
    authenticatedFetch,
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
