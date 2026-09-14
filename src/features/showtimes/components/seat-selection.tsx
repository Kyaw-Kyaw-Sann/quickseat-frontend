"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  SeatInventoryStatus,
  ShowtimeSeat,
  ShowtimeSeatMap,
} from "@/features/showtimes/types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";
import { cn } from "@/lib/utils/cn";

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
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);

  const rows = useMemo(() => groupSeatsInBackendOrder(seatMap.seats), [seatMap]);
  const selectedSeats = useMemo(
    () =>
      seatMap.seats.filter((seat) =>
        selectedSeatIds.includes(seat.showtimeSeatId),
      ),
    [seatMap.seats, selectedSeatIds],
  );
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  function toggleSeat(seat: ShowtimeSeat) {
    if (seat.status !== "AVAILABLE") return;

    setSelectionReady(false);
    setSelectedSeatIds((current) =>
      current.includes(seat.showtimeSeatId)
        ? current.filter((id) => id !== seat.showtimeSeatId)
        : [...current, seat.showtimeSeatId],
    );
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
              {seatMap.movieTitle}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--qs-text-muted)]">
              <span>{seatMap.screenName}</span>
              <time dateTime={seatMap.startTime}>
                {formatMyanmarDateTime(seatMap.startTime)}
              </time>
              <span>Myanmar time</span>
            </div>
          </div>

          <div className="overflow-x-auto px-4 py-7 sm:px-7">
            <div className="mx-auto min-w-max">
              <div className="mx-auto mb-10 w-[min(76vw,42rem)] min-w-80 text-center">
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
              onContinue={() => setSelectionReady(true)}
              selectedSeats={selectedSeats}
              selectionReady={selectionReady}
              total={total}
            />
          </Card>
        </aside>
      </div>

      <div
        className="sticky bottom-0 z-30 -mx-[var(--qs-page-padding)] mt-6 border-t border-[var(--qs-border)] bg-[#0e0e12]/95 px-[var(--qs-page-padding)] py-4 shadow-[0_-16px_40px_rgba(0,0,0,0.45)] backdrop-blur lg:hidden"
        aria-label="Selected seat summary"
      >
        <SelectionSummary
          compact
          onContinue={() => setSelectionReady(true)}
          selectedSeats={selectedSeats}
          selectionReady={selectionReady}
          total={total}
        />
      </div>
    </>
  );
}

function SelectionSummary({
  compact = false,
  onContinue,
  selectedSeats,
  selectionReady,
  total,
}: {
  compact?: boolean;
  onContinue: () => void;
  selectedSeats: ShowtimeSeat[];
  selectionReady: boolean;
  total: number;
}) {
  const selectedSeatIds = selectedSeats.map((seat) => seat.showtimeSeatId);

  return (
    <div data-selected-seat-ids={selectedSeatIds.join(",")}>
      <div className={cn("flex justify-between gap-4", !compact && "block")}>
        <div>
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
        <div className={cn("text-right", !compact && "mt-5 flex items-end justify-between text-left")}>
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
        disabled={selectedSeats.length === 0}
        onClick={onContinue}
      >
        Continue
      </Button>
      {selectionReady && (
        <p className="mt-2 text-center text-xs text-[var(--qs-text-muted)]" role="status">
          Your seat selection is ready.
        </p>
      )}
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
