import type {
  AdminMovie,
  AdminMovieInput,
  AdminMovieListParams,
} from "@/features/admin/movie-types";
import type { ActiveStatusInput, AdminImageUpload } from "@/features/admin/types";
import type { MovieStatus } from "@/features/movies/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

const noStore = { cache: "no-store" as const };

export function getAdminMovies(
  params: AdminMovieListParams = {},
): Promise<ApiSuccess<PaginatedResponse<AdminMovie>>> {
  return apiClient<PaginatedResponse<AdminMovie>>("/admin/movies", {
    ...noStore,
    query: params,
  });
}

export function getAdminMovie(movieId: number): Promise<ApiSuccess<AdminMovie>> {
  return apiClient<AdminMovie>(`/admin/movies/${movieId}`, noStore);
}

export function createAdminMovie(input: AdminMovieInput): Promise<ApiSuccess<AdminMovie>> {
  return apiClient<AdminMovie>("/admin/movies", { method: "POST", body: input });
}

export function updateAdminMovie(
  movieId: number,
  input: AdminMovieInput,
): Promise<ApiSuccess<AdminMovie>> {
  return apiClient<AdminMovie>(`/admin/movies/${movieId}`, {
    method: "PUT",
    body: input,
  });
}

export function updateAdminMovieActive(
  movieId: number,
  input: ActiveStatusInput,
): Promise<ApiSuccess<AdminMovie>> {
  return apiClient<AdminMovie>(`/admin/movies/${movieId}/active`, {
    method: "PATCH",
    body: input,
  });
}

export function updateAdminMovieStatus(
  movieId: number,
  status: MovieStatus,
): Promise<ApiSuccess<AdminMovie>> {
  return apiClient<AdminMovie>(`/admin/movies/${movieId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function uploadAdminMoviePoster(file: File): Promise<ApiSuccess<AdminImageUpload>> {
  const formData = new FormData();
  formData.set("file", file);
  return apiClient<AdminImageUpload>("/admin/movies/poster", {
    method: "POST",
    formData,
  });
}
