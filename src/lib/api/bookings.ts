import type {
  BookingCancellationResult,
  BookingDetail,
  BookingListItem,
  MockPaymentRequest,
  PaymentResult,
  PaymentSummary,
} from "@/features/bookings/types";
import { apiClient } from "@/lib/api/client";
import type {
  ApiSuccess,
  PaginatedResponse,
  QueryParams,
} from "@/lib/api/types";

const protectedRequest = { auth: true, cache: "no-store" } as const;

export function getBookings(
  query: QueryParams,
): Promise<ApiSuccess<PaginatedResponse<BookingListItem>>> {
  return apiClient<PaginatedResponse<BookingListItem>>("/customer/bookings", {
    ...protectedRequest,
    query,
  });
}

export function getBookingDetail(
  bookingReference: string,
): Promise<ApiSuccess<BookingDetail>> {
  return apiClient<BookingDetail>(
    `/customer/bookings/${encodeURIComponent(bookingReference)}`,
    protectedRequest,
  );
}

export function cancelBooking(
  bookingReference: string,
): Promise<ApiSuccess<BookingCancellationResult>> {
  return apiClient<BookingCancellationResult>(
    `/customer/bookings/${encodeURIComponent(bookingReference)}/cancel`,
    { ...protectedRequest, method: "PATCH" },
  );
}

export function getPaymentSummary(
  bookingReference: string,
): Promise<ApiSuccess<PaymentSummary>> {
  return apiClient<PaymentSummary>(
    `/customer/bookings/${encodeURIComponent(bookingReference)}/payment-summary`,
    protectedRequest,
  );
}

export function submitMockPayment(
  bookingReference: string,
  request: MockPaymentRequest,
): Promise<ApiSuccess<PaymentResult>> {
  return apiClient<PaymentResult>(
    `/customer/bookings/${encodeURIComponent(bookingReference)}/payments`,
    {
      ...protectedRequest,
      method: "POST",
      body: request,
    },
  );
}
