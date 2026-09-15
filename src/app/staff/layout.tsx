import type { Metadata } from "next";
import { StaffShell } from "@/features/staff/components/staff-shell";

export const metadata: Metadata = { title: "Staff Workspace", description: "QuickSeat assigned cinema operations." };

export default function StaffLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StaffShell>{children}</StaffShell>;
}
