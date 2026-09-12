"use client";

import { configureApiAuth } from "@/lib/api/client";
import { loginCustomer, logoutSession, registerCustomer } from "@/lib/api/auth";
import {
  clearAuthSession,
  readAuthSession,
} from "@/features/auth/storage";
import {
  persistSession,
  refreshStoredSession,
} from "@/features/auth/session";
import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "@/features/auth/types";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<string>;
  register: (request: RegisterRequest) => Promise<string>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      setSession(readAuthSession());
      setIsLoading(false);
    }, 0);

    configureApiAuth({
      getAccessToken: () => readAuthSession()?.accessToken ?? null,
      refreshAccessToken: async () => {
        const refreshedSession = await refreshStoredSession();
        setSession(refreshedSession);
        return refreshedSession?.accessToken ?? null;
      },
      onUnauthorized: () => {
        clearSession();
        const returnTo = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      },
    });

    return () => {
      window.clearTimeout(initialization);
      configureApiAuth(null);
    };
  }, [clearSession, router]);

  const login = useCallback(async (request: LoginRequest) => {
    const response = await loginCustomer(request);
    setSession(persistSession(response.data));
    return response.message;
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await registerCustomer(request);
    setSession(persistSession(response.data));
    return response.message;
  }, []);

  const logout = useCallback(async () => {
    const currentSession = readAuthSession();

    try {
      if (currentSession?.refreshToken) {
        await logoutSession(currentSession.refreshToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      register,
      logout,
    }),
    [isLoading, login, logout, register, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
