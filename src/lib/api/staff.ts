import type {
  StaffBooking,
  StaffBookingListParams,
  StaffCinema,
  StaffShowtime,
  StaffShowtimeListParams,
  StaffShowtimeSeatMap,
  StaffTicketPreview,
  StaffTicketValidationRequest,
  StaffTicketValidationResult,
} from "@/features/staff/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

const noStore = { cache: "no-store" as const };

export function getStaffCinema(): Promise<ApiSuccess<StaffCinema>> {
  return apiClient<StaffCinema>("/staff/cinema", noStore);
}

export function getStaffShowtimes(
  params: StaffShowtimeListParams = {},
): Promise<ApiSuccess<PaginatedResponse<StaffShowtime>>> {
  return apiClient<PaginatedResponse<StaffShowtime>>("/staff/showtimes", {
    ...noStore,
    query: params,
  });
}

export function getStaffShowtime(showtimeId: number): Promise<ApiSuccess<StaffShowtime>> {
  return apiClient<StaffShowtime>(`/staff/showtimes/${showtimeId}`, noStore);
}

export function getStaffShowtimeSeats(
  showtimeId: number,
): Promise<ApiSuccess<StaffShowtimeSeatMap>> {
  return apiClient<StaffShowtimeSeatMap>(`/staff/showtimes/${showtimeId}/seats`, noStore);
}

export function getStaffBookings(
  params: StaffBookingListParams = {},
): Promise<ApiSuccess<PaginatedResponse<StaffBooking>>> {
  return apiClient<PaginatedResponse<StaffBooking>>("/staff/bookings", {
    ...noStore,
    query: params,
  });
}

export function getStaffBooking(
  bookingReference: string,
): Promise<ApiSuccess<StaffBooking>> {
  return apiClient<StaffBooking>(
    `/staff/bookings/${encodeURIComponent(bookingReference)}`,
    noStore,
  );
}

// Step 2 will use this lookup before staff explicitly validates a ticket.
export function getStaffTicket(
  ticketToken: string,
): Promise<ApiSuccess<StaffTicketPreview>> {
  return apiClient<StaffTicketPreview>(
    `/staff/tickets/${encodeURIComponent(ticketToken)}`,
    noStore,
  );
}

export function validateStaffTicket(
  request: StaffTicketValidationRequest,
): Promise<ApiSuccess<StaffTicketValidationResult>> {
  return apiClient<StaffTicketValidationResult>("/staff/tickets/validate", {
    method: "POST",
    body: request,
  });
}
