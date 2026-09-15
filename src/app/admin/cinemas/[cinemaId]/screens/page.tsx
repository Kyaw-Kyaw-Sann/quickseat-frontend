import { ScreenManagementPage } from "@/features/admin/components/screen-management-page";

export default async function AdminCinemaScreensPage({ params }: { params: Promise<{ cinemaId: string }> }) {
  const { cinemaId } = await params;
  return <ScreenManagementPage cinemaId={Number(cinemaId)} />;
}
