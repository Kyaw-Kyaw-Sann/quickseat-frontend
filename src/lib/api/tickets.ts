import type {
  TicketDetail,
  TicketGenerationResult,
} from "@/features/tickets/types";
import {
  apiBlobClient,
  apiClient,
  type ApiBlobResponse,
} from "@/lib/api/client";
import type { ApiSuccess } from "@/lib/api/types";

const protectedRequest = { auth: true, cache: "no-store" } as const;

export function generateTicket(
  bookingReference: string,
): Promise<ApiSuccess<TicketGenerationResult>> {
  return apiClient<TicketGenerationResult>(
    `/customer/bookings/${encodeURIComponent(bookingReference)}/ticket`,
    { ...protectedRequest, method: "POST" },
  );
}

export function getTicketByBookingReference(
  bookingReference: string,
): Promise<ApiSuccess<TicketDetail>> {
  return apiClient<TicketDetail>(
    `/customer/bookings/${encodeURIComponent(bookingReference)}/ticket`,
    protectedRequest,
  );
}

export function getTicketQr(
  ticketToken: string,
  download = false,
): Promise<ApiBlobResponse> {
  return apiBlobClient(
    `/customer/tickets/${encodeURIComponent(ticketToken)}/qr`,
    { ...protectedRequest, query: download ? { download: true } : undefined },
  );
}

export function getTicketPdf(ticketToken: string): Promise<ApiBlobResponse> {
  return apiBlobClient(
    `/customer/tickets/${encodeURIComponent(ticketToken)}/pdf`,
    protectedRequest,
  );
}
