import { PageContainer } from "@/components/layout/page-container";
import { BookingDetailSkeleton } from "@/features/bookings/components/booking-detail-skeleton";

export default function LoadingBookingDetail() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <BookingDetailSkeleton />
    </PageContainer>
  );
}
