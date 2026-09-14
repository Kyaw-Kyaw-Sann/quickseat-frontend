const TICKET_REFERENCES_KEY = "quickseat.tickets.booking-references";

export function rememberTicketBookingReference(
  ticketToken: string,
  bookingReference: string,
): void {
  if (typeof window === "undefined") return;

  const references = readReferences();
  references[ticketToken] = bookingReference;
  window.sessionStorage.setItem(
    TICKET_REFERENCES_KEY,
    JSON.stringify(references),
  );
}

export function readTicketBookingReference(
  ticketToken: string,
): string | null {
  if (typeof window === "undefined") return null;
  return readReferences()[ticketToken] ?? null;
}

export function clearTicketBookingReferences(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TICKET_REFERENCES_KEY);
}

function readReferences(): Record<string, string> {
  const serialized = window.sessionStorage.getItem(TICKET_REFERENCES_KEY);
  if (!serialized) return {};

  try {
    const value: unknown = JSON.parse(serialized);
    if (!isRecord(value)) return {};

    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
