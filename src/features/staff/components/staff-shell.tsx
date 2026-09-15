"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { QuickSeatLogo } from "@/components/layout/quickseat-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { href: "/staff", label: "Workspace" },
  { href: "/staff/showtimes", label: "Showtimes" },
  { href: "/staff/bookings", label: "Bookings" },
  { href: "/staff/ticket-validation", label: "Ticket validation" },
] as const;

function StaffDeniedState() {
  return <main className="grid min-h-screen place-items-center bg-[#0c0c0f] p-5"><Card className="w-full max-w-lg py-10 text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--qs-danger)]">Access denied</p><h1 className="mt-3 text-2xl font-semibold">Staff access is required</h1><p className="mx-auto mt-3 max-w-md text-sm text-[var(--qs-text-muted)]">This workspace is only available to QuickSeat cinema staff. No staff content has been loaded.</p><Link className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-[var(--qs-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qs-surface-raised)]" href="/">Return to QuickSeat</Link></Card></main>;
}

function StaffLoadingState() {
  return <main className="grid min-h-screen place-items-center bg-[#0c0c0f] text-sm text-[var(--qs-text-muted)]" role="status">Checking staff access&hellip;</main>;
}

function StaffNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Staff navigation"><ul className="space-y-1">{navigation.map((item) => {
    const active = item.href === "/staff" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <li key={item.href}><Link aria-current={active ? "page" : undefined} className={cn("flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium", active ? "border-[#38505a] bg-[#15242a] text-white" : "border-transparent text-[var(--qs-text-muted)] hover:border-[var(--qs-border)] hover:bg-[#202025] hover:text-[var(--qs-text)]")} href={item.href} onClick={onNavigate}><span>{item.label}</span>{active ? <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#91d7e8]">Current</span> : null}</Link></li>;
  })}</ul></nav>;
}

function StaffIdentity() {
  const { user } = useAuth();
  return user ? <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-[var(--qs-text-muted)]">{user.email}</p></div> : null;
}

function StaffShellContent({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  async function handleLogout() { if (isSigningOut) return; setIsSigningOut(true); try { await logout(); router.push("/"); } finally { setIsSigningOut(false); } }
  const logoutLabel = isSigningOut ? "Logging out…" : "Logout";
  return <div className="min-h-screen bg-[#0c0c0f] text-[var(--qs-text)]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[var(--qs-border)] bg-[#111114] lg:flex"><div className="border-b border-[var(--qs-border)] px-5 py-4"><QuickSeatLogo /><p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--qs-text-muted)]">Staff workspace</p></div><div className="flex-1 px-3 py-5"><StaffNavigation /></div><div className="border-t border-[var(--qs-border)] p-4"><StaffIdentity /><Button className="mt-3 w-full justify-start" disabled={isSigningOut} onClick={() => void handleLogout()} variant="ghost">{logoutLabel}</Button></div></aside>
    <div className="min-w-0 lg:pl-64"><header className="sticky top-0 z-20 border-b border-[var(--qs-border)] bg-[rgba(17,17,20,0.96)] backdrop-blur-xl"><div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8"><Button aria-controls="staff-mobile-navigation" aria-expanded={drawerOpen} aria-label="Open staff navigation" className="min-h-10 px-3 lg:hidden" onClick={() => setDrawerOpen(true)} variant="secondary">Menu</Button><div><p className="text-sm font-semibold">Cinema Operations</p><p className="hidden text-xs text-[var(--qs-text-muted)] sm:block">Assigned cinema workspace</p></div><div className="ml-auto flex items-center gap-3"><Badge className="hidden sm:inline-flex" tone="primary">STAFF</Badge><div className="hidden max-w-52 md:block"><StaffIdentity /></div><Button className="min-h-10 px-3 lg:hidden" disabled={isSigningOut} onClick={() => void handleLogout()} variant="ghost">{logoutLabel}</Button></div></div></header><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto min-w-0 max-w-[100rem]">{children}</div></main></div>
    <Dialog onOpenChange={setDrawerOpen} open={drawerOpen} title="Staff navigation" variant="drawer"><div className="space-y-5" id="staff-mobile-navigation"><div className="flex items-center justify-between gap-3 border-b border-[var(--qs-border)] pb-4"><StaffIdentity /><Badge tone="primary">STAFF</Badge></div><StaffNavigation onNavigate={() => setDrawerOpen(false)} /><Button className="w-full justify-start" disabled={isSigningOut} onClick={() => void handleLogout()} variant="ghost">{logoutLabel}</Button></div></Dialog>
  </div>;
}

export function StaffShell({ children }: { children: ReactNode }) {
  return <AuthGuard deniedFallback={<StaffDeniedState />} deniedRedirectTo={null} loadingFallback={<StaffLoadingState />} roles={["STAFF"]}><StaffShellContent>{children}</StaffShellContent></AuthGuard>;
}
