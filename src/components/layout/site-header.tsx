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
  return href === "/" ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href;
}

function SearchShell() {
  return (
    <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] px-3 text-[var(--qs-text-muted)] focus-within:border-[var(--qs-primary)]">
      <span aria-hidden="true">⌕</span>
      <span className="sr-only">Search movies, cinemas, or locations</span>
      <input
        aria-label="Search movies, cinemas, or locations"
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--qs-text)] outline-none placeholder:text-[var(--qs-text-muted)]"
        placeholder="Search movies, cinemas, or locations"
        readOnly
        type="search"
      />
    </label>
  );
}

type NavigationLinksProps = {
  onNavigate?: () => void;
};

function NavigationLinks({ onNavigate }: NavigationLinksProps) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
      {primaryLinks.map((link) => {
        const active = isActivePath(pathname, link.href);

        return (
          <li key={link.href}>
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]",
                active
                  ? "bg-[rgba(255,31,66,0.12)] text-[var(--qs-text)] shadow-[inset_0_-2px_0_var(--qs-primary)]"
                  : "text-[var(--qs-text-muted)] hover:bg-[var(--qs-surface-raised)] hover:text-[var(--qs-text)]",
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
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] px-3 text-sm font-medium text-[var(--qs-text)] transition-colors hover:border-[var(--qs-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] [&::-webkit-details-marker]:hidden">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(255,31,66,0.16)] text-xs text-[var(--qs-primary)]" aria-hidden="true">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-28 truncate">{user.name}</span>
        <span aria-hidden="true" className="text-[var(--qs-text-muted)]">⌄</span>
      </summary>
      <Card className="absolute right-0 z-50 mt-2 w-72 p-3 shadow-2xl">
        <p className="truncate px-2 text-sm font-medium text-[var(--qs-text)]">{user.name}</p>
        <p className="truncate px-2 pt-1 text-xs text-[var(--qs-text-muted)]">{user.email}</p>
        <div className="my-3 border-t border-[var(--qs-border)]" />
        <Button
          className="w-full justify-start"
          disabled={isSigningOut}
          onClick={handleLogout}
          variant="ghost"
        >
          {isSigningOut ? "Logging out…" : "Logout"}
        </Button>
      </Card>
    </details>
  );
}

function AuthActions({ onNavigate }: NavigationLinksProps) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <div aria-label="Loading account" className="h-10 w-24 animate-pulse rounded-lg bg-[var(--qs-surface-raised)]" />;
  }

  if (user) return <AccountMenu />;

  return (
    <div className="flex items-center gap-2">
      <Link
        className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[var(--qs-text)] transition-colors hover:bg-[var(--qs-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
        href="/login"
        onClick={onNavigate}
      >
        Login
      </Link>
      <Link
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--qs-primary)] px-4 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,31,66,0.28)] transition-colors hover:bg-[var(--qs-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qs-bg)]"
        href="/register"
        onClick={onNavigate}
      >
        Register
      </Link>
    </div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-5">
      <SearchShell />
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
    <header className="sticky top-0 z-40 border-b border-[var(--qs-border)] bg-[rgba(8,8,10,0.92)] backdrop-blur-xl">
      <PageContainer className="flex min-h-16 items-center gap-4 py-2">
        <QuickSeatLogo className="shrink-0" />
        <nav aria-label="Primary navigation" className="hidden lg:block">
          <NavigationLinks />
        </nav>
        <div className="ml-auto hidden w-full max-w-sm lg:block">
          <SearchShell />
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <RoleEntry />
          <AuthActions />
        </div>
        <Button
          aria-controls="mobile-navigation"
          aria-expanded={mobileMenuOpen}
          aria-label="Open navigation menu"
          className="ml-auto lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
          variant="ghost"
        >
          Menu
        </Button>
      </PageContainer>
      <Dialog
        onOpenChange={setMobileMenuOpen}
        open={mobileMenuOpen}
        title="Navigation"
      >
        <div id="mobile-navigation">
          <MobileMenu onClose={() => setMobileMenuOpen(false)} />
        </div>
      </Dialog>
    </header>
  );
}
