import { ProfilePageHero } from "@/components/profile/profile-ui";
import BoardRepairBrowser from "@/components/profile/board-repair-browser";
import { boardRepairRecords, type BoardRepairRecord } from "@/data/board-repair";
import { boardRepairDelegate } from "@/lib/board-repairs";
import { getSiteContent } from "@/lib/site-content";

// Cached with ISR: admin create/update/delete actions call
// revalidatePath("/board-repair"), so edits appear immediately while repeat
// visits are served instantly without a live database roundtrip.
export const revalidate = 300;

export const metadata = {
  title: "Board Repair Capability",
  description:
    "Documented board repair capability for semiconductor and manufacturing equipment — die attach and auto mold boards with listed repair rates.",
};

// Fail fast: if the database hangs (unreachable host, exhausted pool,
// blocked connection in prod), serve the static records immediately
// instead of stalling the page render.
const DB_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Board repair query timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export default async function BoardRepairPage() {
  const content = await getSiteContent();
  let records: BoardRepairRecord[] = boardRepairRecords;
  try {
    const delegate = boardRepairDelegate();
    const rows = delegate
      ? await withTimeout(
          delegate.findMany({
            where: { isActive: true },
            select: { key: true, station: true, model: true, boardDescription: true, image: true, problem: true, repairRate: true },
            orderBy: [{ station: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          }),
          DB_TIMEOUT_MS
        )
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
        title={content.boardRepair.heroTitle}
        description={content.boardRepair.heroDescription}
      />
      {/* No Reveal wrapper here: this is a tall, filterable data table and
          must never be opacity-gated as a single block. */}
      <BoardRepairBrowser records={records} />
    </>
  );
}
