import { SeatManagementPage } from "@/features/admin/components/seat-management-page";

export default async function AdminScreenSeatsPage({ params }: { params: Promise<{ cinemaId: string; screenId: string }> }) {
  const { cinemaId, screenId } = await params;
  return <SeatManagementPage cinemaId={Number(cinemaId)} screenId={Number(screenId)} />;
}
