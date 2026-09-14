import type {
  BookingCategory,
  BookingStatus,
} from "@/features/bookings/types";

export type BookingStatusFilter = "ALL" | BookingStatus;
export type BookingCategoryFilter = "ALL" | BookingCategory;

export type BookingQuery = {
  category: BookingCategoryFilter;
  date: string;
  page: number;
  size: number;
  status: BookingStatusFilter;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

const statuses: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "USED",
];

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? ""
    : value;
}

export function parseBookingQuery(searchParams: RawSearchParams): BookingQuery {
  const rawStatus = firstValue(searchParams.status).toUpperCase();
  const rawCategory = firstValue(searchParams.category).toUpperCase();
  const parsedPage = Number.parseInt(firstValue(searchParams.page), 10);
  const parsedSize = Number.parseInt(firstValue(searchParams.size), 10);

  return {
    category:
      rawCategory === "UPCOMING" || rawCategory === "PAST"
        ? rawCategory
        : "ALL",
    date: validDate(firstValue(searchParams.date)),
    page: Number.isSafeInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0,
    size:
      Number.isSafeInteger(parsedSize) && parsedSize >= 1 && parsedSize <= 100
        ? parsedSize
        : 20,
    status: statuses.includes(rawStatus as BookingStatus)
      ? (rawStatus as BookingStatus)
      : "ALL",
  };
}

export function buildBookingsHref(
  query: BookingQuery,
  overrides: Partial<BookingQuery> = {},
): string {
  const nextQuery = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (nextQuery.status !== "ALL") params.set("status", nextQuery.status);
  if (nextQuery.category !== "ALL") {
    params.set("category", nextQuery.category);
  }
  if (nextQuery.date) params.set("date", nextQuery.date);
  if (nextQuery.page > 0) params.set("page", String(nextQuery.page));
  if (nextQuery.size !== 20) params.set("size", String(nextQuery.size));

  const queryString = params.toString();
  return `/bookings${queryString ? `?${queryString}` : ""}`;
}
