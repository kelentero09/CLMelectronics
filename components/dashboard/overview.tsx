import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  FileText,
  FolderTree,
  ImageOff,
  Inbox,
  Minus,
  Package,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { BarList, ColumnChart, Meter, SegmentedBar, type Datum, type Segment } from "@/components/dashboard/charts";

const WEEKS = 12;
const DAY = 86_400_000;
const TZ = "Asia/Manila";
const TZ_OFFSET = 8 * 3_600_000; // Manila has no daylight saving time

/** Monday 00:00 (Manila time) of the week containing `d`, as a UTC instant. */
function weekStart(d: Date): number {
  const local = d.getTime() + TZ_OFFSET;
  const dayStart = Math.floor(local / DAY) * DAY;
  const weekday = (new Date(dayStart).getUTCDay() + 6) % 7; // Monday = 0
  return dayStart - weekday * DAY - TZ_OFFSET;
}

const shortDate = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const AVAILABILITY_LABELS: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  RESERVED: "Reserved",
  SOLD: "Sold",
  UNAVAILABLE: "Unavailable",
};

// Categorical slots 1-3 of the validated reference palette (blue, orange, aqua):
// adjacent CVD ΔE ≥ 9.2. Aqua is under 3:1 on white, so the legend always shows
// the label and count next to each swatch.
const STATUS_SEGMENTS = [
  { key: "NEW", label: "New", color: "#2a78d6" },
  { key: "CONTACTED", label: "Contacted", color: "#eb6834" },
  { key: "COMPLETED", label: "Completed", color: "#1baf7a" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 ring-blue-200",
  CONTACTED: "bg-orange-50 text-orange-700 ring-orange-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

/** Admin dashboard body. The page (app/(dashboard)/admin/page.tsx) checks auth first. */
export async function DashboardOverview() {

  const now = new Date();
  const firstWeek = weekStart(now) - (WEEKS - 1) * 7 * DAY;
  const since = new Date(Math.min(firstWeek, now.getTime() - 60 * DAY));

  let failed = false;
  let data: Awaited<ReturnType<typeof loadDashboard>> | null = null;
  try {
    data = await loadDashboard(since);
  } catch (e) {
    failed = true;
    console.error("Admin dashboard query failed", e);
  }

  const d = data ?? emptyDashboard();

  // ── Inquiries per week ───────────────────────────────────────────────
  const weekly: Datum[] = Array.from({ length: WEEKS }, (_, i) => {
    const start = firstWeek + i * 7 * DAY;
    const end = start + 7 * DAY;
    const value = d.inquiryDates.filter((t) => t >= start && t < end).length;
    return {
      key: String(start),
      label: shortDate.format(start),
      value,
      detail: `Week of ${shortDate.format(start)} – ${shortDate.format(end - DAY)}`,
    };
  });
  const last30 = d.inquiryDates.filter((t) => t >= now.getTime() - 30 * DAY).length;
  const prev30 = d.inquiryDates.filter((t) => t >= now.getTime() - 60 * DAY && t < now.getTime() - 30 * DAY).length;
  const inquiries12w = weekly.reduce((s, w) => s + w.value, 0);

  // ── Inquiry pipeline ─────────────────────────────────────────────────
  const statusCounts = new Map(d.inquiryStatus.map((g) => [g.status, g._count._all]));
  const pipeline: Segment[] = STATUS_SEGMENTS.map((s) => ({
    ...s,
    value: statusCounts.get(s.key) ?? 0,
    href: `/admin/inquiries?status=${s.key}`,
  }));
  const inquiriesTotal = pipeline.reduce((s, p) => s + p.value, 0);
  const newInquiries = statusCounts.get("NEW") ?? 0;

  // ── Catalog ──────────────────────────────────────────────────────────
  const categoryNames = new Map(d.categories.map((c) => [c.id, c.name]));
  const byCategory: Datum[] = d.productsByCategory
    .map((g) => ({
      key: g.categoryId ?? "none",
      label: g.categoryId ? (categoryNames.get(g.categoryId) ?? "Unknown") : "Uncategorized",
      value: g._count._all,
      href: g.categoryId ? `/admin/products?category=${g.categoryId}` : "/admin/products",
    }))
    .sort((a, b) => b.value - a.value);

  const byAvailability: Datum[] = Object.keys(AVAILABILITY_LABELS)
    .map((k) => ({
      key: k,
      label: AVAILABILITY_LABELS[k]!,
      value: d.productsByAvailability.find((g) => g.availability === k)?._count._all ?? 0,
      href: `/admin/products?availability=${k}`,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const complete = d.products - d.health.incomplete;
  const completeness = d.products ? Math.round((complete / d.products) * 100) : 0;
  const publishedPct = d.products ? Math.round((d.published / d.products) * 100) : 0;

  // ── Board repairs ────────────────────────────────────────────────────
  const stationRows = d.repairsByStation
    .map((g) => ({ station: g.station || "Unspecified", count: g._count._all, rate: g._avg.repairRate ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const TOP_STATIONS = 5;
  const top = stationRows.slice(0, TOP_STATIONS);
  const rest = stationRows.slice(TOP_STATIONS);
  const byStation: Datum[] = top.map((r) => ({
    key: r.station,
    label: r.station,
    value: r.count,
    detail: `Average repair rate ${Math.round(r.rate)}%`,
  }));
  if (rest.length) {
    byStation.push({
      key: "__other",
      label: `Other (${rest.length} stations)`,
      value: rest.reduce((s, r) => s + r.count, 0),
    });
  }
  const repairs = stationRows.reduce((s, r) => s + r.count, 0);
  const avgRate = repairs ? Math.round(stationRows.reduce((s, r) => s + r.rate * r.count, 0) / repairs) : 0;

  const healthItems = [
    { label: "Without a photo", count: d.health.noImage, icon: ImageOff, href: "/admin/products" },
    { label: "Without a category", count: d.health.noCategory, icon: FolderTree, href: "/admin/products" },
    { label: "Without a short description", count: d.health.noDescription, icon: FileText, href: "/admin/products" },
    { label: "Drafts (not published)", count: d.products - d.published, icon: Package, href: "/admin/products?published=no" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Catalog, inquiries and board repairs at a glance · {dateTime.format(now)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <Plus className="size-4" aria-hidden /> New product
          </Link>
          <Link
            href="/admin/inquiries?status=NEW"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50"
          >
            <Inbox className="size-4" aria-hidden /> Review inquiries
          </Link>
        </div>
      </div>

      {failed && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
          Some figures couldn’t be loaded from the database. Refresh to try again.
        </p>
      )}

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi href="/admin/products" icon={Package} label="Products" value={d.products}>
          <span className="font-semibold text-navy-900">{d.published}</span> published ·{" "}
          {d.products - d.published} draft{d.products - d.published === 1 ? "" : "s"}
          <Meter value={publishedPct} label={`${publishedPct}% of products published`} />
        </Kpi>
        <Kpi href="/admin/inquiries?status=NEW" icon={Inbox} label="New inquiries" value={newInquiries}>
          <span className="font-semibold text-navy-900">{last30}</span> in the last 30 days <Trend now={last30} before={prev30} />
        </Kpi>
        <Kpi href="/admin/repairs" icon={Cpu} label="Board repairs" value={repairs}>
          <span className="font-semibold text-navy-900">{avgRate}%</span> average repair rate · {stationRows.length} station
          {stationRows.length === 1 ? "" : "s"}
        </Kpi>
        <Kpi href="/admin/products" icon={CheckCircle2} label="Catalog completeness" value={`${completeness}%`}>
          <span className="font-semibold text-navy-900">{complete}</span> of {d.products} products have a photo, category and
          description
          <Meter value={completeness} label={`${completeness}% of products complete`} />
        </Kpi>
      </div>

      {/* Inquiries */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Inquiries per week"
          subtitle={`${inquiries12w} in the last ${WEEKS} weeks`}
          href="/admin/inquiries"
        >
          <ColumnChart data={weekly} caption="Inquiries per week" valueLabel="inquiries" />
        </Panel>
        <Panel title="Inquiry pipeline" subtitle={`${inquiriesTotal} total`} href="/admin/inquiries">
          <SegmentedBar data={pipeline} caption="Inquiries by status" valueLabel="inquiries" />
        </Panel>
      </div>

      {/* Catalog */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Products by category" subtitle={`${d.categories.length} active categories`} href="/admin/categories">
          <BarList data={byCategory} caption="Products by category" valueLabel="products" emptyText="No products yet." />
        </Panel>
        <Panel title="Stock availability" subtitle="All products" href="/admin/products">
          <BarList data={byAvailability} caption="Products by availability" valueLabel="products" emptyText="No products yet." />
        </Panel>
        <Panel title="Catalog health" subtitle="Things to fix">
          <ul className="divide-y divide-slate-100">
            {healthItems.map(({ label, count, icon: Icon, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-2.5 text-slate-700">
                    <Icon className="size-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="truncate">{label}</span>
                  </span>
                  {count === 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="size-3.5" aria-hidden /> None
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
                      <AlertTriangle className="size-3.5 text-amber-500" aria-hidden />
                      <span className="tabular-nums">{count}</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Repairs + activity: cards keep their own height so short lists leave no empty block */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Panel title="Board repairs by station" subtitle={`${repairs} active boards`} href="/admin/repairs">
          <BarList data={byStation} caption="Board repairs by station" valueLabel="boards" emptyText="No board repairs yet." />
        </Panel>
        <Panel title="Latest inquiries" href="/admin/inquiries">
          <ul className="divide-y divide-slate-100">
            {d.recentInquiries.map((q) => (
              <li key={q.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-navy-900">{q.name}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {q.product?.name ?? q.productRef ?? "General inquiry"} · {shortDate.format(q.createdAt)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${STATUS_BADGE[q.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}
                >
                  {q.status.toLowerCase()}
                </span>
              </li>
            ))}
            {d.recentInquiries.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No inquiries yet.</li>}
          </ul>
        </Panel>
        <Panel title="Recently updated products" href="/admin/products">
          <ul className="divide-y divide-slate-100">
            {d.recentProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-navy-900">{p.name}</span>
                  <span className="block truncate text-xs text-slate-500">
                    <span className="font-mono">{p.referenceCode}</span> · {shortDate.format(p.updatedAt)}
                    {!p.published && " · draft"}
                  </span>
                </span>
                <Link href={`/admin/products/${p.id}/edit`} className="shrink-0 font-semibold text-steel-600 hover:underline">
                  Edit
                </Link>
              </li>
            ))}
            {d.recentProducts.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No products yet.</li>}
          </ul>
        </Panel>
      </div>

      <p className="text-xs text-slate-400">
        {d.content} website content entries · {d.users} active admin user{d.users === 1 ? "" : "s"}
      </p>
    </div>
  );
}

async function loadDashboard(since: Date) {
  const notDeleted = { deletedAt: null };
  const [
    products,
    published,
    productsByCategory,
    productsByAvailability,
    noImage,
    noCategory,
    noDescription,
    incomplete,
    categories,
    inquiryStatus,
    inquiryRows,
    recentInquiries,
    recentProducts,
    repairsByStation,
    content,
    users,
  ] = await Promise.all([
    prisma.product.count({ where: notDeleted }),
    prisma.product.count({ where: { ...notDeleted, published: true } }),
    prisma.product.groupBy({ by: ["categoryId"], where: notDeleted, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["availability"], where: notDeleted, _count: { _all: true } }),
    prisma.product.count({ where: { ...notDeleted, images: { none: {} } } }),
    prisma.product.count({ where: { ...notDeleted, categoryId: null } }),
    prisma.product.count({ where: { ...notDeleted, OR: [{ shortDescription: null }, { shortDescription: "" }] } }),
    prisma.product.count({
      where: {
        ...notDeleted,
        OR: [{ images: { none: {} } }, { categoryId: null }, { shortDescription: null }, { shortDescription: "" }],
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.inquiry.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.inquiry.findMany({
      select: { id: true, name: true, status: true, productRef: true, createdAt: true, product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: notDeleted,
      select: { id: true, name: true, referenceCode: true, updatedAt: true, published: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.boardRepair.groupBy({
      by: ["station"],
      where: { isActive: true },
      _count: { _all: true },
      _avg: { repairRate: true },
    }),
    prisma.siteContent.count().catch(() => 0),
    prisma.user.count({ where: { isActive: true } }).catch(() => 0),
  ]);

  return {
    products,
    published,
    productsByCategory,
    productsByAvailability,
    health: { noImage, noCategory, noDescription, incomplete },
    categories,
    inquiryStatus,
    inquiryDates: inquiryRows.map((r) => r.createdAt.getTime()),
    recentInquiries,
    recentProducts,
    repairsByStation,
    content,
    users,
  };
}

function emptyDashboard(): Awaited<ReturnType<typeof loadDashboard>> {
  return {
    products: 0,
    published: 0,
    productsByCategory: [],
    productsByAvailability: [],
    health: { noImage: 0, noCategory: 0, noDescription: 0, incomplete: 0 },
    categories: [],
    inquiryStatus: [],
    inquiryDates: [],
    recentInquiries: [],
    recentProducts: [],
    repairsByStation: [],
    content: 0,
    users: 0,
  };
}

function Kpi({
  href,
  icon: Icon,
  label,
  value,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number | string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-steel-500">
      <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-navy-900">
            <Icon className="size-4" aria-hidden />
          </span>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums text-navy-900">{value}</p>
        <div className="mt-1 text-xs text-slate-500">{children}</div>
      </Card>
    </Link>
  );
}

function Trend({ now, before }: { now: number; before: number }) {
  if (now === before) {
    return (
      <span className="ml-1 inline-flex items-center gap-0.5 whitespace-nowrap text-slate-500">
        <Minus className="size-3" aria-hidden /> same as previous 30
      </span>
    );
  }
  const up = now > before;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const diff = Math.abs(now - before);
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 whitespace-nowrap font-semibold text-slate-700">
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : "−"}
      {diff} vs previous 30
    </span>
  );
}

function Panel({
  title,
  subtitle,
  href,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`flex flex-col ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-navy-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-xs font-semibold text-steel-600 hover:underline">
            View all
          </Link>
        )}
      </div>
      <div className="flex-1 px-5 py-4">{children}</div>
    </Card>
  );
}
