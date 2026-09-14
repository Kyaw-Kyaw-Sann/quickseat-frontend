export type CinemaQuery = {
  city: string;
  page: number;
  search: string;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseCinemaQuery(searchParams: RawSearchParams): CinemaQuery {
  const parsedPage = Number.parseInt(firstValue(searchParams.page), 10);

  return {
    city: firstValue(searchParams.city).trim(),
    page: Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0,
    search: firstValue(searchParams.search).trim(),
  };
}

export function buildCinemasHref(
  query: CinemaQuery,
  overrides: Partial<CinemaQuery> = {},
): string {
  const nextQuery = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (nextQuery.search) params.set("search", nextQuery.search);
  if (nextQuery.city) params.set("city", nextQuery.city);
  if (nextQuery.page > 0) params.set("page", String(nextQuery.page));

  const queryString = params.toString();
  return `/cinemas${queryString ? `?${queryString}` : ""}`;
}
