export type SeatHoldStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "USED";

export type CreateSeatHoldRequest = {
  showtimeId: number;
  showtimeSeatIds: number[];
};

export type SeatHold = {
  bookingId: number;
  bookingReference: string;
  status: SeatHoldStatus;
  totalAmount: number;
  expiresAt: string;
  remainingSeconds: number;
  selectedSeats: unknown[];
};

export type SeatHoldDetail = {
  bookingReference: string;
  status: SeatHoldStatus;
  expiresAt: string;
  remainingSeconds: number;
};

export type ReleasedSeatHold = {
  bookingReference: string;
  status: "CANCELLED";
  remainingSeconds: 0;
};
