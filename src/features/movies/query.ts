import type { MovieStatus } from "@/features/movies/types";

export type MovieStatusFilter = "ALL" | Extract<MovieStatus, "NOW_SHOWING" | "UPCOMING">;

export type MovieQuery = {
  language: string;
  page: number;
  search: string;
  status: MovieStatusFilter;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseMovieQuery(searchParams: RawSearchParams): MovieQuery {
  const rawStatus = firstValue(searchParams.status).toUpperCase();
  const status: MovieStatusFilter =
    rawStatus === "NOW_SHOWING" || rawStatus === "UPCOMING" ? rawStatus : "ALL";
  const parsedPage = Number.parseInt(firstValue(searchParams.page), 10);

  return {
    language: firstValue(searchParams.language).trim(),
    page: Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0,
    search: firstValue(searchParams.search).trim(),
    status,
  };
}

export function buildMoviesHref(query: MovieQuery, overrides: Partial<MovieQuery> = {}): string {
  const nextQuery = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (nextQuery.search) params.set("search", nextQuery.search);
  if (nextQuery.status !== "ALL") params.set("status", nextQuery.status);
  if (nextQuery.language) params.set("language", nextQuery.language);
  if (nextQuery.page > 0) params.set("page", String(nextQuery.page));

  const queryString = params.toString();
  return `/movies${queryString ? `?${queryString}` : ""}`;
}
