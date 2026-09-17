import { prisma } from "@/lib/db";
import { SiteContentManager, type ContentRow } from "@/components/dashboard/site-content-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Website Content" };

export default async function AdminContentPage() {
  let rows: ContentRow[] = [];
  try {
    const data = await prisma.siteContent.findMany({
      select: { key: true, group: true, label: true, description: true, value: true, data: true, updatedAt: true },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    });
    rows = data.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
  } catch (e) {
    console.error("Admin site content query failed", e);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Website Content</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Edit the texts, bullets, and lists shown on the homepage, About, Services, Equipment,
        Contact, and footer. Saving updates the website immediately.
      </p>
      {rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No website content in the database yet. Run <code className="font-mono">pnpm seed</code> after
          migrating to load the current website copy, then refresh this page.
        </div>
      ) : (
        <div className="mt-4">
          <SiteContentManager initial={rows} />
        </div>
      )}
    </div>
  );
}
