import { refreshTokens } from "@/lib/api/auth";
import type { AuthResponse, AuthSession } from "@/features/auth/types";
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from "@/features/auth/storage";

let activeRefresh: Promise<AuthSession | null> | null = null;

export function createSession(response: AuthResponse): AuthSession {
  return {
    user: {
      userId: response.userId,
      name: response.name,
      email: response.email,
      role: response.role,
    },
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    tokenType: response.tokenType,
  };
}

export function persistSession(response: AuthResponse): AuthSession {
  const session = createSession(response);
  writeAuthSession(session);
  return session;
}

export function refreshStoredSession(): Promise<AuthSession | null> {
  if (activeRefresh) return activeRefresh;

  activeRefresh = performRefresh().finally(() => {
    activeRefresh = null;
  });

  return activeRefresh;
}

async function performRefresh(): Promise<AuthSession | null> {
  const currentSession = readAuthSession();
  if (!currentSession?.refreshToken) return null;

  try {
    const response = await refreshTokens(currentSession.refreshToken);
    const refreshedSession: AuthSession = {
      ...currentSession,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      tokenType: response.data.tokenType,
    };

    writeAuthSession(refreshedSession);
    return refreshedSession;
  } catch {
    clearAuthSession();
    return null;
  }
}
