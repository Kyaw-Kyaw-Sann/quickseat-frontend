import { BookingsPage } from "@/features/bookings/components/bookings-page";
import { parseBookingQuery } from "@/features/bookings/query";

export const dynamic = "force-dynamic";

type BookingsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingsRoute({
  searchParams,
}: BookingsRouteProps) {
  const query = parseBookingQuery(await searchParams);
  return <BookingsPage query={query} />;
}
