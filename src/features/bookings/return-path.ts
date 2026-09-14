export function getSafeBookingsReturnPath(value: unknown): string {
  if (typeof value !== "string") return "/bookings";
  return value === "/bookings" || value.startsWith("/bookings?")
    ? value
    : "/bookings";
}
