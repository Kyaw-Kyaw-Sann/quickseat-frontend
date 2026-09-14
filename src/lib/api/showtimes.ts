import type {
  Showtime,
  ShowtimeSeatMap,
} from "@/features/showtimes/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

export type ShowtimeListParams = {
  cinemaId?: number;
  date?: string;
  movieId?: number;
  page?: number;
  size?: number;
};

const publicRequest = { auth: false, cache: "no-store" } as const;

export function getShowtimes(
  params: ShowtimeListParams = {},
): Promise<ApiSuccess<PaginatedResponse<Showtime>>> {
  return apiClient<PaginatedResponse<Showtime>>("/showtimes", {
    ...publicRequest,
    query: params,
  });
}

export function getShowtimeSeats(
  showtimeId: number,
): Promise<ApiSuccess<ShowtimeSeatMap>> {
  return apiClient<ShowtimeSeatMap>(`/showtimes/${showtimeId}/seats`, {
    ...publicRequest,
  });
}
