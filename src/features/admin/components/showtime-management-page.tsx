"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { ShowtimeActionDialog } from "@/features/admin/components/showtime-action-dialog";
import { ShowtimeDetailDialog } from "@/features/admin/components/showtime-detail-dialog";
import { ShowtimeFormDialog } from "@/features/admin/components/showtime-form-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminMovie } from "@/features/admin/movie-types";
import type {
  AdminShowtime,
  AdminShowtimeInput,
  AdminShowtimeStatus,
} from "@/features/admin/showtime-types";
import type { AdminCinema } from "@/features/admin/types";
import { getAdminCinemas } from "@/lib/api/admin-cinema-management";
import { getAdminMovies } from "@/lib/api/admin-movie-management";
import {
  cancelAdminShowtime,
  createAdminShowtime,
  generateAdminShowtimeSeats,
  getAdminShowtime,
  getAdminShowtimes,
  updateAdminShowtime,
} from "@/lib/api/admin-showtime-management";
import type { FieldErrors, PaginatedResponse } from "@/lib/api/types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";

const PAGE_SIZE = 20;
const statuses = ["ACTIVE", "CANCELLED", "COMPLETED"] as const;

function parsePositiveId(value: string | null): number | undefined {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function parseStatus(value: string | null): AdminShowtimeStatus | "" {
  return statuses.includes(value as AdminShowtimeStatus)
    ? (value as AdminShowtimeStatus)
    : "";
}

function parseDate(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : "";
}

export function ShowtimeManagementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const movieId = parsePositiveId(searchParams.get("movieId"));
  const cinemaId = parsePositiveId(searchParams.get("cinemaId"));
  const date = parseDate(searchParams.get("date"));
  const status = parseStatus(searchParams.get("status"));
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const [result, setResult] = useState<PaginatedResponse<AdminShowtime> | null>(null);
  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formShowtime, setFormShowtime] = useState<AdminShowtime | null>(null);
  const [detail, setDetail] = useState<AdminShowtime | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cancelTarget, setCancelTarget] = useState<AdminShowtime | null>(null);
  const [generateTarget, setGenerateTarget] = useState<AdminShowtime | null>(null);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setNetworkError(false);
    try {
      const response = await getAdminShowtimes({
        movieId,
        cinemaId,
        date,
        status: status || undefined,
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
  }, [cinemaId, date, movieId, page, status]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const request = window.setTimeout(async () => {
      setOptionsLoading(true);
      setOptionsError("");
      try {
        const [allCinemas, allMovies] = await Promise.all([
          loadAllCinemas(),
          loadAllMovies(),
        ]);
        if (!cancelled) {
          setCinemas(allCinemas);
          setMovies(allMovies);
        }
      } catch (failure) {
        if (!cancelled) setOptionsError(getAdminMutationError(failure).message);
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(request);
    };
  }, []);

  function updateUrl(next: {
    movieId?: string;
    cinemaId?: string;
    date?: string;
    status?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      movieId: next.movieId ?? (movieId ? String(movieId) : ""),
      cinemaId: next.cinemaId ?? (cinemaId ? String(cinemaId) : ""),
      date: next.date ?? date,
      status: next.status ?? status,
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

  async function openDetail(row: AdminShowtime) {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      const response = await getAdminShowtime(row.id);
      setDetail({ ...row, ...response.data });
    } catch (failure) {
      setLoadError(getAdminMutationError(failure).message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openEdit(row: AdminShowtime) {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      const response = await getAdminShowtime(row.id);
      setFormShowtime({ ...row, ...response.data });
      setMutationError("");
      setFieldErrors({});
      setFormOpen(true);
    } catch (failure) {
      setLoadError(getAdminMutationError(failure).message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitShowtime(input: AdminShowtimeInput) {
    if (pending) return;
    setPending(true);
    setMutationError("");
    setFieldErrors({});
    try {
      const response = formShowtime
        ? await updateAdminShowtime(formShowtime.id, input)
        : await createAdminShowtime(input);
      setFormOpen(false);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setMutationError(
        normalized.status === 409
          ? `Scheduling conflict: ${normalized.message}`
          : normalized.message,
      );
      setFieldErrors(normalized.fieldErrors);
    } finally {
      setPending(false);
    }
  }

  async function confirmCancellation() {
    if (!cancelTarget || pending) return;
    setPending(true);
    setActionError("");
    try {
      const response = await cancelAdminShowtime(cancelTarget.id);
      setCancelTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setActionError(
        normalized.status === 409
          ? `Cancellation conflict: ${normalized.message}`
          : normalized.message,
      );
    } finally {
      setPending(false);
    }
  }

  async function confirmGeneration() {
    if (!generateTarget || pending) return;
    setPending(true);
    setActionError("");
    try {
      const response = await generateAdminShowtimeSeats(generateTarget.id);
      setGenerateTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setActionError(
        normalized.status === 409
          ? `Seat inventory conflict: ${normalized.message}`
          : normalized.message,
      );
    } finally {
      setPending(false);
    }
  }

  const canCreate =
    cinemas.some((cinema) => cinema.active) &&
    movies.some((movie) => movie.active && movie.status !== "ENDED");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button
            disabled={optionsLoading || !canCreate}
            onClick={() => {
              setFormShowtime(null);
              setMutationError("");
              setFieldErrors({});
              setFormOpen(true);
            }}
          >
            Create showtime
          </Button>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Showtimes" }]}
        description="Schedule showtimes, review lifecycle state, cancel sessions, and generate seat inventory."
        title="Showtimes"
      />

      {!optionsLoading && !canCreate ? (
        <AdminNotice message="A new showtime requires an active cinema, an active screen selected from that cinema, and an active, non-ended movie." />
      ) : null}
      {optionsError ? <AdminNotice message={`Selector data could not be loaded: ${optionsError}`} /> : null}
      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}

      <Card className="p-3 shadow-none">
        <div className="grid gap-2 lg:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="showtime-filter-movie">Movie<Select className="!min-h-10" disabled={optionsLoading} id="showtime-filter-movie" onChange={(event) => updateUrl({ movieId: event.target.value, page: 0 })} value={movieId ?? ""}><option value="">All movies</option>{movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</Select></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="showtime-filter-cinema">Cinema<Select className="!min-h-10" disabled={optionsLoading} id="showtime-filter-cinema" onChange={(event) => updateUrl({ cinemaId: event.target.value, page: 0 })} value={cinemaId ?? ""}><option value="">All cinemas</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}</Select></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="showtime-filter-date">Date<Input className="!min-h-10" id="showtime-filter-date" onChange={(event) => updateUrl({ date: event.target.value, page: 0 })} type="date" value={date} /></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="showtime-filter-status">Status<Select className="!min-h-10" id="showtime-filter-status" onChange={(event) => updateUrl({ status: event.target.value, page: 0 })} value={status}><option value="">All statuses</option><option value="ACTIVE">ACTIVE</option><option value="CANCELLED">CANCELLED</option><option value="COMPLETED">COMPLETED</option></Select></label>
        </div>
      </Card>

      {loading ? <ShowtimeTableSkeleton /> : loadError ? (
        <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={loadError} title={networkError ? "Unable to reach QuickSeat" : "Unable to load showtimes"} />
      ) : !result || result.content.length === 0 ? (
        <EmptyState action={<Button onClick={() => updateUrl({ movieId: "", cinemaId: "", date: "", status: "", page: 0 })} variant="secondary">Clear filters</Button>} description="No showtimes match the current backend filters." title="No showtimes found" />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0 shadow-none">
          <div aria-label="Scrollable showtime table" className="overflow-x-auto" role="region" tabIndex={0}>
            <table className="w-full min-w-[80rem] text-left text-sm">
              <thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]"><tr><th className="px-4 py-3">Movie</th><th className="px-4 py-3">Cinema / Screen</th><th className="px-4 py-3">Start / End</th><th className="px-4 py-3">Prices</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[var(--qs-border)]">
                {result.content.map((showtime) => (
                  <tr className="align-top hover:bg-white/[0.02]" key={showtime.id}>
                    <td className="px-4 py-4"><p className="max-w-52 font-semibold">{showtime.movieTitle ?? `Movie ${showtime.movieId ?? "—"}`}</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">Showtime ID {showtime.id}</p></td>
                    <td className="px-4 py-4"><p>{showtime.cinemaName ?? `Cinema ${showtime.cinemaId ?? "—"}`}</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">{showtime.screenName ?? `Screen ${showtime.screenId ?? "—"}`}</p></td>
                    <td className="px-4 py-4"><p>{formatMyanmarDateTime(showtime.startTime)}</p>{showtime.endTime ? <p className="mt-1 text-xs text-[var(--qs-text-muted)]">to {formatMyanmarDateTime(showtime.endTime)}</p> : null}</td>
                    <td className="px-4 py-4"><p>Normal: {formatMMK(showtime.normalPrice)}</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">Couple: {formatMMK(showtime.couplePrice)}</p></td>
                    <td className="px-4 py-4"><ShowtimeStatusBadge status={showtime.status} /></td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2">
                      <Button className="min-h-10 px-3 text-xs" disabled={detailLoading} onClick={() => void openDetail(showtime)} variant="ghost">Detail</Button>
                      <Button className="min-h-10 px-3 text-xs" disabled={detailLoading} onClick={() => void openEdit(showtime)} variant="ghost">Edit</Button>
                      <Button className="min-h-10 px-3 text-xs" onClick={() => { setActionError(""); setGenerateTarget(showtime); }} variant="secondary">Generate seats</Button>
                      {showtime.status === "ACTIVE" ? <Button className="min-h-10 px-3 text-xs" onClick={() => { setActionError(""); setCancelTarget(showtime); }} variant="danger">Cancel</Button> : null}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4"><AdminPagination itemLabel="showtimes" onPageChange={(nextPage) => updateUrl({ page: nextPage })} page={result.page} totalElements={result.totalElements} totalPages={result.totalPages} /></div>
        </Card>
      )}

      {formOpen ? <ShowtimeFormDialog cinemas={cinemas} error={mutationError} fieldErrors={fieldErrors} movies={movies} onClose={() => setFormOpen(false)} onSubmit={submitShowtime} pending={pending} showtime={formShowtime} /> : null}
      {detail ? <ShowtimeDetailDialog onClose={() => setDetail(null)} showtime={detail} /> : null}
      <ShowtimeActionDialog confirmLabel="Cancel showtime" danger description="This uses the backend cancellation lifecycle. The showtime is not hard deleted." error={actionError} onClose={() => setCancelTarget(null)} onConfirm={() => void confirmCancellation()} open={Boolean(cancelTarget)} pending={pending} pendingLabel="Cancelling…" title="Cancel showtime" />
      <ShowtimeActionDialog confirmLabel="Generate inventory" description="Generate showtime-specific inventory from the assigned screen's physical seats. No inventory is assumed until the backend confirms success." error={actionError} onClose={() => setGenerateTarget(null)} onConfirm={() => void confirmGeneration()} open={Boolean(generateTarget)} pending={pending} pendingLabel="Generating…" title="Generate seat inventory" />
    </div>
  );
}

function ShowtimeStatusBadge({ status }: { status: AdminShowtimeStatus }) {
  const tone = status === "ACTIVE" ? "success" : status === "CANCELLED" ? "danger" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function ShowtimeTableSkeleton() {
  return <Card aria-label="Loading showtimes" className="space-y-3 shadow-none">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-20" key={index} />)}</Card>;
}

async function loadAllCinemas(): Promise<AdminCinema[]> {
  const first = await getAdminCinemas({ page: 0, size: PAGE_SIZE });
  const cinemas = [...first.data.content];
  for (let pageIndex = 1; pageIndex < first.data.totalPages; pageIndex += 1) {
    const response = await getAdminCinemas({ page: pageIndex, size: PAGE_SIZE });
    cinemas.push(...response.data.content);
  }
  return cinemas;
}

async function loadAllMovies(): Promise<AdminMovie[]> {
  const first = await getAdminMovies({ page: 0, size: PAGE_SIZE });
  const movies = [...first.data.content];
  for (let pageIndex = 1; pageIndex < first.data.totalPages; pageIndex += 1) {
    const response = await getAdminMovies({ page: pageIndex, size: PAGE_SIZE });
    movies.push(...response.data.content);
  }
  return movies;
}
