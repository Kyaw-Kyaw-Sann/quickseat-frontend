export type AdminDashboardFilters = {
  from?: string;
  to?: string;
  cinemaId?: number;
  movieId?: number;
};

export type AdminDashboardSummary = {
  totalBookings: number;
  confirmedBookings: number;
  todayBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  cancellationRate: number;
};

export type AdminAnalyticsRow = Record<string, unknown>;

export type AdminDashboardResource<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string; network: boolean };
