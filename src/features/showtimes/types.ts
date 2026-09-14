export type Showtime = {
  showtimeId: number;
  movieId: number;
  movieTitle: string;
  cinemaId: number;
  cinemaName: string;
  screenId: number;
  screenName: string;
  startTime: string;
  endTime: string;
  normalPrice: number;
  couplePrice: number;
};

export type SeatType = "NORMAL" | "COUPLE";

export type SeatInventoryStatus =
  | "AVAILABLE"
  | "HELD"
  | "BOOKED"
  | "UNAVAILABLE";

export type ShowtimeSeat = {
  showtimeSeatId: number;
  seatId: number;
  rowName: string;
  seatNumber: number;
  seatType: SeatType;
  price: number;
  status: SeatInventoryStatus;
};

export type ShowtimeSeatMap = {
  showtimeId: number;
  movieTitle: string;
  screenName: string;
  startTime: string;
  seats: ShowtimeSeat[];
};
