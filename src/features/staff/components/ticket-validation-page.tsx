"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { TicketQrScanner } from "@/features/staff/components/ticket-qr-scanner";
import { getStaffError, type StaffRequestError } from "@/features/staff/staff-error";
import {
  isUrlLikeTicketInput,
  parseStaffTicketQrPayload,
} from "@/features/staff/ticket-qr-payload";
import type {
  StaffTicketPreview,
  StaffTicketValidationResult,
} from "@/features/staff/types";
import { getStaffTicket, validateStaffTicket } from "@/lib/api/staff";

const emptyError: StaffRequestError = {
  message: "",
  isNetworkError: false,
  status: 0,
  fieldErrors: {},
};

export function TicketValidationPage() {
  const previewLock = useRef(false);
  const validationLock = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ticketToken, setTicketToken] = useState("");
  const [preview, setPreview] = useState<StaffTicketPreview | null>(null);
  const [result, setResult] = useState<StaffTicketValidationResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewError, setPreviewError] = useState<StaffRequestError>(emptyError);
  const [validationError, setValidationError] = useState<StaffRequestError>(emptyError);
  const [inputError, setInputError] = useState("");

  const normalizedToken = ticketToken.trim();

  function handleTokenChange(value: string) {
    setTicketToken(value);
    setPreview(null);
    setResult(null);
    setPreviewError(emptyError);
    setValidationError(emptyError);
    setInputError("");
    setConfirmOpen(false);
  }

  async function previewTicketToken(token: string) {
    const normalizedPreviewToken = token.trim();
    if (!normalizedPreviewToken || previewLock.current || validationLock.current) return;

    previewLock.current = true;
    setPreviewing(true);
    setPreview(null);
    setResult(null);
    setPreviewError(emptyError);
    setValidationError(emptyError);
    setInputError("");

    try {
      const response = await getStaffTicket(normalizedPreviewToken);
      setPreview(response.data);
    } catch (failure) {
      setPreviewError(getStaffError(failure));
    } finally {
      previewLock.current = false;
      setPreviewing(false);
    }
  }

  function previewManualInput() {
    if (!normalizedToken) return;

    if (isUrlLikeTicketInput(normalizedToken)) {
      const parsedToken = parseStaffTicketQrPayload(normalizedToken);
      if (!parsedToken) {
        setPreview(null);
        setResult(null);
        setPreviewError(emptyError);
        setInputError("Unsupported QuickSeat QR code");
        return;
      }

      setTicketToken(parsedToken);
      void previewTicketToken(parsedToken);
      return;
    }

    void previewTicketToken(normalizedToken);
  }

  function handleScannedToken(token: string) {
    if (previewLock.current || validationLock.current || previewing || validating) return;
    setTicketToken(token);
    setPreview(null);
    setResult(null);
    setInputError("");
    void previewTicketToken(token);
  }

  async function confirmValidation() {
    if (!preview || validationLock.current || previewLock.current) return;

    validationLock.current = true;
    setValidating(true);
    setValidationError(emptyError);

    try {
      const response = await validateStaffTicket({ ticketToken: preview.ticketToken });
      setResult(response.data);
      setPreview({
        ticketToken: response.data.ticketToken || preview.ticketToken,
        ticketStatus: response.data.ticketStatus,
        bookingStatus: response.data.bookingStatus,
      });
      setConfirmOpen(false);
    } catch (failure) {
      setValidationError(getStaffError(failure));
      setConfirmOpen(false);
    } finally {
      validationLock.current = false;
      setValidating(false);
    }
  }

  function resetForNextTicket() {
    setTicketToken("");
    setPreview(null);
    setResult(null);
    setPreviewError(emptyError);
    setValidationError(emptyError);
    setInputError("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--qs-border)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#91d7e8]">
          Assigned cinema operation
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Ticket validation
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--qs-text-muted)] sm:text-base">
          Enter or scan a ticket token, review the backend preview, then explicitly confirm validation.
        </p>
      </header>

      <TicketQrScanner
        busy={previewing || validating}
        onToken={handleScannedToken}
      />

      <Card className="max-w-3xl shadow-none">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            previewManualInput();
          }}
        >
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="staff-ticket-token">
            Ticket token
            <Input
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              disabled={previewing || validating}
              error={inputError || previewError.fieldErrors.ticketToken}
              id="staff-ticket-token"
              name="ticketToken"
              onChange={(event) => handleTokenChange(event.target.value)}
              placeholder="Scan or enter ticket token"
              ref={inputRef}
              spellCheck={false}
              value={ticketToken}
            />
          </label>
          <p className="text-xs leading-5 text-[var(--qs-text-muted)]">
            USB QR scanners work as keyboard input. Scanning or pressing Enter previews the ticket only; it never validates automatically.
          </p>
          <Button className="w-full sm:w-auto" disabled={!normalizedToken || previewing || validating} type="submit">
            {previewing ? "Checking ticket…" : "Preview ticket"}
          </Button>
        </form>
      </Card>

      {previewError.message ? <RequestError error={previewError} context="preview" /> : null}
      {validationError.message ? <RequestError error={validationError} context="validation" /> : null}

      {preview ? (
        <Card className="max-w-3xl shadow-none" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">
                Backend ticket preview
              </p>
              <h2 className="mt-2 text-xl font-semibold">Review lifecycle state</h2>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--qs-text-muted)]">Previewed</span>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <LifecycleDetail label="Ticket status" status={preview.ticketStatus} />
            <LifecycleDetail label="Booking status" status={preview.bookingStatus} />
          </dl>

          <p className="mt-6 border-l-2 border-[#a97b2d] bg-[#211c13] px-4 py-3 text-sm leading-6 text-[#e4c47d]">
            The backend makes the final validity decision and enforces the staff member&apos;s assigned cinema.
          </p>

          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <Button
              className="w-full sm:w-auto"
              disabled={previewing || validating || Boolean(result)}
              onClick={() => setConfirmOpen(true)}
            >
              Validate ticket
            </Button>
            <Button className="w-full sm:w-auto" disabled={previewing || validating} onClick={resetForNextTicket} variant="secondary">
              Check another ticket
            </Button>
          </div>
        </Card>
      ) : null}

      {result ? (
        <Card className="max-w-3xl border-l-2 border-l-[#4c9b6a] shadow-none" aria-live="assertive" role="status">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#78d89b]">{result.result || "Result received"}</p>
          <h2 className="mt-3 text-xl font-semibold">Ticket validated by the backend</h2>
          <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
            The returned lifecycle states are shown below. No frontend status was inferred.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <LifecycleDetail label="Ticket status" status={result.ticketStatus} />
            <LifecycleDetail label="Booking status" status={result.bookingStatus} />
          </dl>
          <Button className="mt-6 w-full sm:w-auto" onClick={resetForNextTicket} variant="secondary">
            Validate another ticket
          </Button>
        </Card>
      ) : null}

      <Dialog
        onOpenChange={(open) => !validating && setConfirmOpen(open)}
        open={confirmOpen}
        title="Validate this ticket?"
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-[var(--qs-text-muted)]">
            QuickSeat will ask the backend to validate this ticket for your assigned cinema. A successful single-use validation changes the ticket and booking lifecycle according to the backend response.
          </p>
          {preview ? (
            <dl className="grid gap-3 border-y border-[var(--qs-border)] py-4 sm:grid-cols-2">
              <LifecycleDetail label="Current ticket status" status={preview.ticketStatus} />
              <LifecycleDetail label="Current booking status" status={preview.bookingStatus} />
            </dl>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button disabled={validating} onClick={() => setConfirmOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button disabled={validating} onClick={() => void confirmValidation()}>
              {validating ? "Validating…" : "Confirm validation"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function LifecycleDetail({ label, status }: { label: string; status?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">
        {label}
      </dt>
      <dd className="mt-2"><StatusBadge status={status} /></dd>
    </div>
  );
}

function RequestError({
  error,
  context,
}: {
  error: StaffRequestError;
  context: "preview" | "validation";
}) {
  const title = error.isNetworkError
    ? "Unable to reach QuickSeat"
    : error.status === 404
      ? "Ticket not found"
      : error.status === 409
        ? "Ticket validation conflict"
        : context === "preview"
          ? "Unable to preview ticket"
          : "Ticket was not validated";

  return (
    <Card className="max-w-3xl border-l-2 border-l-[#a7444b] shadow-none" role="alert">
      <p className="font-semibold text-[#ff9999]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--qs-text-muted)]">{error.message}</p>
    </Card>
  );
}
