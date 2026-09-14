"use client";

import { configureApiAuth } from "@/lib/api/client";
import { loginCustomer, logoutSession, registerCustomer } from "@/lib/api/auth";
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
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
import { clearPendingSeatSelection } from "@/features/seat-holds/pending-seat-selection";
import { clearActiveSeatHold } from "@/features/seat-holds/active-seat-hold";
import { clearTicketBookingReferences } from "@/features/tickets/ticket-context";
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
  isEmailVerificationRequired: boolean;
  login: (request: LoginRequest) => Promise<string>;
  register: (request: RegisterRequest) => Promise<string>;
  markEmailVerified: () => void;
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
    setSession(persistSession(response.data, "unknown"));
    return response.message;
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await registerCustomer(request);
    setSession(persistSession(response.data, "required"));
    return response.message;
  }, []);

  const markEmailVerified = useCallback(() => {
    setSession((currentSession) => {
      if (!currentSession) return null;

      const verifiedSession: AuthSession = {
        ...currentSession,
        emailVerificationStatus: "verified",
      };
      writeAuthSession(verifiedSession);
      return verifiedSession;
    });
  }, []);

  const logout = useCallback(async () => {
    const currentSession = readAuthSession();

    try {
      if (currentSession?.refreshToken) {
        await logoutSession(currentSession.refreshToken);
      }
    } finally {
      clearActiveSeatHold();
      clearPendingSeatSelection();
      clearTicketBookingReferences();
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      isEmailVerificationRequired:
        session?.emailVerificationStatus === "required",
      login,
      register,
      markEmailVerified,
      logout,
    }),
    [isLoading, login, logout, markEmailVerified, register, session],
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
