import type {
  AdminAnalyticsRow,
  AdminDashboardFilters,
  AdminDashboardSummary,
} from "@/features/admin/dashboard-types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/lib/api/types";

const noStore = { cache: "no-store" as const };

export function getAdminDashboardSummary(
  filters: AdminDashboardFilters,
): Promise<ApiSuccess<AdminDashboardSummary>> {
  return apiClient<AdminDashboardSummary>("/admin/dashboard/summary", {
    ...noStore,
    query: filters,
  });
}

export function getAdminMoviePerformance(
  filters: AdminDashboardFilters,
): Promise<ApiSuccess<AdminAnalyticsRow[]>> {
  return apiClient<AdminAnalyticsRow[]>("/admin/dashboard/movies", {
    ...noStore,
    query: { ...filters, limit: 50 },
  });
}

export function getAdminTopMovies(
  filters: Pick<AdminDashboardFilters, "from" | "to">,
): Promise<ApiSuccess<AdminAnalyticsRow[]>> {
  return apiClient<AdminAnalyticsRow[]>("/admin/dashboard/movies/top", {
    ...noStore,
    query: { ...filters, limit: 10 },
  });
}

export function getAdminCinemaPerformance(
  filters: Pick<AdminDashboardFilters, "from" | "to" | "cinemaId">,
): Promise<ApiSuccess<AdminAnalyticsRow[]>> {
  return apiClient<AdminAnalyticsRow[]>("/admin/dashboard/cinemas", {
    ...noStore,
    query: filters,
  });
}

export function getAdminDailyRevenue(
  filters: Pick<AdminDashboardFilters, "from" | "to" | "cinemaId">,
): Promise<ApiSuccess<AdminAnalyticsRow[]>> {
  return apiClient<AdminAnalyticsRow[]>("/admin/dashboard/revenue/daily", {
    ...noStore,
    query: filters,
  });
}

export function getAdminMonthlyRevenue(
  filters: Pick<AdminDashboardFilters, "from" | "to" | "movieId">,
): Promise<ApiSuccess<AdminAnalyticsRow[]>> {
  return apiClient<AdminAnalyticsRow[]>("/admin/dashboard/revenue/monthly", {
    ...noStore,
    query: filters,
  });
}
