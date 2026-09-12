"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { hasRole } from "@/features/auth/roles";
import type { Role } from "@/features/auth/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

type AuthGuardProps = {
  children: ReactNode;
  roles?: readonly Role[];
};

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const roleAllowed = !roles || hasRole(user, roles);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!roleAllowed) router.replace("/");
  }, [isLoading, pathname, roleAllowed, router, user]);

  if (isLoading || !user || !roleAllowed) {
    return (
      <p className="p-6 text-center text-sm text-[var(--qs-text-muted)]" role="status">
        Checking access…
      </p>
    );
  }

  return children;
}
