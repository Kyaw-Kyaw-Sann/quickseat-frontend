export function getSafeReturnPath(search: string, fallback = "/"): string {
  const returnTo = new URLSearchParams(search).get("returnTo");
  return returnTo?.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : fallback;
}

export function withReturnTo(path: string, returnTo: string): string {
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}
