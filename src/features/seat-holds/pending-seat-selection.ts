export type PendingSeatSelection = {
  showtimeId: number;
  showtimeSeatIds: number[];
  returnTo: string;
};

const PENDING_SELECTION_KEY = "quickseat.booking.pending-seat-selection";

export function readPendingSeatSelection(): PendingSeatSelection | null {
  if (typeof window === "undefined") return null;

  const serializedSelection = window.sessionStorage.getItem(
    PENDING_SELECTION_KEY,
  );
  if (!serializedSelection) return null;

  try {
    const selection: unknown = JSON.parse(serializedSelection);
    return isPendingSeatSelection(selection) ? selection : null;
  } catch {
    return null;
  }
}

export function writePendingSeatSelection(
  selection: PendingSeatSelection,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PENDING_SELECTION_KEY,
    JSON.stringify(selection),
  );
}

export function clearPendingSeatSelection(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_SELECTION_KEY);
}

export function getPendingSeatSelectionReturnTo(): string | null {
  return readPendingSeatSelection()?.returnTo ?? null;
}

function isPendingSeatSelection(value: unknown): value is PendingSeatSelection {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.showtimeId) &&
    (value.showtimeId as number) > 0 &&
    Array.isArray(value.showtimeSeatIds) &&
    value.showtimeSeatIds.every(
      (id) => Number.isSafeInteger(id) && id > 0,
    ) &&
    typeof value.returnTo === "string" &&
    isSafeLocalPath(value.returnTo)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSafeLocalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}
