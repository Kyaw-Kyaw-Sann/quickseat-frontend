import type {
  AdminShowtime,
  AdminShowtimeInput,
  AdminShowtimeListParams,
} from "@/features/admin/showtime-types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

const noStore = { cache: "no-store" as const };

export function getAdminShowtimes(
  params: AdminShowtimeListParams = {},
): Promise<ApiSuccess<PaginatedResponse<AdminShowtime>>> {
  return apiClient<PaginatedResponse<AdminShowtime>>("/admin/showtimes", {
    ...noStore,
    query: params,
  });
}

export function getAdminShowtime(showtimeId: number): Promise<ApiSuccess<AdminShowtime>> {
  return apiClient<AdminShowtime>(`/admin/showtimes/${showtimeId}`, noStore);
}

export function createAdminShowtime(
  input: AdminShowtimeInput,
): Promise<ApiSuccess<AdminShowtime>> {
  return apiClient<AdminShowtime>("/admin/showtimes", { method: "POST", body: input });
}

export function updateAdminShowtime(
  showtimeId: number,
  input: AdminShowtimeInput,
): Promise<ApiSuccess<AdminShowtime>> {
  return apiClient<AdminShowtime>(`/admin/showtimes/${showtimeId}`, {
    method: "PUT",
    body: input,
  });
}

export function cancelAdminShowtime(showtimeId: number): Promise<ApiSuccess<AdminShowtime>> {
  return apiClient<AdminShowtime>(`/admin/showtimes/${showtimeId}/cancel`, {
    method: "PATCH",
  });
}

export function generateAdminShowtimeSeats(
  showtimeId: number,
): Promise<ApiSuccess<unknown[]>> {
  return apiClient<unknown[]>(`/admin/showtimes/${showtimeId}/seats/generate`, {
    method: "POST",
  });
}
