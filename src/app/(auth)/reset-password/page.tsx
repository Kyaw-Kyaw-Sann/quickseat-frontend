"use client";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { getAuthFormError } from "@/features/auth/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword, verifyResetOtp } from "@/lib/api/auth";
import type { FieldErrors } from "@/lib/api/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type ResetStep = "verify" | "password" | "complete";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("verify");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      const initialEmail = new URLSearchParams(window.location.search).get("email");
      if (initialEmail) setEmail(initialEmail);
    }, 0);

    return () => window.clearTimeout(initialization);
  }, []);

  async function handleOtpVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "");
    const submittedOtp = String(form.get("otp") ?? "");

    try {
      await verifyResetOtp({ email: submittedEmail, otp: submittedOtp });
      setEmail(submittedEmail);
      setOtp(submittedOtp);
      setStep("password");
    } catch (error) {
      const formError = getAuthFormError(error);
      setErrorMessage(formError.message);
      setFieldErrors(formError.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      setIsSubmitting(false);
      return;
    }

    try {
      await resetPassword({ email, otp, newPassword });
      setStep("complete");
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
      description={step === "verify" ? "Verify the six-digit code sent to your email." : "Choose a new password for your account."}
      footer={<Link className="font-semibold text-[var(--qs-primary)]" href="/login">Back to sign in</Link>}
      title={step === "complete" ? "Password updated" : "Reset your password"}
    >
      {step === "verify" ? (
        <form className="space-y-4" onSubmit={handleOtpVerification}>
          <label className="grid gap-2 text-sm font-medium" htmlFor="reset-email">
            Email address
            <Input autoComplete="email" error={fieldErrors.email} id="reset-email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="reset-otp">
            Six-digit code
            <Input autoComplete="one-time-code" error={fieldErrors.otp} id="reset-otp" inputMode="numeric" maxLength={6} name="otp" pattern="[0-9]{6}" required />
          </label>
          {errorMessage ? <p className="rounded-lg border border-[#6d2428] bg-[#351112] p-3 text-sm text-[#ff9999]" role="alert">{errorMessage}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Verifying…" : "Verify code"}
          </Button>
        </form>
      ) : null}

      {step === "password" ? (
        <form className="space-y-4" onSubmit={handlePasswordReset}>
          <label className="grid gap-2 text-sm font-medium" htmlFor="new-password">
            New password
            <Input autoComplete="new-password" error={fieldErrors.newPassword} id="new-password" minLength={8} name="newPassword" required type="password" />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="confirm-password">
            Confirm new password
            <Input autoComplete="new-password" error={fieldErrors.confirmPassword} id="confirm-password" minLength={8} name="confirmPassword" required type="password" />
          </label>
          {errorMessage ? <p className="rounded-lg border border-[#6d2428] bg-[#351112] p-3 text-sm text-[#ff9999]" role="alert">{errorMessage}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Updating password…" : "Update password"}
          </Button>
        </form>
      ) : null}

      {step === "complete" ? (
        <div className="space-y-5 text-center">
          <p className="text-sm text-[#82e6a7]" role="status">Your password was reset successfully.</p>
          <Button className="w-full" onClick={() => router.push("/login")}>Sign in</Button>
        </div>
      ) : null}
    </AuthFormShell>
  );
}
