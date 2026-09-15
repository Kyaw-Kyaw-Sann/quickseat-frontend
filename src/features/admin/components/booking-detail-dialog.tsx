import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminBooking } from "@/features/admin/booking-types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";

export function AdminBookingDetailDialog({
  booking,
  onClose,
}: {
  booking: AdminBooking;
  onClose: () => void;
}) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open title="Booking detail">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">Booking reference</p>
            <p className="mt-1 break-all font-mono text-xl font-bold">{booking.bookingReference}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {booking.customerName ? <Detail label="Customer" value={booking.customerName} /> : null}
          {booking.customerEmail ? <Detail label="Customer email" value={booking.customerEmail} /> : null}
          {booking.movieTitle ? <Detail label="Movie" value={booking.movieTitle} /> : null}
          {booking.cinemaName ? <Detail label="Cinema" value={booking.cinemaName} /> : null}
          {booking.screenName ? <Detail label="Screen" value={booking.screenName} /> : null}
          {booking.startTime ? <Detail label="Showtime (Myanmar time)" value={formatMyanmarDateTime(booking.startTime)} /> : null}
          <Detail label="Total amount" value={formatMMK(booking.totalAmount)} />
          {booking.paymentStatus ? <Detail label="Payment status" value={booking.paymentStatus} /> : null}
          {booking.paymentReference ? <Detail label="Payment reference" value={booking.paymentReference} /> : null}
          {booking.ticketStatus ? <Detail label="Ticket status" value={booking.ticketStatus} /> : null}
          {booking.expiresAt ? <Detail label="Expires (Myanmar time)" value={formatMyanmarDateTime(booking.expiresAt)} /> : null}
          {booking.createdAt ? <Detail label="Created (Myanmar time)" value={formatMyanmarDateTime(booking.createdAt)} /> : null}
        </dl>

        <SeatUnits seats={booking.seats} />
      </div>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>;
}

function SeatUnits({ seats }: { seats: unknown[] }) {
  return (
    <section aria-labelledby="admin-booking-seats">
      <h3 className="text-sm font-semibold" id="admin-booking-seats">Seats</h3>
      {seats.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--qs-text-muted)]">Seat details were not included in this response.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {seats.map((seat, index) => {
            const detail = readSeat(seat);
            return (
              <li className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-3 py-2 text-sm" key={`${detail.label}-${index}`}>
                <span className="font-semibold">{detail.label}</span>
                {detail.type ? <Badge className="ml-2" tone="neutral">{detail.type}</Badge> : null}
                {detail.price !== null ? <span className="mt-1 block text-xs text-[var(--qs-text-muted)]">{formatMMK(detail.price)}</span> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function readSeat(value: unknown): { label: string; type: string; price: number | null } {
  if (typeof value === "string" || typeof value === "number") {
    return { label: String(value), type: "", price: null };
  }
  if (!value || typeof value !== "object") {
    return { label: "Seat unit", type: "", price: null };
  }

  const seat = value as Record<string, unknown>;
  const row = typeof seat.rowName === "string" ? seat.rowName : "";
  const number = typeof seat.seatNumber === "string" || typeof seat.seatNumber === "number"
    ? String(seat.seatNumber)
    : "";
  return {
    label: row || number ? `${row}${number}` : "Seat unit",
    type: typeof seat.seatType === "string" ? seat.seatType : "",
    price: typeof seat.price === "number" ? seat.price : null,
  };
}
