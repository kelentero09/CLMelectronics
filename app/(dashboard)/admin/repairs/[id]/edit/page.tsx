import Link from "next/link";
import { notFound } from "next/navigation";
import { RepairForm } from "@/components/dashboard/repair-form";
import { boardRepairDelegate } from "@/lib/board-repairs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Repair Record" };

export default async function EditRepairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let repair = null;
  let stations: string[] = [];
  try {
    const delegate = boardRepairDelegate();
    if (delegate) {
      const [row, stationRows] = await Promise.all([
        delegate.findUnique({ where: { id } }),
        delegate.findMany({ select: { station: true }, distinct: ["station"], orderBy: { station: "asc" } }),
      ]);
      repair = row;
      stations = stationRows.map((r) => r.station);
    }
  } catch (e) {
    console.error("Edit repair query failed", e);
  }
  if (!repair) notFound();

  return (
    <div>
      <Link href="/admin/repairs" className="text-sm font-semibold text-steel-600 hover:underline">← Back to Board Repairs</Link>
      <h1 className="mt-2 text-xl font-bold text-navy-900">Edit: {repair.boardDescription}</h1>
      <div className="mt-4">
        <RepairForm
          mode="edit"
          repairId={repair.id}
          stations={stations}
          initial={{
            station: repair.station,
            model: repair.model,
            boardDescription: repair.boardDescription,
            problem: repair.problem,
            repairRate: repair.repairRate,
            sortOrder: repair.sortOrder,
            isActive: repair.isActive,
            image: repair.image,
          }}
        />
      </div>
    </div>
  );
}
