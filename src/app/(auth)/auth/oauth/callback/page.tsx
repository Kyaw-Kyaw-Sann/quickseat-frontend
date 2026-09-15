"use client";

import { Card } from "@/components/ui/card";
import { persistSession } from "@/features/auth/session";
import type { AuthResponse, Role } from "@/features/auth/types";
import { consumeGoogleOAuthReturnTo } from "@/lib/api/auth";
import { useEffect } from "react";

const roles: Role[] = ["CUSTOMER", "STAFF", "ADMIN"];

function decodeSession(encodedSession: string): AuthResponse | null {
  try {
    const padded = encodedSession.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      Math.ceil(encodedSession.length / 4) * 4,
      "=",
    );
    const bytes = Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object") return null;
    const session = value as Record<string, unknown>;
    return typeof session.userId === "number" &&
      typeof session.name === "string" &&
      typeof session.email === "string" &&
      typeof session.accessToken === "string" &&
      typeof session.refreshToken === "string" &&
      typeof session.tokenType === "string" &&
      typeof session.role === "string" && roles.includes(session.role as Role)
      ? session as AuthResponse
      : null;
  } catch {
    return null;
  }
}

export default function GoogleOAuthCallbackPage() {
  useEffect(() => {
    const session = decodeSession(new URLSearchParams(window.location.hash.slice(1)).get("session") ?? "");
    window.history.replaceState(null, "", window.location.pathname);

    if (!session) {
      window.location.replace("/login?oauthError=callback_invalid");
      return;
    }

    persistSession(session, "verified");
    const returnTo = consumeGoogleOAuthReturnTo();
    window.location.replace(returnTo);
  }, []);

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-md p-6 text-center">
        <h1 className="text-xl font-semibold">Completing Google sign-in</h1>
        <p className="mt-3 text-sm text-[var(--qs-text-muted)]" role="status">
          Your QuickSeat session is being prepared…
        </p>
      </Card>
    </main>
  );
}
