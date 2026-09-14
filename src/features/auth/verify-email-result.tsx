"use client";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { useAuth } from "@/features/auth/auth-provider";
import { getAuthFormError } from "@/features/auth/form-errors";
import { getPendingSeatSelectionReturnTo } from "@/features/seat-holds/pending-seat-selection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { verifyEmail } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type VerificationState = "loading" | "success" | "error";

export function VerifyEmailResult({ token }: { token?: string }) {
  const router = useRouter();
  const { markEmailVerified } = useAuth();
  const verificationStarted = useRef(false);
  const [state, setState] = useState<VerificationState>(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token
      ? "Verifying your email address…"
      : "The verification link is missing its token.",
  );

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    if (!token) return;

    verifyEmail(token)
      .then((response) => {
        markEmailVerified();
        setMessage(response.message);
        setState("success");
      })
      .catch((error: unknown) => {
        setMessage(getAuthFormError(error).message);
        setState("error");
      });
  }, [markEmailVerified, token]);

  return (
    <AuthFormShell description="Email verification result" title="Verify your email">
      {state === "loading" ? (
        <div className="space-y-3" role="status">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <span className="sr-only">{message}</span>
        </div>
      ) : null}

      {state === "success" ? (
        <div className="space-y-5 text-center">
          <Badge tone="success">VERIFIED</Badge>
          <p className="text-sm text-[var(--qs-text-muted)]" role="status">{message}</p>
          <Button
            className="w-full"
            onClick={() =>
              window.location.assign(
                getPendingSeatSelectionReturnTo() ?? "/",
              )
            }
          >
            Continue to QuickSeat
          </Button>
        </div>
      ) : null}

      {state === "error" ? (
        <ErrorState
          action={<Button onClick={() => router.push("/login")} variant="secondary">Back to sign in</Button>}
          description={message}
          title="Verification unsuccessful"
        />
      ) : null}
    </AuthFormShell>
  );
}
