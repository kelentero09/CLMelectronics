import { ProfilePageHero } from "@/components/profile/profile-ui";
import BoardRepairBrowser from "@/components/profile/board-repair-browser";
import { boardRepairRecords, type BoardRepairRecord } from "@/data/board-repair";
import { boardRepairDelegate } from "@/lib/board-repairs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Board Repair Capability",
  description:
    "Documented board repair capability for semiconductor and manufacturing equipment — die attach and auto mold boards with listed repair rates.",
};

export default async function BoardRepairPage() {
  let records: BoardRepairRecord[] = boardRepairRecords;
  try {
    const delegate = boardRepairDelegate();
    const rows = delegate
      ? await delegate.findMany({
          where: { isActive: true },
          select: { key: true, station: true, model: true, boardDescription: true, image: true, problem: true, repairRate: true },
          orderBy: [{ station: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        })
      : [];
    if (rows.length > 0) {
      records = rows.map((r) => ({
        id: r.key,
        station: r.station,
        model: r.model,
        boardDescription: r.boardDescription,
        image: r.image,
        problem: r.problem,
        repairRate: r.repairRate,
      }));
    }
  } catch (e) {
    console.error("Board repair query failed, using static fallback", e);
  }

  return (
    <>
      <ProfilePageHero
        eyebrow="Board repair"
        title="Board Repair Capability"
        description="CLM Electronics Engineering Services provides board repair capabilities for semiconductor and manufacturing equipment. Our repair services cover a range of control, driver, power supply, interface, and electronic boards based on our technical capabilities and available resources."
      />
      <BoardRepairBrowser records={records} />
    </>
  );
}
