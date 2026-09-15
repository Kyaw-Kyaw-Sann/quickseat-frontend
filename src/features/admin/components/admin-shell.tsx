"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { QuickSeatLogo } from "@/components/layout/quickseat-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  AdminAccessDeniedState,
  AdminLoadingState,
} from "@/features/admin/components/admin-access-state";
import {
  adminNavigation,
  type AdminNavigationItem,
} from "@/features/admin/navigation";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

function isActivePath(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationItem({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavigationItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  if (!item.available) {
    return (
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-[#707078]"
        title="Coming in a later phase"
      >
        <span>{item.label}</span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider">
          Later
          <span className="sr-only"> — Coming in a later phase</span>
        </span>
      </span>
    );
  }

  const active = isActivePath(pathname, item.href);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-[#65303a] bg-[#291419] text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--qs-primary)]"
          : "border-transparent text-[var(--qs-text-muted)] hover:border-[var(--qs-border)] hover:bg-[#202025] hover:text-[var(--qs-text)]",
      )}
      href={item.href}
      onClick={onNavigate}
    >
      <span>{item.label}</span>
      {active ? (
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#ff8798]">
          Current
        </span>
      ) : null}
    </Link>
  );
}

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      <ul className="space-y-1">
        {adminNavigation.map((item) => (
          <li key={item.href}>
            <NavigationItem item={item} onNavigate={onNavigate} pathname={pathname} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AdminIdentity() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-[var(--qs-text)]">{user.name}</p>
      <p className="truncate text-xs text-[var(--qs-text-muted)]">{user.email}</p>
    </div>
  );
}

function AdminShellContent({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await logout();
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-[var(--qs-text)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[var(--qs-border)] bg-[#111114] lg:flex">
        <div className="border-b border-[var(--qs-border)] px-5 py-4">
          <QuickSeatLogo />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--qs-text-muted)]">
            Admin workspace
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <AdminNavigation />
        </div>
        <div className="border-t border-[var(--qs-border)] p-4">
          <AdminIdentity />
          <Button
            className="mt-3 w-full justify-start"
            disabled={isSigningOut}
            onClick={handleLogout}
            variant="ghost"
          >
            {isSigningOut ? "Logging out…" : "Logout"}
          </Button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[var(--qs-border)] bg-[rgba(17,17,20,0.96)] backdrop-blur-xl">
          <div className="flex min-h-16 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
            <Button
              aria-controls="admin-mobile-navigation"
              aria-expanded={drawerOpen}
              aria-label="Open admin navigation"
              className="min-h-11 min-w-11 shrink-0 px-3 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              variant="secondary"
            >
              Menu
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Admin Console</p>
              <p className="hidden text-xs text-[var(--qs-text-muted)] sm:block">
                QuickSeat operations
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              <Badge className="hidden sm:inline-flex" tone="primary">
                ADMIN
              </Badge>
              <div className="hidden max-w-52 md:block">
                <AdminIdentity />
              </div>
              <Button
                className="min-h-11 px-2 sm:px-3 lg:hidden"
                disabled={isSigningOut}
                onClick={handleLogout}
                variant="ghost"
              >
                {isSigningOut ? "Logging out…" : "Logout"}
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto min-w-0 max-w-[100rem]">{children}</div>
        </main>
      </div>

      <Dialog
        onOpenChange={setDrawerOpen}
        open={drawerOpen}
        title="Admin navigation"
        variant="drawer"
      >
        <div className="space-y-5" id="admin-mobile-navigation">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--qs-border)] pb-4">
            <AdminIdentity />
            <Badge tone="primary">ADMIN</Badge>
          </div>
          <AdminNavigation onNavigate={() => setDrawerOpen(false)} />
          <Button
            className="w-full justify-start"
            disabled={isSigningOut}
            onClick={handleLogout}
            variant="ghost"
          >
            {isSigningOut ? "Logging out…" : "Logout"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard
      deniedFallback={<AdminAccessDeniedState />}
      deniedRedirectTo={null}
      loadingFallback={<AdminLoadingState />}
      roles={["ADMIN"]}
    >
      <AdminShellContent>{children}</AdminShellContent>
    </AuthGuard>
  );
}
