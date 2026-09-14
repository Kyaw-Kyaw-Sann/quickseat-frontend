import { BookingDetailPage } from "@/features/bookings/components/booking-detail-page";
import { getSafeBookingsReturnPath } from "@/features/bookings/return-path";
import { notFound } from "next/navigation";

type BookingDetailRouteProps = {
  params: Promise<{ bookingReference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingDetailRoute({
  params,
  searchParams,
}: BookingDetailRouteProps) {
  const [{ bookingReference: routeReference }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const bookingReference = routeReference.trim();
  const rawReturnTo = Array.isArray(query.returnTo)
    ? query.returnTo[0]
    : query.returnTo;

  if (!bookingReference) notFound();

  return (
    <BookingDetailPage
      bookingReference={bookingReference}
      returnHref={getSafeBookingsReturnPath(rawReturnTo)}
    />
  );
}
