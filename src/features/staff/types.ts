export type StaffShowtimeStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";

export type StaffCinema = {
  id: number;
  name: string;
  city?: string | null;
  address?: string | null;
  active: boolean;
};

export type StaffShowtime = {
  id: number;
  cinemaId?: number;
  cinemaName?: string | null;
  movieId?: number;
  movieTitle?: string | null;
  screenId?: number;
  screenName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  normalPrice?: number | null;
  couplePrice?: number | null;
  status: string;
};

export type StaffShowtimeSeat = {
  showtimeSeatId?: number;
  seatId?: number;
  rowName?: string | null;
  seatNumber?: number | null;
  seatType?: string | null;
  price?: number | null;
  status: string;
};

export type StaffShowtimeSeatMap = {
  showtimeId: number;
  seats: StaffShowtimeSeat[];
  movieTitle?: string | null;
  screenName?: string | null;
  startTime?: string | null;
};

export type StaffBooking = {
  bookingReference: string;
  status: string;
  totalAmount?: number | null;
  seats?: unknown[];
  customerName?: string | null;
  customerEmail?: string | null;
  movieTitle?: string | null;
  cinemaName?: string | null;
  screenName?: string | null;
  showtimeId?: number | null;
  startTime?: string | null;
  paymentStatus?: string | null;
  paymentReference?: string | null;
  ticketStatus?: string | null;
};

export type StaffTicketPreview = {
  ticketToken: string;
  ticketStatus?: string | null;
  bookingStatus?: string | null;
};

export type StaffTicketValidationRequest = {
  ticketToken: string;
};

export type StaffTicketValidationResult = {
  ticketToken?: string | null;
  result?: string | null;
  ticketStatus?: string | null;
  bookingStatus?: string | null;
};

export type StaffShowtimeListParams = {
  movieId?: number;
  date?: string;
  status?: StaffShowtimeStatus;
  page?: number;
  size?: number;
};

export type StaffBookingListParams = {
  status?: string;
  showtimeId?: number;
  date?: string;
  search?: string;
  page?: number;
  size?: number;
};
