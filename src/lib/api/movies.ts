import type { Movie, MovieStatus } from "@/features/movies/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

type MovieListParams = {
  language?: string;
  page?: number;
  search?: string;
  size?: number;
  status?: MovieStatus;
};

const publicRequest = { auth: false, cache: "no-store" } as const;

export function getMovies(
  params: MovieListParams = {},
): Promise<ApiSuccess<PaginatedResponse<Movie>>> {
  return apiClient<PaginatedResponse<Movie>>("/movies", {
    ...publicRequest,
    query: params,
  });
}

export function getNowShowingMovies(
  params: MovieListParams = {},
): Promise<ApiSuccess<PaginatedResponse<Movie>>> {
  return apiClient<PaginatedResponse<Movie>>("/movies/now-showing", {
    ...publicRequest,
    query: params,
  });
}

export function getUpcomingMovies(
  params: MovieListParams = {},
): Promise<ApiSuccess<PaginatedResponse<Movie>>> {
  return apiClient<PaginatedResponse<Movie>>("/movies/upcoming", {
    ...publicRequest,
    query: params,
  });
}

export function getMovie(movieId: number): Promise<ApiSuccess<Movie>> {
  return apiClient<Movie>(`/movies/${movieId}`, publicRequest);
}
