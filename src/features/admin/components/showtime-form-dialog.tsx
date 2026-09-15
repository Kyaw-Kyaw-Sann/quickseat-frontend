"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminMovie } from "@/features/admin/movie-types";
import type { AdminShowtime, AdminShowtimeInput } from "@/features/admin/showtime-types";
import type { AdminCinema, AdminScreen } from "@/features/admin/types";
import { getAdminScreens } from "@/lib/api/admin-cinema-management";
import type { FieldErrors } from "@/lib/api/types";
import { formatMMK } from "@/lib/formatters/currency";
import {
  formatMyanmarDateTime,
  formatMyanmarDateTimeLocal,
  myanmarDateTimeLocalToUtc,
} from "@/lib/formatters/date-time";

type FormState = {
  cinemaId: number | "";
  movieId: number | "";
  screenId: number | "";
  startTime: string;
  normalPrice: number;
  couplePrice: number;
  cleaningBufferMinutes: number;
};

export function ShowtimeFormDialog({
  showtime,
  cinemas,
  movies,
  pending,
  error,
  fieldErrors,
  onClose,
  onSubmit,
}: {
  showtime: AdminShowtime | null;
  cinemas: AdminCinema[];
  movies: AdminMovie[];
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onSubmit: (input: AdminShowtimeInput) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(showtime));
  const [screens, setScreens] = useState<AdminScreen[]>([]);
  const [screensLoading, setScreensLoading] = useState(false);
  const [screensError, setScreensError] = useState("");
  const [timeError, setTimeError] = useState("");

  const eligibleCinemas = useMemo(() => cinemas.filter((cinema) => cinema.active), [cinemas]);
  const eligibleMovies = useMemo(
    () => movies.filter((movie) => movie.active && movie.status !== "ENDED"),
    [movies],
  );

  useEffect(() => {
    if (!form.cinemaId) {
      const reset = window.setTimeout(() => setScreens([]), 0);
      return () => window.clearTimeout(reset);
    }

    let cancelled = false;
    const request = window.setTimeout(async () => {
      setScreensLoading(true);
      setScreensError("");
      try {
        const response = await getAdminScreens(form.cinemaId as number);
        if (cancelled) return;
        const activeScreens = response.data.filter((screen) => screen.active);
        setScreens(activeScreens);
        setForm((current) =>
          current.screenId && !activeScreens.some((screen) => screen.id === current.screenId)
            ? { ...current, screenId: "" }
            : current,
        );
      } catch (failure) {
        if (!cancelled) setScreensError(getAdminMutationError(failure).message);
      } finally {
        if (!cancelled) setScreensLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(request);
    };
  }, [form.cinemaId]);

  const endTimePreview = useMemo(() => {
    const movie = eligibleMovies.find((candidate) => candidate.id === form.movieId);
    const startTime = myanmarDateTimeLocalToUtc(form.startTime);
    if (!movie || !startTime || movie.durationMinutes <= 0 || form.cleaningBufferMinutes < 0) return "";
    const preview = new Date(new Date(startTime).getTime() + (movie.durationMinutes + form.cleaningBufferMinutes) * 60_000);
    return formatMyanmarDateTime(preview);
  }, [eligibleMovies, form.cleaningBufferMinutes, form.movieId, form.startTime]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Dialog onOpenChange={(open) => !open && !pending && onClose()} open title={showtime ? "Edit showtime" : "Create showtime"}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const utcStartTime = myanmarDateTimeLocalToUtc(form.startTime);
          if (!utcStartTime) {
            setTimeError("Enter a valid Myanmar local date and time.");
            return;
          }
          if (!form.movieId || !form.screenId || pending) return;
          setTimeError("");
          void onSubmit({
            movieId: form.movieId,
            screenId: form.screenId,
            startTime: utcStartTime,
            normalPrice: form.normalPrice,
            couplePrice: form.couplePrice,
            cleaningBufferMinutes: form.cleaningBufferMinutes,
          });
        }}
      >
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="showtime-cinema">
          Cinema
          <Select id="showtime-cinema" onChange={(event) => setForm((current) => ({ ...current, cinemaId: Number(event.target.value) || "", screenId: "" }))} required value={form.cinemaId}>
            <option value="">Select an active cinema</option>
            {eligibleCinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name} · {cinema.city}</option>)}
          </Select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="showtime-screen">
          Screen
          <Select disabled={!form.cinemaId || screensLoading} error={fieldErrors.screenId} id="showtime-screen" onChange={(event) => update("screenId", Number(event.target.value) || "")} required value={form.screenId}>
            <option value="">{screensLoading ? "Loading screens…" : "Select an active screen"}</option>
            {screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.name}</option>)}
          </Select>
        </label>
        {screensError ? <AdminNotice message={screensError} /> : null}

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="showtime-movie">
          Movie
          <Select error={fieldErrors.movieId} id="showtime-movie" onChange={(event) => update("movieId", Number(event.target.value) || "")} required value={form.movieId}>
            <option value="">Select an active, non-ended movie</option>
            {eligibleMovies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title} · {movie.status.replaceAll("_", " ")}</option>)}
          </Select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="showtime-start">
          Start time (Asia/Yangon)
          <Input error={fieldErrors.startTime ?? timeError} id="showtime-start" onChange={(event) => update("startTime", event.target.value)} required type="datetime-local" value={form.startTime} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="showtime-normal-price">
            Normal price
            <Input error={fieldErrors.normalPrice} id="showtime-normal-price" min={0} onChange={(event) => update("normalPrice", numberValue(event.target.valueAsNumber))} required step="1" type="number" value={form.normalPrice} />
            <span className="text-xs font-normal text-[var(--qs-text-muted)]">{formatMMK(form.normalPrice)}</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="showtime-couple-price">
            Couple price
            <Input error={fieldErrors.couplePrice} id="showtime-couple-price" min={0} onChange={(event) => update("couplePrice", numberValue(event.target.valueAsNumber))} required step="1" type="number" value={form.couplePrice} />
            <span className="text-xs font-normal text-[var(--qs-text-muted)]">{formatMMK(form.couplePrice)}</span>
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="showtime-buffer">
          Cleaning buffer (minutes)
          <Input error={fieldErrors.cleaningBufferMinutes} id="showtime-buffer" min={0} onChange={(event) => update("cleaningBufferMinutes", numberValue(event.target.valueAsNumber))} required type="number" value={form.cleaningBufferMinutes} />
        </label>

        {endTimePreview ? (
          <div className="rounded-lg border border-[var(--qs-border)] bg-[#1b1b20] p-3 text-sm">
            <p className="font-semibold">Estimated end: {endTimePreview}</p>
            <p className="mt-1 text-xs text-[var(--qs-text-muted)]">Frontend convenience preview only. The backend-calculated end time is authoritative.</p>
          </div>
        ) : null}

        {error ? <AdminNotice message={error} /> : null}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button>
          <Button disabled={pending || screensLoading || !form.movieId || !form.screenId} type="submit">{pending ? "Saving…" : showtime ? "Save changes" : "Create showtime"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function toForm(showtime: AdminShowtime | null): FormState {
  return {
    cinemaId: showtime?.cinemaId ?? "",
    movieId: showtime?.movieId ?? "",
    screenId: showtime?.screenId ?? "",
    startTime: formatMyanmarDateTimeLocal(showtime?.startTime),
    normalPrice: showtime?.normalPrice ?? 0,
    couplePrice: showtime?.couplePrice ?? 0,
    cleaningBufferMinutes: showtime?.cleaningBufferMinutes ?? 0,
  };
}

function numberValue(value: number): number {
  return Number.isNaN(value) ? 0 : value;
}
