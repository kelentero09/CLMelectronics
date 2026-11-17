export const dynamic = "force-dynamic";

import { HelpGuide } from "@/components/dashboard/help-guide";
import { requireAdmin } from "@/lib/authz";

export const metadata = {
  title: "Help Guide — CLM Admin",
};

export default async function HelpPage() {
  // Every admin page checks auth itself: shared layouts are not re-run on client navigation.
  await requireAdmin();
  return <HelpGuide />;
}
