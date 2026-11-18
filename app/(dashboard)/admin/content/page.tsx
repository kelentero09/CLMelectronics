import { prisma } from "@/lib/db";
import { SiteContentManager, type ContentRow } from "@/components/dashboard/site-content-manager";
import { requireAdmin } from "@/lib/authz";
import { SITE_CONTENT_DEFAULTS } from "@/data/site-content-defaults";

export const dynamic = "force-dynamic";

export const metadata = { title: "Website Content" };

export default async function AdminContentPage() {
  // Every admin page checks auth itself: shared layouts are not re-run on client navigation.
  await requireAdmin();
  let rows: ContentRow[] = [];
  try {
    const data = await prisma.siteContent.findMany({
      select: { key: true, group: true, label: true, description: true, value: true, data: true, updatedAt: true },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    });
    rows = data.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
    // Entries added after the last seed (e.g. brands.*) have no row yet: show
    // their built-in default so they can be edited. Saving creates the row.
    if (rows.length > 0) {
      const have = new Set(rows.map((r) => r.key));
      for (const d of SITE_CONTENT_DEFAULTS) {
        if (have.has(d.key)) continue;
        rows.push({
          key: d.key,
          group: d.group,
          label: d.label,
          description: d.description ?? null,
          value: d.value,
          data: d.data ?? null,
          updatedAt: new Date(0).toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("Admin site content query failed", e);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Website Content</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Edit the texts, bullets, and lists shown on the homepage, About, Services, Equipment,
        Brands, Contact, and footer. Saving updates the website immediately.
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
