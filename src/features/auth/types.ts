export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export type AuthUser = {
  userId: number;
  name: string;
  email: string;
  role: Role;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

export type AuthResponse = AuthUser & AuthTokens;

export type RefreshResponse = AuthTokens;

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

export type EmailRequest = {
  email: string;
};

export type VerifyResetOtpRequest = EmailRequest & {
  otp: string;
};

export type ResetPasswordRequest = VerifyResetOtpRequest & {
  newPassword: string;
};
