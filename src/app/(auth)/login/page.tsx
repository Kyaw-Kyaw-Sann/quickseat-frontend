"use client";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { useAuth } from "@/features/auth/auth-provider";
import { getAuthFormError } from "@/features/auth/form-errors";
import { withReturnTo } from "@/features/auth/return-path";
import { useReturnPath } from "@/features/auth/use-return-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startGoogleOAuth } from "@/lib/api/auth";
import type { FieldErrors } from "@/lib/api/types";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const returnTo = useReturnPath();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);

    try {
      await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      window.location.replace(returnTo);
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
      description="Sign in to continue your QuickSeat journey."
      footer={
        <>
          New to QuickSeat?{" "}
          <Link
            className="font-semibold text-[var(--qs-primary)]"
            href={withReturnTo("/register", returnTo)}
          >
            Create an account
          </Link>
        </>
      }
      title="Welcome back"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium" htmlFor="login-email">
          Email address
          <Input
            autoComplete="email"
            error={fieldErrors.email}
            id="login-email"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="login-password">
          Password
          <Input
            autoComplete="current-password"
            error={fieldErrors.password}
            id="login-password"
            name="password"
            required
            type="password"
          />
        </label>
        <div className="text-right">
          <Link className="text-sm text-[var(--qs-text-muted)] hover:text-[var(--qs-text)]" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
        {errorMessage ? (
          <p className="rounded-lg border border-[#6d2428] bg-[#351112] p-3 text-sm text-[#ff9999]" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <div className="flex items-center gap-3 text-xs text-[var(--qs-text-muted)]">
          <span className="h-px flex-1 bg-[var(--qs-border)]" />
          OR
          <span className="h-px flex-1 bg-[var(--qs-border)]" />
        </div>
        <Button className="w-full" onClick={startGoogleOAuth} variant="secondary">
          Continue with Google
        </Button>
      </form>
    </AuthFormShell>
  );
}
