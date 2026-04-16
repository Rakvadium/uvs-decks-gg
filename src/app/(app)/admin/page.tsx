import type { Metadata } from "next";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Administrator dashboard for UniVersus card data — cards, sets, and imports on UVSDECKS.GG.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
