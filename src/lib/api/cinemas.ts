import type { Cinema } from "@/features/cinemas/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

type CinemaListParams = {
  city?: string;
  page?: number;
  search?: string;
  size?: number;
};

const publicRequest = { auth: false, cache: "no-store" } as const;

export function getCinemas(
  params: CinemaListParams = {},
): Promise<ApiSuccess<PaginatedResponse<Cinema>>> {
  return apiClient<PaginatedResponse<Cinema>>("/cinemas", {
    ...publicRequest,
    query: params,
  });
}

export function getCinema(cinemaId: number): Promise<ApiSuccess<Cinema>> {
  return apiClient<Cinema>(`/cinemas/${cinemaId}`, publicRequest);
}
