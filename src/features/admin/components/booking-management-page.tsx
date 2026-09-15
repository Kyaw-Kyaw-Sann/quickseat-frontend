"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminBooking, AdminBookingStatus } from "@/features/admin/booking-types";
import { AdminBookingDetailDialog } from "@/features/admin/components/booking-detail-dialog";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { ShowtimeActionDialog } from "@/features/admin/components/showtime-action-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import {
  cancelAdminBooking,
  getAdminBooking,
  getAdminBookings,
} from "@/lib/api/admin-booking-management";
import type { PaginatedResponse } from "@/lib/api/types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";

const PAGE_SIZE = 20;
const bookingStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED", "USED"] as const;

function parseStatus(value: string | null): AdminBookingStatus | "" {
  return bookingStatuses.includes(value as AdminBookingStatus)
    ? (value as AdminBookingStatus)
    : "";
}

function parsePositiveId(value: string | null): number | undefined {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function parseDate(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : "";
}

function isCancellationCandidate(status: string): boolean {
  return status === "PENDING" || status === "CONFIRMED";
}

export function BookingManagementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const status = parseStatus(searchParams.get("status"));
  const cinemaId = parsePositiveId(searchParams.get("cinemaId"));
  const movieId = parsePositiveId(searchParams.get("movieId"));
  const showtimeId = parsePositiveId(searchParams.get("showtimeId"));
  const date = parseDate(searchParams.get("date"));
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const cancellationLock = useRef(false);
  const [result, setResult] = useState<PaginatedResponse<AdminBooking> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [detail, setDetail] = useState<AdminBooking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setNetworkError(false);
    try {
      const response = await getAdminBookings({
        status: status || undefined,
        cinemaId,
        movieId,
        showtimeId,
        date,
        search,
        page,
        size: PAGE_SIZE,
      });
      setResult(response.data);
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setLoadError(normalized.message);
      setNetworkError(normalized.isNetworkError);
    } finally {
      setLoading(false);
    }
  }, [cinemaId, date, movieId, page, search, showtimeId, status]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  function updateUrl(next: {
    search?: string;
    status?: string;
    cinemaId?: string;
    movieId?: string;
    showtimeId?: string;
    date?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      search: next.search ?? search,
      status: next.status ?? status,
      cinemaId: next.cinemaId ?? (cinemaId ? String(cinemaId) : ""),
      movieId: next.movieId ?? (movieId ? String(movieId) : ""),
      showtimeId: next.showtimeId ?? (showtimeId ? String(showtimeId) : ""),
      date: next.date ?? date,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const nextPage = next.page ?? page;
    if (nextPage > 0) params.set("page", String(nextPage));
    else params.delete("page");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  async function openDetail(bookingReference: string) {
    if (detailLoading) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      const response = await getAdminBooking(bookingReference);
      setDetail(response.data);
    } catch (failure) {
      setDetailError(getAdminMutationError(failure).message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmCancellation() {
    if (!cancelTarget || cancellationLock.current) return;
    cancellationLock.current = true;
    setCancelling(true);
    setCancelError("");
    try {
      const latestResponse = await getAdminBooking(cancelTarget.bookingReference);
      const latestBooking = latestResponse.data;
      setCancelTarget(latestBooking);

      if (!isCancellationCandidate(latestBooking.status)) {
        setCancelError(`This booking is now ${latestBooking.status}. Cancellation is not available.`);
        await load();
        return;
      }

      const response = await cancelAdminBooking(latestBooking.bookingReference);
      setCancelTarget(null);
      setDetail(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setCancelError(normalized.message);
      if (normalized.status === 409) await load();
    } finally {
      cancellationLock.current = false;
      setCancelling(false);
    }
  }

  function startCancellation(booking: AdminBooking) {
    if (!isCancellationCandidate(booking.status) || booking.status === "USED") return;
    setCancelError("");
    setCancelTarget(booking);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Bookings" }]}
        description="Review system-wide bookings, lifecycle state, payment context, and eligible cancellations."
        title="Bookings"
      />

      <div className="rounded-xl border border-[#6b5524] bg-[#2b220f] px-4 py-3 text-sm leading-6 text-[#f1ce7a]">
        Admin cancellation is not a real refund. A SUCCESS payment may remain as a historical record. The backend controls ticket cancellation and eligible seat release.
      </div>
      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}
      {detailError ? <AdminNotice message={detailError} /> : null}

      <Card className="shadow-none">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.4fr)_11rem_repeat(3,minmax(8rem,0.7fr))_11rem_auto] xl:items-end" onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          updateUrl({
            search: String(data.get("search") ?? "").trim(),
            status: String(data.get("status") ?? ""),
            cinemaId: String(data.get("cinemaId") ?? ""),
            movieId: String(data.get("movieId") ?? ""),
            showtimeId: String(data.get("showtimeId") ?? ""),
            date: String(data.get("date") ?? ""),
            page: 0,
          });
        }}>
          <FilterInput defaultValue={search} id="admin-booking-search" label="Search" name="search" placeholder="Customer email or booking reference" />
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="admin-booking-status">Status<Select defaultValue={status} id="admin-booking-status" key={`status-${status}`} name="status"><option value="">All statuses</option>{bookingStatuses.map((value) => <option key={value} value={value}>{value}</option>)}</Select></label>
          <FilterInput defaultValue={cinemaId ? String(cinemaId) : ""} id="admin-booking-cinema" label="Cinema ID" min="1" name="cinemaId" step="1" type="number" />
          <FilterInput defaultValue={movieId ? String(movieId) : ""} id="admin-booking-movie" label="Movie ID" min="1" name="movieId" step="1" type="number" />
          <FilterInput defaultValue={showtimeId ? String(showtimeId) : ""} id="admin-booking-showtime" label="Showtime ID" min="1" name="showtimeId" step="1" type="number" />
          <FilterInput defaultValue={date} id="admin-booking-date" label="Date" name="date" type="date" />
          <Button type="submit" variant="secondary">Apply</Button>
        </form>
      </Card>

      {loading ? <BookingTableSkeleton /> : loadError ? (
        <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={loadError} title={networkError ? "Unable to reach QuickSeat" : "Unable to load bookings"} />
      ) : !result || result.content.length === 0 ? (
        <EmptyState action={<Button onClick={() => updateUrl({ search: "", status: "", cinemaId: "", movieId: "", showtimeId: "", date: "", page: 0 })} variant="secondary">Clear filters</Button>} description="No bookings match the current backend filters." title="No bookings found" />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0 shadow-none">
          <div className="overflow-x-auto"><table className="w-full min-w-[82rem] text-left text-sm"><thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]"><tr><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Movie</th><th className="px-4 py-3">Cinema / Screen</th><th className="px-4 py-3">Showtime</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[var(--qs-border)]">
            {result.content.map((booking) => (
              <tr className="align-top hover:bg-white/[0.02]" key={booking.bookingReference}>
                <td className="px-4 py-4"><p className="max-w-48 break-all font-mono font-semibold">{booking.bookingReference}</p>{booking.paymentStatus ? <p className="mt-1 text-xs text-[var(--qs-text-muted)]">Payment: {booking.paymentStatus}</p> : null}</td>
                <td className="px-4 py-4"><p>{booking.customerName ?? "—"}</p>{booking.customerEmail ? <p className="mt-1 max-w-52 break-all text-xs text-[var(--qs-text-muted)]">{booking.customerEmail}</p> : null}</td>
                <td className="px-4 py-4">{booking.movieTitle ?? (booking.movieId ? `Movie ID ${booking.movieId}` : "—")}</td>
                <td className="px-4 py-4"><p>{booking.cinemaName ?? (booking.cinemaId ? `Cinema ID ${booking.cinemaId}` : "—")}</p>{booking.screenName ? <p className="mt-1 text-xs text-[var(--qs-text-muted)]">{booking.screenName}</p> : null}</td>
                <td className="px-4 py-4">{booking.startTime ? formatMyanmarDateTime(booking.startTime) : "—"}</td>
                <td className="px-4 py-4 font-semibold">{formatMMK(booking.totalAmount)}</td>
                <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
                <td className="px-4 py-4"><div className="flex justify-end gap-2"><Button className="min-h-10 px-3 text-xs" disabled={detailLoading} onClick={() => void openDetail(booking.bookingReference)} variant="ghost">View</Button>{isCancellationCandidate(booking.status) ? <Button className="min-h-10 px-3 text-xs" onClick={() => startCancellation(booking)} variant="danger">Cancel</Button> : null}</div></td>
              </tr>
            ))}
          </tbody></table></div>
          <div className="px-4 pb-4"><AdminPagination itemLabel="bookings" onPageChange={(nextPage) => updateUrl({ page: nextPage })} page={result.page} totalElements={result.totalElements} totalPages={result.totalPages} /></div>
        </Card>
      )}

      {detail ? <AdminBookingDetailDialog booking={detail} onClose={() => setDetail(null)} /> : null}
      <ShowtimeActionDialog
        confirmLabel="Cancel booking"
        danger
        description="This asks the backend to cancel the eligible booking, cancel ticket access where applicable, and release eligible seats. QuickSeat MVP does not process a real payment refund; successful payment records may remain as history."
        error={cancelError}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancellation()}
        open={Boolean(cancelTarget)}
        pending={cancelling}
        pendingLabel="Cancelling…"
        title="Cancel booking?"
      />
    </div>
  );
}

function FilterInput({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  return <label className="grid gap-1.5 text-sm font-medium" htmlFor={props.id}>{label}<Input key={`${props.name}-${props.defaultValue}`} {...props} /></label>;
}

function BookingTableSkeleton() {
  return <Card aria-label="Loading bookings" className="space-y-3 shadow-none">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-20" key={index} />)}</Card>;
}
