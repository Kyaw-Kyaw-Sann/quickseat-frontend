import {
  createNetworkError,
  normalizeApiError,
  ApiRequestError,
} from "@/lib/api/errors";
import type {
  ApiError,
  ApiSuccess,
  QueryParams,
} from "@/lib/api/types";
import { env } from "@/lib/config/env";

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
  query?: QueryParams;
  retryUnauthorized?: boolean;
};

export type ApiAuthAdapter = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onUnauthorized: () => void;
};

let authAdapter: ApiAuthAdapter | null = null;

export function configureApiAuth(adapter: ApiAuthAdapter | null): void {
  authAdapter = adapter;
}

export function buildQueryString(query?: QueryParams): string {
  if (!query) return "";

  const parameters = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      continue;
    }
    parameters.set(key, String(value));
  }

  return parameters.toString();
}

export function buildApiUrl(path: string, query?: QueryParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = buildQueryString(query);

  return `${env.apiBaseUrl}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

export async function apiClient<T>(
  path: string,
  {
    auth = true,
    body,
    headers: providedHeaders,
    query,
    retryUnauthorized = true,
    ...options
  }: ApiRequestOptions = {},
): Promise<ApiSuccess<T>> {
  const headers = new Headers(providedHeaders);
  headers.set("Accept", "application/json");

  const accessToken = auth ? authAdapter?.getAccessToken() : null;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path, query), {
      ...options,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
    });
  } catch {
    throw createNetworkError();
  }

  const payload = await parseJsonSafely(response);

  if (response.status === 401 && auth && authAdapter) {
    if (retryUnauthorized) {
      const refreshedAccessToken = await authAdapter.refreshAccessToken();

      if (refreshedAccessToken) {
        return apiClient<T>(path, {
          ...options,
          auth,
          body,
          headers: providedHeaders,
          query,
          retryUnauthorized: false,
        });
      }
    }

    authAdapter.onUnauthorized();
  }

  if (isApiError(payload)) {
    throw normalizeApiError(payload, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError({
      message: "The request could not be completed.",
      status: response.status,
      code: "HTTP_ERROR",
    });
  }

  if (!isApiSuccess(payload)) {
    throw new ApiRequestError({
      message: "QuickSeat returned an invalid response.",
      status: response.status,
      code: "INVALID_RESPONSE",
    });
  }

  return payload as ApiSuccess<T>;
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) return undefined;

  try {
    return JSON.parse(responseText);
  } catch {
    return undefined;
  }
}

function isApiSuccess(payload: unknown): payload is ApiSuccess<unknown> {
  return (
    isRecord(payload) &&
    payload.success === true &&
    typeof payload.message === "string" &&
    "data" in payload
  );
}

function isApiError(payload: unknown): payload is ApiError {
  return isRecord(payload) && payload.success === false && typeof payload.message === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
