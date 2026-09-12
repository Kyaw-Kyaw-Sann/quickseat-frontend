"use client";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { getAuthFormError } from "@/features/auth/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/api/auth";
import type { FieldErrors } from "@/lib/api/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");

    try {
      await requestPasswordReset({ email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      const formError = getAuthFormError(error);
      setErrorMessage(formError.message);
      setFieldErrors(formError.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFormShell
      description="Enter your account email and we will send a six-digit reset code."
      footer={<Link className="font-semibold text-[var(--qs-primary)]" href="/login">Back to sign in</Link>}
      title="Reset your password"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium" htmlFor="forgot-email">
          Email address
          <Input autoComplete="email" error={fieldErrors.email} id="forgot-email" name="email" required type="email" />
        </label>
        {errorMessage ? <p className="rounded-lg border border-[#6d2428] bg-[#351112] p-3 text-sm text-[#ff9999]" role="alert">{errorMessage}</p> : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending code…" : "Send reset code"}
        </Button>
      </form>
    </AuthFormShell>
  );
}
