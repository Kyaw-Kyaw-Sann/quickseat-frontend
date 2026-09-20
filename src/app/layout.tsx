import type { Metadata } from "next";
import { ConnectivityBanner } from "@/components/ui/connectivity-banner";
import { AuthProvider } from "@/features/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "QuickSeat | Cinema Ticket Booking",
    template: "%s | QuickSeat",
  },
  description: "Discover movies, reserve seats, and manage cinema tickets.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <ConnectivityBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
