import { apiClient, buildApiUrl } from "@/lib/api/client";
import type { ApiSuccess } from "@/lib/api/types";
import type {
  AuthResponse,
  EmailRequest,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyResetOtpRequest,
} from "@/features/auth/types";

const publicRequest = { auth: false } as const;

export function registerCustomer(
  request: RegisterRequest,
): Promise<ApiSuccess<AuthResponse>> {
  return apiClient<AuthResponse>("/auth/register", {
    ...publicRequest,
    method: "POST",
    body: request,
  });
}

export function loginCustomer(
  request: LoginRequest,
): Promise<ApiSuccess<AuthResponse>> {
  return apiClient<AuthResponse>("/auth/login", {
    ...publicRequest,
    method: "POST",
    body: request,
  });
}

export function refreshTokens(
  refreshToken: string,
): Promise<ApiSuccess<RefreshResponse>> {
  return apiClient<RefreshResponse>("/auth/refresh", {
    ...publicRequest,
    method: "POST",
    body: { refreshToken },
  });
}

export function logoutSession(
  refreshToken: string,
): Promise<ApiSuccess<null>> {
  return apiClient<null>("/auth/logout", {
    ...publicRequest,
    method: "POST",
    body: { refreshToken },
  });
}

export function verifyEmail(token: string): Promise<ApiSuccess<null>> {
  return apiClient<null>("/auth/verify-email", {
    ...publicRequest,
    method: "GET",
    query: { token },
  });
}

export function resendVerification(
  request: EmailRequest,
): Promise<ApiSuccess<null>> {
  return apiClient<null>("/auth/resend-verification", {
    ...publicRequest,
    method: "POST",
    body: request,
  });
}

export function requestPasswordReset(
  request: EmailRequest,
): Promise<ApiSuccess<null>> {
  return apiClient<null>("/auth/forgot-password", {
    ...publicRequest,
    method: "POST",
    body: request,
  });
}

export function verifyResetOtp(
  request: VerifyResetOtpRequest,
): Promise<ApiSuccess<null>> {
  return apiClient<null>("/auth/verify-reset-otp", {
    ...publicRequest,
    method: "POST",
    body: request,
  });
}

export function resetPassword(
  request: ResetPasswordRequest,
): Promise<ApiSuccess<null>> {
  return apiClient<null>("/auth/reset-password", {
    ...publicRequest,
    method: "POST",
    body: request,
  });
}

export function startGoogleOAuth(): void {
  if (typeof window === "undefined") return;
  window.location.assign(buildApiUrl("/oauth2/authorization/google"));
}
