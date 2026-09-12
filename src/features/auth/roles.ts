import type { AuthUser, Role } from "@/features/auth/types";

export function hasRole(
  user: AuthUser | null,
  allowedRoles: readonly Role[],
): boolean {
  return Boolean(user && allowedRoles.includes(user.role));
}

export function isCustomer(user: AuthUser | null): boolean {
  return user?.role === "CUSTOMER";
}

export function isStaff(user: AuthUser | null): boolean {
  return user?.role === "STAFF";
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}
