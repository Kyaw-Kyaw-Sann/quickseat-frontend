import type { SeatHoldStatus } from "@/features/seat-holds/types";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type PaymentSummary = {
  bookingReference: string;
  bookingStatus: SeatHoldStatus;
  totalAmount: number;
  expiresAt: string;
  remainingSeconds: number;
  paymentStatus: PaymentStatus | null;
  canPay: boolean;
};

export type MockPaymentRequest = {
  successful: boolean;
};

export type PaymentResult = {
  paymentReference: string;
  paymentStatus: PaymentStatus;
  amount: number;
  bookingReference: string;
  bookingStatus: SeatHoldStatus;
  alreadyProcessed: boolean;
};

export type BookingCategory = "UPCOMING" | "PAST";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "USED";

export type BookingListItem = {
  bookingReference: string;
  status: string;
  category: BookingCategory;
  totalAmount: number;
  movieTitle: string;
};

export type BookingDetail = {
  bookingReference: string;
  status: string;
  category: BookingCategory;
  totalAmount: number;
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  startTime: string;
  seats: unknown[];
};

export type BookingCancellationResult = {
  bookingReference: string;
  status: string;
  cancelledAt: string;
};
