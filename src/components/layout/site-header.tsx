"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { QuickSeatLogo } from "@/components/layout/quickseat-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth-provider";
import { isAdmin, isCustomer, isStaff } from "@/features/auth/roles";
import { cn } from "@/lib/utils/cn";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/cinemas", label: "Cinemas" },
  { href: "/showtimes", label: "Showtimes" },
];

function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname.startsWith(`${href}/`) || pathname === href;
}

type NavigationLinksProps = {
  onNavigate?: () => void;
};

function NavigationLinks({ onNavigate }: NavigationLinksProps) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
      {primaryLinks.map((link) => {
        const active = isActivePath(pathname, link.href);

        return (
          <li key={link.href}>
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] lg:rounded-none lg:px-1 lg:py-5",
                active
                  ? "bg-[rgba(255,31,66,0.12)] text-[var(--qs-text)] lg:bg-transparent lg:after:absolute lg:after:inset-x-0 lg:after:bottom-2 lg:after:h-0.5 lg:after:rounded-full lg:after:bg-[var(--qs-primary)] lg:after:shadow-[0_0_10px_rgba(255,31,66,0.9)]"
                  : "text-[var(--qs-text-muted)] hover:bg-[var(--qs-surface-raised)] hover:text-[var(--qs-text)] lg:hover:bg-transparent",
              )}
              href={link.href}
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function RoleEntry({ onNavigate }: NavigationLinksProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const entry = isCustomer(user)
    ? { href: "/bookings", label: "My Bookings" }
    : isStaff(user)
      ? { href: "/staff", label: "Staff" }
      : isAdmin(user)
        ? { href: "/admin", label: "Admin" }
        : null;

  if (!entry) return null;

  const active = isActivePath(pathname, entry.href);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]",
        active
          ? "bg-[rgba(255,31,66,0.12)] text-[var(--qs-text)]"
          : "text-[var(--qs-text-muted)] hover:bg-[var(--qs-surface-raised)] hover:text-[var(--qs-text)]",
      )}
      href={entry.href}
      onClick={onNavigate}
    >
      {entry.label}
    </Link>
  );
}

function AccountMenu() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    setIsSigningOut(true);
    await logout();
    router.push("/");
  }

  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-3 text-sm font-medium text-[var(--qs-text)] transition-colors hover:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(255,31,66,0.16)] text-xs text-[var(--qs-primary)]">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-28 truncate">{user.name}</span>
        <span aria-hidden="true" className="text-[var(--qs-text-muted)]">⌄</span>
      </summary>
      <Card className="absolute right-0 z-50 mt-2 w-72 p-3 shadow-2xl">
        <p className="truncate px-2 text-sm font-medium text-[var(--qs-text)]">{user.name}</p>
        <p className="truncate px-2 pt-1 text-xs text-[var(--qs-text-muted)]">{user.email}</p>
        <div className="my-3 border-t border-[var(--qs-border)]" />
        <Button className="w-full justify-start" disabled={isSigningOut} onClick={handleLogout} variant="ghost">
          {isSigningOut ? "Logging out..." : "Logout"}
        </Button>
      </Card>
    </details>
  );
}

function AuthActions({ onNavigate }: NavigationLinksProps) {
  const { isLoading, user } = useAuth();

  if (isLoading) return <div aria-label="Loading account" className="h-10 w-24 animate-pulse rounded-lg bg-[var(--qs-surface-raised)]" />;
  if (user) return <AccountMenu />;

  return (
    <div className="flex items-center gap-2">
      <Link className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.02] px-4 text-sm font-medium text-[var(--qs-text)] transition-colors hover:border-white/35 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]" href="/login" onClick={onNavigate}>
        Sign In
      </Link>
      <Link className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--qs-primary)] px-4 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,31,66,0.28)] transition-colors hover:bg-[var(--qs-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qs-background)]" href="/register" onClick={onNavigate}>
        Sign Up
      </Link>
    </div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-5">
      <nav aria-label="Mobile navigation">
        <NavigationLinks onNavigate={onClose} />
        <div className="mt-3 border-t border-[var(--qs-border)] pt-3">
          <RoleEntry onNavigate={onClose} />
        </div>
      </nav>
      <AuthActions onNavigate={onClose} />
    </div>
  );
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(8,8,10,0.94)] shadow-[0_10px_34px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <PageContainer className="flex min-h-[3.75rem] items-center gap-5 py-1 sm:min-h-16">
        <QuickSeatLogo className="shrink-0" />
        <nav aria-label="Primary navigation" className="hidden lg:block"><NavigationLinks /></nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex"><RoleEntry /><AuthActions /></div>
        <Button aria-controls="mobile-navigation" aria-expanded={mobileMenuOpen} aria-label="Open navigation menu" className="ml-auto min-h-10 px-3 lg:hidden" onClick={() => setMobileMenuOpen(true)} variant="ghost">
          Menu
        </Button>
      </PageContainer>
      <Dialog onOpenChange={setMobileMenuOpen} open={mobileMenuOpen} title="Navigation">
        <div id="mobile-navigation"><MobileMenu onClose={() => setMobileMenuOpen(false)} /></div>
      </Dialog>
    </header>
  );
}
