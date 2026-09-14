export type MovieStatus = "UPCOMING" | "NOW_SHOWING" | "ENDED";

export type Movie = {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  releaseDate: string | null;
  language: string | null;
  genres: string[];
  ageRating: string | null;
  director: string | null;
  castText: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  status: MovieStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
