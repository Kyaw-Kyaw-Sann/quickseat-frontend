import type { ApiError, FieldErrors } from "@/lib/api/types";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly path?: string;
  readonly fieldErrors?: FieldErrors;
  readonly isNetworkError: boolean;

  constructor({
    message,
    status,
    code,
    path,
    fieldErrors,
    isNetworkError = false,
  }: {
    message: string;
    status: number;
    code: string;
    path?: string;
    fieldErrors?: FieldErrors;
    isNetworkError?: boolean;
  }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.path = path;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export function normalizeApiError(
  error: Partial<ApiError> | undefined,
  fallbackStatus: number,
): ApiRequestError {
  return new ApiRequestError({
    message: error?.message || "The request could not be completed.",
    status: error?.status ?? fallbackStatus,
    code: error?.error || "REQUEST_FAILED",
    path: error?.path,
    fieldErrors: error?.fieldErrors,
  });
}

export function createNetworkError(): ApiRequestError {
  return new ApiRequestError({
    message: "Unable to reach QuickSeat. Check your connection and try again.",
    status: 0,
    code: "NETWORK_ERROR",
    isNetworkError: true,
  });
}
