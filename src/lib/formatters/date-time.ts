export const MYANMAR_TIME_ZONE = "Asia/Yangon";

type DateTimeValue = string | number | Date | null | undefined;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: MYANMAR_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: MYANMAR_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: MYANMAR_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatMyanmarDate(value: DateTimeValue): string {
  const date = toValidDate(value);
  return date ? dateFormatter.format(date) : "—";
}

export function formatMyanmarTime(value: DateTimeValue): string {
  const date = toValidDate(value);
  return date ? timeFormatter.format(date) : "—";
}

export function formatMyanmarDateTime(value: DateTimeValue): string {
  const date = toValidDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

function toValidDate(value: DateTimeValue): Date | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
