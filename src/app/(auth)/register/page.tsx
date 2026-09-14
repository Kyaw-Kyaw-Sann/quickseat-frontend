"use client";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { useAuth } from "@/features/auth/auth-provider";
import { getAuthFormError } from "@/features/auth/form-errors";
import { withReturnTo } from "@/features/auth/return-path";
import { useReturnPath } from "@/features/auth/use-return-path";
import { VerificationRequired } from "@/features/auth/verification-required";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/lib/api/types";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

export default function RegisterPage() {
  const { register } = useAuth();
  const returnTo = useReturnPath();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");

    try {
      await register({
        name: String(form.get("name") ?? ""),
        email,
        password: String(form.get("password") ?? ""),
        phone: String(form.get("phone") ?? ""),
      });
      setRegisteredEmail(email);
      setVerificationOpen(true);
    } catch (error) {
      const formError = getAuthFormError(error);
      setErrorMessage(formError.message);
      setFieldErrors(formError.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AuthFormShell
        description="Create your account now; verification is required before reserving seats."
        footer={
          <>
            Already have an account?{" "}
            <Link
              className="font-semibold text-[var(--qs-primary)]"
              href={withReturnTo("/login", returnTo)}
            >
              Sign in
            </Link>
          </>
        }
        title="Join QuickSeat"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium" htmlFor="register-name">
            Full name
            <Input autoComplete="name" error={fieldErrors.name} id="register-name" name="name" required />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="register-email">
            Email address
            <Input autoComplete="email" error={fieldErrors.email} id="register-email" name="email" required type="email" />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="register-phone">
            Phone number
            <Input autoComplete="tel" error={fieldErrors.phone} id="register-phone" name="phone" required type="tel" />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="register-password">
            Password
            <Input autoComplete="new-password" error={fieldErrors.password} id="register-password" minLength={8} name="password" required type="password" />
          </label>
          {errorMessage ? (
            <p className="rounded-lg border border-[#6d2428] bg-[#351112] p-3 text-sm text-[#ff9999]" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthFormShell>

      <Dialog onOpenChange={setVerificationOpen} open={verificationOpen} title="Account created">
        <VerificationRequired
          email={registeredEmail}
          onTryAgain={() => window.location.replace(returnTo)}
        />
      </Dialog>
    </>
  );
}
