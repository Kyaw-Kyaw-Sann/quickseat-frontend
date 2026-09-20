"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { LiveFilterForm } from "@/components/ui/live-filter-form";
import { Select } from "@/components/ui/select";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  AnalyticsTable,
  DashboardSummaryCards,
  RevenueTrend,
} from "@/features/admin/components/dashboard-widgets";
import type {
  AdminAnalyticsRow,
  AdminDashboardFilters,
  AdminDashboardResource,
  AdminDashboardSummary,
} from "@/features/admin/dashboard-types";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminMovie } from "@/features/admin/movie-types";
import type { AdminCinema } from "@/features/admin/types";
import { getAdminCinemas } from "@/lib/api/admin-cinema-management";
import {
  getAdminCinemaPerformance,
  getAdminDailyRevenue,
  getAdminDashboardSummary,
  getAdminMonthlyRevenue,
  getAdminMoviePerformance,
  getAdminTopMovies,
} from "@/lib/api/admin-dashboard";
import { getAdminMovies } from "@/lib/api/admin-movie-management";
import type { ApiSuccess } from "@/lib/api/types";

const OPTION_PAGE_SIZE = 100;

type DashboardData = {
  summary: AdminDashboardResource<AdminDashboardSummary>;
  movies: AdminDashboardResource<AdminAnalyticsRow[]>;
  topMovies: AdminDashboardResource<AdminAnalyticsRow[]>;
  cinemas: AdminDashboardResource<AdminAnalyticsRow[]>;
  dailyRevenue: AdminDashboardResource<AdminAnalyticsRow[]>;
  monthlyRevenue: AdminDashboardResource<AdminAnalyticsRow[]>;
};

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

export function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const cinemaId = parsePositiveId(searchParams.get("cinemaId"));
  const movieId = parsePositiveId(searchParams.get("movieId"));
  const [data, setData] = useState<DashboardData>(() => loadingDashboard());
  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const load = useCallback(async () => {
    setData(loadingDashboard());
    const filters: AdminDashboardFilters = {
      from: from || undefined,
      to: to || undefined,
      cinemaId,
      movieId,
    };
    const [summary, moviePerformance, topMovies, cinemaPerformance, dailyRevenue, monthlyRevenue] = await Promise.allSettled([
      getAdminDashboardSummary(filters),
      getAdminMoviePerformance(filters),
      getAdminTopMovies({ from: filters.from, to: filters.to }),
      getAdminCinemaPerformance({ from: filters.from, to: filters.to, cinemaId: filters.cinemaId }),
      getAdminDailyRevenue({ from: filters.from, to: filters.to, cinemaId: filters.cinemaId }),
      getAdminMonthlyRevenue({ from: filters.from, to: filters.to, movieId: filters.movieId }),
    ]);
    setData({
      summary: toResource(summary),
      movies: toResource(moviePerformance),
      topMovies: toResource(topMovies),
      cinemas: toResource(cinemaPerformance),
      dailyRevenue: toResource(dailyRevenue),
      monthlyRevenue: toResource(monthlyRevenue),
    });
  }, [cinemaId, from, movieId, to]);

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
        const [allCinemas, allMovies] = await Promise.all([loadAllCinemas(), loadAllMovies()]);
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
    return () => { cancelled = true; window.clearTimeout(request); };
  }, []);

  return (
    <div className="space-y-8">
      <AdminPageHeader breadcrumbs={[{ label: "Admin" }]} description="Backend-authoritative booking, revenue, occupancy, movie, and cinema performance." title="Dashboard" />

      <div>
        <LiveFilterForm className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="dashboard-from">From<Input className="!min-h-10" defaultValue={from} id="dashboard-from" name="from" type="date" /></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="dashboard-to">To<Input className="!min-h-10" defaultValue={to} id="dashboard-to" name="to" type="date" /></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="dashboard-cinema">Cinema<Select className="!min-h-10" defaultValue={cinemaId ?? ""} disabled={optionsLoading} id="dashboard-cinema" name="cinemaId"><option value="">All cinemas</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}{cinema.active ? "" : " (inactive)"}</option>)}</Select></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="dashboard-movie">Movie<Select className="!min-h-10" defaultValue={movieId ?? ""} disabled={optionsLoading} id="dashboard-movie" name="movieId"><option value="">All movies</option>{movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</Select></label>
        </LiveFilterForm>
        {optionsError ? <p className="mt-3 text-sm text-[#ff9b9b]" role="alert">Filter options unavailable: {optionsError}</p> : null}
      </div>

      <section aria-labelledby="dashboard-summary-heading" className="space-y-4">
        <div><h2 className="text-xl font-semibold" id="dashboard-summary-heading">Operational summary</h2><p className="mt-1 text-sm text-[var(--qs-text-muted)]">Documented booking, revenue, occupancy, and cancellation metrics.</p></div>
        <DashboardSummaryCards onRetry={() => void load()} state={data.summary} />
      </section>

      <section aria-label="Revenue trends" className="grid gap-6 xl:grid-cols-2">
        <RevenueTrend description="Backend daily revenue in the returned order." emptyTitle="No daily revenue data" onRetry={() => void load()} state={data.dailyRevenue} title="Daily revenue" />
        <RevenueTrend description="Backend monthly revenue in the returned order." emptyTitle="No monthly revenue data" onRetry={() => void load()} state={data.monthlyRevenue} title="Monthly revenue" />
      </section>

      <AnalyticsTable description="Backend movie performance in the returned order." emptyTitle="No movie performance data" onRetry={() => void load()} state={data.movies} title="Movie performance" />
      <AnalyticsTable description="Backend most-booked ranking in the returned order." emptyTitle="No top movies data" onRetry={() => void load()} state={data.topMovies} title="Top movies" />
      <AnalyticsTable description="Backend cinema bookings, revenue, and occupancy in the returned order." emptyTitle="No cinema performance data" onRetry={() => void load()} state={data.cinemas} title="Cinema performance" />
    </div>
  );
}

function loadingDashboard(): DashboardData {
  return {
    summary: { status: "loading" },
    movies: { status: "loading" },
    topMovies: { status: "loading" },
    cinemas: { status: "loading" },
    dailyRevenue: { status: "loading" },
    monthlyRevenue: { status: "loading" },
  };
}

function toResource<T>(result: PromiseSettledResult<ApiSuccess<T>>): AdminDashboardResource<T> {
  if (result.status === "fulfilled") return { status: "success", data: result.value.data };
  const error = getAdminMutationError(result.reason);
  return { status: "error", message: error.message, network: error.isNetworkError };
}

async function loadAllCinemas(): Promise<AdminCinema[]> {
  const first = await getAdminCinemas({ page: 0, size: OPTION_PAGE_SIZE });
  const cinemas = [...first.data.content];
  for (let page = 1; page < first.data.totalPages; page += 1) {
    const response = await getAdminCinemas({ page, size: OPTION_PAGE_SIZE });
    cinemas.push(...response.data.content);
  }
  return cinemas;
}

async function loadAllMovies(): Promise<AdminMovie[]> {
  const first = await getAdminMovies({ page: 0, size: OPTION_PAGE_SIZE });
  const movies = [...first.data.content];
  for (let page = 1; page < first.data.totalPages; page += 1) {
    const response = await getAdminMovies({ page, size: OPTION_PAGE_SIZE });
    movies.push(...response.data.content);
  }
  return movies;
}
