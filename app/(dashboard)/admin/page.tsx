import { requireAdmin } from "@/lib/authz";
import { DashboardOverview } from "@/components/dashboard/overview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminHomePage() {
  // Every admin page checks auth itself: shared layouts are not re-run on client navigation.
  await requireAdmin();
  return <DashboardOverview />;
}
