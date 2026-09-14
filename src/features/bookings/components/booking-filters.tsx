import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  buildBookingsHref,
  type BookingQuery,
  type BookingStatusFilter,
} from "@/features/bookings/query";
import { cn } from "@/lib/utils/cn";

const statuses: { label: string; value: BookingStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Used", value: "USED" },
];

const standardPageSizes = [10, 20, 50];

export function BookingFilters({ query }: { query: BookingQuery }) {
  const hasFilters = Boolean(
    query.status !== "ALL" ||
      query.category !== "ALL" ||
      query.date ||
      query.size !== 20,
  );

  return (
    <Card className="space-y-5 bg-[rgba(21,21,25,0.94)] p-4 backdrop-blur-xl sm:p-5">
      <nav aria-label="Booking status">
        <ul className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const active = query.status === status.value;
            return (
              <li key={status.value}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]",
                    active
                      ? "border-[var(--qs-primary)] bg-[var(--qs-primary)] text-white"
                      : "border-[var(--qs-border)] bg-[var(--qs-background)] text-[var(--qs-text-muted)] hover:border-[#565661] hover:text-[var(--qs-text)]",
                  )}
                  href={buildBookingsHref(query, {
                    page: 0,
                    status: status.value,
                  })}
                >
                  {status.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form
        action="/bookings"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(11rem,0.7fr)_minmax(12rem,0.8fr)_minmax(8rem,0.45fr)_auto_auto]"
        method="get"
      >
        {query.status !== "ALL" ? (
          <input name="status" type="hidden" value={query.status} />
        ) : null}
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="booking-category">Category</label>
          <Select
            defaultValue={query.category === "ALL" ? "" : query.category}
            id="booking-category"
            name="category"
          >
            <option value="">All categories</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="PAST">Past</option>
          </Select>
        </div>
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="booking-date">Date</label>
          <Input
            defaultValue={query.date}
            id="booking-date"
            name="date"
            type="date"
          />
        </div>
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="booking-page-size">Per page</label>
          <Select
            defaultValue={String(query.size)}
            id="booking-page-size"
            name="size"
          >
            {!standardPageSizes.includes(query.size) ? (
              <option value={query.size}>{query.size}</option>
            ) : null}
            {standardPageSizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </Select>
        </div>
        <Button className="self-end" type="submit">Apply filters</Button>
        {hasFilters ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center self-end rounded-lg px-3 text-sm font-semibold text-[var(--qs-text-muted)] hover:text-[var(--qs-text)]"
            href="/bookings"
          >
            Clear
          </Link>
        ) : null}
      </form>
    </Card>
  );
}
