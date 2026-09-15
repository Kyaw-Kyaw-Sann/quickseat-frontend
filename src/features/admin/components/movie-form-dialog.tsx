"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminMovie, AdminMovieInput } from "@/features/admin/movie-types";
import type { MovieStatus } from "@/features/movies/types";
import { uploadAdminMoviePoster } from "@/lib/api/admin-movie-management";
import type { FieldErrors } from "@/lib/api/types";

type MovieFormState = Omit<AdminMovieInput, "genres"> & { genres: string };

export function MovieFormDialog({
  movie,
  pending,
  error,
  fieldErrors,
  onClose,
  onSubmit,
}: {
  movie: AdminMovie | null;
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onSubmit: (input: AdminMovieInput) => Promise<void>;
}) {
  const [form, setForm] = useState<MovieFormState>(() => toForm(movie));
  const [posterPreview, setPosterPreview] = useState(movie?.posterUrl ?? "");
  const [posterObjectUrl, setPosterObjectUrl] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterUploadError, setPosterUploadError] = useState("");

  useEffect(() => {
    return () => {
      if (posterObjectUrl) URL.revokeObjectURL(posterObjectUrl);
    };
  }, [posterObjectUrl]);

  function updateField<K extends keyof MovieFormState>(field: K, value: MovieFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadPoster(file: File | undefined) {
    if (!file || posterUploading || pending) return;
    setPosterUploadError("");
    if (!file.type.startsWith("image/")) {
      setPosterUploadError("Select an image file for the movie poster.");
      return;
    }

    if (posterObjectUrl) URL.revokeObjectURL(posterObjectUrl);
    const previewUrl = URL.createObjectURL(file);
    setPosterObjectUrl(previewUrl);
    setPosterPreview(previewUrl);
    setPosterUploading(true);

    try {
      const response = await uploadAdminMoviePoster(file);
      updateField("posterUrl", response.data.url);
      setPosterPreview(response.data.url);
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setPosterUploadError(normalized.fieldErrors.file ?? normalized.message);
    } finally {
      setPosterUploading(false);
    }
  }

  const cannotSubmit = pending || posterUploading || Boolean(posterUploadError) || !form.posterUrl;

  return (
    <Dialog onOpenChange={(open) => !open && !pending && !posterUploading && onClose()} open title={movie ? "Edit movie" : "Create movie"}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (cannotSubmit) return;
          void onSubmit({
            ...form,
            genres: form.genres.split(",").map((genre) => genre.trim()).filter(Boolean),
          });
        }}
      >
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-title">
          Title
          <Input error={fieldErrors.title} id="movie-title" onChange={(event) => updateField("title", event.target.value)} required value={form.title} />
        </label>

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-description">
          Description
          <textarea
            aria-describedby={fieldErrors.description ? "movie-description-error" : undefined}
            aria-invalid={Boolean(fieldErrors.description)}
            className="min-h-28 w-full resize-y rounded-lg border border-[var(--qs-border)] bg-[var(--qs-background)] px-3 py-2 text-sm outline-none focus:border-[var(--qs-primary)]"
            id="movie-description"
            onChange={(event) => updateField("description", event.target.value)}
            required
            value={form.description}
          />
          {fieldErrors.description ? <span className="text-sm text-[#ff8585]" id="movie-description-error">{fieldErrors.description}</span> : null}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-duration">
            Duration (minutes)
            <Input error={fieldErrors.durationMinutes} id="movie-duration" min={1} onChange={(event) => updateField("durationMinutes", Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} required type="number" value={form.durationMinutes} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-release-date">
            Release date
            <Input error={fieldErrors.releaseDate} id="movie-release-date" onChange={(event) => updateField("releaseDate", event.target.value)} required type="date" value={form.releaseDate} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-language">
            Language
            <Input error={fieldErrors.language} id="movie-language" onChange={(event) => updateField("language", event.target.value)} required value={form.language} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-age-rating">
            Age rating
            <Input error={fieldErrors.ageRating} id="movie-age-rating" onChange={(event) => updateField("ageRating", event.target.value)} required value={form.ageRating} />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-genres">
          Genres
          <Input error={fieldErrors.genres} id="movie-genres" onChange={(event) => updateField("genres", event.target.value)} placeholder="Action, Drama" required value={form.genres} />
          <span className="text-xs font-normal text-[var(--qs-text-muted)]">Separate backend genre values with commas.</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-director">
            Director
            <Input error={fieldErrors.director} id="movie-director" onChange={(event) => updateField("director", event.target.value)} required value={form.director} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-cast">
            Cast
            <Input error={fieldErrors.castText} id="movie-cast" onChange={(event) => updateField("castText", event.target.value)} required value={form.castText} />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-trailer-url">
          Trailer URL
          <Input error={fieldErrors.trailerUrl} id="movie-trailer-url" onChange={(event) => updateField("trailerUrl", event.target.value)} required type="url" value={form.trailerUrl} />
        </label>

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-status">
          Lifecycle status
          <Select error={fieldErrors.status} id="movie-status" onChange={(event) => updateField("status", event.target.value as MovieStatus)} value={form.status}>
            <option value="UPCOMING">UPCOMING</option>
            <option value="NOW_SHOWING">NOW SHOWING</option>
            <option value="ENDED">ENDED</option>
          </Select>
        </label>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="movie-poster">Movie poster</label>
          {posterPreview ? (
            <div aria-label="Movie poster preview" className="h-52 w-36 rounded-lg border border-[var(--qs-border)] bg-cover bg-center" role="img" style={{ backgroundImage: `url(${JSON.stringify(posterPreview).slice(1, -1)})` }} />
          ) : (
            <div className="grid h-40 w-28 place-items-center rounded-lg border border-dashed border-[var(--qs-border)] px-2 text-center text-xs text-[var(--qs-text-muted)]">No poster uploaded</div>
          )}
          <Input accept="image/*" disabled={pending || posterUploading} error={fieldErrors.posterUrl} id="movie-poster" onChange={(event) => void uploadPoster(event.target.files?.[0])} type="file" />
          {posterUploading ? <p className="text-sm text-[var(--qs-warning)]" role="status">Uploading poster…</p> : null}
          {posterUploadError ? <AdminNotice message={`Poster upload failed: ${posterUploadError}`} /> : null}
        </div>

        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button disabled={pending || posterUploading} onClick={onClose} variant="ghost">Cancel</Button>
          <Button disabled={cannotSubmit} type="submit">{pending ? "Saving…" : movie ? "Save changes" : "Create movie"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function toForm(movie: AdminMovie | null): MovieFormState {
  return {
    title: movie?.title ?? "",
    description: movie?.description ?? "",
    durationMinutes: movie?.durationMinutes ?? 0,
    releaseDate: movie?.releaseDate ?? "",
    language: movie?.language ?? "",
    genres: movie?.genres?.join(", ") ?? "",
    ageRating: movie?.ageRating ?? "",
    director: movie?.director ?? "",
    castText: movie?.castText ?? "",
    posterUrl: movie?.posterUrl ?? "",
    trailerUrl: movie?.trailerUrl ?? "",
    status: movie?.status ?? "UPCOMING",
  };
}
