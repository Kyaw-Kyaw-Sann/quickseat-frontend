export type AdminBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "USED";

export type AdminBooking = {
  bookingReference: string;
  status: string;
  totalAmount: number;
  seats: unknown[];
  bookingId?: number;
  customerId?: number;
  customerName?: string | null;
  customerEmail?: string | null;
  movieId?: number;
  movieTitle?: string | null;
  cinemaId?: number;
  cinemaName?: string | null;
  screenName?: string | null;
  showtimeId?: number;
  startTime?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  paymentStatus?: string | null;
  paymentReference?: string | null;
  ticketStatus?: string | null;
};

export type AdminBookingListParams = {
  status?: AdminBookingStatus;
  cinemaId?: number;
  movieId?: number;
  showtimeId?: number;
  date?: string;
  search?: string;
  page?: number;
  size?: number;
};

export type AdminBookingCancellationResult = {
  bookingReference: string;
  status: "CANCELLED";
};
