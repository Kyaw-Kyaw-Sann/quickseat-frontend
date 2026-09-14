"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthFormError } from "@/features/auth/form-errors";
import { resendVerification } from "@/lib/api/auth";
import { useState } from "react";
import type { FormEvent } from "react";

type VerificationRequiredProps = {
  email: string;
  onTryAgain?: () => void;
};

export function VerificationRequired({
  email,
  onTryAgain,
}: VerificationRequiredProps) {
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await resendVerification({ email });
      setMessage(response.message);
    } catch (error) {
      setErrorMessage(getAuthFormError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="space-y-5 border-[#5c3f16] bg-[#1c170f]">
      <div className="space-y-2">
        <Badge tone="warning">VERIFICATION REQUIRED</Badge>
        <h2 className="text-lg font-semibold">Verify your email to reserve seats</h2>
        <p className="text-sm text-[var(--qs-text-muted)]">
          Open the verification link sent to your inbox, then return to QuickSeat.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleResend}>
        <label className="grid gap-2 text-sm font-medium" htmlFor="verification-email">
          Email address
          <Input disabled id="verification-email" value={email} />
        </label>
        {message ? <p className="text-sm text-[#82e6a7]" role="status">{message}</p> : null}
        {errorMessage ? <p className="text-sm text-[#ff9999]" role="alert">{errorMessage}</p> : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending…" : "Resend verification email"}
        </Button>
        {onTryAgain ? (
          <Button className="w-full" onClick={onTryAgain} variant="secondary">
            Try again
          </Button>
        ) : null}
      </form>
    </Card>
  );
}
