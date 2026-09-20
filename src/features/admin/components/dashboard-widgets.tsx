import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AdminAnalyticsRow,
  AdminDashboardResource,
  AdminDashboardSummary,
} from "@/features/admin/dashboard-types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDate, formatMyanmarDateTime } from "@/lib/formatters/date-time";

export function DashboardSummaryCards({
  state,
  onRetry,
}: {
  state: AdminDashboardResource<AdminDashboardSummary>;
  onRetry: () => void;
}) {
  if (state.status === "loading") {
    return <div aria-label="Loading dashboard summary" className="grid overflow-hidden rounded-lg border border-[var(--qs-border)] sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-28 rounded-none border-b border-r border-[var(--qs-border)]" key={index} />)}</div>;
  }
  if (state.status === "error") {
    return <ErrorState action={<Button onClick={onRetry} variant="secondary">Try again</Button>} description={state.message} title={state.network ? "Unable to reach QuickSeat" : "Unable to load dashboard summary"} />;
  }

  const summary = state.data;
  const metrics = [
    { label: "Total bookings", value: formatNumber(summary.totalBookings) },
    { label: "Confirmed bookings", value: formatNumber(summary.confirmedBookings) },
    { label: "Today's bookings", value: formatNumber(summary.todayBookings) },
    { label: "Total revenue", value: formatMMK(summary.totalRevenue) },
    { label: "Occupancy rate", value: formatRate(summary.occupancyRate) },
    { label: "Cancellation rate", value: formatRate(summary.cancellationRate) },
  ];

  return (
    <div className="grid overflow-hidden rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div className="border-b border-r border-[var(--qs-border)] px-5 py-5" key={metric.label}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsTable({
  title,
  description,
  emptyTitle,
  state,
  onRetry,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  state: AdminDashboardResource<AdminAnalyticsRow[]>;
  onRetry: () => void;
}) {
  if (state.status === "loading") return <SectionSkeleton title={title} />;
  if (state.status === "error") return <SectionError description={state.message} network={state.network} onRetry={onRetry} title={title} />;
  if (state.data.length === 0) return <EmptyState description={`The backend returned no ${description.toLowerCase()} for these filters.`} title={emptyTitle} />;

  const columns = getColumns(state.data);
  if (columns.length === 0) return <EmptyState description="The backend returned rows without displayable fields." title={emptyTitle} />;

  return (
    <section className="space-y-4 overflow-hidden rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)]">
      <header className="border-b border-[var(--qs-border)] px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--qs-text-muted)]">{description}</p>
      </header>
      <div aria-label={`Scrollable ${title} table`} className="overflow-x-auto" role="region" tabIndex={0}>
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]"><tr>{columns.map((column) => <th className="px-4 py-3" key={column} scope="col">{humanizeKey(column)}</th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--qs-border)]">{state.data.map((row, rowIndex) => <tr className="hover:bg-white/[0.02]" key={rowKey(row, rowIndex)}>{columns.map((column) => <td className="px-4 py-3 align-top" key={column}>{formatAnalyticsValue(column, row[column])}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

export function RevenueTrend({
  title,
  description,
  emptyTitle,
  state,
  onRetry,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  state: AdminDashboardResource<AdminAnalyticsRow[]>;
  onRetry: () => void;
}) {
  if (state.status === "loading") return <SectionSkeleton title={title} />;
  if (state.status === "error") return <SectionError description={state.message} network={state.network} onRetry={onRetry} title={title} />;
  if (state.data.length === 0) return <EmptyState description={`The backend returned no ${description.toLowerCase()} for these filters.`} title={emptyTitle} />;

  const columns = getColumns(state.data);
  const labelKey = columns.find((key) => /(date|day|month|period)/i.test(key));
  const valueKey = columns.find((key) => /(revenue|amount)/i.test(key) && state.data.some((row) => typeof row[key] === "number"));

  if (!labelKey || !valueKey) {
    return <AnalyticsTable description={description} emptyTitle={emptyTitle} onRetry={onRetry} state={state} title={title} />;
  }

  const maximum = Math.max(...state.data.map((row) => typeof row[valueKey] === "number" ? row[valueKey] as number : 0), 0);
  return (
    <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--qs-text-muted)]">{description}</p>
      <ol aria-label={title} className="mt-5 space-y-3">
        {state.data.map((row, index) => {
          const amount = typeof row[valueKey] === "number" ? row[valueKey] as number : 0;
          const width = maximum > 0 ? Math.max(0, Math.min(100, amount / maximum * 100)) : 0;
          return (
            <li className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_9rem] sm:items-center" key={rowKey(row, index)}>
              <span className="truncate text-xs text-[var(--qs-text-muted)]">{formatAnalyticsValue(labelKey, row[labelKey])}</span>
              <div aria-hidden="true" className="h-1.5 overflow-hidden bg-[#29292f]"><div className="h-full bg-[var(--qs-primary)]" style={{ width: `${width}%` }} /></div>
              <span className="text-sm font-semibold sm:text-right">{formatMMK(amount)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return <Card aria-label={`Loading ${title}`} className="space-y-4 shadow-none"><Skeleton className="h-6 w-48" /><Skeleton className="h-44 w-full" /></Card>;
}

function SectionError({ title, description, network, onRetry }: { title: string; description: string; network: boolean; onRetry: () => void }) {
  return <ErrorState action={<Button onClick={onRetry} variant="secondary">Try again</Button>} description={description} title={network ? `${title}: connection problem` : `${title} unavailable`} />;
}

function getColumns(rows: AdminAnalyticsRow[]): string[] {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key) && !key.toLowerCase().includes("token")) columns.push(key);
    }
  }
  return columns;
}

function humanizeKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function formatAnalyticsValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (/(revenue|amount)/i.test(key)) return formatMMK(value);
    if (/(rate|percentage|percent)/i.test(key)) return formatRate(value);
    return formatNumber(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) && /(date|day)/i.test(key)) return formatMyanmarDate(`${value}T00:00:00Z`);
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) && /(date|time|created|updated)/i.test(key)) return formatMyanmarDateTime(value);
    return value;
  }
  return Array.isArray(value) ? value.map(String).join(", ") : "—";
}

function rowKey(row: AdminAnalyticsRow, index: number): string {
  const candidate = Object.entries(row).find(([key, value]) => /(^id$|date|month|movieId|cinemaId)/i.test(key) && (typeof value === "string" || typeof value === "number"));
  return `${candidate?.[1] ?? "row"}-${index}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatRate(value: number): string {
  return `${formatNumber(value)}%`;
}
