export type AdminShowtimeStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";

export type AdminShowtime = {
  id: number;
  movieId?: number;
  movieTitle?: string;
  screenId?: number;
  screenName?: string;
  cinemaId?: number;
  cinemaName?: string;
  startTime?: string;
  endTime?: string;
  normalPrice?: number;
  couplePrice?: number;
  cleaningBufferMinutes?: number;
  status: AdminShowtimeStatus;
};

export type AdminShowtimeInput = {
  movieId: number;
  screenId: number;
  startTime: string;
  normalPrice: number;
  couplePrice: number;
  cleaningBufferMinutes: number;
};

export type AdminShowtimeListParams = {
  movieId?: number;
  cinemaId?: number;
  date?: string;
  status?: AdminShowtimeStatus;
  page?: number;
  size?: number;
};
