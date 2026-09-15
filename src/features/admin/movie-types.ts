import type { MovieStatus } from "@/features/movies/types";

export type AdminMovie = {
  id: number;
  title: string;
  description?: string | null;
  durationMinutes: number;
  releaseDate?: string | null;
  language?: string | null;
  genres?: string[];
  ageRating?: string | null;
  director?: string | null;
  castText?: string | null;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  status: MovieStatus;
  active: boolean;
};

export type AdminMovieInput = {
  title: string;
  description: string;
  durationMinutes: number;
  releaseDate: string;
  language: string;
  genres: string[];
  ageRating: string;
  director: string;
  castText: string;
  posterUrl: string;
  trailerUrl: string;
  status: MovieStatus;
};

export type AdminMovieListParams = {
  search?: string;
  status?: MovieStatus;
  language?: string;
  active?: boolean;
  page?: number;
  size?: number;
};
