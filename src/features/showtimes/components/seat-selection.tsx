"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth-provider";
import { isCustomer } from "@/features/auth/roles";
import { withReturnTo } from "@/features/auth/return-path";
import { VerificationRequired } from "@/features/auth/verification-required";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import {
  writeActiveSeatHold,
} from "@/features/seat-holds/active-seat-hold";
import {
  clearPendingSeatSelection,
  readPendingSeatSelection,
  writePendingSeatSelection,
} from "@/features/seat-holds/pending-seat-selection";
import type {
  SeatInventoryStatus,
  ShowtimeSeat,
  ShowtimeSeatMap,
} from "@/features/showtimes/types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";
import { isApiRequestError } from "@/lib/api/errors";
import { createSeatHold } from "@/lib/api/seat-holds";
import { getShowtimeSeats } from "@/lib/api/showtimes";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";

type SeatSelectionProps = {
  seatMap: ShowtimeSeatMap;
};

type SeatRow = {
  rowName: string;
  seats: ShowtimeSeat[];
};

const statusStyles: Record<SeatInventoryStatus, string> = {
  AVAILABLE:
    "border-[#595963] bg-[#17171c] text-[var(--qs-text)] hover:border-[var(--qs-primary)] hover:bg-[#25171b]",
  HELD: "cursor-not-allowed border-[#b87916] bg-[#3a2a12] text-[#ffd28a] opacity-80",
  BOOKED:
    "cursor-not-allowed border-[#45454d] bg-[#303037] text-[#92929c] opacity-70",
  UNAVAILABLE:
    "cursor-not-allowed border-[#34343b] bg-[#1f1f24] text-[#6f6f78] opacity-45 line-through",
};

const statusLabels: Record<SeatInventoryStatus, string> = {
  AVAILABLE: "available",
  HELD: "held",
  BOOKED: "booked",
  UNAVAILABLE: "unavailable",
};

export function SeatSelection({ seatMap }: SeatSelectionProps) {
  const router = useRouter();
  const {
    isEmailVerificationRequired,
    isLoading: isAuthLoading,
    markEmailVerified,
    user,
  } = useAuth();
  const submissionLock = useRef(false);
  const [inventory, setInventory] = useState(seatMap);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [isCreatingHold, setIsCreatingHold] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "warning">(
    "success",
  );
  const [roleError, setRoleError] = useState("");

  const rows = useMemo(
    () => groupSeatsInBackendOrder(inventory.seats),
    [inventory.seats],
  );
  const selectedSeats = useMemo(
    () =>
      inventory.seats.filter((seat) =>
        selectedSeatIds.includes(seat.showtimeSeatId),
      ),
    [inventory.seats, selectedSeatIds],
  );
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const pendingSelection = readPendingSeatSelection();
      if (pendingSelection?.showtimeId !== seatMap.showtimeId) return;

      const availableSeatIds = new Set(
        seatMap.seats
          .filter((seat) => seat.status === "AVAILABLE")
          .map((seat) => seat.showtimeSeatId),
      );
      const restoredSeatIds = pendingSelection.showtimeSeatIds.filter((id) =>
        availableSeatIds.has(id),
      );
      const unavailableCount =
        pendingSelection.showtimeSeatIds.length - restoredSeatIds.length;

      setSelectedSeatIds(restoredSeatIds);
      setNotice(
        unavailableCount > 0
          ? `${unavailableCount} previously selected ${unavailableCount === 1 ? "seat is" : "seats are"} no longer available and ${unavailableCount === 1 ? "was" : "were"} removed.`
          : "Your selected seats were restored after sign-in.",
      );
      setNoticeTone(unavailableCount > 0 ? "warning" : "success");

      if (restoredSeatIds.length === 0) {
        clearPendingSeatSelection();
      } else {
        writePendingSeatSelection({
          ...pendingSelection,
          showtimeSeatIds: restoredSeatIds,
        });
      }
    }, 0);

    return () => window.clearTimeout(restore);
  }, [seatMap]);

  function toggleSeat(seat: ShowtimeSeat) {
    if (seat.status !== "AVAILABLE") return;

    setRoleError("");
    setNotice("");
    setSelectedSeatIds((current) => {
      const next = current.includes(seat.showtimeSeatId)
        ? current.filter((id) => id !== seat.showtimeSeatId)
        : [...current, seat.showtimeSeatId];
      const pendingSelection = readPendingSeatSelection();

      if (pendingSelection?.showtimeId === seatMap.showtimeId) {
        if (next.length === 0) {
          clearPendingSeatSelection();
        } else {
          writePendingSeatSelection({
            ...pendingSelection,
            showtimeSeatIds: next,
          });
        }
      }

      return next;
    });
  }

  async function handleContinue(skipKnownVerificationCheck = false) {
    if (
      selectedSeatIds.length === 0 ||
      isAuthLoading ||
      submissionLock.current
    ) {
      return;
    }

    const returnTo = `${window.location.pathname}${window.location.search}`;
    writePendingSeatSelection({
      showtimeId: inventory.showtimeId,
      showtimeSeatIds: selectedSeatIds,
      returnTo,
    });
    setRoleError("");

    if (!user) {
      router.push(withReturnTo("/login", returnTo));
      return;
    }

    if (!isCustomer(user)) {
      setRoleError(
        "Seat reservations are available to customer accounts only. Please sign in with a customer account.",
      );
      return;
    }

    if (isEmailVerificationRequired && !skipKnownVerificationCheck) {
      setVerificationOpen(true);
      return;
    }

    submissionLock.current = true;
    setIsCreatingHold(true);
    setNotice("");
    let holdCreated = false;

    try {
      const latestSeatMap = (await getShowtimeSeats(inventory.showtimeId)).data;
      setInventory(latestSeatMap);

      const availableSeatIds = new Set(
        latestSeatMap.seats
          .filter((seat) => seat.status === "AVAILABLE")
          .map((seat) => seat.showtimeSeatId),
      );
      const stillAvailableSelection = selectedSeatIds.filter((id) =>
        availableSeatIds.has(id),
      );

      if (stillAvailableSelection.length !== selectedSeatIds.length) {
        setSelectedSeatIds(stillAvailableSelection);
        persistAvailableSelection(stillAvailableSelection, returnTo);
        setNoticeTone("warning");
        setNotice(
          "Some selected seats are no longer available. We updated your selection; please review it before continuing.",
        );
        return;
      }

      const response = await createSeatHold({
        showtimeId: inventory.showtimeId,
        showtimeSeatIds: stillAvailableSelection,
      });
      writeActiveSeatHold({
        showtimeId: inventory.showtimeId,
        hold: response.data,
      });
      markEmailVerified();
      clearPendingSeatSelection();
      holdCreated = true;
      router.push(
        `/checkout/hold/${encodeURIComponent(response.data.bookingReference)}?showtimeId=${inventory.showtimeId}`,
      );
    } catch (error) {
      if (isApiRequestError(error) && error.status === 409) {
        await handleSeatConflict(returnTo);
      } else if (isVerificationRequiredError(error)) {
        setVerificationOpen(true);
      } else {
        setRoleError(
          error instanceof Error
            ? error.message
            : "The seat hold could not be created. Please try again.",
        );
      }
    } finally {
      if (!holdCreated) {
        submissionLock.current = false;
        setIsCreatingHold(false);
      }
    }
  }

  function persistAvailableSelection(ids: number[], returnTo: string) {
    if (ids.length === 0) {
      clearPendingSeatSelection();
      return;
    }

    writePendingSeatSelection({
      showtimeId: inventory.showtimeId,
      showtimeSeatIds: ids,
      returnTo,
    });
  }

  async function handleSeatConflict(returnTo: string) {
    setRoleError("This seat was just taken. Please choose another seat.");

    try {
      const latestSeatMap = (await getShowtimeSeats(inventory.showtimeId)).data;
      setInventory(latestSeatMap);
      const availableSeatIds = new Set(
        latestSeatMap.seats
          .filter((seat) => seat.status === "AVAILABLE")
          .map((seat) => seat.showtimeSeatId),
      );
      const retainedSelection = selectedSeatIds.filter((id) =>
        availableSeatIds.has(id),
      );
      setSelectedSeatIds(retainedSelection);
      persistAvailableSelection(retainedSelection, returnTo);
    } catch {
      setNoticeTone("warning");
      setNotice(
        "We could not refresh the seat map. Refresh the page before choosing again.",
      );
    }
  }

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0 overflow-hidden p-0">
          <div className="border-b border-[var(--qs-border)] px-5 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--qs-primary)]">
              Choose your seats
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {inventory.movieTitle}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--qs-text-muted)]">
              <span>{inventory.screenName}</span>
              <time dateTime={inventory.startTime}>
                {formatMyanmarDateTime(inventory.startTime)}
              </time>
              <span>Myanmar time</span>
            </div>
            {notice ? (
              <p
                className={cn(
                  "mt-4 rounded-lg border px-3 py-2 text-sm",
                  noticeTone === "warning"
                    ? "border-[#5c3f16] bg-[#1c170f] text-[#ffd28a]"
                    : "border-[#35543f] bg-[#122119] text-[#9be4b6]",
                )}
                role="status"
              >
                {notice}
              </p>
            ) : null}
            {roleError ? (
              <p
                className="mt-4 rounded-lg border border-[#6d2428] bg-[#351112] px-3 py-2 text-sm text-[#ff9999]"
                role="alert"
              >
                {roleError}
              </p>
            ) : null}
          </div>

          <div
            aria-label="Scrollable cinema seat map"
            className="overflow-x-auto overscroll-x-contain px-3 py-6 sm:px-7 sm:py-7"
            role="region"
            tabIndex={0}
          >
            <div className="mx-auto min-w-max">
              <div className="mx-auto mb-8 w-[min(76vw,42rem)] min-w-64 text-center sm:mb-10 sm:min-w-80">
                <div className="h-2 rounded-[50%] bg-gradient-to-r from-transparent via-[var(--qs-primary)] to-transparent shadow-[0_8px_26px_rgba(255,24,66,0.65)]" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.5em] text-[var(--qs-text-muted)]">
                  Screen
                </p>
              </div>

              <div className="space-y-3" role="group" aria-label="Cinema seats">
                {rows.map((row, rowIndex) => (
                  <div
                    className="flex min-w-max items-center gap-3"
                    key={`${row.rowName}-${rowIndex}`}
                  >
                    <span
                      aria-hidden="true"
                      className="sticky left-0 z-10 grid h-12 w-8 shrink-0 place-items-center bg-[var(--qs-surface)] text-sm font-bold text-[var(--qs-text-muted)]"
                    >
                      {row.rowName}
                    </span>
                    <div className="flex items-center gap-2.5">
                      {row.seats.map((seat) => {
                        const selected = selectedSeatIds.includes(
                          seat.showtimeSeatId,
                        );
                        const disabled = seat.status !== "AVAILABLE";

                        return (
                          <button
                            aria-label={getSeatLabel(seat, selected)}
                            aria-pressed={disabled ? undefined : selected}
                            className={cn(
                              "flex h-12 shrink-0 flex-col items-center justify-center rounded-lg border text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qs-surface)]",
                              seat.seatType === "COUPLE" ? "w-24" : "w-14",
                              selected
                                ? "border-[var(--qs-primary)] bg-[var(--qs-primary)] text-white shadow-[0_0_20px_rgba(255,24,66,0.45)]"
                                : statusStyles[seat.status],
                            )}
                            disabled={disabled}
                            key={seat.showtimeSeatId}
                            onClick={() => toggleSeat(seat)}
                            type="button"
                          >
                            <span>
                              {seat.seatType === "COUPLE" ? "Couple " : ""}
                              {seat.seatNumber}
                            </span>
                            <span className="mt-0.5 text-[9px] font-normal opacity-80">
                              {formatMMK(seat.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SeatLegend />
        </Card>

        <aside className="hidden lg:block" aria-label="Selected seat summary">
          <Card className="sticky top-24">
            <SelectionSummary
              isAuthLoading={isAuthLoading}
              isCreatingHold={isCreatingHold}
              onContinue={handleContinue}
              selectedSeats={selectedSeats}
              total={total}
            />
          </Card>
        </aside>
      </div>

      <div
        className="sticky bottom-0 z-30 -mx-[var(--qs-page-padding)] mt-6 border-t border-[var(--qs-border)] bg-[#0e0e12]/95 px-[var(--qs-page-padding)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_40px_rgba(0,0,0,0.45)] backdrop-blur lg:hidden"
        aria-label="Selected seat summary"
      >
        <SelectionSummary
          compact
          isAuthLoading={isAuthLoading}
          isCreatingHold={isCreatingHold}
          onContinue={handleContinue}
          selectedSeats={selectedSeats}
          total={total}
        />
      </div>

      <Dialog
        onOpenChange={setVerificationOpen}
        open={verificationOpen}
        title="Email verification required"
      >
        <VerificationRequired
          email={user?.email ?? ""}
          onTryAgain={() => {
            setVerificationOpen(false);
            void handleContinue(true);
          }}
        />
      </Dialog>
    </>
  );
}

function SelectionSummary({
  compact = false,
  isAuthLoading,
  isCreatingHold,
  onContinue,
  selectedSeats,
  total,
}: {
  compact?: boolean;
  isAuthLoading: boolean;
  isCreatingHold: boolean;
  onContinue: () => Promise<void>;
  selectedSeats: ShowtimeSeat[];
  total: number;
}) {
  const selectedSeatIds = selectedSeats.map((seat) => seat.showtimeSeatId);

  return (
    <div data-selected-seat-ids={selectedSeatIds.join(",")}>
      <div className={cn("flex min-w-0 justify-between gap-3", !compact && "block")}>
        <div className="min-w-0">
          <h2 className="text-lg font-bold">Your seats</h2>
          <p className="mt-1 text-sm text-[var(--qs-text-muted)]">
            {selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"} selected
          </p>
          {compact && selectedSeats.length > 0 && (
            <p className="mt-1 max-w-52 truncate text-xs text-[var(--qs-text-muted)]">
              {selectedSeats
                .map((seat) => `${seat.rowName}${seat.seatNumber}`)
                .join(", ")}
            </p>
          )}
        </div>
        <div className={cn("shrink-0 text-right", !compact && "mt-5 flex items-end justify-between text-left")}>
          {!compact && <span className="text-sm text-[var(--qs-text-muted)]">Total</span>}
          <strong className="block text-xl text-[var(--qs-primary)]">
            {formatMMK(total)}
          </strong>
        </div>
      </div>

      {!compact && (
        <div className="my-5 min-h-16 border-y border-[var(--qs-border)] py-4">
          {selectedSeats.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Selected seats">
              {selectedSeats.map((seat) => (
                <li
                  className="rounded-md border border-[var(--qs-primary)]/50 bg-[var(--qs-primary)]/10 px-2.5 py-1 text-sm"
                  key={seat.showtimeSeatId}
                >
                  {seat.rowName}{seat.seatNumber}
                  {seat.seatType === "COUPLE" ? " · Couple" : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--qs-text-muted)]">
              Select an available seat to continue.
            </p>
          )}
        </div>
      )}

      <Button
        className={cn("w-full", compact && "mt-3")}
        disabled={
          selectedSeats.length === 0 || isAuthLoading || isCreatingHold
        }
        onClick={() => void onContinue()}
      >
        {isCreatingHold
          ? "Holding seats…"
          : isAuthLoading
            ? "Checking session…"
            : "Continue"}
      </Button>
    </div>
  );
}

function SeatLegend() {
  const items: Array<{ label: string; className: string }> = [
    { label: "Available", className: statusStyles.AVAILABLE },
    {
      label: "Selected",
      className: "border-[var(--qs-primary)] bg-[var(--qs-primary)]",
    },
    { label: "Held", className: statusStyles.HELD },
    { label: "Booked", className: statusStyles.BOOKED },
    { label: "Unavailable", className: statusStyles.UNAVAILABLE },
  ];

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--qs-border)] px-5 py-5 text-xs text-[var(--qs-text-muted)] sm:px-7">
      {items.map((item) => (
        <span className="inline-flex items-center gap-2" key={item.label}>
          <span
            aria-hidden="true"
            className={cn("h-5 w-6 rounded border", item.className)}
          />
          {item.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-5 w-10 rounded-full border border-[#595963] bg-[#17171c]"
        />
        Couple (one unit, two people)
      </span>
    </div>
  );
}

function groupSeatsInBackendOrder(seats: ShowtimeSeat[]): SeatRow[] {
  return seats.reduce<SeatRow[]>((rows, seat) => {
    const currentRow = rows.at(-1);
    if (currentRow?.rowName === seat.rowName) {
      currentRow.seats.push(seat);
    } else {
      rows.push({ rowName: seat.rowName, seats: [seat] });
    }
    return rows;
  }, []);
}

function getSeatLabel(seat: ShowtimeSeat, selected: boolean): string {
  const type = seat.seatType === "COUPLE" ? "couple seat for two people" : "normal seat";
  const state = selected ? "selected" : statusLabels[seat.status];
  return `Row ${seat.rowName}, seat ${seat.seatNumber}, ${type}, ${formatMMK(seat.price)}, ${state}`;
}
