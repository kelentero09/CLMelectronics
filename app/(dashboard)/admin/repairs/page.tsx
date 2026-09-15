import Link from "next/link";
import { Input, Select } from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, DataTable } from "@/components/ui/card";
import { RepairDeleteButton } from "@/components/dashboard/repair-delete-button";
import { boardRepairDelegate } from "@/lib/board-repairs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Board Repairs" };

type SP = { q?: string; station?: string };

export default async function AdminRepairsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const stationFilter = sp.station ?? "";
  const where: Record<string, unknown> = {};
  if (stationFilter) where.station = stationFilter;
  if (q) {
    where.OR = [
      { boardDescription: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { problem: { contains: q, mode: "insensitive" } },
      { station: { contains: q, mode: "insensitive" } },
    ];
  }

  let repairs: {
    id: string;
    station: string;
    model: string;
    boardDescription: string;
    image: string | null;
    problem: string;
    repairRate: number;
    isActive: boolean;
  }[] = [];
  let stations: string[] = [];
  try {
    const delegate = boardRepairDelegate();
    const [rows, stationRows] = delegate
      ? await Promise.all([
          delegate.findMany({
            where: where as never,
            select: { id: true, station: true, model: true, boardDescription: true, image: true, problem: true, repairRate: true, isActive: true },
            orderBy: [{ station: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
            take: 500,
          }),
          delegate.findMany({ select: { station: true }, distinct: ["station"], orderBy: { station: "asc" } }),
        ])
      : [[], []];
    repairs = rows;
    stations = stationRows.map((r) => r.station);
  } catch (e) {
    console.error("Admin repairs query failed", e);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-navy-900">Board Repairs ({repairs.length})</h1>
        <Link href="/admin/repairs/new" className={buttonVariants({ size: "sm" })}>+ Add Record</Link>
      </div>

      <form action="/admin/repairs" method="get" className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
        <Input name="q" defaultValue={q} placeholder="Search board, model, problem…" aria-label="Search repairs" />
        <Select name="station" defaultValue={stationFilter} aria-label="Filter by station">
          <option value="">All stations</option>
          {stations.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      <div className="mt-4">
        <DataTable aria-label="Board repairs">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Photo</th>
              <th className="px-3 py-2">Station</th>
              <th className="px-3 py-2">Board</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Shown</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {repairs.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={encodeURI(r.image)} alt={r.boardDescription} loading="lazy" className="h-10 w-14 rounded border border-slate-200 bg-white object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">No photo</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-navy-900">{r.station}</td>
                <td className="px-3 py-2">
                  <span className="block max-w-[240px] truncate font-semibold text-navy-900">{r.boardDescription}</span>
                  <span className="text-xs text-slate-500">{r.model}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-bold">{r.repairRate}%</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Badge variant={r.isActive ? "success" : "muted"}>{r.isActive ? "Yes" : "Hidden"}</Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="flex flex-wrap gap-1">
                    <Link href={`/admin/repairs/${r.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>
                    <RepairDeleteButton id={r.id} board={r.boardDescription} />
                  </span>
                </td>
              </tr>
            ))}
            {repairs.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">No repair records found.</td></tr>
            )}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
