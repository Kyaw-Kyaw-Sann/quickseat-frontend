import type {
  AdminBooking,
  AdminBookingCancellationResult,
  AdminBookingListParams,
} from "@/features/admin/booking-types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

const noStore = { cache: "no-store" as const };

export function getAdminBookings(
  params: AdminBookingListParams = {},
): Promise<ApiSuccess<PaginatedResponse<AdminBooking>>> {
  return apiClient<PaginatedResponse<AdminBooking>>("/admin/bookings", {
    ...noStore,
    query: params,
  });
}

export function getAdminBooking(
  bookingReference: string,
): Promise<ApiSuccess<AdminBooking>> {
  return apiClient<AdminBooking>(
    `/admin/bookings/${encodeURIComponent(bookingReference)}`,
    noStore,
  );
}

export function cancelAdminBooking(
  bookingReference: string,
): Promise<ApiSuccess<AdminBookingCancellationResult>> {
  return apiClient<AdminBookingCancellationResult>(
    `/admin/bookings/${encodeURIComponent(bookingReference)}/cancel`,
    { method: "PATCH" },
  );
}
