"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LiveFilterForm } from "@/components/ui/live-filter-form";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { MovieFormDialog } from "@/features/admin/components/movie-form-dialog";
import { MovieStatusDialog } from "@/features/admin/components/movie-status-dialog";
import { StatusConfirmationDialog } from "@/features/admin/components/status-confirmation-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminMovie, AdminMovieInput } from "@/features/admin/movie-types";
import type { MovieStatus } from "@/features/movies/types";
import {
  createAdminMovie,
  getAdminMovie,
  getAdminMovies,
  updateAdminMovie,
  updateAdminMovieActive,
  updateAdminMovieStatus,
} from "@/lib/api/admin-movie-management";
import type { PaginatedResponse, FieldErrors } from "@/lib/api/types";
import { formatMyanmarDate } from "@/lib/formatters/date-time";

const PAGE_SIZE = 20;
const movieStatuses = ["UPCOMING", "NOW_SHOWING", "ENDED"] as const;

function parseStatus(value: string | null): MovieStatus | "" {
  return movieStatuses.includes(value as MovieStatus) ? (value as MovieStatus) : "";
}

export function MovieManagementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const language = searchParams.get("language")?.trim() ?? "";
  const status = parseStatus(searchParams.get("status"));
  const activeParam = searchParams.get("active");
  const active = activeParam === "true" || activeParam === "false" ? activeParam : "";
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const [result, setResult] = useState<PaginatedResponse<AdminMovie> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMovie, setFormMovie] = useState<AdminMovie | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [activeTarget, setActiveTarget] = useState<AdminMovie | null>(null);
  const [activeError, setActiveError] = useState("");
  const [statusTarget, setStatusTarget] = useState<AdminMovie | null>(null);
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setNetworkError(false);
    try {
      const response = await getAdminMovies({
        search,
        status: status || undefined,
        language,
        active: active ? active === "true" : undefined,
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
  }, [active, language, page, search, status]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  function updateUrl(next: { search?: string; language?: string; status?: string; active?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      search: next.search ?? search,
      language: next.language ?? language,
      status: next.status ?? status,
      active: next.active ?? active,
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

  async function openEdit(movieId: number) {
    if (detailLoading) return;
    setDetailLoading(true);
    setLoadError("");
    try {
      const response = await getAdminMovie(movieId);
      setFormMovie(response.data);
      setMutationError("");
      setFieldErrors({});
      setFormOpen(true);
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setLoadError(normalized.message);
      setNetworkError(normalized.isNetworkError);
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitMovie(input: AdminMovieInput) {
    if (pending) return;
    setPending(true);
    setMutationError("");
    setFieldErrors({});
    try {
      const response = formMovie
        ? await updateAdminMovie(formMovie.id, input)
        : await createAdminMovie(input);
      setFormOpen(false);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setMutationError(normalized.message);
      setFieldErrors(normalized.fieldErrors);
    } finally {
      setPending(false);
    }
  }

  async function confirmActive() {
    if (!activeTarget || pending) return;
    setPending(true);
    setActiveError("");
    try {
      const response = await updateAdminMovieActive(activeTarget.id, { active: !activeTarget.active });
      setActiveTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      setActiveError(getAdminMutationError(failure).message);
    } finally {
      setPending(false);
    }
  }

  async function confirmStatus(nextStatus: MovieStatus) {
    if (!statusTarget || pending) return;
    setPending(true);
    setStatusError("");
    try {
      const response = await updateAdminMovieStatus(statusTarget.id, nextStatus);
      setStatusTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      setStatusError(getAdminMutationError(failure).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={<Button onClick={() => { setFormMovie(null); setMutationError(""); setFieldErrors({}); setFormOpen(true); }}>Create movie</Button>}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Movies" }]}
        description="Maintain movie metadata, lifecycle status, operational availability, posters, and trailer links."
        title="Movies"
      />

      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}

      <LiveFilterForm className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_11rem_11rem_10rem]">
          <label className="sr-only" htmlFor="admin-movie-search">Search movies</label><Input className="!min-h-10" defaultValue={search} id="admin-movie-search" name="search" placeholder="Search movies..." type="search" />
          <label className="sr-only" htmlFor="admin-movie-language">Language</label><Input className="!min-h-10" defaultValue={language} id="admin-movie-language" name="language" placeholder="All languages" />
          <label className="sr-only" htmlFor="admin-movie-status">Lifecycle</label><Select className="!min-h-10" defaultValue={status} id="admin-movie-status" name="status"><option value="">All lifecycles</option><option value="UPCOMING">Upcoming</option><option value="NOW_SHOWING">Now showing</option><option value="ENDED">Ended</option></Select>
          <label className="sr-only" htmlFor="admin-movie-active">Active state</label><Select className="!min-h-10" defaultValue={active} id="admin-movie-active" name="active"><option value="">All active states</option><option value="true">Active</option><option value="false">Inactive</option></Select>
      </LiveFilterForm>

      {loading ? <MovieTableSkeleton /> : loadError ? (
        <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={loadError} title={networkError ? "Unable to reach QuickSeat" : "Unable to load movies"} />
      ) : !result || result.content.length === 0 ? (
        <EmptyState action={<Button onClick={() => updateUrl({ search: "", language: "", status: "", active: "", page: 0 })} variant="secondary">Clear filters</Button>} description="No movies match the current backend filters." title="No movies found" />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0 shadow-none">
          <div aria-label="Scrollable movie table" className="overflow-x-auto" role="region" tabIndex={0}>
            <table className="w-full min-w-[72rem] text-left text-sm">
              <thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]"><tr><th className="px-4 py-3">Movie</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Release</th><th className="px-4 py-3">Lifecycle</th><th className="px-4 py-3">Active state</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[var(--qs-border)]">
                {result.content.map((movie) => (
                  <tr className="align-top hover:bg-white/[0.02]" key={movie.id}>
                    <td className="px-4 py-4"><div className="flex gap-3">{movie.posterUrl ? <div aria-label={`${movie.title} poster`} className="h-16 w-11 shrink-0 rounded border border-[var(--qs-border)] bg-cover bg-center" role="img" style={{ backgroundImage: `url(${JSON.stringify(movie.posterUrl).slice(1, -1)})` }} /> : null}<div><p className="max-w-56 font-semibold">{movie.title}</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">ID {movie.id}</p></div></div></td>
                    <td className="px-4 py-4"><p>{movie.durationMinutes} min</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">{movie.language || "—"}</p></td>
                    <td className="px-4 py-4 text-[var(--qs-text-muted)]">{formatMyanmarDate(movie.releaseDate)}</td>
                    <td className="px-4 py-4"><MovieLifecycleBadge status={movie.status} /></td>
                    <td className="px-4 py-4">{movie.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}</td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2">
                      <Button className="min-h-10 px-3 text-xs" disabled={detailLoading} onClick={() => void openEdit(movie.id)} variant="ghost">Edit</Button>
                      <Button className="min-h-10 px-3 text-xs" onClick={() => { setStatusError(""); setStatusTarget(movie); }} variant="secondary">Lifecycle</Button>
                      <Button className="min-h-10 px-3 text-xs" onClick={() => { setActiveError(""); setActiveTarget(movie); }} variant={movie.active ? "danger" : "secondary"}>{movie.active ? "Deactivate" : "Activate"}</Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4"><AdminPagination itemLabel="movies" onPageChange={(nextPage) => updateUrl({ page: nextPage })} page={result.page} totalElements={result.totalElements} totalPages={result.totalPages} /></div>
        </Card>
      )}

      {formOpen ? <MovieFormDialog error={mutationError} fieldErrors={fieldErrors} movie={formMovie} onClose={() => setFormOpen(false)} onSubmit={submitMovie} pending={pending} /> : null}
      <StatusConfirmationDialog active={activeTarget?.active ?? false} entityLabel="Movie" error={activeError} onClose={() => !pending && setActiveTarget(null)} onConfirm={() => void confirmActive()} open={Boolean(activeTarget)} pending={pending} />
      {statusTarget ? <MovieStatusDialog error={statusError} movie={statusTarget} onClose={() => setStatusTarget(null)} onConfirm={confirmStatus} pending={pending} /> : null}
    </div>
  );
}

function MovieTableSkeleton() {
  return <Card aria-label="Loading movies" className="space-y-3 shadow-none">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-20 w-full" key={index} />)}</Card>;
}

function MovieLifecycleBadge({ status }: { status: MovieStatus }) {
  const tone = status === "NOW_SHOWING" ? "success" : status === "UPCOMING" ? "primary" : "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
