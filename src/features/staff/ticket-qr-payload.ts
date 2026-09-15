const STAFF_TICKET_VALIDATION_PATH = "/api/v1/staff/tickets/validate";

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function parseStaffTicketQrPayload(payload: string): string | null {
  const value = payload.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (normalizePathname(url.pathname) !== STAFF_TICKET_VALIDATION_PATH) return null;

    const token = url.searchParams.get("token")?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function isUrlLikeTicketInput(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
