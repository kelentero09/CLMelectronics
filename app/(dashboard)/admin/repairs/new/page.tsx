import Link from "next/link";
import { RepairForm } from "@/components/dashboard/repair-form";
import { boardRepairDelegate } from "@/lib/board-repairs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Add Repair Record" };

export default async function NewRepairPage() {
  let stations: string[] = [];
  try {
    const delegate = boardRepairDelegate();
    const rows = delegate
      ? await delegate.findMany({
          select: { station: true },
          distinct: ["station"],
          orderBy: { station: "asc" },
        })
      : [];
    stations = rows.map((r) => r.station);
  } catch (e) {
    console.error("Repair stations query failed", e);
  }

  return (
    <div>
      <Link href="/admin/repairs" className="text-sm font-semibold text-steel-600 hover:underline">← Back to Board Repairs</Link>
      <h1 className="mt-2 text-xl font-bold text-navy-900">Add Repair Record</h1>
      <div className="mt-4">
        <RepairForm mode="create" stations={stations} />
      </div>
    </div>
  );
}
