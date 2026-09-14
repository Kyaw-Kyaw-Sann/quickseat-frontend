import type { SeatHold, SeatHoldDetail } from "@/features/seat-holds/types";

export type ActiveSeatHold = {
  showtimeId: number;
  hold: SeatHold;
};

const ACTIVE_HOLD_KEY = "quickseat.booking.active-seat-hold";

export function readActiveSeatHold(
  bookingReference?: string,
): ActiveSeatHold | null {
  if (typeof window === "undefined") return null;

  const serializedHold = window.sessionStorage.getItem(ACTIVE_HOLD_KEY);
  if (!serializedHold) return null;

  try {
    const activeHold: unknown = JSON.parse(serializedHold);
    if (!isActiveSeatHold(activeHold)) return null;
    if (
      bookingReference &&
      activeHold.hold.bookingReference !== bookingReference
    ) {
      return null;
    }
    return activeHold;
  } catch {
    return null;
  }
}

export function writeActiveSeatHold(activeHold: ActiveSeatHold): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ACTIVE_HOLD_KEY, JSON.stringify(activeHold));
}

export function updateActiveSeatHoldDetail(
  detail: SeatHoldDetail,
): ActiveSeatHold | null {
  const current = readActiveSeatHold(detail.bookingReference);
  if (!current) return null;

  const updated: ActiveSeatHold = {
    ...current,
    hold: {
      ...current.hold,
      status: detail.status,
      expiresAt: detail.expiresAt,
      remainingSeconds: detail.remainingSeconds,
    },
  };
  writeActiveSeatHold(updated);
  return updated;
}

export function clearActiveSeatHold(bookingReference?: string): void {
  if (typeof window === "undefined") return;

  if (bookingReference) {
    const current = readActiveSeatHold();
    if (current?.hold.bookingReference !== bookingReference) return;
  }
  window.sessionStorage.removeItem(ACTIVE_HOLD_KEY);
}

function isActiveSeatHold(value: unknown): value is ActiveSeatHold {
  if (!isRecord(value) || !isRecord(value.hold)) return false;
  const { hold } = value;

  return (
    Number.isSafeInteger(value.showtimeId) &&
    (value.showtimeId as number) > 0 &&
    typeof hold.bookingId === "number" &&
    typeof hold.bookingReference === "string" &&
    typeof hold.status === "string" &&
    typeof hold.totalAmount === "number" &&
    typeof hold.expiresAt === "string" &&
    typeof hold.remainingSeconds === "number" &&
    Array.isArray(hold.selectedSeats)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
