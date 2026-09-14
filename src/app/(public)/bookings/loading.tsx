import { PageContainer } from "@/components/layout/page-container";
import { BookingListSkeleton } from "@/features/bookings/components/booking-list-skeleton";

export default function LoadingBookings() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <BookingListSkeleton />
    </PageContainer>
  );
}
