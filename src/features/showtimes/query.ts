export type ShowtimeQuery = {
  cinemaId?: number;
  date: string;
  movieId?: number;
  page: number;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function positiveInteger(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function validDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? ""
    : value;
}

export function parseShowtimeQuery(searchParams: RawSearchParams): ShowtimeQuery {
  const parsedPage = Number.parseInt(firstValue(searchParams.page), 10);

  return {
    cinemaId: positiveInteger(firstValue(searchParams.cinemaId)),
    date: validDate(firstValue(searchParams.date)),
    movieId: positiveInteger(firstValue(searchParams.movieId)),
    page: Number.isSafeInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0,
  };
}

export function buildShowtimesHref(
  query: ShowtimeQuery,
  overrides: Partial<ShowtimeQuery> = {},
): string {
  const nextQuery = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (nextQuery.movieId) params.set("movieId", String(nextQuery.movieId));
  if (nextQuery.cinemaId) params.set("cinemaId", String(nextQuery.cinemaId));
  if (nextQuery.date) params.set("date", nextQuery.date);
  if (nextQuery.page > 0) params.set("page", String(nextQuery.page));

  const queryString = params.toString();
  return `/showtimes${queryString ? `?${queryString}` : ""}`;
}
