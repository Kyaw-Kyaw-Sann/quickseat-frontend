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

export function formatMyanmarDateTimeLocal(value: DateTimeValue): string {
  const date = toValidDate(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MYANMAR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function myanmarDateTimeLocalToUtc(value: string): string | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return undefined;

  const [, year, month, day, hour, minute] = match;
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  const normalizedLocal = new Date(localAsUtc);
  if (
    normalizedLocal.getUTCFullYear() !== Number(year) ||
    normalizedLocal.getUTCMonth() !== Number(month) - 1 ||
    normalizedLocal.getUTCDate() !== Number(day) ||
    normalizedLocal.getUTCHours() !== Number(hour) ||
    normalizedLocal.getUTCMinutes() !== Number(minute)
  ) {
    return undefined;
  }
  let utcTime = localAsUtc;

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const zonedParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: MYANMAR_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utcTime));
    const zonedPart = (type: Intl.DateTimeFormatPartTypes) =>
      Number(zonedParts.find((item) => item.type === type)?.value ?? 0);
    const representedAsUtc = Date.UTC(
      zonedPart("year"),
      zonedPart("month") - 1,
      zonedPart("day"),
      zonedPart("hour"),
      zonedPart("minute"),
      zonedPart("second"),
    );
    utcTime -= representedAsUtc - localAsUtc;
  }

  const result = new Date(utcTime);
  return Number.isNaN(result.getTime()) ? undefined : result.toISOString();
}

function toValidDate(value: DateTimeValue): Date | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
