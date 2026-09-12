const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_API_BASE_URL. Add it to your .env.local file.",
  );
}

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
} as const;
