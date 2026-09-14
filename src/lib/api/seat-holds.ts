import type {
  CreateSeatHoldRequest,
  ReleasedSeatHold,
  SeatHold,
  SeatHoldDetail,
} from "@/features/seat-holds/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/lib/api/types";

const protectedRequest = { auth: true, cache: "no-store" } as const;

export function createSeatHold(
  request: CreateSeatHoldRequest,
): Promise<ApiSuccess<SeatHold>> {
  return apiClient<SeatHold>("/customer/seat-holds", {
    ...protectedRequest,
    method: "POST",
    body: request,
  });
}

export function getSeatHold(
  bookingReference: string,
): Promise<ApiSuccess<SeatHoldDetail>> {
  return apiClient<SeatHoldDetail>(
    `/customer/seat-holds/${encodeURIComponent(bookingReference)}`,
    protectedRequest,
  );
}

export function releaseSeatHold(
  bookingReference: string,
): Promise<ApiSuccess<ReleasedSeatHold>> {
  return apiClient<ReleasedSeatHold>(
    `/customer/seat-holds/${encodeURIComponent(bookingReference)}`,
    {
      ...protectedRequest,
      method: "DELETE",
    },
  );
}
