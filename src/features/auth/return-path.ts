export function getSafeReturnPath(search: string, fallback = "/"): string {
  const returnTo = new URLSearchParams(search).get("returnTo");
  return returnTo && isSafeInternalPath(returnTo) ? returnTo : fallback;
}

export function withReturnTo(path: string, returnTo: string): string {
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return false;
  }

  return !/[\u0000-\u001f\u007f]/.test(path);
}
