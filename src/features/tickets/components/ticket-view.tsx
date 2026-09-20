"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAuth } from "@/features/auth/auth-provider";
import { VerificationRequired } from "@/features/auth/verification-required";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import {
  readTicketBookingReference,
  rememberTicketBookingReference,
} from "@/features/tickets/ticket-context";
import type { TicketDetail } from "@/features/tickets/types";
import { isApiRequestError } from "@/lib/api/errors";
import {
  getTicketByBookingReference,
  getTicketPdf,
  getTicketQr,
} from "@/lib/api/tickets";
import { formatMMK } from "@/lib/formatters/currency";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type TicketViewProps = {
  ticketToken: string;
};

type TicketViewState =
  | "loading"
  | "detail"
  | "verification"
  | "missing-context"
  | "not-found"
  | "error";

type DownloadKind = "qr" | "pdf";

export function TicketView(props: TicketViewProps) {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <TicketViewContent {...props} />
    </AuthGuard>
  );
}

function TicketViewContent({ ticketToken }: TicketViewProps) {
  const router = useRouter();
  const { markEmailVerified, user } = useAuth();
  const downloadLock = useRef(false);
  const [viewState, setViewState] = useState<TicketViewState>("loading");
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState("");
  const [qrReloadKey, setQrReloadKey] = useState(0);
  const [activeDownload, setActiveDownload] = useState<DownloadKind | null>(
    null,
  );
  const [downloadError, setDownloadError] = useState("");

  const loadTicket = useCallback(async () => {
    const bookingReference = readTicketBookingReference(ticketToken);

    if (!bookingReference) {
      setViewState("missing-context");
      return;
    }

    try {
      const response = await getTicketByBookingReference(bookingReference);
      const authoritativeTicket = response.data;

      if (authoritativeTicket.ticketToken !== ticketToken) {
        setViewState("not-found");
        return;
      }

      markEmailVerified();
      rememberTicketBookingReference(
        authoritativeTicket.ticketToken,
        authoritativeTicket.bookingReference,
      );
      setTicket(authoritativeTicket);
      setErrorMessage("");
      setIsNetworkError(false);
      setViewState("detail");
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setViewState("verification");
        return;
      }

      if (isApiRequestError(error) && error.status === 404) {
        setViewState("not-found");
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "The ticket could not be loaded.",
      );
      setIsNetworkError(isApiRequestError(error) && error.isNetworkError);
      setViewState("error");
    }
  }, [markEmailVerified, ticketToken]);

  useEffect(() => {
    const initialize = window.setTimeout(() => void loadTicket(), 0);
    return () => window.clearTimeout(initialize);
  }, [loadTicket]);

  useEffect(() => {
    if (viewState !== "detail" || ticket?.status !== "ACTIVE") return;

    let disposed = false;
    let objectUrl: string | null = null;
    const initialize = window.setTimeout(() => {
      setQrUrl(null);
      setQrError("");

      void getTicketQr(ticketToken)
        .then((response) => {
          if (!isContentType(response.contentType, "image/png")) {
            throw new Error("QuickSeat returned an invalid QR image.");
          }

          objectUrl = URL.createObjectURL(response.blob);
          if (disposed) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
            return;
          }

          setQrUrl(objectUrl);
        })
        .catch((error: unknown) => {
          if (disposed) return;

          if (isVerificationRequiredError(error)) {
            setViewState("verification");
            return;
          }

          setQrError(
            error instanceof Error
              ? error.message
              : "The ticket QR image could not be loaded.",
          );
        });
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(initialize);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [qrReloadKey, ticket?.status, ticketToken, viewState]);

  async function handleDownload(kind: DownloadKind) {
    if (
      downloadLock.current ||
      activeDownload ||
      ticket?.status !== "ACTIVE"
    ) {
      return;
    }

    downloadLock.current = true;
    setActiveDownload(kind);
    setDownloadError("");

    try {
      const response =
        kind === "qr"
          ? await getTicketQr(ticketToken, true)
          : await getTicketPdf(ticketToken);
      const expectedType = kind === "qr" ? "image/png" : "application/pdf";

      if (!isContentType(response.contentType, expectedType)) {
        throw new Error(
          kind === "qr"
            ? "QuickSeat returned an invalid QR download."
            : "QuickSeat returned an invalid ticket PDF.",
        );
      }

      triggerBrowserDownload(
        response.blob,
        response.filename ?? getFallbackFilename(kind, ticket.bookingReference),
      );
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setViewState("verification");
      } else {
        setDownloadError(
          error instanceof Error
            ? error.message
            : "The ticket download could not be completed.",
        );
      }
    } finally {
      downloadLock.current = false;
      setActiveDownload(null);
    }
  }

  return (
    <main>
      <PageContainer className="py-10 sm:py-14">
        {viewState === "loading" ? <TicketSkeleton /> : null}

        {viewState === "verification" && user ? (
          <div className="mx-auto max-w-xl">
            <VerificationRequired
              email={user.email}
              onTryAgain={() => {
                setViewState("loading");
                void loadTicket();
              }}
            />
          </div>
        ) : null}

        {viewState === "missing-context" ? (
          <EmptyState
            action={<Button onClick={() => router.push("/movies")}>Browse movies</Button>}
            description="Open this ticket from its booking confirmation so QuickSeat can retrieve the backend ticket details."
            title="Ticket booking reference unavailable"
          />
        ) : null}

        {viewState === "not-found" ? (
          <ErrorState
            action={<Button onClick={() => router.push("/movies")}>Browse movies</Button>}
            description="This ticket does not exist or is not available to this account."
            title="Ticket not found"
          />
        ) : null}

        {viewState === "error" ? (
          <ErrorState
            action={
              <Button
                onClick={() => {
                  setViewState("loading");
                  void loadTicket();
                }}
              >
                Try again
              </Button>
            }
            description={errorMessage}
            title={isNetworkError ? "Connection problem" : "Unable to load ticket"}
          />
        ) : null}

        {viewState === "detail" && ticket ? (
          <TicketLifecycle
            activeDownload={activeDownload}
            downloadError={downloadError}
            onDownload={handleDownload}
            onReloadQr={() => setQrReloadKey((current) => current + 1)}
            qrError={qrError}
            qrUrl={qrUrl}
            ticket={ticket}
          />
        ) : null}
      </PageContainer>
    </main>
  );
}

function TicketLifecycle({
  activeDownload,
  downloadError,
  onDownload,
  onReloadQr,
  qrError,
  qrUrl,
  ticket,
}: {
  activeDownload: DownloadKind | null;
  downloadError: string;
  onDownload: (kind: DownloadKind) => Promise<void>;
  onReloadQr: () => void;
  qrError: string;
  qrUrl: string | null;
  ticket: TicketDetail;
}) {
  switch (ticket.status) {
    case "ACTIVE":
      return (
        <ActiveTicket
          activeDownload={activeDownload}
          downloadError={downloadError}
          onDownload={onDownload}
          onReloadQr={onReloadQr}
          qrError={qrError}
          qrUrl={qrUrl}
          ticket={ticket}
        />
      );
    case "USED":
      return (
        <InactiveTicket
          description="This ticket has already been validated for cinema entry. Its QR and download actions are no longer available."
          ticket={ticket}
          title="Ticket already used"
        />
      );
    case "CANCELLED":
      return (
        <InactiveTicket
          description="This ticket was cancelled and is no longer valid for cinema entry."
          ticket={ticket}
          title="Ticket cancelled"
        />
      );
    default:
      return (
        <InactiveTicket
          description={`QuickSeat returned the ticket status “${ticket.status}”. QR and download actions are unavailable for this state.`}
          ticket={ticket}
          title="Ticket status unavailable"
        />
      );
  }
}

function ActiveTicket({
  activeDownload,
  downloadError,
  onDownload,
  onReloadQr,
  qrError,
  qrUrl,
  ticket,
}: {
  activeDownload: DownloadKind | null;
  downloadError: string;
  onDownload: (kind: DownloadKind) => Promise<void>;
  onReloadQr: () => void;
  qrError: string;
  qrUrl: string | null;
  ticket: TicketDetail;
}) {
  return (
    <Card className="mx-auto max-w-5xl overflow-hidden p-0 shadow-none">
      <div className="border-b border-[var(--qs-border)] px-6 py-6 text-center sm:px-9">
        <StatusBadge status={ticket.status} />
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Your cinema ticket</h1>
        <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
          Present this QR code at the cinema entrance.
        </p>
      </div>

      <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section aria-label="Ticket QR code" className="mx-auto w-full max-w-[22rem]">
          <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-[var(--qs-border)] bg-white p-5">
            {qrUrl ? (
              <Image
                alt={`Admission QR code for booking ${ticket.bookingReference}`}
                className="h-full w-full object-contain"
                height={640}
                src={qrUrl}
                unoptimized
                width={640}
              />
            ) : qrError ? (
              <div className="px-4 text-center">
                <p className="text-sm text-[#8f1f2d]" role="alert">{qrError}</p>
                <Button className="mt-4" onClick={onReloadQr} variant="secondary">
                  Reload QR
                </Button>
              </div>
            ) : (
              <div className="grid w-full gap-3" role="status">
                <Skeleton className="aspect-square w-full" />
                <span className="sr-only">Loading admission QR code…</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-[var(--qs-text-muted)]">
            Single-use ticket · keep the QR clear and visible
          </p>
        </section>

        <section aria-labelledby="ticket-booking-reference">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--qs-primary)]">
            Booking reference
          </p>
          <h2
            className="mt-2 break-all font-mono text-2xl font-bold sm:text-3xl"
            id="ticket-booking-reference"
          >
            {ticket.bookingReference}
          </h2>

          <dl className="mt-7 grid gap-5 border-y border-[var(--qs-border)] py-6 sm:grid-cols-2">
            <Detail label="Movie" value={ticket.movieTitle} />
            <Detail label="Cinema" value={ticket.cinemaName} />
            <Detail label="Screen" value={ticket.screenName} />
            <Detail label="Total amount" value={formatMMK(ticket.totalAmount)} />
          </dl>

          <SeatUnits seats={ticket.seats} />

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button
              aria-busy={activeDownload === "qr"}
              disabled={activeDownload !== null}
              onClick={() => void onDownload("qr")}
              variant="secondary"
            >
              {activeDownload === "qr" ? "Downloading QR…" : "Download QR"}
            </Button>
            <Button
              aria-busy={activeDownload === "pdf"}
              disabled={activeDownload !== null}
              onClick={() => void onDownload("pdf")}
            >
              {activeDownload === "pdf" ? "Downloading PDF…" : "Download ticket PDF"}
            </Button>
          </div>
          {downloadError ? (
            <p className="mt-4 text-sm text-[#ff9999]" role="alert">
              {downloadError}
            </p>
          ) : null}
        </section>
      </div>
    </Card>
  );
}

function InactiveTicket({
  description,
  ticket,
  title,
}: {
  description: string;
  ticket: TicketDetail;
  title: string;
}) {
  const router = useRouter();

  return (
    <Card className="mx-auto max-w-2xl p-6 text-center sm:p-9">
      <StatusBadge status={ticket.status} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--qs-text-muted)]">
        {description}
      </p>
      <dl className="mt-7 grid gap-4 border-y border-[var(--qs-border)] py-5 text-left sm:grid-cols-2">
        <Detail label="Booking reference" value={ticket.bookingReference} />
        <Detail label="Movie" value={ticket.movieTitle} />
        <Detail label="Cinema" value={ticket.cinemaName} />
        <Detail label="Amount" value={formatMMK(ticket.totalAmount)} />
      </dl>
      <Button className="mt-7" onClick={() => router.push("/movies")}>
        Browse more movies
      </Button>
    </Card>
  );
}

function SeatUnits({ seats }: { seats: unknown[] }) {
  return (
    <section aria-labelledby="ticket-seat-units" className="mt-7">
      <h3 className="font-semibold" id="ticket-seat-units">Seats</h3>
      {seats.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {seats.map((seat, index) => (
            <li
              className="rounded-md border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-3 py-2 text-sm"
              key={`${getSeatLabel(seat, index)}-${index}`}
            >
              {getSeatLabel(seat, index)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
          Seat item details were not included in this ticket response.
        </p>
      )}
    </section>
  );
}

function getSeatLabel(seat: unknown, index: number): string {
  return typeof seat === "string" || typeof seat === "number"
    ? String(seat)
    : `Seat unit ${index + 1}`;
}

function TicketSkeleton() {
  return (
    <Card className="mx-auto grid max-w-5xl gap-8 p-6 sm:p-9 lg:grid-cols-[22rem_minmax(0,1fr)]" role="status">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-5">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
      <span className="sr-only">Loading ticket…</span>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{label}</dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}

function isContentType(actual: string, expected: string): boolean {
  return actual.toLowerCase().split(";", 1)[0].trim() === expected;
}

function getFallbackFilename(
  kind: DownloadKind,
  bookingReference: string,
): string {
  return `quickseat-ticket-${bookingReference}.${kind === "qr" ? "png" : "pdf"}`;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
