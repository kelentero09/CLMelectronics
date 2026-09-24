import Link from "next/link";
import { prisma } from "@/lib/db";
import { InquiriesManager, type InquiryRow } from "@/components/dashboard/inquiries-manager";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inquiries" };

const INQUIRIES_PAGE_SIZE = 20;

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status && ["NEW", "CONTACTED", "COMPLETED"].includes(sp.status) ? sp.status : "";
  const page = Math.max(1, Number(sp.page || 1) || 1);
  let inquiries: InquiryRow[] = [];
  let total = 0;
  const counts = { NEW: 0, CONTACTED: 0, COMPLETED: 0 };
  try {
    const where = status ? { status: status as never } : {};
    const [rows, totalCount, grouped] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        select: { id: true, name: true, email: true, phone: true, company: true, message: true, status: true, productRef: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * INQUIRIES_PAGE_SIZE,
        take: INQUIRIES_PAGE_SIZE,
      }),
      prisma.inquiry.count({ where }),
      prisma.inquiry.groupBy({ by: ["status"], _count: true }),
    ]);
    inquiries = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
    total = totalCount;
    for (const g of grouped) {
      if (g.status in counts) counts[g.status as keyof typeof counts] = g._count;
    }
  } catch (e) {
    console.error("Admin inquiries query failed", e);
  }

  const totalPages = Math.max(1, Math.ceil(total / INQUIRIES_PAGE_SIZE));

  const tabs = [
    { label: `All`, value: "" },
    { label: `New (${counts.NEW})`, value: "NEW" },
    { label: `Contacted (${counts.CONTACTED})`, value: "CONTACTED" },
    { label: `Completed (${counts.COMPLETED})`, value: "COMPLETED" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Inquiries ({total})</h1>
      <div className="mt-3 flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
        {tabs.map((t) => (
          <Link
            key={t.label}
            role="tab"
            aria-selected={(status || "") === t.value}
            href={t.value ? `/admin/inquiries?status=${t.value}` : "/admin/inquiries"}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), (status || "") === t.value && "bg-navy-900 text-white")}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <InquiriesManager initial={inquiries} currentPage={page} totalPages={totalPages} baseUrl="/admin/inquiries" searchParams={{ status }} />
      </div>
    </div>
  );
}
