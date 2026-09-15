export type AdminNavigationItem = {
  label: string;
  href: string;
  available: boolean;
};

export const adminNavigation: readonly AdminNavigationItem[] = [
  { label: "Dashboard", href: "/admin", available: true },
  { label: "Cinemas", href: "/admin/cinemas", available: true },
  { label: "Screens & Seats", href: "/admin/screens", available: true },
  { label: "Movies", href: "/admin/movies", available: true },
  { label: "Showtimes", href: "/admin/showtimes", available: true },
  { label: "Customers", href: "/admin/customers", available: true },
  { label: "Staff", href: "/admin/staff", available: true },
  { label: "Bookings", href: "/admin/bookings", available: true },
] as const;
