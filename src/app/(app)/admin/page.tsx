import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { RouteChunkFallback } from "@/components/shell/route-chunk-fallback";

const AdminDashboardClient = dynamic(
  () =>
    import("./admin-dashboard-client").then((m) => ({
      default: m.AdminDashboardClient,
    })),
  { loading: () => <RouteChunkFallback />, ssr: true }
);

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Administrator dashboard for UniVersus card data — cards, sets, and imports on UVSDECKS.GG.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
