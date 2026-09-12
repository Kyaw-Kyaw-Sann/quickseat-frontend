import type { AuthSession, AuthUser, Role } from "@/features/auth/types";

const AUTH_SESSION_KEY = "quickseat.auth.session";
const roles: Role[] = ["CUSTOMER", "STAFF", "ADMIN"];

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const serializedSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!serializedSession) return null;

  try {
    const session: unknown = JSON.parse(serializedSession);
    return isAuthSession(session) ? session : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value) || !isAuthUser(value.user)) return false;

  return (
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    typeof value.tokenType === "string"
  );
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false;

  return (
    typeof value.userId === "number" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.role === "string" &&
    roles.includes(value.role as Role)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
