import type {
  ActiveStatusInput,
  AdminCinema,
  AdminCinemaInput,
  AdminCinemaPage,
  AdminImageUpload,
  AdminScreen,
  AdminScreenInput,
  AdminSeat,
  AdminSeatInput,
  SeatLayoutInput,
} from "@/features/admin/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/lib/api/types";

export type AdminCinemaListParams = {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
};

const noStore = { cache: "no-store" as const };

export function getAdminCinemas(
  params: AdminCinemaListParams = {},
): Promise<ApiSuccess<AdminCinemaPage>> {
  return apiClient<AdminCinemaPage>("/admin/cinemas", {
    ...noStore,
    query: params,
  });
}

export function getAdminCinema(cinemaId: number): Promise<ApiSuccess<AdminCinema>> {
  return apiClient<AdminCinema>(`/admin/cinemas/${cinemaId}`, noStore);
}

export function createAdminCinema(
  input: AdminCinemaInput,
): Promise<ApiSuccess<AdminCinema>> {
  return apiClient<AdminCinema>("/admin/cinemas", { method: "POST", body: input });
}

export function updateAdminCinema(
  cinemaId: number,
  input: AdminCinemaInput,
): Promise<ApiSuccess<AdminCinema>> {
  return apiClient<AdminCinema>(`/admin/cinemas/${cinemaId}`, {
    method: "PUT",
    body: input,
  });
}

export function updateAdminCinemaStatus(
  cinemaId: number,
  input: ActiveStatusInput,
): Promise<ApiSuccess<AdminCinema>> {
  return apiClient<AdminCinema>(`/admin/cinemas/${cinemaId}/status`, {
    method: "PATCH",
    body: input,
  });
}

export function uploadAdminCinemaImage(file: File): Promise<ApiSuccess<AdminImageUpload>> {
  const formData = new FormData();
  formData.set("file", file);
  return apiClient<AdminImageUpload>("/admin/cinemas/image", {
    method: "POST",
    formData,
  });
}

export function getAdminScreens(cinemaId: number): Promise<ApiSuccess<AdminScreen[]>> {
  return apiClient<AdminScreen[]>(`/admin/cinemas/${cinemaId}/screens`, noStore);
}

export function createAdminScreen(
  cinemaId: number,
  input: AdminScreenInput,
): Promise<ApiSuccess<AdminScreen>> {
  return apiClient<AdminScreen>(`/admin/cinemas/${cinemaId}/screens`, {
    method: "POST",
    body: input,
  });
}

export function updateAdminScreen(
  screenId: number,
  input: AdminScreenInput,
): Promise<ApiSuccess<AdminScreen>> {
  return apiClient<AdminScreen>(`/admin/screens/${screenId}`, {
    method: "PUT",
    body: input,
  });
}

export function updateAdminScreenStatus(
  screenId: number,
  input: ActiveStatusInput,
): Promise<ApiSuccess<AdminScreen>> {
  return apiClient<AdminScreen>(`/admin/screens/${screenId}/status`, {
    method: "PATCH",
    body: input,
  });
}

export function getAdminSeats(screenId: number): Promise<ApiSuccess<AdminSeat[]>> {
  return apiClient<AdminSeat[]>(`/admin/screens/${screenId}/seats`, noStore);
}

export function createAdminSeatLayout(
  screenId: number,
  input: SeatLayoutInput,
): Promise<ApiSuccess<AdminSeat[]>> {
  return apiClient<AdminSeat[]>(`/admin/screens/${screenId}/seats/layout`, {
    method: "POST",
    body: input,
  });
}

export function updateAdminSeat(
  seatId: number,
  input: AdminSeatInput,
): Promise<ApiSuccess<AdminSeat>> {
  return apiClient<AdminSeat>(`/admin/seats/${seatId}`, {
    method: "PUT",
    body: input,
  });
}

export function updateAdminSeatStatus(
  seatId: number,
  input: ActiveStatusInput,
): Promise<ApiSuccess<AdminSeat>> {
  return apiClient<AdminSeat>(`/admin/seats/${seatId}/status`, {
    method: "PATCH",
    body: input,
  });
}
