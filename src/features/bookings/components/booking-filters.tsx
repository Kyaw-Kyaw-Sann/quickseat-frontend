import Link from "next/link";
import { Input } from "@/components/ui/input";
import { LiveFilterForm } from "@/components/ui/live-filter-form";
import { Select } from "@/components/ui/select";
import { buildBookingsHref, type BookingQuery, type BookingStatusFilter } from "@/features/bookings/query";
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
  return (
    <div className="space-y-3">
      <nav aria-label="Booking status" className="overflow-x-auto">
        <ul className="flex min-w-max gap-2">
          {statuses.map((status) => {
            const active = query.status === status.value;
            return (
              <li key={status.value}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-lg border px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] sm:text-sm",
                    active
                      ? "border-[var(--qs-primary)] bg-[var(--qs-primary)] text-white"
                      : "border-[var(--qs-border)] bg-[var(--qs-background)] text-[var(--qs-text-muted)] hover:border-[#565661] hover:text-[var(--qs-text)]",
                  )}
                  href={buildBookingsHref(query, { page: 0, status: status.value })}
                >
                  {status.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <LiveFilterForm className="grid gap-2 sm:grid-cols-3">
        {query.status !== "ALL" ? <input name="status" type="hidden" value={query.status} /> : null}
        <div>
          <label className="sr-only" htmlFor="booking-category">Category</label>
          <Select className="!min-h-10" defaultValue={query.category === "ALL" ? "" : query.category} id="booking-category" name="category">
            <option value="">All categories</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="PAST">Past</option>
          </Select>
        </div>
        <div>
          <label className="sr-only" htmlFor="booking-date">Date</label>
          <Input className="!min-h-10" defaultValue={query.date} id="booking-date" name="date" type="date" />
        </div>
        <div>
          <label className="sr-only" htmlFor="booking-page-size">Bookings per page</label>
          <Select className="!min-h-10" defaultValue={String(query.size)} id="booking-page-size" name="size">
            {!standardPageSizes.includes(query.size) ? <option value={query.size}>{query.size}</option> : null}
            {standardPageSizes.map((size) => <option key={size} value={size}>{size} per page</option>)}
          </Select>
        </div>
      </LiveFilterForm>
    </div>
  );
}
