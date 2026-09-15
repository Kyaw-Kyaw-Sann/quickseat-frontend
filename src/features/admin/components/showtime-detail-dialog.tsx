import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import type { AdminShowtime } from "@/features/admin/showtime-types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";

export function ShowtimeDetailDialog({
  showtime,
  onClose,
}: {
  showtime: AdminShowtime;
  onClose: () => void;
}) {
  const statusTone = showtime.status === "ACTIVE" ? "success" : showtime.status === "CANCELLED" ? "danger" : "neutral";

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open title="Showtime detail">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-lg font-semibold">{showtime.movieTitle ?? `Showtime ${showtime.id}`}</p><p className="mt-1 text-sm text-[var(--qs-text-muted)]">ID {showtime.id}</p></div>
          <Badge tone={statusTone}>{showtime.status}</Badge>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {showtime.cinemaName ? <Detail label="Cinema" value={showtime.cinemaName} /> : null}
          {showtime.screenName ? <Detail label="Screen" value={showtime.screenName} /> : null}
          {showtime.startTime ? <Detail label="Starts (Myanmar time)" value={formatMyanmarDateTime(showtime.startTime)} /> : null}
          {showtime.endTime ? <Detail label="Ends (Myanmar time)" value={formatMyanmarDateTime(showtime.endTime)} /> : null}
          {showtime.normalPrice !== undefined ? <Detail label="Normal price" value={formatMMK(showtime.normalPrice)} /> : null}
          {showtime.couplePrice !== undefined ? <Detail label="Couple price" value={formatMMK(showtime.couplePrice)} /> : null}
          {showtime.cleaningBufferMinutes !== undefined ? <Detail label="Cleaning buffer" value={`${showtime.cleaningBufferMinutes} minutes`} /> : null}
        </dl>
      </div>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{label}</dt><dd className="mt-1 text-[var(--qs-text)]">{value}</dd></div>;
}
